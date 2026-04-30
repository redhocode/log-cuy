// app/api/ppic/committed-pos/route.ts
import { NextResponse } from "next/server";
import { getPool } from "@/lib/config";
import { CommittedPOsResponse } from "@/lib/types";

export async function GET(): Promise<NextResponse<CommittedPOsResponse>> {
  let pool;

  try {
    pool = await getPool();

    console.log("📋 Mengambil data committed POs...");

    // 1. Ambil daftar SPK yang sudah selesai (Completed = 1)
    const completedSPKResult = await pool.request().query(`
      SELECT OrderID 
      FROM [cp].[dbo].[taPROrder] 
      WHERE Completed = 1
    `);

    const completedSPKSet = new Set(
      completedSPKResult.recordset.map((row: any) => row.OrderID),
    );

    console.log(
      `SPK yang sudah selesai: ${Array.from(completedSPKSet).join(", ")}`,
    );

    // 2. Ambil daftar committed PO
    const committedPOsResult = await pool.request().query(`
      SELECT 
        cp.CommitID,
        cp.No_SPK as noSPK,
        cp.KodeBarang as kodeBarang,
        cp.NamaPO as namaPO,
        cp.Qty as qty,
        cp.TanggalCommit as tanggalCommit,
        cp.UserID as userID,
        cp.Status as status,
        (SELECT COUNT(*) FROM [dbo].[taCommitPODetail] cpd WHERE cpd.CommitID = cp.CommitID) as totalMaterials,
        (SELECT COALESCE(SUM(sr.ReservedQty), 0) FROM [dbo].[taStockReservation] sr WHERE sr.CommitID = cp.CommitID AND sr.Status = 'RESERVED') as totalQtyReserved
      FROM [dbo].[taCommitPO] cp
      WHERE cp.Status IN ('COMMITTED', 'UNCOMMITTED')
      ORDER BY cp.CreatedAt DESC
    `);

    // FILTER: Hanya committed PO untuk SPK yang BELUM selesai
    const filteredCommittedPOs = (committedPOsResult.recordset || []).filter(
      (po: any) => !completedSPKSet.has(po.noSPK),
    );

    // 3. Ambil daftar reservasi stok dengan JOIN ke taCommitPO untuk mendapatkan NamaPO
    const reservationsResult = await pool.request().query(`
      SELECT 
        sr.ReservationID as reservationID,
        sr.CommitID as commitID,
        sr.ItemID as itemID,
        sr.ItemName as itemName,
        sr.ReservedQty as reservedQty,
        sr.ReservationDate as reservationDate,
        sr.Status as status,
        sr.ExpiryDate as expiryDate,
        sr.No_SPK as noSPK,
        cp.NamaPO as namaPO  -- 🔥 Tambahkan NamaPO dari JOIN ke taCommitPO
      FROM [dbo].[taStockReservation] sr
      INNER JOIN [dbo].[taCommitPO] cp ON sr.CommitID = cp.CommitID
      WHERE sr.Status IN ('RESERVED', 'RELEASED')
      ORDER BY sr.ReservationDate DESC
    `);

    // FILTER: Hanya reservasi untuk SPK yang BELUM selesai
    const filteredReservations = (reservationsResult.recordset || []).filter(
      (reservation: any) => !completedSPKSet.has(reservation.noSPK),
    );

    console.log(
      `✅ Data committed POs: ${filteredCommittedPOs.length} PO (total ${committedPOsResult.recordset.length}), ` +
        `Reservations: ${filteredReservations.length} (total ${reservationsResult.recordset.length})`,
    );

    return NextResponse.json({
      success: true,
      data: {
        committedPOs: filteredCommittedPOs,
        reservations: filteredReservations,
      },
    });
  } catch (error) {
    console.error("❌ Error mengambil committed POs:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data committed PO",
        data: {
          committedPOs: [],
          reservations: [],
        },
      },
      { status: 500 },
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
