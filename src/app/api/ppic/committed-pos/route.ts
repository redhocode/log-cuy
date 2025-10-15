// app/api/committed-pos/route.ts
import { NextResponse } from "next/server";
//import sql from "mssql";
import { getPool } from "@/lib/config";
import { CommittedPOsResponse } from "@/lib/types";

export async function GET(): Promise<NextResponse<CommittedPOsResponse>> {
  let pool;

  try {
    pool = await getPool();

    console.log("📋 Mengambil data committed POs...");

    // Ambil daftar committed PO
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

    // Ambil daftar reservasi stok
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
        cp.No_SPK as noSPK
      FROM [dbo].[taStockReservation] sr
      INNER JOIN [dbo].[taCommitPO] cp ON sr.CommitID = cp.CommitID
      WHERE sr.Status IN ('RESERVED', 'RELEASED')
      ORDER BY sr.ReservationDate DESC
    `);

    const committedPOs = committedPOsResult.recordset || [];
    const reservations = reservationsResult.recordset || [];

    console.log(
      `✅ Data committed POs berhasil diambil: ${committedPOs.length} PO, ${reservations.length} reservations`
    );

    return NextResponse.json({
      success: true,
      data: {
        committedPOs: committedPOs,
        reservations: reservations,
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
