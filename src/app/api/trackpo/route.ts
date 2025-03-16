import { NextResponse } from "next/server";
import sql from "mssql";
import { trackPoType } from "@/lib/types"; // Pastikan trackPoType sudah didefinisikan dengan benar
import { getPool } from "@/lib/config"; // Mengimpor fungsi untuk mendapatkan koneksi ke SQL Server

export async function GET(request: Request) {
  // Mengambil parameter startDate dan endDate dari query string URL
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  try {
    // Membuka koneksi ke database SQL Server
    const pool = await getPool();

    // Menyusun query SQL untuk mengambil data
    let query = `
SELECT 
    pohd.[OrderID] AS SPK,
    pohd.[Remark] AS Name,
    CONVERT(DATE, pohd.[OrderDate]) AS OrderDate,
    CONVERT(DATE, pohd.[PlanDate]) AS PlanDate,
    pohd.[ItemID] AS Item_PO,
    pohd.[Kgs] AS Qty_PO,
    prod.[ItemType],
    prod.[ProdType] AS Dept,
    prod.[ItemID] AS Item_Prod,
    SUM(prod.[Kgs]) AS Qty_Prod, -- Menjumlahkan Qty_Prod
    MAX(CONVERT(DATE, prod.[ProdDate])) AS Produksi, -- Mengambil tanggal produksi terbaru
    CASE
        WHEN SUM(prod.[Kgs]) IS NULL THEN 'Belum Produksi' 
        WHEN pohd.[Kgs] = SUM(prod.[Kgs]) THEN 'Selesai'
        WHEN pohd.[Kgs] > SUM(prod.[Kgs]) THEN 'Belum Selesai'
        ELSE 'Produksi Lebih'
    END AS Status
FROM [CP].[dbo].[taPROrder] AS pohd
LEFT JOIN [CP].[dbo].[taPRProdDt] AS prod 
    ON prod.[ItemID] = pohd.[ItemID]
    AND prod.[OrderID] = pohd.[OrderID]  -- Menjaga kecocokan OrderID pada JOIN
WHERE 
    YEAR(pohd.[OrderDate]) = 2025 -- Filter berdasarkan tahun OrderDate
    AND (prod.[ItemType] = 'H' OR prod.[ProdDate] IS NULL) -- Menampilkan yang belum diproduksi
  `;
    if (startDate && endDate) {
      query += ` AND CONVERT(DATE, pohd.[OrderDate]) >= @startDate AND CONVERT(DATE, pohd.[OrderDate]) <= @endDate`;
    }

    query += `
GROUP BY
    pohd.[OrderID],
    pohd.[Remark],
    pohd.[OrderDate],
    pohd.[PlanDate],
    pohd.[ItemID],
    pohd.[Kgs],
    prod.[ItemType],
    prod.[ProdType],
    prod.[ItemID]
ORDER BY pohd.[OrderDate] DESC;
`;
    // Menyiapkan parameter untuk query jika ada
    const requestQuery = pool.request();

    if (startDate && endDate) {
      requestQuery.input("startDate", sql.Date, new Date(startDate));
      requestQuery.input("endDate", sql.Date, new Date(endDate));
    }

    // Menjalankan query dan mendapatkan hasilnya
    const result = await requestQuery.query<trackPoType>(query);

    // Memformat tanggal agar hanya menampilkan tanggal saja
    const formattedRecords = result.recordset.map((record) => ({
      ...record,
      // Menambahkan pengecekan untuk null atau undefined pada OrderDate dan PlanDate
      OrderDate: record.OrderDate
        ? record.OrderDate.toISOString().split("T")[0]
        : "-",
      PlanDate: record.PlanDate
        ? record.PlanDate.toISOString().split("T")[0]
        : "-",
    }));

    // Mengembalikan hasil dalam format JSON
    return NextResponse.json(formattedRecords);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching data:", error.message);
    } else {
      console.error("Unknown error:", error);
    }
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}
