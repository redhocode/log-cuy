import { NextResponse } from "next/server";
import sql from "mssql";
import { kasType } from "@/lib/types";
// SQL Server Configuration
import { getPool } from "@/lib/config";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const refType = url.searchParams.get("refType");

  try {
    const pool = await getPool();

    let query = `
      SELECT TOP (10000)
        hd.[RefNo],
        hd.[RefType],
        hd.[RefDate],
        hd.[TotalRp],
        dt.[Status],
        dt.[Acc],
        dt.[Remark],
        dt.[Pos],
        dt.[Curr],
        dt.[username],
        dt.[userdatetime]
      FROM [cp].[dbo].[taGLJnlHD] AS hd
      INNER JOIN [cp].[dbo].[taGLJnlDT] AS dt ON hd.[RefNo] = dt.[RefNo] AND hd.[RefType] = dt.[RefType]
      WHERE hd.[RefType] IN ('JU')
    `;

    // Add date filter if provided
    if (startDate && endDate) {
      query += ` AND hd.[RefDate] >= @StartDate AND hd.[RefDate] <= @EndDate`;
    }

    // Add RefType filter if provided
    if (refType) {
      query += ` AND hd.[RefType] = @RefType`;
    }

    query += ` ORDER BY hd.[RefNo] DESC`;

    const requestQuery = pool.request();

    // Add inputs for parameters
    if (startDate && endDate) {
      requestQuery.input("StartDate", sql.Date, new Date(startDate));
      requestQuery.input("EndDate", sql.Date, new Date(endDate));
    }

    // if (refType) {
    //   requestQuery.input("RefType", sql.NVarChar, refType); // Add RefType parameter
    // }

    const result = await requestQuery.query<kasType>(query);

    // Format the date and TotalRp (money) to proper formats
    const formattedRecords = result.recordset.map((record) => ({
      ...record,
      RefDate: record.RefDate.toISOString().split("T")[0], // format date
      TotalRp: new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(record.TotalRp), // format TotalRp to currency
    }));

    return NextResponse.json(formattedRecords);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}
