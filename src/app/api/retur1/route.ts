import { NextResponse } from "next/server";
import sql from "mssql";
import { LbmType } from "@/lib/types";

// SQL Server Configuration
import { getPool } from "@/lib/config";
//import * as XLSX from "xlsx";

// Define a type for the record structure

export async function GET(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  try {
    const pool = await getPool();

    let query = `
      SELECT TOP (100000)
        hd.[MoveID],
        hd.[MoveType],
        hd.[LocID],
        hd.[MoveDate],
        hd.[Remark],
        dt.[ItemID],
        dt.[Bags],
        dt.[Kgs],
        dt.[HPPPrice],
        dt.[username],
        dt.[userdatetime] 
      FROM [cp].[dbo].[taOpNameIHD] AS hd
      INNER JOIN [cp].[dbo].[taOpNameIDT]
      AS dt ON hd.[MoveID] = dt.[MoveID] AND hd.[MoveType] = dt.[MoveType]
      WHERE hd.[MoveType] = 'K'
    `;

    if (startDate && endDate) {
      query += ` WHERE hd.[MoveDate] >= @StartDate AND hd.[MoveDate] <= @EndDate
`;
    }
    query += ` ORDER BY hd.[MoveID] DESC`;

    const requestQuery = pool.request();

    if (startDate && endDate) {
      requestQuery.input("StartDate", sql.Date, new Date(startDate));
      requestQuery.input("EndDate", sql.Date, new Date(endDate));
    }

    const result = await requestQuery.query<LbmType>(query);

    // Format the HeaderProdDate to show only the date part
    const formattedRecords = result.recordset.map((record) => ({
      ...record,
      MoveDate: record.MoveDate.toISOString().split("T")[0],
    }));

    return NextResponse.json(formattedRecords);
    // return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}
