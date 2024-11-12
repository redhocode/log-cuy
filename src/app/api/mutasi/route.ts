import { NextResponse } from "next/server";
import sql from "mssql";
import { MutasiType } from "@/lib/types";
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
      SELECT TOP (10000)
        hd.[MoveID],
        hd.[MoveType],
        hd.[MoveDate],
        hd.[LocIDSrc],
        hd.[LocIDDest],
        hd.[Remark],
        hd.[OrderIDRef],
        hd.[OrderTypeRef],
        dt.[ItemID],
        dt.[Bags],
        dt.[Kgs],
        dt.[HPPPrice],
        dt.[username],
        dt.[userdatetime],
        dt.[rjn]
      FROM [cp].[dbo].[taMoveHD] AS hd
      INNER JOIN [cp].[dbo].[taMoveDT]
      AS dt ON hd.[MoveID] = dt.[MoveID]
      AND hd.[MoveType] = dt.[MoveType]
    `;

    if (startDate && endDate) {
      query += ` WHERE hd.[MoveDate] BETWEEN @StartDate AND @EndDate 
`;
    }
    query += ` ORDER BY hd.[MoveID] DESC`;

    const requestQuery = pool.request();

    if (startDate && endDate) {
      requestQuery.input("StartDate", sql.Date, new Date(startDate));
      requestQuery.input("EndDate", sql.Date, new Date(endDate));
    }

    const result = await requestQuery.query<MutasiType>(query);

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
    const jsonData: MutasiType[] =
      XLSX.utils.sheet_to_json<MutasiType>(worksheet);

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
      console.log("Processing row:", row);

      if (!row.MoveID || !row.MoveType) {
        console.error("MoveID or MoveType is null or undefined for row:", row);
        errors.push("MoveID or MoveType is missing for a row.");
        continue; // Skip this row
      }

      try {
        // Validasi tipe data untuk MoveID
        if (typeof row.MoveID !== "string") {
          console.error("Invalid MoveID type for row:", row);
          errors.push(`Invalid MoveID for row: ${JSON.stringify(row)}`);
          continue; // Skip this row
        }
        if (typeof row.MoveID !== "string" || row.MoveID.trim() === "") {
          console.error("Invalid MoveID:", row.MoveID);
          errors.push(`Invalid MoveID for row: ${JSON.stringify(row)}`);
          continue; // Skip this row
        }
        // MERGE untuk HD
        const requestHD = new sql.Request(transaction);
        await requestHD
          .input("MoveID", sql.VarChar, row.MoveID)
          .input("MoveType", sql.VarChar, row.MoveType)
          .input("LocIDSrc", sql.VarChar, row.LocIDSrc)
          .input("LocIDDest", sql.VarChar, row.LocIDDest)
          .input("OrderIDRef", sql.VarChar, row.OrderIDRef)
          .input("OrderTypeRef", sql.VarChar, row.OrderTypeRef)
          .input("MoveDate", sql.DateTime, new Date(row.MoveDate))
          .input("Remark", sql.VarChar, row.Remark).query(`
            MERGE INTO [cp].[dbo].[taMoveHD] AS target
            USING (SELECT @MoveID AS MoveID) AS source
            ON target.MoveID = source.MoveID
            WHEN MATCHED THEN
                UPDATE SET 
                    MoveType = @MoveType, 
                    LocIDSrc = @LocIDSrc,
                    LocIDDest = @LocIDDest,
                    OrderIDRef = @OrderIDRef,
                    OrderTypeRef = @OrderTypeRef,
                    MoveDate = @MoveDate, 
                    Remark = @Remark
            WHEN NOT MATCHED THEN
                INSERT (MoveID, MoveType, LocIDSrc, LocIDDest, OrderIDRef, OrderTypeRef, MoveDate, Remark)
                VALUES (@MoveID, @MoveType, @LocIDSrc, @LocIDDest, @OrderIDRef, @OrderTypeRef, @MoveDate, @Remark);
          `);

        console.log(`Processed HD for MoveID: ${row.MoveID}`);

        // MERGE untuk DT
        const requestDT = new sql.Request(transaction);
        await requestDT
          .input("MoveID", sql.VarChar, row.MoveID)
          .input("MoveType", sql.VarChar, row.MoveType)
          .input("MoveDate", sql.DateTime, new Date(row.MoveDate))
          .input("ItemID", sql.VarChar, row.ItemID)
          .input("Bags", sql.Int, row.Bags)
          .input("Kgs", sql.Float, row.Kgs)
          .input("HPPPrice", sql.Float, row.HPPPrice)
          .input("username", sql.VarChar, row.username)
          .input("userdatetime", sql.DateTime, new Date(row.userdatetime))
          .query(`
            MERGE INTO [cp].[dbo].[taMoveDT] AS target
            USING (SELECT @MoveID AS MoveID, @ItemID AS ItemID) AS source
            ON target.MoveID = source.MoveID AND target.ItemID = source.ItemID
            WHEN MATCHED THEN
                UPDATE SET 
                    MoveType = @MoveType, 
                    MoveDate = @MoveDate,
                    HPPPrice = @HPPPrice,
                    Bags = @Bags, 
                    Kgs = @Kgs, 
                    username = @username, 
                    userdatetime = @userdatetime
            WHEN NOT MATCHED THEN
                INSERT (MoveID, MoveType, MoveDate, ItemID, Bags, Kgs, HPPPrice, username, userdatetime)
                VALUES (@MoveID, @MoveType, @MoveDate, @ItemID, @Bags, @Kgs, @HPPPrice, @username, @userdatetime);
          `);

        console.log(`Processed DT for MoveID: ${row.MoveID}`);
      } catch (rowError: unknown) {
        console.error("SQL Error for MoveID:", row.MoveID, "Error:", rowError);
        errors.push(
          `Error processing MoveID ${row.MoveID}: ${
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
