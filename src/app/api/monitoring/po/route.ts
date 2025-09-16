/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getPool } from "@/lib/config";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const pool = await getPool();
    const request = pool.request();

    // tambahkan parameter kalau ada
    if (start) request.input("start", start);
    if (end) request.input("end", end);

    const result = await request.query(`

SELECT TOP 200
    a.OrderID              AS SPK,
    CONVERT(VARCHAR(10), a.PlanDate, 23) AS tanggal_planning,
    a.Remark               AS Nama_PO,
    e.ItemID               AS item_po,
    e.Kgs                  AS qty_po,
    d.ItemID               AS item_produksi,
    d.Kgs                  AS qty,
    d.ItemType             AS NamaJenis,
    d.ProdType             AS departemen,
    CONVERT(VARCHAR(10), d.ProdDate, 23) AS tanggal_produksi,
    f.Remark               AS Nama_PO_Kirim,
    CONVERT(VARCHAR(10), f.MoveDate, 23) AS tanggal_kirim,
    CASE WHEN d.ItemID IS NOT NULL THEN 'Sudah Produksi' ELSE 'Belum Produksi' END AS status_produksi,
    CASE WHEN f.MoveDate IS NOT NULL THEN 'Sudah Dikirim' ELSE 'Belum Dikirim' END AS status_kirim
FROM taPROrder a
LEFT JOIN taProrderDT e ON e.OrderID = a.OrderID
LEFT JOIN taPRproddt d  
    ON d.NoPO = a.OrderID 
LEFT JOIN taTransOHD2 f ON a.NoSO = f.OrderID
WHERE a.PlanDate BETWEEN @start AND @end
ORDER BY a.OrderID DESC;




    `);

    return NextResponse.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Tracking API error:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}


//  SELECT 
//     a.OrderID              AS SPK,
//     CONVERT(VARCHAR(10), a.PlanDate, 23)   AS tanggal_planning,
//     a.Remark               AS Nama_PO,
//     e.ItemID               AS item_po,
//     e.Kgs                  AS qty_po,
//     c.ItemID               AS item_bom,          
//     CASE 
//         WHEN d.ItemID IS NOT NULL THEN 'Sudah Produksi'
//         ELSE 'Belum Produksi'
//     END                    AS status_produksi,
//     d.ItemID               AS item_produksi,
//     d.Kgs                  AS qty,
//     d.ItemType             AS NamaJenis,
//     d.ProdType             AS departemen,
//     CONVERT(VARCHAR(10), d.ProdDate, 23) AS tanggal_produksi,
//     f.Remark               AS Nama_PO_Kirim,
//     CONVERT(VARCHAR(10), f.MoveDate, 23) AS tanggal_kirim,
//     CASE
//         WHEN f.MoveDate IS NOT NULL THEN 'Sudah Dikirim'
//         ELSE 'Belum Dikirim'
//     END                    AS status_kirim
// FROM taPROrder a
// INNER JOIN taProrderDT e 
//     ON e.OrderID = a.OrderID
// INNER JOIN taPackingHD b 
//     ON e.ItemID = b.ItemID
// INNER JOIN taPackingDT c 
//     ON c.TransID = b.TransID
// LEFT JOIN taPRproddt d 
//     ON d.NoPO = a.OrderID 
// LEFT JOIN taTransOHD2 f 
//     ON a.NoSO = f.OrderID
// WHERE (@start IS NULL OR a.PlanDate >= @start)
//   AND (@end IS NULL OR a.PlanDate <= @end)
// ORDER BY a.OrderID DESC, e.ItemID, c.ItemID, d.ProdDate;