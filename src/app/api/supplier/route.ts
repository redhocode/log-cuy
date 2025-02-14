import { NextResponse } from "next/server";
import { getPool } from "@/lib/config";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const queryParams = url.searchParams;

    // Menampilkan query parameters di console
    for (const [key, value] of Array.from(queryParams)) {
      console.log(`${key}: ${value}`);
    }

    // Mengambil koneksi ke SQL Server
    const pool = await getPool();

    // Menyusun query untuk mengambil data
    const query = `
      SELECT TOP (100000)
       CompanyID,
       CompanyName1 AS Nama,
       Address1 AS Alamat,
       Status AS Status,
      FORMAT(UserDateTime, 'yyyy-MM-dd') AS Tanggal_Masuk
      FROM [cp].[dbo].[taSupplier]
      ORDER BY Tanggal_Masuk DESC
    `;

    // Menjalankan query SQL dan mendapatkan hasilnya
    const result = await pool.request().query(query);

    // Mengembalikan data dalam format JSON
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}