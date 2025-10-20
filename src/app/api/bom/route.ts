// app/api/bom/route.ts
import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";

interface BomData {
  TransID: number;
  ItemidHD: string;
  itemnamehd: string;
  ItemID: string;
  ItemName: string;
  BahanQty: number;
  Departemen: string;
  KodeJenis: string;
}

// Cache in memory
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function GET(request: Request) {
  const url = new URL(request.url);
  const itemid = url.searchParams.get("itemid");

  // Check cache
  const cacheKey = `bom-tree-${itemid || 'all'}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[CACHE HIT] BOM tree for ${itemid || 'all'}`);
    return NextResponse.json(cached.data);
  }

  console.log(`[CACHE MISS] Fetching BOM tree for ${itemid || 'all'} from database`);

  try {
    const pool = await getPool();
    let result;

    if (itemid && itemid.trim() !== "" && itemid !== "%") {
      result = await pool
        .request()
        .input("itemid", sql.NVarChar, itemid)
        .execute("dbo.rpBOM");
    } else {
      result = await pool.request().execute("dbo.rpBOM");
    }

    const data = result.recordset as BomData[];

    // Store in cache
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    // Set cache headers
    const response = NextResponse.json(data);
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
    
    return response;
  } catch (error) {
    console.error("Error saat fetch data BOM:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

// Clear expired cache entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    // PERBAIKAN: Gunakan forEach daripada for...of
    cache.forEach((value, key) => {
      if (now - value.timestamp > CACHE_DURATION) {
        cache.delete(key);
        console.log(`[CACHE CLEANED] Removed expired cache: ${key}`);
      }
    });
  }, 60 * 60 * 1000); // 1 hour
}