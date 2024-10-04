import { NextResponse } from "next/server";
import sql from "mssql";

// SQL Server Configuration
const config = {
  user: "sa",
  password: "",
  server: "",
  port: 1433,
  database: "cp",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let poolPromise: Promise<sql.ConnectionPool> | undefined;

const getPool = async () => {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then((pool) => {
        console.log("Connected to MSSQL");
        return pool;
      })
      .catch((err) => {
        console.error("Database connection failed: ", err);
        throw err;
      });
  }
  return poolPromise;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  try {
    const pool = await getPool();

    let query = `
      SELECT TOP (1000)
        hd.[ProdID],
        hd.[ProdType] AS HeaderProdType,
        hd.[ProdDate] AS HeaderProdDate,
        hd.[DeptID],
        hd.[OrderID],
        hd.[OrderType],
        hd.[LocID],
        hd.[Remark],
        dt.[ItemID],
        dt.[ItemType],
        dt.[Bags],
        dt.[Kgs],
        dt.[BagsLeft],
        dt.[KgsLeft],
        dt.[UserName],
        dt.[UserDateTime] 
      FROM [cp].[dbo].[taPRProdHd] AS hd
      JOIN [cp].[dbo].[taPRProdDt] AS dt ON hd.[ProdID] = dt.[ProdID]
    `;

    if (startDate && endDate) {
      query += ` WHERE hd.[ProdDate] BETWEEN @StartDate AND @EndDate`;
    }
    query += ` ORDER BY hd.[ProdID] DESC`;

    const requestQuery = pool.request();

    if (startDate && endDate) {
      requestQuery.input("StartDate", sql.Date, new Date(startDate));
      requestQuery.input("EndDate", sql.Date, new Date(endDate));
    }

    const result = await requestQuery.query(query);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}
