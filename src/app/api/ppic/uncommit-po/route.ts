// app/api/uncommit-po/route.ts
import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";
import { UncommitPORequest, UncommitPOResponse } from "@/lib/types";

export async function POST(
  request: Request
): Promise<NextResponse<UncommitPOResponse>> {
  let pool;
  let transaction;

  try {
    const { noSPK, userID }: UncommitPORequest = await request.json();

    if (!noSPK || !userID) {
      return NextResponse.json(
        { success: false, error: "No SPK dan UserID diperlukan" },
        { status: 400 }
      );
    }

    pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    console.log(`↩️ Memulai uncommit PO: ${noSPK}`);

    // 1. Cari commit PO yang aktif
    const commitResult = await transaction
      .request()
      .input("No_SPK", sql.VarChar(50), noSPK)
      .input("Status", sql.VarChar(20), "COMMITTED").query(`
        SELECT CommitID, KodeBarang 
        FROM [dbo].[taCommitPO] 
        WHERE No_SPK = @No_SPK AND Status = @Status
      `);

    if (commitResult.recordset.length === 0) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, error: "Committed PO tidak ditemukan" },
        { status: 404 }
      );
    }

    const commitID = commitResult.recordset[0].CommitID;
    const kodeBarang = commitResult.recordset[0].KodeBarang;

    // 2. Hitung total material dan qty yang akan di-release
    const reservationStats = await transaction
      .request()
      .input("CommitID", sql.Int, commitID).query(`
        SELECT 
          COUNT(*) as totalMaterials,
          COALESCE(SUM(ReservedQty), 0) as totalQtyReserved
        FROM [dbo].[taStockReservation] 
        WHERE CommitID = @CommitID AND Status = 'RESERVED'
      `);

    const totalMaterials = reservationStats.recordset[0].totalMaterials;
    const totalQtyReserved = reservationStats.recordset[0].totalQtyReserved;

    // 3. Update status commit PO menjadi UNCOMMITTED
    await transaction
      .request()
      .input("CommitID", sql.Int, commitID)
      .input("Status", sql.VarChar(20), "UNCOMMITTED").query(`
        UPDATE [dbo].[taCommitPO] 
        SET Status = @Status 
        WHERE CommitID = @CommitID
      `);

    // 4. Update status reservasi stok menjadi RELEASED
    await transaction
      .request()
      .input("CommitID", sql.Int, commitID)
      .input("Status", sql.VarChar(20), "RELEASED").query(`
        UPDATE [dbo].[taStockReservation] 
        SET Status = @Status 
        WHERE CommitID = @CommitID AND Status = 'RESERVED'
      `);

    // 5. Insert history
    await transaction
      .request()
      .input("CommitID", sql.Int, commitID)
      .input("No_SPK", sql.VarChar(50), noSPK)
      .input("KodeBarang", sql.VarChar(500), kodeBarang)
      .input("Action", sql.VarChar(50), "UNCOMMIT")
      .input("OldStatus", sql.VarChar(20), "COMMITTED")
      .input("NewStatus", sql.VarChar(20), "UNCOMMITTED")
      .input("UserID", sql.VarChar(50), userID)
      .input(
        "Remarks",
        sql.VarChar(1000),
        `Uncommit PO: ${totalMaterials} materials released, ${totalQtyReserved} qty freed`
      ).query(`
        INSERT INTO [dbo].[taCommitPOHistory] 
        (CommitID, No_SPK, KodeBarang, Action, OldStatus, NewStatus, UserID, Remarks)
        VALUES 
        (@CommitID, @No_SPK, @KodeBarang, @Action, @OldStatus, @NewStatus, @UserID, @Remarks)
      `);

    await transaction.commit();

    console.log(
      `✅ Uncommit PO ${noSPK} berhasil: ${totalMaterials} materials released`
    );

    return NextResponse.json({
      success: true,
      message: `PO berhasil di-uncommit`,
      releasedMaterials: totalMaterials,
      releasedQty: totalQtyReserved,
    });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("❌ Error saat rollback:", rollbackError);
      }
    }

    console.error("❌ Error uncommit PO:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Gagal uncommit PO",
      },
      { status: 500 }
    );
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error("❌ Error menutup koneksi:", closeError);
      }
    }
  }
}
