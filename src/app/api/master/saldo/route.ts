//saldo ini di ambil dari data dari laporan excel admin
import { NextResponse } from "next/server";
import { getPool } from "@/lib/config";

// import { saldoType } from "@/lib/types";
// import sql from "mssql";

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
        SELECT 
            [ItemID],
            [Bulan],
            [Gudang],
            [Tahun],
            [Saldo]
        FROM [cp].[dbo].[SaldoGudang]
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