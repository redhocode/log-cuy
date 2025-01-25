import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config"; // Ensure this path is correct

// Function to call the stored procedure and get data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRpStockL(params: any) {
  const pool = await getPool();
  try {
    const result = await pool
      .request()
      .input("PeriodeR", sql.VarChar(6), params.periodeR)
      .input("Loc", sql.VarChar(6), params.loc)
      .input("Item", sql.VarChar(500), params.item)
      .input("Tgl", sql.DateTime, params.tgl)
      .input("company", sql.Int, params.company)
      .input("tipestock", sql.SmallInt, params.tipestock)
      .input("jenisbarang", sql.SmallInt, params.jenisbarang)
      .input("kategori", sql.VarChar(20), params.kategori)
      .input("minus", sql.Int, params.minus)
      .execute("[dbo].[rpStockL]");

    return result.recordset;
  } catch (error) {
    console.error("Error executing stored procedure:", error);
    throw new Error("Database query failed");
  }
}

export async function GET(req: Request) {
  try {
    // Hardcoded Periode value (201905)
    const periodeR = "201905"; // Fixed Periode

    // Getting query params from URL
    const url = new URL(req.url);
    const loc = url.searchParams.get("loc") || "%";
    const item = url.searchParams.get("item") || "%";
    const tgl = new Date(url.searchParams.get("tgl") || "2023-12-31");
    const company = parseInt(url.searchParams.get("company") || "0");
    const tipestock = parseInt(url.searchParams.get("tipestock") || "0");
    const jenisbarang = parseInt(url.searchParams.get("jenisbarang") || "9");
    const kategori = url.searchParams.get("kategori") || "BAHAN BAKU";
    const minus = parseInt(url.searchParams.get("minus") || "0");

    // Prepare parameters for stored procedure
    const params = {
      periodeR,
      loc,
      item,
      tgl,
      company,
      tipestock,
      jenisbarang,
      kategori,
      minus,
    };

    // Call function to get data from stored procedure
    const data = await getRpStockL(params);

    // Calculate final stock by summing only total Kgs (totalkgs)
    const stockAkhir = data.reduce(
      (acc, item) => {
        const totalKgs = item.totalkgs || 0; // Sum only totalKgs

        // Sum total Kgs to calculate stock akhir
        acc.totalKgs += totalKgs;

        return acc;
      },
      { totalKgs: 0 } // Only track totalKgs
    );

    // Return the data and stock calculation
    return NextResponse.json({ data, stockAkhir });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
