// app/api/bom/route.ts
import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";

interface BomData {
  TransID: number;
  itemidHD: string;
  itemnamehd: string;
  itemnamehd2: string;
  ItemID: string;
  ItemName: string;
  ItemName2: string;
  BahanQty: number;
  Departemen: string;
  NamaJenis: string;
}

// Cache in memory
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function GET(request: Request) {
  const url = new URL(request.url);
  const itemid = url.searchParams.get("itemid");
  const searchType = url.searchParams.get("searchType") || "itemid";

  // Check cache
  const cacheKey = `bom-${searchType}-${itemid || 'all'}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[CACHE HIT] BOM for ${itemid || 'all'}`);
    return NextResponse.json(cached.data);
  }

  console.log(`[CACHE MISS] Fetching BOM for ${itemid || 'all'} from database`);

  try {
    const pool = await getPool();
    let result;

    // SELALU gunakan stored procedure rpBOM untuk semua kasus
    // Karena stored procedure sudah di-optimize dan cepat
    
    if (searchType === 'itemname' && itemid && itemid.trim() !== "" && itemid !== "%") {
      // Untuk pencarian berdasarkan nama, kita perlu menggunakan query LIKE
      // Karena stored procedure hanya support pencarian berdasarkan ID
      console.log("Searching by item name using query:", itemid);
      result = await pool
        .request()
        .input("itemid", sql.NVarChar, `%${itemid}%`)
        .query(`
          SELECT 
            hd.TransID, 
            hd.ItemID AS itemidHD, 
            ISNULL(ghd.ItemName, '') AS itemnamehd,
            ISNULL(ghd.ItemName2, '') AS itemnamehd2, 
            dt.ItemID, 
            ISNULL(gdt.ItemName, '') AS ItemName,
            ISNULL(gdt.ItemName2, '') AS ItemName2, 
            ISNULL(dt.BahanQty, 0) AS BahanQty, 
            ISNULL(gdt.Mark, '') AS Departemen,
            ISNULL(got.NamaJenis, '') AS NamaJenis
          FROM taPackingHD hd
          INNER JOIN taPackingDT dt ON hd.TransID = dt.TransID
          INNER JOIN taGoods ghd ON hd.ItemID = ghd.ItemID
          INNER JOIN taGoods gdt ON dt.ItemID = gdt.ItemID
          INNER JOIN taKindofGoods got ON gdt.KodeJenis = got.KodeJenis 
          WHERE ghd.ItemName LIKE @itemid
          ORDER BY hd.ItemID, dt.ItemID
        `);
    } else {
      // Untuk semua kasus lainnya (semua data atau pencarian berdasarkan ID)
      // Gunakan stored procedure rpBOM yang cepat
      let searchParam = "%";
      if (itemid && itemid.trim() !== "" && itemid !== "%") {
        searchParam = `%${itemid}%`;
        console.log("Searching by item ID using stored procedure:", searchParam);
      } else {
        console.log("Fetching ALL BOM data using stored procedure rpBOM");
      }
      
      result = await pool
        .request()
        .input("itemid", sql.VarChar(50), searchParam)
        .execute("dbo.rpBOM");
    }

    console.log(`Query returned ${result.recordset.length} records in ${result.recordset.length > 0 ? 'success' : 'no data'}`);
    
    if (result.recordset.length > 0) {
      const sample = result.recordset[0];
      console.log("Sample record:", {
        itemidHD: sample.itemidHD,
        itemnamehd: sample.itemnamehd,
        itemnamehd2: sample.itemnamehd2,
        ItemID: sample.ItemID,
        ItemName: sample.ItemName,
        ItemName2: sample.ItemName2,
        BahanQty: sample.BahanQty
      });
    }

    // Transform data
    const transformedData = result.recordset.map((row: any) => ({
      TransID: row.TransID,
      itemidHD: row.itemidHD,
      itemnamehd: row.itemnamehd || "",
      itemnamehd2: row.itemnamehd2 || "",
      ItemID: row.ItemID,
      ItemName: row.ItemName || "",
      ItemName2: row.ItemName2 || "",
      BahanQty: row.BahanQty || 0,
      Departemen: row.Departemen || "",
      NamaJenis: row.NamaJenis || ""
    }));

    console.log(`Transformed ${transformedData.length} records for frontend`);

    // Store in cache
    cache.set(cacheKey, {
      data: transformedData,
      timestamp: Date.now()
    });

    const response = NextResponse.json(transformedData);
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
    
    return response;
    
  } catch (error) {
    console.error("Error saat fetch data BOM:", error);
    
    let errorMessage = "Terjadi kesalahan server.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        message: errorMessage,
        error: String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Clear expired cache entries
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    let deletedCount = 0;
    cache.forEach((value, key) => {
      if (now - value.timestamp > CACHE_DURATION) {
        cache.delete(key);
        deletedCount++;
      }
    });
    if (deletedCount > 0) {
      console.log(`[CACHE CLEANED] Removed ${deletedCount} expired cache entries`);
    }
  }, 60 * 60 * 1000);
}