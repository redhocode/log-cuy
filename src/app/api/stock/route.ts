/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config"; // Ensure this path is correct

// In-memory cache
const cache = new Map<string, { data: any; stockAkhir: any }>();

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
    const url = new URL(req.url);

    // Hardcoded Periode value (201905)
    const periodeR = "201905"; // Fixed Periode
    const loc = url.searchParams.get("loc") || "%";
    const item = url.searchParams.get("item") || "%";
    const tgl = new Date(url.searchParams.get("tgl") || "2023-12-31");
    const company = parseInt(url.searchParams.get("company") || "0");
    const tipestock = parseInt(url.searchParams.get("tipestock") || "0");
    const jenisbarang = parseInt(url.searchParams.get("jenisbarang") || "9");
    const kategori = url.searchParams.get("kategori") || "BAHAN BAKU";
    const minus = parseInt(url.searchParams.get("minus") || "0");

    // Cache key (unik per parameter)
    const cacheKey = `${periodeR}-${loc}-${item}-${tgl.toISOString()}-${company}-${tipestock}-${jenisbarang}-${kategori}-${minus}`;

    // 🔹 Cek cache dulu
    if (cache.has(cacheKey)) {
      console.log("✅ Data dari cache:", cacheKey);
      return NextResponse.json(cache.get(cacheKey));
    }

    // Prepare parameters
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

    // Execute stored procedure
    const startTime = Date.now();
    const data = await getRpStockL(params);
    const endTime = Date.now();
    console.log(`🕒 Stored Procedure executed in ${endTime - startTime} ms`);

    // Hitung stock akhir
    const stockAkhir = data.reduce(
      (acc, item) => {
        const totalKgs = parseFloat(item.totalkgs);
        if (!isNaN(totalKgs)) {
          acc.totalKgs += totalKgs;
        }
        return acc;
      },
      { totalKgs: 0 }
    );

    const response = { data, stockAkhir };

    // 🔹 Simpan ke cache (expire 5 menit)
    cache.set(cacheKey, response);
    setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
