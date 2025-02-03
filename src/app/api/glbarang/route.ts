import { NextResponse } from "next/server";
import sql from "mssql";
import { glbarangType } from "@/lib/types";
// SQL Server Configuration
import { getPool } from "@/lib/config";


export async function GET(request:Request) {
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
   try {
    const pool = await getPool();

    let query = `
        SELECT DISTINCT
        a.[Acc] as COA,
        a.[ItemID],
        a.[TransDate],
        b.[ItemName] as Nama,
        c.[AccName] as Kategori,
        d.[NamaJenis] as Kategori_bahan
        FROM [cp].[dbo].[taAcd] as a
        INNER JOIN [cp].[dbo].[taGoods] as b on a.[ItemID] = b.[ItemID]
        INNER JOIN [cp].[dbo].[taGLAcc] as c on a.[Acc] = c.[Acc]
        INNER JOIN [cp].[dbo].[taKindofGoods] as d on b.[KodeJenis] = d.[KodeJenis]
        WHERE a.[Acc] IN ('1104.11','1104.12','1104.41','1104.21','1104.22','1104.24','1104.31','1104.91')
    `;

    if (startDate && endDate) {
      query += ` AND a.[TransDate] >= @StartDate AND a.[TransDate] <= @EndDate`
   }
      query += ` ORDER BY a.[TransDate] DESC`;

    const requestQuery = pool.request();
    if (startDate && endDate) {
      requestQuery.input("StartDate", sql.Date, new Date(startDate));
      requestQuery.input("EndDate", sql.Date, new Date(endDate));
    }

    const result = await requestQuery.query<glbarangType>(query);

    // Format the HeaderProdDate to show only the date part
    const formattedRecords = result.recordset.map((record) => ({
      ...record,
      TransDate: record.TransDate.toISOString().split("T")[0],
    }));

    return NextResponse.json(formattedRecords);
    // return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}