import { NextResponse } from "next/server";
//import sql from "mssql";
import { getPool } from "@/lib/config";
//import * as XLSX from "xlsx";

export async function GET(request: Request) {
  try {
        const url = new URL(request.url);
        const queryParams = url.searchParams;
for (const [key, value] of Array.from(queryParams)) {
  console.log(`${key}: ${value}`);
}
    // Mengambil koneksi ke SQL Server
    const pool = await getPool();

    // Menyusun query untuk mengambil data
    const query = `
      SELECT TOP (100000)
        a.[ItemID],
        a.[ItemName],
        a.[ItemNameBuy],
        a.[Mark],
        a.[KodeJenis],
        a.[SatuanKecil],
        a.[Spec],
        b.[NamaJenis],
        a.[UserName],
        a.[UserDateTime]
      FROM [cp].[dbo].[taGoods] AS a
      INNER JOIN [cp].[dbo].[taKindofGoods] AS b
      ON a.[KodeJenis] = b.[KodeJenis]
    `;

    // Menjalankan query SQL dan mendapatkan hasilnya
    const result = await pool.request().query(query);

    // Jika Anda ingin mengembalikan data dalam format JSON
    return NextResponse.json(result.recordset);

    // Jika Anda ingin mengonversi data menjadi file Excel dan mengembalikannya
    // const wb = XLSX.utils.book_new();
    // const ws = XLSX.utils.json_to_sheet(result.recordset);
    // XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    // const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    // return new NextResponse(excelBuffer, {
    //   headers: {
    //     "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    //     "Content-Disposition": "attachment; filename=data.xlsx",
    //   },
    // });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}
