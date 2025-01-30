import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";

// Tipe data untuk response API
interface KartuStockData {
  Item: string;
  Loc: string;
  Jumlah: number;
  Tanggal: string;
}

// Function to fetch the most recent period from the taACR table
async function getLatestPeriodFromDB() {
  try {
    const pool = await getPool();
    // Query to get the most recent period from taACR
    const periodeResult = await pool
      .request()
      .query("SELECT TOP 1 Periode FROM taACR ORDER BY Periode DESC");

    // Return the most recent period found, or fallback to "201905"
    if (periodeResult.recordset.length > 0) {
      return periodeResult.recordset[0].Periode;
    } else {
      return "201905"; // Fallback if no period is found
    }
  } catch (error) {
    console.error("Error fetching the most recent period:", error);
    throw new Error("Error fetching the most recent period");
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  // Get parameters from query string
  const tgl1 = url.searchParams.get("tgl1");
  const tgl2 = url.searchParams.get("tgl2");
  const loc = url.searchParams.get("loc") || "%"; // Default to '%' if not provided
  const item = url.searchParams.get("item");
  const kategori = url.searchParams.get("kategori") || "0"; // Default to '0' if not provided
  const itemid = url.searchParams.get("itemid");

  // Validate required parameters
  if (!tgl1 || !tgl2 || !item || !itemid) {
    return NextResponse.json(
      { message: "Parameter tidak lengkap!" },
      { status: 400 }
    );
  }

  try {
    // Get the most recent period from the taACR table
    const periodeR = await getLatestPeriodFromDB();

    // Get connection pool
    const pool = await getPool();

    // Execute the stored procedure with parameters
    const result = await pool
      .request()
      .input("TGL1", sql.Date, tgl1)
      .input("TGL2", sql.Date, tgl2)
      .input("LOC", sql.NVarChar, loc)
      .input("ITEM", sql.NVarChar, item)
      .input("PERIODER", sql.NVarChar, periodeR)
      .input("KATEGORI", sql.NVarChar, kategori)
      .input("ITEMID", sql.NVarChar, itemid)
      .execute("dbo.usp_GetKartuStock");

    // Return the result as JSON
    return NextResponse.json(result.recordset as KartuStockData[]);
  } catch (err) {
    console.error("Error fetching data:", err);
    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
