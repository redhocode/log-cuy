import { NextResponse } from "next/server";
import { getPool } from "@/lib/config";
import * as XLSX from "xlsx";
import { masterType } from "@/lib/types";
import sql from 'mssql';

// app/api/master/route.ts - ubah bagian GET
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword");
    const limit = parseInt(url.searchParams.get("limit") || "100000"); // Ubah limit default jadi lebih besar
    const checkOnly = url.searchParams.get("check") === "true";
    const itemId = url.searchParams.get("itemId");

    const pool = await getPool();

    // Jika mode check only, hanya cek satu item
    if (checkOnly && itemId) {
      const checkQuery = `
        SELECT 
          a.[ItemID],
          a.[ItemName],
          a.[ItemName2] AS ItemName2,
          a.[warnac] AS warna,
          a.[Mark] AS Departemen,
          a.[KodeJenis],
          a.[SatuanKecil],
          a.[Spec],
          a.[bahan],
          b.[NamaJenis]
        FROM [cp].[dbo].[taGoods] AS a
        INNER JOIN [cp].[dbo].[taKindofGoods] AS b ON a.[KodeJenis] = b.[KodeJenis]
        WHERE a.[ItemID] = @ItemID
      `;
      
      const checkResult = await pool
        .request()
        .input("ItemID", sql.VarChar(50), itemId)
        .query(checkQuery);

      if (checkResult.recordset.length > 0) {
        return NextResponse.json({
          success: true,
          exists: true,
          data: checkResult.recordset[0]
        });
      } else {
        return NextResponse.json({
          success: true,
          exists: false,
          message: "Item ID tidak ditemukan"
        });
      }
    }

    // Mode ambil semua data (tanpa limit)
    let query = `
      SELECT 
        a.[ItemID],
        a.[ItemName],
        a.[ItemName2] AS ItemName2,
        a.[warnac] as warna,
        a.[Mark] AS Departemen,
        a.[KodeJenis],
        a.[SatuanKecil],
        a.[Spec],
        a.[bahan],
        b.[NamaJenis]
      FROM [cp].[dbo].[taGoods] AS a
      INNER JOIN [cp].[dbo].[taKindofGoods] AS b ON a.[KodeJenis] = b.[KodeJenis]
    `;

    if (keyword && keyword.trim() !== "") {
      query += ` WHERE a.[ItemID] LIKE @keyword OR a.[ItemName] LIKE @keyword OR a.[ItemNameBuy] LIKE @keyword`;
    }

    query += ` ORDER BY a.[ItemID]`;

    const requestQuery = pool.request();
    
    if (keyword && keyword.trim() !== "") {
      requestQuery.input("keyword", sql.NVarChar, `%${keyword}%`);
    }

    const result = await requestQuery.query(query);

    console.log(`Found ${result.recordset.length} items`);

    // Return array langsung (bukan wrapper)
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching master data:", error);
    return NextResponse.json([], { status: 500 });
  }
}
// Endpoint POST untuk check item by ID
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ItemID } = body;

    if (!ItemID) {
      return NextResponse.json(
        { success: false, error: "ItemID is required" },
        { status: 400 }
      );
    }

    console.log(`POST /api/master - checking ItemID: ${ItemID}`);

    const pool = await getPool();
    const result = await pool
      .request()
      .input("ItemID", sql.VarChar(50), ItemID)
      .query(`
        SELECT TOP 1
          a.[ItemID],
          a.[ItemName],
          a.[ItemNameBuy] AS ItemName2,
          a.[warna],
          a.[Mark] AS Departemen,
          a.[KodeJenis],
          a.[SatuanKecil],
          a.[Spec],
          b.[NamaJenis]
        FROM [cp].[dbo].[taGoods] AS a
        INNER JOIN [cp].[dbo].[taKindofGoods] AS b ON a.[KodeJenis] = b.[KodeJenis]
        WHERE a.[ItemID] = @ItemID
      `);

    if (result.recordset.length > 0) {
      const item = result.recordset[0];
      console.log(`Item found: ${item.ItemID} - ${item.ItemName}`);
      return NextResponse.json({
        success: true,
        exists: true,
        data: {
          ItemID: item.ItemID,
          ItemName: item.ItemName,
          ItemName2: item.ItemName2 || "",
          warna: item.warna,
          Departemen: item.Departemen || "",
          KodeJenis: item.KodeJenis,
          NamaJenis: item.NamaJenis,
          SatuanKecil: item.SatuanKecil,
          Spec: item.Spec
        }
      });
    } else {
      console.log(`Item not found: ${ItemID}`);
      return NextResponse.json({
        success: true,
        exists: false,
        message: "Item ID tidak ditemukan"
      });
    }
  } catch (error) {
    console.error("Error checking item:", error);
    return NextResponse.json(
      { success: false, error: "Error checking item" },
      { status: 500 }
    );
  }
}

// app/api/master/route.ts - Perbaiki method PUT
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log("PUT request body:", body);
    
    const { 
      ItemID, 
      ItemName, 
      ItemName2, 
      warna, 
      Departemen, 
      KodeJenis, 
      SatuanKecil,
      bahan, 
      Spec,
      NamaJenis 
    } = body;

    if (!ItemID) {
      return NextResponse.json(
        { success: false, error: "ItemID is required" },
        { status: 400 }
      );
    }

    console.log(`PUT /api/master - updating ItemID: ${ItemID}`);
    console.log(`Data to update:`, {
      ItemName,
      ItemName2,
      warna,
      Departemen,
      KodeJenis,
      SatuanKecil,
      bahan,
      Spec
    });

    const pool = await getPool();
    const now = new Date().toISOString();

    // Update tabel taGoods
    const updateQuery = `
      UPDATE [cp].[dbo].[taGoods]
      SET 
        [ItemName] = @ItemName,
        [ItemName2] = @ItemName2,
        [warna] = @warna,
        [Mark] = @Departemen,
        [KodeJenis] = @KodeJenis,
        [SatuanKecil] = @SatuanKecil,
        [bahan] =@bahan,
        [Spec] = @Spec,
        [UserName] = @UserName,
        [UserDateTime] = @UserDateTime
      WHERE [ItemID] = @ItemID
    `;

    const result = await pool
      .request()
      .input("ItemID", sql.VarChar(50), ItemID)
      .input("ItemName", sql.NVarChar(100), ItemName || null)
      .input("ItemName2", sql.NVarChar(100), ItemName2 || null)
      .input("warnac", sql.NVarChar(50), warna || null)
      .input("Departemen", sql.VarChar(50), Departemen || null)
      .input("KodeJenis", sql.VarChar(50), KodeJenis || null)
      .input("SatuanKecil", sql.VarChar(20), SatuanKecil || null)
      .input("bahan",sql.NVarChar(150), bahan || null)
      .input("Spec", sql.NVarChar(100), Spec || null)
      .input("UserName", sql.VarChar(50), "System")
      .input("UserDateTime", sql.DateTime, now)
      .query(updateQuery);

    console.log("Update result:", result);

    if (result.rowsAffected[0] === 0) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    // Jika ada KodeJenis dan NamaJenis, update atau insert ke taKindofGoods
    if (KodeJenis) {
      const checkJenis = await pool
        .request()
        .input("KodeJenis", sql.VarChar(50), KodeJenis)
        .query(`SELECT COUNT(*) as count FROM [cp].[dbo].[taKindofGoods] WHERE KodeJenis = @KodeJenis`);
      
      if (checkJenis.recordset[0].count > 0 && NamaJenis) {
        await pool
          .request()
          .input("KodeJenis", sql.VarChar(50), KodeJenis)
          .input("NamaJenis", sql.NVarChar(100), NamaJenis)
          .query(`UPDATE [cp].[dbo].[taKindofGoods] SET NamaJenis = @NamaJenis WHERE KodeJenis = @KodeJenis`);
      } else if (NamaJenis) {
        await pool
          .request()
          .input("KodeJenis", sql.VarChar(50), KodeJenis)
          .input("NamaJenis", sql.NVarChar(100), NamaJenis)
          .query(`INSERT INTO [cp].[dbo].[taKindofGoods] (KodeJenis, NamaJenis) VALUES (@KodeJenis, @NamaJenis)`);
      }
    }

    console.log(`Item ${ItemID} updated successfully`);
    
    // Return data yang sudah diupdate
    return NextResponse.json({
      success: true,
      message: "Item updated successfully",
      data: {
        ItemID,
        ItemName,
        ItemName2,
        warna,
        Departemen,
        KodeJenis,
        SatuanKecil,
        bahan,
        Spec,
        NamaJenis
      }
    });
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { success: false, error: "Error updating item: " + String(error) },
      { status: 500 }
    );
  }
}

// Endpoint POST for file upload (existing code)
export async function POST_UPLOAD(request: Request) {
  try {
    const body = await request.formData();
    const file = body.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const data = Buffer.from(buffer);

    const workbook = XLSX.read(data, { type: "buffer" });
    console.log("Sheet Names:", workbook.SheetNames);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: masterType[] =
      XLSX.utils.sheet_to_json<masterType>(worksheet);
    console.log("Parsed JSON Data:", jsonData);

    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: "No data found in the uploaded file." },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    const errors: string[] = [];

    for (const item of jsonData) {
      if (!item.ItemID) {
        errors.push(`ItemID is missing for item: ${JSON.stringify(item)}`);
        continue;
      }

      try {
        const checkQuery = `
          SELECT COUNT(*) AS count
          FROM [cp].[dbo].[taGoods]
          WHERE [ItemID] = @ItemID
        `;
        const existingItem = await pool
          .request()
          .input("ItemID", sql.VarChar(50), item.ItemID)
          .query(checkQuery);

        if (existingItem.recordset[0].count > 0) {
          errors.push(`ItemID ${item.ItemID} already exists in the database.`);
          console.log(`ItemID ${item.ItemID} already exists in the database.`);
          continue;
        }

        const requestMT = new sql.Request(transaction);
        await requestMT
          .input("ItemID", sql.VarChar(50), item.ItemID)
          .input("ItemName", sql.VarChar(50), item.ItemName)
          .input("ItemNameBuy", sql.VarChar(50), item.ItemNameBuy)
          .input("Mark", sql.VarChar(50), item.Mark)
          .input("KodeJenis", sql.VarChar(50), item.KodeJenis)
          .input("bahan",sql.NVarChar(150), item.Bahan)
          .input("warnac",sql.NVarChar(150), item.warna)
          .input("Spec", sql.VarChar(50), item.Spec)
          .input("SatuanKecil", sql.VarChar(50), item.SatuanKecil)
          .input("UserName", sql.VarChar(50), item.UserName)
          .input("UserDateTime", sql.VarChar(50), item.UserDateTime)
          .query(
            "INSERT INTO [cp].[dbo].[taGoods] ([ItemID], [ItemName], [ItemNameBuy], [Mark], [KodeJenis], [SatuanKecil],[Bahan],[warna] [Spec], [UserName], [UserDateTime]) VALUES (@ItemID, @ItemName, @ItemNameBuy, @Mark, @KodeJenis, @SatuanKecil,@Bahan,@Warna, @Spec, @UserName, @UserDateTime)"
          );
      } catch (error: unknown) {
        console.error(
          `Error inserting item with ItemID: ${item.ItemID}`,
          error
        );
        errors.push(`Failed to insert ItemID: ${item.ItemID}`);
      }
    }

    if (errors.length > 0) {
      await transaction.rollback();
      return NextResponse.json({ errors }, { status: 400 });
    }

    await transaction.commit();
    return NextResponse.json(
      { message: "Data successfully inserted." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}