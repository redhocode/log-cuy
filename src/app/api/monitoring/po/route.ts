import { NextResponse } from "next/server";
import sql from "mssql";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  try {
    const pool = await sql.connect(process.env.DB_CONN!);
    const result = await pool.request().query(`
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
      LEFT JOIN taTransOHD2 f ON a.NoSO = f.OrderID
      ${start && end ? `WHERE a.PlanDate BETWEEN '${start}' AND '${end}'` : ""}
      ORDER BY a.PlanDate DESC
    `);

    return NextResponse.json({ success: true, data: result.recordset });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message });
  }
}
