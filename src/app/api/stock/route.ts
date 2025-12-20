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

// Fungsi untuk menormalisasi data - FOKUS PADA totalkgs
function normalizeStockData(data: any[]) {
  console.log(`🔄 Normalisasi ${data.length} data`);

  return data.map((item, index) => {
    // 1. Cari properti totalkgs dengan case insensitive
    const keys = Object.keys(item);
    let totalkgsValue = 0;

    // Cari properti yang mengandung 'totalkgs' (case insensitive)
    for (const key of keys) {
      if (key.toLowerCase() === "totalkgs") {
        const val = item[key];

        // Konversi ke number dengan aman
        if (val === null || val === undefined || val === "") {
          totalkgsValue = 0;
        } else {
          const numVal = Number(val);
          totalkgsValue = isNaN(numVal) ? 0 : numVal;
        }
        break;
      }
    }

    // Jika tidak ditemukan totalkgs, coba properti lain sebagai fallback
    if (totalkgsValue === 0) {
      // Fallback ke properti yang mungkin berisi kgs
      const fallbackKeys = keys.filter(
        (k) => k.toLowerCase().includes("kgs") || k.toLowerCase().includes("kg")
      );

      for (const key of fallbackKeys) {
        const val = item[key];
        if (val != null) {
          const numVal = Number(val);
          if (!isNaN(numVal) && numVal !== 0) {
            console.warn(
              `⚠️ Item ${index}: Menggunakan fallback key '${key}' = ${val}`
            );
            totalkgsValue = numVal;
            break;
          }
        }
      }
    }

    // 2. Normalisasi nama properti lainnya (opsional)
    const normalizedItem = {
      ...item,
      totalkgs: totalkgsValue, // Selalu gunakan 'totalkgs' lowercase
      // Pastikan properti lain konsisten
      itemid: item.itemid || item.ItemID || item.itemno || item.ItemNo || "",
      itemname: item.itemname || item.ItemName || "",
      kategori: item.kategori || item.Kategori || "",
    };

    return normalizedItem;
  });
}

// Hitung total Kgs dari data yang sudah dinormalisasi
function calculateTotalKgs(data: any[]) {
  let total = 0;
  let countValid = 0;
  let countZero = 0;

  for (const item of data) {
    const kgs = item.totalkgs || 0;

    if (kgs !== 0) {
      total += kgs;
      countValid++;
    } else {
      countZero++;
    }
  }

  console.log(`🧮 Perhitungan Total Kgs:
    - Items dengan nilai > 0: ${countValid}
    - Items dengan nilai = 0: ${countZero}
    - Total Kgs: ${total.toFixed(2)}`);

  return { totalKgs: total };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const periodeR = "201905";
    const loc = url.searchParams.get("loc") || "%";
    const item = url.searchParams.get("item") || "%";
    const tgl = new Date(url.searchParams.get("tgl") || "2023-12-31");
    const company = parseInt(url.searchParams.get("company") || "0");
    const tipestock = parseInt(url.searchParams.get("tipestock") || "0");
    const jenisbarang = parseInt(url.searchParams.get("jenisbarang") || "0");
    const kategori = url.searchParams.get("kategori") || "%";
    const minus = parseInt(url.searchParams.get("minus") || "0");

    const cacheKey = `${periodeR}-${loc}-${item}-${tgl.toISOString()}-${company}-${tipestock}-${jenisbarang}-${kategori}-${minus}`;

    // Clear cache jika ada parameter debug
    if (url.searchParams.get("nocache") === "1") {
      cache.delete(cacheKey);
      console.log("🧹 Cache cleared");
    }

    // Cek cache
    const cached = cache.get(cacheKey);
    if (
      cached &&
      cached.expiresAt > Date.now() &&
      url.searchParams.get("nocache") !== "1"
    ) {
      console.log("✅ Menggunakan cache");
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

    console.time("Database Query");
    const rawData = await getRpStockL(params);
    console.timeEnd("Database Query");
    console.log(`📥 Data mentah: ${rawData.length} records`);

    // TAMPILKAN STRUKTUR DATA UNTUK DEBUG
    if (rawData.length > 0) {
      console.log("🔍 Struktur data dari stored procedure:");
      const sample = rawData[0];
      console.log("Keys:", Object.keys(sample));

      // Cari semua properti yang mengandung totalkgs
      const totalkgsKeys = Object.keys(sample).filter((k) =>
        k.toLowerCase().includes("totalkgs")
      );
      console.log("Properti totalkgs ditemukan:", totalkgsKeys);

      // Tampilkan beberapa contoh nilai
      console.log("📋 Contoh data (3 pertama):");
      rawData.slice(0, 3).forEach((item, i) => {
        console.log(`${i + 1}. itemid: ${item.itemid || item.ItemNo}`);
        // Tampilkan semua properti yang mungkin totalkgs
        totalkgsKeys.forEach((key) => {
          console.log(`   ${key}: ${item[key]} (${typeof item[key]})`);
        });
      });
    }

    // Normalisasi data
    const normalizedData = normalizeStockData(rawData);

    // Validasi: cek apakah semua item punya properti totalkgs
    const missingTotalkgs = normalizedData.filter(
      (item) => item.totalkgs === undefined || item.totalkgs === null
    ).length;

    if (missingTotalkgs > 0) {
      console.warn(
        `⚠️ ${missingTotalkgs} item tidak memiliki properti totalkgs`
      );
    }

    // Hitung total Kgs
    const stockAkhir = calculateTotalKgs(normalizedData);

    // Simpan ke cache
    cache.set(cacheKey, {
      data: normalizedData,
      stockAkhir,
      expiresAt: Date.now() + CACHE_TTL,
    });

    // Clean expired cache
    cache.forEach((value, key) => {
      if (value.expiresAt <= Date.now()) {
        cache.delete(key);
      }
    });

    return NextResponse.json({
      data: normalizedData,
      stockAkhir,
      meta: {
        totalItems: normalizedData.length,
        cacheKey,
      },
    });
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
