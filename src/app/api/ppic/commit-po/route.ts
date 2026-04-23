// app/api/ppic/commit-po/route.ts
import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";
import { CommitPORequest, CommitPOResponse } from "@/lib/types";

export async function POST(
  request: Request
): Promise<NextResponse<CommitPOResponse>> {
  let pool;
  let transaction;

  try {
    const {
      noSPK,
      kodeBarang,
      namaPO,
      qty,
      userID,
      materialUsage,
    }: CommitPORequest = await request.json();

    // Validasi input
    if (!noSPK || !kodeBarang || !namaPO || !qty || !userID || !materialUsage) {
      return NextResponse.json(
        { success: false, error: "Data yang diperlukan tidak lengkap" },
        { status: 400 }
      );
    }

    // Koneksi ke database
    pool = await getPool();
    transaction = new sql.Transaction(pool);

    await transaction.begin();

    console.log(`📝 Memulai commit PO: ${noSPK}`);

    // 1. Insert ke tabel taCommitPO
    const commitResult = await transaction
      .request()
      .input("No_SPK", sql.VarChar(50), noSPK)
      .input("KodeBarang", sql.VarChar(500), kodeBarang)
      .input("NamaPO", sql.VarChar(500), namaPO)
      .input("Qty", sql.Decimal(18, 2), qty)
      .input("UserID", sql.VarChar(50), userID)
      .query(`
        INSERT INTO [dbo].[taCommitPO] (No_SPK, KodeBarang, NamaPO, Qty, UserID)
        OUTPUT INSERTED.CommitID
        VALUES (@No_SPK, @KodeBarang, @NamaPO, @Qty, @UserID)
      `);

    const commitID = commitResult.recordset[0].CommitID;
    console.log(`✅ Commit PO berhasil dibuat dengan ID: ${commitID}`);

    // 2. Insert detail material usage ke taCommitPODetail
    let totalMaterials = 0;
    let totalQtyReserved = 0;

    for (const material of materialUsage) {
      if (material.qtyUsed > 0) {
        await transaction
          .request()
          .input("CommitID", sql.Int, commitID)
          .input("ItemID", sql.VarChar(50), material.itemId)
          .input("ItemName", sql.VarChar(500), material.itemName)
          .input("QtyPerUnit", sql.Decimal(18, 4), material.qtyPerUnit)
          .input("TotalNeeded", sql.Decimal(18, 2), material.totalNeeded)
          .input("StockBefore", sql.Decimal(18, 2), material.stockBefore)
          .input("StockAfter", sql.Decimal(18, 2), material.stockAfter)
          .input("QtyUsed", sql.Decimal(18, 2), material.qtyUsed)
          .input("Departemen", sql.VarChar(100), material.departemen || null)
          .input("Level", sql.Int, material.level)
          .query(`
            INSERT INTO [dbo].[taCommitPODetail] 
            (CommitID, ItemID, ItemName, QtyPerUnit, TotalNeeded, StockBefore, StockAfter, QtyUsed, Departemen, Level)
            VALUES 
            (@CommitID, @ItemID, @ItemName, @QtyPerUnit, @TotalNeeded, @StockBefore, @StockAfter, @QtyUsed, @Departemen, @Level)
          `);

        // 3. Insert reservasi stok ke taStockReservation
        await transaction
          .request()
          .input("CommitID", sql.Int, commitID)
          .input("ItemID", sql.VarChar(50), material.itemId)
          .input("ItemName", sql.VarChar(500), material.itemName)
          .input("ReservedQty", sql.Decimal(18, 2), material.qtyUsed)
          .input("No_SPK", sql.VarChar(50), noSPK)
          .query(`
            INSERT INTO [dbo].[taStockReservation] 
            (CommitID, ItemID, ItemName, ReservedQty, No_SPK, ExpiryDate)
            VALUES 
            (@CommitID, @ItemID, @ItemName, @ReservedQty, @No_SPK, DATEADD(day, 30, GETDATE()))
          `);

        totalMaterials++;
        totalQtyReserved += material.qtyUsed;
      }
    }

    // 4. Insert history
    await transaction
      .request()
      .input("CommitID", sql.Int, commitID)
      .input("No_SPK", sql.VarChar(50), noSPK)
      .input("KodeBarang", sql.VarChar(500), kodeBarang)
      .input("Action", sql.VarChar(50), "COMMIT")
      .input("OldStatus", sql.VarChar(20), null)
      .input("NewStatus", sql.VarChar(20), "COMMITTED")
      .input("UserID", sql.VarChar(50), userID)
      .input("Remarks", sql.VarChar(1000), `Commit PO dengan ${totalMaterials} material, total reserved: ${totalQtyReserved}`)
      .query(`
        INSERT INTO [dbo].[taCommitPOHistory] 
        (CommitID, No_SPK, KodeBarang, Action, OldStatus, NewStatus, UserID, Remarks)
        VALUES 
        (@CommitID, @No_SPK, @KodeBarang, @Action, @OldStatus, @NewStatus, @UserID, @Remarks)
      `);

    // Commit transaction
    await transaction.commit();

    console.log(`✅ Commit PO ${noSPK} berhasil: ${totalMaterials} materials, ${totalQtyReserved} qty reserved`);

    return NextResponse.json({
      success: true,
      commitID: commitID,
      totalMaterials: totalMaterials,
      totalQtyReserved: totalQtyReserved,
      message: `PO berhasil di-commit dengan ID: ${commitID}`,
    });
  } catch (error) {
    // Rollback transaction jika ada error
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("❌ Error saat rollback:", rollbackError);
      }
    }

    console.error("❌ Error commit PO:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Gagal commit PO",
      },
      { status: 500 }
    );
  } finally {
    // Tutup koneksi
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error("❌ Error menutup koneksi:", closeError);
      }
    }
  }
}