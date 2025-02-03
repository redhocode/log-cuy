import { NextResponse } from "next/server";
import sql from "mssql";
import { trackPoType } from "@/lib/types";
// SQL Server Configuration
import { getPool } from "@/lib/config";
// import * as XLSX from "xlsx";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  try {
    const pool = await getPool();

    let query = `
    SELECT TOP (10000)
    pohd.[OrderID] as SPK,
    pohd.[Remark] as Name,
    CONVERT(DATE, pohd.[OrderDate]) AS OrderDate,
    CONVERT(DATE, pohd.[PlanDate]) AS PlanDate,
    podt.[ItemID] AS Item_PO,
    podt.[Kgs] AS Qty_PO, 
    prod.[ItemType],
    prod.[ProdType] AS Dept,
    prod.[ItemID] AS Item_Prod,
    prod.[Kgs] AS Qty_Prod, 
    CONVERT(DATE, prod.[ProdDate]) AS Produksi,
    CASE
        WHEN prod.[Kgs] IS NULL THEN 'Belum Produksi' 
        WHEN podt.[Kgs] = prod.[Kgs] THEN 'Selesai'
        WHEN podt.[Kgs] > prod.[Kgs] THEN 'Belum Selesai'
        ELSE 'Produksi Lebih'
    END AS Status
        FROM [CP].[dbo].[taPROrder] AS pohd
        LEFT JOIN [CP].[dbo].[taPROrderDT] AS podt 
            ON pohd.[OrderID] = podt.[OrderID]
        LEFT JOIN [CP].[dbo].[taPRProdHd] AS prohd 
            ON pohd.[OrderID] = prohd.[OrderID]
        LEFT JOIN [CP].[dbo].[taPRProdDt] AS prod 
            ON prohd.[ProdID] = prod.[ProdID] and prod.[ProdType]=pohd.[PRDeptID]
    `;

    if (startDate && endDate) {
      query += ` WHERE pohd.[OrderDate] >= @StartDate AND pohd.[OrderDate] <= @EndDate
`;
    }
    query += ` ORDER BY pohd.[OrderDate] DESC`;

    const requestQuery = pool.request();

    if (startDate && endDate) {
      requestQuery.input("StartDate", sql.Date, new Date(startDate));
      requestQuery.input("EndDate", sql.Date, new Date(endDate));
    }

    const result = await requestQuery.query<trackPoType>(query);

    // Format the HeaderProdDate to show only the date part
    const formattedRecords = result.recordset.map((record) => ({
      ...record,
      OrderDate: record.OrderDate.toISOString().split("T")[0],
      PlanDate: record.PlanDate.toISOString().split("T")[0],
    }));

    return NextResponse.json(formattedRecords);
    // return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}
