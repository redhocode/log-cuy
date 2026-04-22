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
  BahanPackSatuan: string; // Tambahkan ini
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

    if (searchType === 'itemname' && itemid && itemid.trim() !== "" && itemid !== "%") {
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
            ISNULL(dt.BahanPackSatuan, '') AS BahanPackSatuan,  -- TAMBAHKAN INI
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

    console.log(`Query returned ${result.recordset.length} records`);

    // Transform data - PASTIKAN BahanPackSatuan diambil
    const transformedData = result.recordset.map((row: any) => ({
      TransID: row.TransID,
      itemidHD: row.itemidHD,
      itemnamehd: row.itemnamehd || "",
      itemnamehd2: row.itemnamehd2 || "",
      ItemID: row.ItemID,
      ItemName: row.ItemName || "",
      ItemName2: row.ItemName2 || "",
      BahanQty: row.BahanQty || 0,
      BahanPackSatuan: row.BahanPackSatuan || "",  // TAMBAHKAN INI
      Departemen: row.Departemen || "",
      NamaJenis: row.NamaJenis || ""
    }));

    console.log("Sample with satuan:", transformedData[0]?.BahanPackSatuan);

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
// app/api/bom/route.ts - Tambahkan method PUT
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { TransID, ItemID, newItemID, BahanQty, BahanPackSatuan, action } = body;

    console.log("PUT request received:", { TransID, ItemID, newItemID, BahanQty, BahanPackSatuan, action });

    if (!TransID || !ItemID) {
      return NextResponse.json(
        { error: "TransID dan ItemID diperlukan" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    if (action === 'delete') {
      // Delete komponen
      const result = await pool
        .request()
        .input("TransID", sql.VarChar(7), TransID)
        .input("ItemID", sql.VarChar(25), ItemID)
        .query(`
          DELETE FROM taPackingDT 
          WHERE TransID = @TransID AND ItemID = @ItemID
        `);

      if (result.rowsAffected[0] === 0) {
        return NextResponse.json(
          { error: "Komponen tidak ditemukan" },
          { status: 404 }
        );
      }

      clearCache();

      return NextResponse.json({
        success: true,
        message: "Komponen berhasil dihapus",
        TransID,
        ItemID
      });
    } 
    else if (action === 'update') {
      // Update komponen
      const updateItemID = newItemID || ItemID;
      
      // Cek apakah perlu update ItemID (rename)
      if (updateItemID !== ItemID) {
        // Delete old and insert new
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
          // Delete old
          await transaction.request()
            .input("TransID", sql.VarChar(7), TransID)
            .input("ItemID", sql.VarChar(25), ItemID)
            .query(`DELETE FROM taPackingDT WHERE TransID = @TransID AND ItemID = @ItemID`);
          
          // Insert new
          await transaction.request()
            .input("TransID", sql.VarChar(7), TransID)
            .input("ItemID", sql.VarChar(25), updateItemID)
            .input("BahanQty", sql.Decimal(18, 5), BahanQty)
            .input("BahanPackSatuan", sql.VarChar(10), BahanPackSatuan || null)
            .query(`
              INSERT INTO taPackingDT (TransID, ItemID, BahanQty, BahanPackSatuan)
              VALUES (@TransID, @ItemID, @BahanQty, @BahanPackSatuan)
            `);
          
          await transaction.commit();
        } catch (error) {
          await transaction.rollback();
          throw error;
        }
      } else {
        // Just update quantity and satuan
        const result = await pool
          .request()
          .input("TransID", sql.VarChar(7), TransID)
          .input("ItemID", sql.VarChar(25), ItemID)
          .input("BahanQty", sql.Decimal(18, 5), BahanQty)
          .input("BahanPackSatuan", sql.VarChar(10), BahanPackSatuan || null)
          .query(`
            UPDATE taPackingDT 
            SET BahanQty = @BahanQty, BahanPackSatuan = @BahanPackSatuan
            WHERE TransID = @TransID AND ItemID = @ItemID
          `);

        if (result.rowsAffected[0] === 0) {
          return NextResponse.json(
            { error: "Komponen tidak ditemukan" },
            { status: 404 }
          );
        }
      }

      clearCache();

      return NextResponse.json({
        success: true,
        message: "Komponen berhasil diupdate",
        TransID,
        ItemID: updateItemID,
        BahanQty,
        BahanPackSatuan
      });
    }
    else {
      return NextResponse.json(
        { error: "Action tidak valid. Gunakan 'update' atau 'delete'" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Error updating BOM:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate BOM", details: String(error) },
      { status: 500 }
    );
  }
}
// PATCH untuk bulk update atau add component
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, TransID, components } = body;

    console.log("PATCH request:", { action, TransID, components });

    const pool = await getPool();

    if (action === 'add' && components && Array.isArray(components)) {
      // Add multiple components
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        for (const comp of components) {
          const { ItemID, BahanQty, BahanPackSatuan } = comp;
          
          // Cek apakah komponen sudah ada
          const checkResult = await transaction.request()
            .input("TransID", sql.VarChar(7), TransID)
            .input("ItemID", sql.VarChar(25), ItemID)
            .query(`
              SELECT COUNT(*) as count FROM taPackingDT 
              WHERE TransID = @TransID AND ItemID = @ItemID
            `);
          
          if (checkResult.recordset[0].count > 0) {
            await transaction.rollback();
            return NextResponse.json({
              success: false,
              message: `Komponen ${ItemID} sudah ada dalam BOM ini`
            }, { status: 400 });
          }
          
          await transaction.request()
            .input("TransID", sql.VarChar(7), TransID)
            .input("ItemID", sql.VarChar(25), ItemID)
            .input("BahanQty", sql.Decimal(18, 5), BahanQty || 0)
            .input("BahanPackSatuan", sql.VarChar(10), BahanPackSatuan || null)
            .query(`
              INSERT INTO taPackingDT (TransID, ItemID, BahanQty, BahanPackSatuan)
              VALUES (@TransID, @ItemID, @BahanQty, @BahanPackSatuan)
            `);
        }

        await transaction.commit();
        
        // Clear cache after update
        clearCache();

        return NextResponse.json({
          success: true,
          message: `${components.length} komponen berhasil ditambahkan`,
          TransID
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }
    else {
      return NextResponse.json(
        { error: "Action tidak valid. Gunakan 'add'" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Error in BOM operation:", error);
    return NextResponse.json(
      { error: "Gagal memproses BOM", details: String(error) },
      { status: 500 }
    );
  }
}
// Function to clear cache
function clearCache() {
  cache.clear();
  console.log("[CACHE CLEARED] All cache entries removed after update");
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