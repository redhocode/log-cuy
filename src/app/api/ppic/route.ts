// /api/ppic
import { NextResponse } from "next/server";
import sql from "mssql";
import { Spktype } from "@/lib/types";
import { getPool } from "@/lib/config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  try {
    const pool = await getPool();

    let query = `
      SELECT TOP (10000)
        hd.[OrderID] AS No_SPK,
        hd.[OrderDate] AS Tanggal_Order,
        hd.[Remark] AS Nama_PO,
        dt.[itemID] AS Kode_Barang,
        dt.[Kgs] AS QTY
      FROM [cp].[dbo].[taPROrder] AS hd
      INNER JOIN [cp].[dbo].[taPROrderDt] AS dt
        ON hd.[OrderID] = dt.[OrderID]
        AND hd.[OrderType] = dt.[OrderType]
      WHERE hd.[Completed] = '0' AND hd.[OrderID] LIKE 'AS%'
    `;

    if (startDate && endDate) {
      query += `
        AND CONVERT(DATE, hd.[OrderDate]) >= @StartDate
        AND CONVERT(DATE, hd.[OrderDate]) <= @EndDate
      `;
    }

    query += ` ORDER BY hd.[OrderDate] DESC`;

    const requestQuery = pool.request();

    if (startDate && endDate) {
      requestQuery.input("StartDate", sql.Date, new Date(startDate));
      requestQuery.input("EndDate", sql.Date, new Date(endDate));
    }

    const result = await requestQuery.query<Spktype>(query);

    const formattedRecords = result.recordset.map((record) => ({
      ...record,
      Tanggal_Order: record.Tanggal_Order?.toISOString().split("T")[0],
    }));

    return NextResponse.json(formattedRecords);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}
