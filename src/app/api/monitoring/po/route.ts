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
      SELECT 
    a.OrderID              AS SPK,
    CONVERT(VARCHAR(10), a.PlanDate, 23)   AS tanggal_planning, -- YYYY-MM-DD
    a.Remark               AS Nama_PO,
    e.ItemID               AS item_po,
    e.Kgs                 AS qty_po,
    c.ItemID               AS item_bom,          
    CASE 
        WHEN prod.itemid IS NOT NULL THEN 'Sudah Produksi'
        ELSE 'Belum Produksi'
    END                    AS status_produksi,
    prod.itemid            AS item_produksi,
    prod.kgs               AS qty,
    prod.prodtype          AS departemen,
    CONVERT(VARCHAR(10), prod.ProdDate, 23) AS tanggal_produksi -- YYYY-MM-DD
FROM taPROrder a
INNER JOIN taProrderDT e 
    ON e.OrderID = a.OrderID
INNER JOIN taPackingHD b 
    ON e.ItemID = b.ItemID
INNER JOIN taPackingDT c 
    ON c.TransID = b.TransID
OUTER APPLY (
    SELECT TOP 1 
        d.ItemID, 
        d.Kgs, 
        d.ProdType, 
        d.ProdDate
    FROM taPRproddt d
    WHERE d.NoPO = a.OrderID 
      AND d.ItemType = 'H' and e.ItemID=c.ItemID
    ORDER BY d.ProdDate DESC
) prod
WHERE (@start IS NULL OR a.PlanDate >= @start)
  AND (@end IS NULL OR a.PlanDate <= @end)
ORDER BY a.OrderID DESC, e.ItemID, c.ItemID;

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
