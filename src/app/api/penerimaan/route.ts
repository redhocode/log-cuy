import { NextResponse } from "next/server";
import sql from "mssql";
import { PenerimaanType } from "@/lib/types";
import * as XLSX from "xlsx";
// SQL Server Configuration
import { getPool } from "@/lib/config";

// Define a type for the record structure

export async function GET(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  try {
    const pool = await getPool();

    let query = `
      SELECT TOP (100000)
        hd.[MoveID] AS No_Transaksi,
        hd.[MoveDate] AS Tanggal,
        g.[LocName] as Gudang,
        c.[CompanyName1] AS Supplier,
        hd.[Nopol],
        hd.[Nopen],
        dt.[ItemID],
        dt.[Bags],
        dt.[Kgs],
        dt.[satuan],
        dt.[username]
      FROM [cp].[dbo].[taTransIHD2] AS hd
      INNER JOIN [cp].[dbo].[taTransIDT2]
      AS dt ON hd.[MoveID] = dt.[MoveID] and hd.[MoveType] = dt.[MoveType]
      and hd.[TransID] = dt.[TransID]
      INNER JOIN [cp].[dbo].[taSupplier] AS c
      ON hd.[CompanyID] = c.[CompanyID]
      INNER JOIN [cp].[dbo].[taLocation] AS g ON hd.[LocID] = g.[LocID]
    `;

   if (startDate && endDate) {
     query += ` WHERE CONVERT(DATE, hd.[MoveDate]) >= @StartDate AND CONVERT(DATE, hd.[MoveDate]) <= @EndDate`;
   }

    query += ` ORDER BY hd.[MoveID] DESC`;

    const requestQuery = pool.request();

    if (startDate && endDate) {
      requestQuery.input("StartDate", sql.Date, new Date(startDate));
      requestQuery.input("EndDate", sql.Date, new Date(endDate));
    }

    const result = await requestQuery.query<PenerimaanType>(query);

    // Format the HeaderProdDate to show only the date part
    const formattedRecords = result.recordset.map((record) => ({
      ...record,
      Tanggal: record.Tanggal.toISOString().split("T")[0],
    }));

    return NextResponse.json(formattedRecords);
    // return NextResponse.json(result.recordset);
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
    const jsonData: PenerimaanType[] =
      XLSX.utils.sheet_to_json<PenerimaanType>(worksheet);

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
    console.log("Processing row:", row);

    // Operasi untuk taTransIHD2
    const requestIHD2 = new sql.Request(transaction);

    requestIHD2
      .input("MoveID", sql.VarChar, row.MoveID)
      .input("MoveType", sql.VarChar, row.MoveType)
      .input("OrderID", sql.VarChar, row.OrderID)
      .input("TransID", sql.VarChar, row.TransID)
      .input("CompanyID", sql.VarChar, row.CompanyID)
      .input("LocID", sql.VarChar, row.LocID)
      .input("MoveDate", sql.Date, new Date(row.MoveDate))
      .input("Nopol", sql.VarChar, row.Nopol)
      .input("Nopen", sql.VarChar, row.Nopen)
      .input("TglNopen", sql.Date, new Date(row.TglNopen))
      .input("Remark", sql.VarChar, row.Remark)
      .input("ItemID", sql.VarChar, row.ItemID)
      .input("Bags", sql.Int, row.Bags)
      .input("RJN", sql.Int, row.RJN)
      .input("Kgs", sql.Float, row.Kgs)
      .input("username", sql.VarChar, row.username)
      .input("userdatetime", sql.VarChar, row.userdatetime)
      .input("satuan", sql.VarChar, row.satuan)
      .input("TglSJSupplier", sql.Date, new Date(row.TglSJSupplier));

    await requestIHD2.query(`
      MERGE INTO [cp].[dbo].[taTransIHD2] AS target
      USING (SELECT @MoveID AS MoveID, @TransID AS TransID) AS source
      ON target.MoveID = source.MoveID AND target.TransID = source.TransID
      WHEN MATCHED THEN
          UPDATE SET 
              MoveType = @MoveType, 
              OrderID = @OrderID, 
              CompanyID = @CompanyID, 
              LocID = @LocID, 
              MoveDate = @MoveDate,  
              TglSJSupplier = @TglSJSupplier, 
              Nopol = @Nopol, 
              Nopen = @Nopen, 
              TglNopen = @TglNopen
      WHEN NOT MATCHED THEN
          INSERT (MoveID, MoveType, OrderID, TransID, CompanyID, LocID, MoveDate, TglSJSupplier, Nopol, Nopen, TglNopen)
          VALUES (@MoveID, @MoveType, @OrderID, @TransID, @CompanyID, @LocID, @MoveDate, @TglSJSupplier, @Nopol, @Nopen, @TglNopen);
    `);

    // Log untuk memastikan kita masuk ke bagian taTransIDT2
    console.log("Processing taTransIDT2 for MoveID:", row.MoveID);

    // Persiapkan input untuk taTransIDT2
    const requestIDT = new sql.Request(transaction);

    requestIDT
      .input("MoveID", sql.VarChar, row.MoveID)
      .input("MoveType", sql.VarChar, row.MoveType)
      .input("TransID", sql.VarChar, row.TransID)
      .input("ItemID", sql.VarChar, row.ItemID)
      .input("Bags", sql.Int, row.Bags)
      .input("Kgs", sql.Float, row.Kgs)
      .input("username", sql.VarChar, row.username)
      .input("userdatetime", sql.VarChar, row.userdatetime)
      .input("satuan", sql.VarChar, row.satuan)
      .input("RJN", sql.Int, row.RJN);

    const mergeResultIDT = await requestIDT.query(`
      MERGE INTO [cp].[dbo].[taTransIDT2] AS target
      USING (SELECT @MoveID AS MoveID, @TransID AS TransID, @ItemID AS ItemID) AS source
      ON target.MoveID = source.MoveID AND target.TransID = source.TransID AND target.ItemID = source.ItemID
      WHEN MATCHED THEN
          UPDATE SET 
              MoveType = @MoveType,
              Bags = @Bags, 
              Kgs = @Kgs, 
              username = @username, 
              userdatetime = @userdatetime, 
              satuan = @satuan,
              RJN = @RJN
      WHEN NOT MATCHED THEN
          INSERT (MoveID, MoveType, TransID, ItemID, Bags, Kgs, username, userdatetime, satuan, RJN)
          VALUES (@MoveID, @MoveType, @TransID, @ItemID, @Bags, @Kgs, @username, @userdatetime, @satuan, @RJN);
    `);

    console.log("Merge result for taTransIDT2:", mergeResultIDT);
  } catch (rowError) {
    console.error("SQL Error:", rowError);
    errors.push(
      `Error processing row with MoveID ${row.MoveID}: ${
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

