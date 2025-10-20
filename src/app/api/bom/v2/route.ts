// app/api/bom/v2/route.ts
import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";

interface FinishedGood {
  FinishedGoodID: string;
  FinishedGoodName: string;
  FinishedGoodBuyName: string;
  Unit: string;
  KodeJenis: string;
  JenisBarang: string;
  QuantityUsed: number;
  TransID: number;
  CreatedDate: string;
}

// Cache in memory dengan duration lebih panjang
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 menit (diperpanjang)
const CACHE_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 jam

// Inisialisasi cache cleanup
let cleanupInitialized = false;

function initializeCleanup() {
  if (cleanupInitialized || typeof setInterval === 'undefined') return;
  
  cleanupInitialized = true;
  setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    
    cache.forEach((value, key) => {
      if (now - value.timestamp > CACHE_DURATION) {
        cache.delete(key);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`[CACHE CLEANUP] Removed ${cleanedCount} expired entries`);
    }
  }, CACHE_CLEANUP_INTERVAL);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const itemId = url.searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json(
      { error: "itemId parameter is required" },
      { status: 400 }
    );
  }

  // Initialize cleanup on first request
  if (!cleanupInitialized) {
    initializeCleanup();
  }

  // Check cache dengan logging lebih detail
  const cacheKey = `bom-v2-${itemId}`;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    const age = Date.now() - cached.timestamp;
    const isExpired = age > CACHE_DURATION;
    
    if (!isExpired) {
      console.log(`[CACHE HIT] BOM v2 for ${itemId} (age: ${Math.round(age/1000)}s)`);
      return NextResponse.json(cached.data);
    } else {
      console.log(`[CACHE EXPIRED] BOM v2 for ${itemId} (age: ${Math.round(age/1000)}s)`);
      cache.delete(cacheKey); // Hapus cache yang expired
    }
  }

  console.log(`[CACHE MISS] Fetching BOM v2 for ${itemId} from database`);
  console.log(`[CACHE STATS] Total cached items: ${cache.size}`);

  try {
    const pool = await getPool();
    
    const result = await pool
      .request()
      .input("materialId", sql.VarChar, itemId)
      .execute("spGetFinishedGoodsByMaterial");

    const data = result.recordset as FinishedGood[];

    // Store in cache hanya jika ada data
    if (data && data.length > 0) {
      cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      console.log(`[CACHE STORED] BOM v2 for ${itemId} (${data.length} items)`);
    } else {
      console.log(`[CACHE SKIP] No data to cache for ${itemId}`);
    }

    // Set cache headers
    const response = NextResponse.json(data);
    response.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600'); // 30 menit
    
    return response;
  } catch (error) {
    console.error("Error fetching BOM v2 data:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch BOM v2 data" },
      { status: 500 }
    );
  }
}

// Export untuk debugging cache
export async function POST(request: Request) {
  const { action, key } = await request.json().catch(() => ({}));
  
  if (action === 'clear') {
    if (key) {
      const deleted = cache.delete(key);
      return NextResponse.json({ 
        success: true, 
        message: deleted ? `Cache cleared for ${key}` : `No cache found for ${key}` 
      });
    } else {
      const size = cache.size;
      cache.clear();
      return NextResponse.json({ 
        success: true, 
        message: `All cache cleared (${size} items)` 
      });
    }
  }
  
  if (action === 'stats') {
    const stats = {
      total: cache.size,
      keys: Array.from(cache.keys()),
      details: Array.from(cache.entries()).map(([key, value]) => ({
        key,
        age: Math.round((Date.now() - value.timestamp) / 1000),
        items: value.data?.length || 0
      }))
    };
    return NextResponse.json(stats);
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}