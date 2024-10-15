import { NextResponse } from "next/server";
import sql from "mssql";

// SQL Server Configuration
const config = {
  user: "sa",
  password: "cpedp",
  server: "192.168.1.218",
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
// Define a type for the record structure
type RecordType = {
  ProdID: string;
  ProdType: string;
  ProdDate: Date; // Keep as Date for processing
  ItemID: string;
  ItemType: string;
  Bags: number;
  Kgs: number;
  UserName: string;
  UserDateTime: string;

};
export async function GET(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  try {
    const pool = await getPool();

    // Start building the SQL query
    let query = `
      SELECT 
        [ProdID],
        [ProdType],
        [ProdDate],
        [ItemID],
        [ItemType],
        [Bags],
        [Kgs],
        [UserName],
        [UserDateTime]
      FROM [CP].[dbo].[taPRProdDt]
    `;

    // If date range is provided, filter the results
    if (startDate && endDate) {
      query += ` WHERE ProdDate BETWEEN @StartDate AND @EndDate `;
    }
    query += ` ORDER BY ProdID DESC`;

    const requestQuery = pool.request();

    // Bind parameters if date range is specified
   if (startDate && endDate) {
     requestQuery.input("StartDate", sql.Date, new Date(startDate));
     requestQuery.input("EndDate", sql.Date, new Date(endDate));
   }

   const result = await requestQuery.query<RecordType>(query);

   // Format the HeaderProdDate to show only the date part
   const formattedRecords = result.recordset.map((record) => ({
     ...record,
     ProdDate: record.ProdDate.toISOString().split("T")[0],
   }));
    return NextResponse.json(formattedRecords);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}

