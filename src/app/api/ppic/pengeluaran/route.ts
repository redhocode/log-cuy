
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";

type CacheValue = {
  data: any[];
  expiresAt: number;
};

const CACHE_TTL = 5 * 60 * 1000; // 5 menit
const cache = new Map<string, CacheValue>();

async function getRpStokPPIC(params: any) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("Tgl1", sql.DateTime, params.tgl1)
    .input("Tgl2", sql.DateTime, params.tgl2)
    .input("Loc", sql.VarChar(6), params.loc)
    .input("PeriodeR", sql.VarChar(6), params.periodeR)
    .input("kategori", sql.VarChar(20), params.kategori)
    .input("itemid", sql.VarChar(50), params.itemid)
    .execute("[dbo].[rpStokPPIC]");

  return result.recordset;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    // Ambil parameter dari URL
    const tgl1 = new Date(url.searchParams.get("tgl1") || new Date());
    const tgl2 = new Date(url.searchParams.get("tgl2") || new Date());
    const loc = url.searchParams.get("loc") || "%";
    const periodeR = url.searchParams.get("periodeR") || "201905";
    const kategori = url.searchParams.get("kategori") || "%";
    const itemid = url.searchParams.get("itemid") || "%";

    console.log("🎯 Parameter rpStokPPIC:");
    console.log("  tgl1:", tgl1);
    console.log("  tgl2:", tgl2);
    console.log("  loc:", loc);
    console.log("  periodeR:", periodeR);
    console.log("  kategori:", kategori);
    console.log("  itemid:", itemid);

    // Buat cache key
    const cacheKey = `stok-${tgl1.toISOString()}-${tgl2.toISOString()}-${loc}-${periodeR}-${kategori}-${itemid}`;

    // 🔹 cek cache valid
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      console.log("✅ Data dari cache:", cacheKey);
      return NextResponse.json({
        success: true,
        data: cached.data,
        metadata: {
          fromCache: true,
          totalRecords: cached.data.length,
        },
      });
    }

    const params = {
      tgl1,
      tgl2,
      loc,
      periodeR,
      kategori,
      itemid,
    };

    const startTime = Date.now();
    const data = await getRpStokPPIC(params);
    const executionTime = Date.now() - startTime;

    console.log(`✅ Stored procedure selesai dalam ${executionTime}ms`);
    console.log(`📊 Jumlah data: ${data.length}`);

    // Log sample data
    if (data.length > 0) {
      console.log("🔍 Sample data dari stored procedure:");
      data.slice(0, 3).forEach((item: any, index: number) => {
        console.log(
          `  ${index + 1}. ${item.KodeBarang}: ${
            item.NamaBarang
          } - Pengeluaran: ${item.Pengeluaran}`
        );
      });
    }

    // Process data - pastikan SaldoAkhir adalah number
    const processedData = data.map((item: any) => ({
      KodeBarang: item.KodeBarang,
      NamaBarang: item.NamaBarang || item.KodeBarang,
      Pengeluaran: parseFloat(item.Pengeluaran) || 0,
      TglStok: item.TglStok,
      Gudang: item.Gudang || loc,
      // Simpan semua field asli untuk kompatibilitas
      ...item,
    }));

    // simpan ke cache dengan TTL
    cache.set(cacheKey, {
      data: processedData,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return NextResponse.json({
      success: true,
      data: processedData,
      metadata: {
        totalRecords: processedData.length,
        executionTime: `${executionTime}ms`,
        fromCache: false,
        parameters: { tgl1, tgl2, loc, periodeR, kategori, itemid },
      },
    });
  } catch (error: any) {
    console.error("❌ API Error:", error);
    console.error("❌ Error details:", error.message);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch data",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
