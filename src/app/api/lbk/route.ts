import { NextResponse } from "next/server";
import sql from "mssql";
import { LbkType } from "@/lib/types";
import * as XLSX from "xlsx";
// SQL Server Configuration
import {getPool} from "@/lib/config";


// Define a type for the record structure

export async function GET(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  try {
    const pool = await getPool();

    let query = `
      SELECT TOP (10000)
        hd.[MoveID],
        hd.[MoveType],
        hd.[LocID],
        hd.[MoveDate],
        hd.[Remark],
        dt.[ItemID],
        dt.[Bags],
        dt.[Kgs],
        dt.[username],
        dt.[userdatetime] 
      FROM [cp].[dbo].[taOpNameOHD] AS hd
      INNER JOIN [cp].[dbo].[taOpNameODT]
      AS dt ON hd.[MoveID] = dt.[MoveID]
    `;

    if (startDate && endDate) {
      query += ` WHERE hd.[MoveDate] BETWEEN @StartDate AND @EndDate 
`;
    }
    query += ` ORDER BY hd.[MoveDate] DESC`;

    const requestQuery = pool.request();

    if (startDate && endDate) {
      requestQuery.input("StartDate", sql.Date, new Date(startDate));
      requestQuery.input("EndDate", sql.Date, new Date(endDate));
    }

    const result = await requestQuery.query<LbkType>(query);

    // Format the HeaderProdDate to show only the date part
    const formattedRecords = result.recordset.map((record) => ({
      ...record,
      MoveDate: record.MoveDate.toISOString().split("T")[0],
    }));

    return NextResponse.json(formattedRecords);
    // return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}

// Fungsi POST untuk meng-upload data dari file Excel
// Fungsi POST untuk meng-upload data dari file Excel
export async function POST(request: Request) {
  try {
    // Membaca form data (termasuk file yang di-upload)
    const body = await request.formData();
    const file = body.get("file") as File;

    // Jika tidak ada file yang di-upload
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Membaca buffer dari file yang di-upload
    const buffer = await file.arrayBuffer();
    const data = Buffer.from(buffer);

    // Membaca workbook dari file Excel
    const workbook = XLSX.read(data, { type: "buffer" });
    console.log("Sheet Names:", workbook.SheetNames);

    // Mengambil worksheet pertama dari file Excel
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    console.log("Worksheet:", worksheet);

    // Mengonversi worksheet ke dalam format JSON
    const jsonData: LbkType[] = XLSX.utils.sheet_to_json<LbkType>(worksheet);
    console.log("Parsed JSON Data:", jsonData);

    // Jika data kosong
    if (jsonData.length === 0) {
      return NextResponse.json({ error: "No data found in the uploaded file." }, { status: 400 });
    }

    // Mengambil pool koneksi ke database
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    const errors: string[] = [];

    // Query untuk mendapatkan LocID yang valid dari taLocation
    const requestLocID = new sql.Request(transaction);
    const validLocIDs = await requestLocID.query(`
      SELECT LocID FROM [cp].[dbo].[taLocation]
    `);
    const validLocIDsSet = new Set(validLocIDs.recordset.map((row) => row.LocID));

    console.log("Valid LocIDs:", validLocIDsSet);

    // Memproses setiap baris data dari Excel
    for (const row of jsonData) {
      try {
        // Validasi LocID: Pastikan LocID ada di taLocation
        if (!validLocIDsSet.has(row.LocID)) {
          errors.push(`Invalid LocID: ${row.LocID} at row MoveID: ${row.MoveID}`);
          console.log(`Invalid LocID at row ${row.MoveID}: ${row.LocID}`);
          continue; // Jika LocID tidak valid, lewati baris ini
        }

        // Query MERGE untuk taOpNameOHD
        const requestOHD = new sql.Request(transaction);
        await requestOHD
          .input("MoveID", sql.Int, row.MoveID)
          .input("MoveType", sql.VarChar, row.MoveType)
          .input("LocID", sql.VarChar, row.LocID)
          .input("MoveDate", sql.DateTime, new Date(row.MoveDate))
          .input("Remark", sql.VarChar, row.Remark)
          .query(`
            MERGE INTO [cp].[dbo].[taOpNameOHD] AS target
            USING (SELECT @MoveID AS MoveID) AS source
            ON target.MoveID = source.MoveID
            WHEN MATCHED THEN
                UPDATE SET 
                    MoveType = @MoveType, 
                    LocID = @LocID, 
                    MoveDate = @MoveDate, 
                    Remark = @Remark
            WHEN NOT MATCHED THEN
                INSERT (MoveID, MoveType, LocID, MoveDate, Remark)
                VALUES (@MoveID, @MoveType, @LocID, @MoveDate, @Remark);
          `);
        console.log(`Processed MoveID: ${row.MoveID} for taOpNameOHD`);

        // Query MERGE untuk taOpNameODT
        const requestODT = new sql.Request(transaction);
        await requestODT
          .input("MoveID", sql.Int, row.MoveID)
          .input("MoveType", sql.VarChar, row.MoveType)
          .input("ItemID", sql.VarChar, row.ItemID)
          .input("Bags", sql.Int, row.Bags)
          .input("Kgs", sql.Float, row.Kgs)
          .input("username", sql.VarChar, row.username)
          .input("userdatetime", sql.DateTime, new Date(row.userdatetime))
          .query(`
            MERGE INTO [cp].[dbo].[taOpNameODT] AS target
            USING (SELECT @MoveID AS MoveID, @ItemID AS ItemID) AS source
            ON target.MoveID = source.MoveID AND target.ItemID = source.ItemID
            WHEN MATCHED THEN
                UPDATE SET 
                    MoveType = @MoveType, 
                    Bags = @Bags, 
                    Kgs = @Kgs, 
                    username = @username, 
                    userdatetime = @userdatetime
            WHEN NOT MATCHED THEN
                INSERT (MoveID, MoveType, ItemID, Bags, Kgs, username, userdatetime)
                VALUES (@MoveID, @MoveType, @ItemID, @Bags, @Kgs, @username, @userdatetime);
          `);
        console.log(`Processed MoveID: ${row.MoveID} for taOpNameODT`);

      } catch (rowError: unknown) {
        // Menangani kesalahan dalam proses tiap baris
        console.error(`Error at MoveID: ${row.MoveID}`, rowError);
        errors.push(`Error at row MoveID ${row.MoveID}: ${
          rowError instanceof Error ? rowError.message : String(rowError)
        }`);
      }
    }

    // Jika ada error, rollback transaksi dan kembalikan error
    if (errors.length > 0) {
      await transaction.rollback();
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Jika semua data berhasil diproses, commit transaksi
    await transaction.commit();
    return NextResponse.json({
      data: jsonData,
      message: "Data uploaded successfully",
    });

  } catch (error) {
    // Menangani kesalahan di luar proses baris data (misalnya kesalahan koneksi database)
    console.error("Error uploading data:", error);
    return NextResponse.json(
      { error: `Error uploading data: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}