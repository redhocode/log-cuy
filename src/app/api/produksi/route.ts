import { NextResponse } from "next/server";
import sql from "mssql";
import { ProduksiType, DataProduksi } from "@/lib/types";
import * as XLSX from "xlsx";
// SQL Server Configuration
import {getPool} from "@/lib/config";

// Define a type for the record structure

export async function GET(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const remark = url.searchParams.get("remark");
  const prodType = url.searchParams.get("prodType");
  const itemType = url.searchParams.get("itemType");

  try {
    const pool = await getPool();
    let query = `
      SELECT TOP (10000)
        hd.[ProdID],
        hd.[ProdDate],
        hd.[ProdType],
        hd.[DeptID],
        hd.[OrderID],
        hd.[OrderType],
        hd.[Shift],
        hd.[LocID],
        hd.[Remark],
        dt.[ItemID],
        dt.[ItemType],
        dt.[Bags],
        dt.[Kgs],
        dt.[JamMulai],
        dt.[JamSelesai],
        dt.[UserName],
        dt.[UserDateTime] 
      FROM [cp].[dbo].[taPRProdHd] AS hd
      INNER JOIN [cp].[dbo].[taPRProdDt] AS dt ON hd.[ProdID] = dt.[ProdID] AND hd.[ProdType] = dt.[ProdType]
      WHERE hd.[ProdType] IN ('IN','SP','MO','PL','AS') AND dt.[ItemType] IN ('B','H')
    `;

    const conditions: string[] = [];

    // Menambahkan filter berdasarkan tanggal, jika ada
    if (startDate && endDate) {
      conditions.push(`hd.[ProdDate] BETWEEN @StartDate AND @EndDate`);
    }

    // Menambahkan filter berdasarkan remark, jika ada (cari 5 karakter terakhir)
    if (remark) {
      console.log("Using remark in SQL:", remark); // Debug: Cek nilai remark yang diterima
      conditions.push(`RIGHT(hd.[Remark], 5) = @Remark`);
    }

    // Filter berdasarkan prodType, jika ada
    if (prodType) {
      conditions.push(`hd.[ProdType] = @ProdType`);
    }

    // Filter berdasarkan itemType, jika ada
    if (itemType) {
      conditions.push(`dt.[ItemType] = @ItemType`);
    }

    // Gabungkan kondisi WHERE jika ada
    if (conditions.length > 0) {
      query += " AND " + conditions.join(" AND ");
    }

    query += ` ORDER BY hd.[ProdID] DESC`;

    const requestQuery = pool.request();

    // Menambahkan parameter untuk tanggal dan remark
    if (startDate && endDate) {
      requestQuery.input("StartDate", sql.Date, new Date(startDate));
      requestQuery.input("EndDate", sql.Date, new Date(endDate));
    }

    if (remark) {
      requestQuery.input("Remark", sql.NVarChar, remark);
    }
    if (prodType) {
      requestQuery.input("ProdType", sql.NVarChar, prodType);
    }
    if (itemType) {
      requestQuery.input("ItemType", sql.NVarChar, itemType);
    }

    const result = await requestQuery.query<ProduksiType>(query);

    // Format the HeaderProdDate to show only the date part
    const formattedRecords = result.recordset.map((record) => ({
      ...record,
      ProdDate: record.ProdDate.toISOString().split("T")[0],
    }));

    return NextResponse.json(formattedRecords);
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

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData: DataProduksi[] =
      XLSX.utils.sheet_to_json<DataProduksi>(worksheet);

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

    for (const row of jsonData) {
      try {
        // MERGE untuk taPRProdHd
        // Menghapus spasi dari ProdID
        const prodID =
          typeof row.ProdID === "string"
            ? row.ProdID.trim()
            : String(row.ProdID || "");
        // Log untuk memeriksa nilai ProdID
        console.log(`Processing ProdID: ${prodID}`);

        const requestHd = new sql.Request(transaction);
        await requestHd
          .input("ProdID", sql.VarChar, prodID)
          .input("ProdDate", sql.DateTime, new Date(row.ProdDate))
          .input("ProdType", sql.VarChar, row.ProdType)
          .input("DeptID", sql.VarChar, row.DeptID)
          .input("OrderID", sql.VarChar, row.OrderID)
          .input("OrderType", sql.VarChar, row.OrderType)
          .input("LocID", sql.VarChar, row.LocID)
          .input("Remark", sql.VarChar, row.Remark).query(`
            MERGE INTO [cp].[dbo].[taPRProdHd] AS target
            USING (SELECT @ProdID AS ProdID) AS source
            ON target.ProdID = source.ProdID
            WHEN MATCHED THEN
                UPDATE SET 
                    ProdDate = @ProdDate, 
                    ProdType = @ProdType, 
                    DeptID = @DeptID, 
                    OrderID = @OrderID, 
                    OrderType = @OrderType, 
                    LocID = @LocID, 
                    Remark = @Remark
            WHEN NOT MATCHED THEN
                INSERT (ProdID, ProdDate, ProdType, DeptID, OrderID, OrderType, LocID, Remark)
                VALUES (@ProdID, @ProdDate, @ProdType, @DeptID, @OrderID, @OrderType, @LocID, @Remark);
          `);

        // MERGE untuk taPRProdDt
        const requestDt = new sql.Request(transaction);
        const margeResultDT = await requestDt
          .input("ProdID", sql.VarChar, row.ProdID)
          .input("ProdType", sql.VarChar, row.ProdType)
          .input("ItemID", sql.VarChar, row.ItemID)
          .input("ItemType", sql.VarChar, row.ItemType)
          .input("Bags", sql.Int, row.Bags)
          .input("Kgs", sql.Float, row.Kgs)
          .input("UserName", sql.VarChar, row.UserName)
          .input("UserDateTime", sql.DateTime, new Date(row.UserDateTime))
          .query(`
            MERGE INTO [cp].[dbo].[taPRProdDt] AS target
            USING (SELECT @ProdID AS ProdID, @ItemID AS ItemID) AS source
            ON target.ProdID = source.ProdID AND target.ItemID = source.ItemID
            WHEN MATCHED THEN
                UPDATE SET 
                    ProdType = @ProdType, 
                    Bags = @Bags, 
                    Kgs = @Kgs, 
                    UserName = @UserName, 
                    UserDateTime = @UserDateTime
            WHEN NOT MATCHED THEN
                INSERT (ProdID, ProdType, ItemID, ItemType, Bags, Kgs, UserName, UserDateTime)
                VALUES (@ProdID, @ProdType, @ItemID, @ItemType, @Bags, @Kgs, @UserName, @UserDateTime);
          `);
        console.log(margeResultDT);
      } catch (rowError) {
        console.error("SQL Error:", rowError);
        errors.push(
          `Error processing row with ProdID ${row.ProdID}: ${
            rowError instanceof Error ? rowError.message : String(rowError)
          }`
        );
      }
    }

    if (errors.length > 0) {
      await transaction.rollback();
      return NextResponse.json({ errors }, { status: 400 });
    }

    await transaction.commit();
    return NextResponse.json({
      data: jsonData,
      message: "Data uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading data:", error);
    return NextResponse.json(
      { error: "Error uploading data" },
      { status: 500 }
    );
  }
}


