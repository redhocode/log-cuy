import { NextResponse } from "next/server";
import sql from "mssql";
import { ProduksiType } from "@/lib/types";
// SQL Server Configuration
import {getPool} from "@/lib/config";

// Define a type for the record structure

export async function GET(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  try {
    const pool = await getPool();

    let query = `
      SELECT TOP (10000)
        hd.[ProdID],
        hd.[ProdDate] AS HeaderProdDate,
        hd.[ProdType] AS HeaderProdType,
        dt.[ProdType],
        hd.[DeptID],
        hd.[OrderID],
        hd.[OrderType],
        hd.[LocID],
        hd.[Remark],
        dt.[ItemID],
        dt.[ItemType],
        dt.[Bags],
        dt.[Kgs],
        dt.[UserName],
        dt.[UserDateTime] 
      FROM [cp].[dbo].[taPRProdHd] AS hd
      JOIN [cp].[dbo].[taPRProdDt] AS dt ON hd.[ProdID] = dt.[ProdID] and hd.[ProdType] = dt.[ProdType]

    `;

    if (startDate && endDate) {
      query += ` WHERE hd.[ProdDate] BETWEEN @StartDate AND @EndDate 
`;
    }
    query += ` ORDER BY hd.[ProdDate] DESC`;

    const requestQuery = pool.request();

    if (startDate && endDate) {
      requestQuery.input("StartDate", sql.Date, new Date(startDate));
      requestQuery.input("EndDate", sql.Date, new Date(endDate));
    }

   const result = await requestQuery.query<ProduksiType>(query);

   // Format the HeaderProdDate to show only the date part
   const formattedRecords = result.recordset.map((record) => ({
     ...record,
     HeaderProdDate: record.HeaderProdDate.toISOString().split("T")[0],
    
   }));

   return NextResponse.json(formattedRecords);
   // return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}
