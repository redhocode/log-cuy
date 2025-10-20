/* eslint-disable @typescript-eslint/no-explicit-any */


// app/api/items/route.ts
import { NextResponse } from "next/server";
import { getPool } from "@/lib/config";
import sql from 'mssql';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('search') || '';
    const showGrouped = url.searchParams.get('grouped') === 'true';

    const pool = await getPool();

    // Query dasar dengan BaseItemID
    let baseQuery = `
      SELECT 
        a.[ItemID],
        a.[ItemName],
        a.[ItemNameBuy],
        a.[warna],
        a.[Mark],
        a.[KodeJenis],
        a.[SatuanKecil],
        a.[Spec],
        b.[NamaJenis],
        a.[UserName],
        a.[UserDateTime],
        -- BaseItemID: hilangkan prefix LC-
        CASE 
          WHEN a.[ItemID] LIKE 'LC-%' THEN SUBSTRING(a.[ItemID], 4, LEN(a.[ItemID]))
          ELSE a.[ItemID]
        END AS BaseItemID,
        -- Flag untuk menandai apakah ini item LC
        CASE 
          WHEN a.[ItemID] LIKE 'LC-%' THEN 1
          ELSE 0
        END AS IsLC
      FROM [cp].[dbo].[taGoods] AS a
      INNER JOIN [cp].[dbo].[taKindofGoods] AS b
      ON a.[KodeJenis] = b.[KodeJenis]
    `;

    const whereConditions = [];
    const requestPool = pool.request();

    // Tambahkan search condition jika ada search term
    if (searchTerm.trim()) {
      whereConditions.push(`
        (a.[ItemID] LIKE '%' + @searchTerm + '%' 
        OR a.[ItemName] LIKE '%' + @searchTerm + '%'
        OR a.[ItemNameBuy] LIKE '%' + @searchTerm + '%'
        OR CASE 
            WHEN a.[ItemID] LIKE 'LC-%' THEN SUBSTRING(a.[ItemID], 4, LEN(a.[ItemID]))
            ELSE a.[ItemID]
          END LIKE '%' + @searchTerm + '%')
      `);
      requestPool.input('searchTerm', sql.VarChar, searchTerm);
    }

    // Gabungkan conditions
    if (whereConditions.length > 0) {
      baseQuery += ' WHERE ' + whereConditions.join(' AND ');
    }

    // Order by BaseItemID dan ItemID untuk grouping yang konsisten
    baseQuery += ` 
      ORDER BY 
        CASE 
          WHEN a.[ItemID] LIKE 'LC-%' THEN SUBSTRING(a.[ItemID], 4, LEN(a.[ItemID]))
          ELSE a.[ItemID]
        END,
        a.[ItemID] DESC
    `;

    const result = await requestPool.query(baseQuery);
    
    // Jika ingin data sudah di-group dari API
    if (showGrouped) {
      const groupedData = groupItemsByBaseId(result.recordset);
      return NextResponse.json(groupedData);
    }

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}

// Helper function untuk grouping data di server side
function groupItemsByBaseId(items: any[]) {
  const grouped = items.reduce((acc, item) => {
    const baseId = item.BaseItemID;
    if (!acc[baseId]) {
      acc[baseId] = {
        baseItemId: baseId,
        items: [],
        hasLC: false,
        hasNonLC: false,
        allVariants: []
      };
    }
    
    acc[baseId].items.push(item);
    acc[baseId].allVariants.push(item.ItemID);
    
    if (item.IsLC) {
      acc[baseId].hasLC = true;
    } else {
      acc[baseId].hasNonLC = true;
    }
    
    return acc;
  }, {});
  
  return Object.values(grouped);
}