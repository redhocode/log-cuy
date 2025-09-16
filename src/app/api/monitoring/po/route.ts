/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getPool } from "@/lib/config";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
     const start = searchParams.get("start");
     const end = searchParams.get("end");
    const search = searchParams.get("search");

    const pool = await getPool();
    const request = pool.request();

    // if (start) request.input("start", start);
    // if (end) request.input("end", end);
  
let query = `
  SELECT
      a.OrderID AS SPK,
      CONVERT(VARCHAR(10), a.PlanDate, 23) AS tanggal_planning,
      a.Remark AS Nama_PO,
      e.ItemID AS item_po,
      e.Kgs AS qty_po,
      d.ItemID AS item_produksi,
      d.Kgs AS qty,
      d.ItemType AS NamaJenis,
      d.ProdType AS departemen,
      NULLIF(CONVERT(VARCHAR(10), d.ProdDate, 23), '') AS tanggal_produksi,
      f.Remark AS Nama_PO_Kirim,
      NULLIF(CONVERT(VARCHAR(10), f.MoveDate, 23), '') AS tanggal_kirim,
      CASE WHEN d.ItemID IS NOT NULL THEN 'Sudah Produksi' ELSE 'Belum Produksi' END AS status_produksi,
      CASE WHEN f.MoveDate IS NOT NULL THEN 'Sudah Dikirim' ELSE 'Belum Dikirim' END AS status_kirim
  FROM taPROrder a
  INNER JOIN taProrderDT e ON e.OrderID = a.OrderID
  LEFT JOIN taPRproddt d ON d.NoPO = a.OrderID 
  LEFT JOIN taTransOHD2 f ON f.OrderID = a.OrderID
  WHERE 1=1
`;

// filter tanggal
if (start) {
  query += " AND a.PlanDate >= @start";
  request.input("start", start);
}
if (end) {
  query += " AND a.PlanDate <= @end";
  request.input("end", end);
}

// filter search
if (search) {
  query += `
AND (
  LOWER(a.OrderID) LIKE LOWER(@search)
  OR LOWER(a.Remark) LIKE LOWER(@search)
  OR LOWER(e.ItemID) LIKE LOWER(@search)
  OR LOWER(d.ItemID) LIKE LOWER(@search)
)

  `;
  request.input("search", `%${search}%`);
}

query += " ORDER BY a.PlanDate DESC;";

    const result = await request.query(query);


    return NextResponse.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Tracking API error:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
