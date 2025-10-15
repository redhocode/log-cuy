// app/api/reset-committed-pos/route.ts
import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";
import { ResetCommittedPOsRequest, UncommitPOResponse } from "@/lib/types";

export async function POST(
  request: Request
): Promise<NextResponse<UncommitPOResponse>> {
  let pool;
  let transaction;

  try {
    const { userID }: ResetCommittedPOsRequest = await request.json();

    if (!userID) {
      return NextResponse.json(
        { success: false, error: "UserID diperlukan" },
        { status: 400 }
      );
    }

    pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    console.log("🔄 Memulai reset semua committed PO...");

    // 1. Hitung total PO yang akan di-reset
    const statsResult = await transaction
      .request()
      .input("Status", sql.VarChar(20), "COMMITTED").query(`
        SELECT 
          COUNT(*) as totalPOs,
          COUNT(DISTINCT sr.ItemID) as totalItems,
          COALESCE(SUM(sr.ReservedQty), 0) as totalReservedQty
        FROM [dbo].[taCommitPO] cp
        INNER JOIN [dbo].[taStockReservation] sr ON cp.CommitID = sr.CommitID
        WHERE cp.Status = @Status AND sr.Status = 'RESERVED'
      `);

    const totalPOs = statsResult.recordset[0].totalPOs;
    const totalItems = statsResult.recordset[0].totalItems;
    const totalReservedQty = statsResult.recordset[0].totalReservedQty;

    if (totalPOs === 0) {
      await transaction.rollback();
      return NextResponse.json({
        success: true,
        message: "Tidak ada PO yang perlu di-reset",
        releasedMaterials: 0,
        releasedQty: 0,
      });
    }

    // 2. Update status semua committed PO menjadi UNCOMMITTED
    await transaction
      .request()
      .input("OldStatus", sql.VarChar(20), "COMMITTED")
      .input("NewStatus", sql.VarChar(20), "UNCOMMITTED").query(`
        UPDATE [dbo].[taCommitPO] 
        SET Status = @NewStatus 
        WHERE Status = @OldStatus
      `);

    // 3. Update status semua reservasi stok menjadi RELEASED
    await transaction
      .request()
      .input("OldStatus", sql.VarChar(20), "RESERVED")
      .input("NewStatus", sql.VarChar(20), "RELEASED").query(`
        UPDATE [dbo].[taStockReservation] 
        SET Status = @NewStatus 
        WHERE Status = @OldStatus
      `);

    // 4. Insert history untuk setiap PO yang di-reset
    const committedPOs = await transaction
      .request()
      .input("Status", sql.VarChar(20), "COMMITTED").query(`
        SELECT CommitID, No_SPK, KodeBarang 
        FROM [dbo].[taCommitPO] 
        WHERE Status = 'COMMITTED'
      `);

    for (const po of committedPOs.recordset) {
      await transaction
        .request()
        .input("CommitID", sql.Int, po.CommitID)
        .input("No_SPK", sql.VarChar(50), po.No_SPK)
        .input("KodeBarang", sql.VarChar(500), po.KodeBarang)
        .input("Action", sql.VarChar(50), "RESET_ALL")
        .input("OldStatus", sql.VarChar(20), "COMMITTED")
        .input("NewStatus", sql.VarChar(20), "UNCOMMITTED")
        .input("UserID", sql.VarChar(50), userID)
        .input(
          "Remarks",
          sql.VarChar(1000),
          `Reset semua PO: total ${totalPOs} PO, ${totalItems} items, ${totalReservedQty} qty released`
        ).query(`
          INSERT INTO [dbo].[taCommitPOHistory] 
          (CommitID, No_SPK, KodeBarang, Action, OldStatus, NewStatus, UserID, Remarks)
          VALUES 
          (@CommitID, @No_SPK, @KodeBarang, @Action, @OldStatus, @NewStatus, @UserID, @Remarks)
        `);
    }

    await transaction.commit();

    console.log(
      `✅ Reset semua committed PO berhasil: ${totalPOs} PO, ${totalItems} items, ${totalReservedQty} qty released`
    );

    return NextResponse.json({
      success: true,
      message: `Berhasil reset ${totalPOs} PO yang di-commit`,
      releasedMaterials: totalItems,
      releasedQty: totalReservedQty,
    });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("❌ Error saat rollback:", rollbackError);
      }
    }

    console.error("❌ Error reset committed POs:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Gagal reset committed PO",
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
