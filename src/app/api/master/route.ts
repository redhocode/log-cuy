import { NextResponse } from "next/server";
import { getPool } from "@/lib/config";
import * as XLSX from "xlsx";

import { masterType } from "@/lib/types";
import sql from 'mssql';


export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const queryParams = url.searchParams;

    // Menampilkan query parameters di console
    for (const [key, value] of Array.from(queryParams)) {
      console.log(`${key}: ${value}`);
    }

    // Mengambil koneksi ke SQL Server
    const pool = await getPool();

    // Menyusun query untuk mengambil data
    const query = `
      SELECT TOP (100000)
        a.[ItemID],
        a.[ItemName],
        a.[ItemNameBuy],
        a.[Mark],
        a.[KodeJenis],
        a.[SatuanKecil],
        a.[Spec],
        b.[NamaJenis],
        a.[UserName],
        a.[UserDateTime]
      FROM [cp].[dbo].[taGoods] AS a
      INNER JOIN [cp].[dbo].[taKindofGoods] AS b
      ON a.[KodeJenis] = b.[KodeJenis] ORDER BY a.[ItemID] DESC
    `;

    // Menjalankan query SQL dan mendapatkan hasilnya
    const result = await pool.request().query(query);

    // Mengembalikan data dalam format JSON
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    // Getting SQL Server connection pool
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    const errors: string[] = [];

    for (const item of jsonData) {
      // Check if ItemID exists
      if (!item.ItemID) {
        errors.push(`ItemID is missing for item: ${JSON.stringify(item)}`);
        continue;
      }

      try {
        // Check if the ItemID already exists in the database
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
          // If the ItemID already exists, add to errors and stop further import
          errors.push(`ItemID ${item.ItemID} already exists in the database.`);
          console.log(`ItemID ${item.ItemID} already exists in the database.`);
          continue;
        }

        // If ItemID doesn't exist, proceed with insertion
        const requestMT = new sql.Request(transaction);
        await requestMT
          .input("ItemID", sql.VarChar(50), item.ItemID)
          .input("ItemName", sql.VarChar(50), item.ItemName)
          .input("ItemNameBuy", sql.VarChar(50), item.ItemNameBuy)
          .input("Mark", sql.VarChar(50), item.Mark)
          .input("KodeJenis", sql.VarChar(50), item.KodeJenis)
          .input("Spec", sql.VarChar(50), item.Spec)
          .input("SatuanKecil", sql.VarChar(50), item.SatuanKecil)
          .input("UserName", sql.VarChar(50), item.UserName)
          .input("UserDateTime", sql.VarChar(50), item.UserDateTime)
          .query(
            "INSERT INTO [cp].[dbo].[taGoods] ([ItemID], [ItemName], [ItemNameBuy], [Mark], [KodeJenis], [SatuanKecil], [Spec], [UserName], [UserDateTime]) VALUES (@ItemID, @ItemName, @ItemNameBuy, @Mark, @KodeJenis, @SatuanKecil, @Spec, @UserName, @UserDateTime)"
          );
      } catch (error: unknown) {
        console.error(
          `Error inserting item with ItemID: ${item.ItemID}`,
          error
        );
        errors.push(`Failed to insert ItemID: ${item.ItemID}`);
      }
    }

    // If there are errors (including duplicates), rollback the transaction
    if (errors.length > 0) {
      await transaction.rollback();
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Commit the transaction if no errors
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