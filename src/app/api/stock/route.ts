/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";

type CacheValue = {
  data: any[];
  stockAkhir: { totalKgs: number };
  expiresAt: number;
};

const CACHE_TTL = 5 * 60 * 1000; // 5 menit
const cache = new Map<string, CacheValue>();

async function getRpStockL(params: any) {
  const pool = await getPool();
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
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const periodeR = "201905"; // fixed periode
    const loc = url.searchParams.get("loc") || "%";
    const item = url.searchParams.get("item") || "%";
    const tgl = new Date(url.searchParams.get("tgl") || "2023-12-31");
    const company = parseInt(url.searchParams.get("company") || "0");
    const tipestock = parseInt(url.searchParams.get("tipestock") || "0");
    const jenisbarang = parseInt(url.searchParams.get("jenisbarang") || "9");
    const kategori = url.searchParams.get("kategori") || "BAHAN BAKU";
    const minus = parseInt(url.searchParams.get("minus") || "0");

    const cacheKey = `${periodeR}-${loc}-${item}-${tgl.toISOString()}-${company}-${tipestock}-${jenisbarang}-${kategori}-${minus}`;

    // 🔹 cek cache valid
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      console.log("✅ dari cache:", cacheKey);
      return NextResponse.json({
        data: cached.data,
        stockAkhir: cached.stockAkhir,
      });
    }

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

    const startTime = Date.now();
    const data = await getRpStockL(params);
    console.log(`🕒 Query selesai dalam ${Date.now() - startTime} ms`);

    const stockAkhir = data.reduce(
      (acc, item) => {
        const totalKgs = parseFloat(item.totalkgs);
        if (!isNaN(totalKgs)) acc.totalKgs += totalKgs;
        return acc;
      },
      { totalKgs: 0 }
    );

    // simpan ke cache dengan TTL
    cache.set(cacheKey, {
      data,
      stockAkhir,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return NextResponse.json({ data, stockAkhir });
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
