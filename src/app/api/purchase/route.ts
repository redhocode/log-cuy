import { NextResponse } from "next/server";
import sql from "mssql";
import { PurchaseType } from "@/lib/types";
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
       hd.[OrderID],
        hd.[OrderType],
        hd.[OrderDate],
        hd.[CompanyID],
        hd.[Total],
        hd.[Curr],
        hd.[Rate],
        hd.[TotalRp],
        hd.[DueDate],
        hd.[Remark],
        hd.[TipeDok],
        hd.[DPP],
        dt.[ItemID],
        dt.[Bags],
        dt.[Kgs],
        dt.[Price],
        dt.[Total] as TotalDt,
        dt.[Satuan]

      FROM [cp].[dbo].[taPOHD] AS hd
        JOIN [cp].[dbo].[taPODT] AS dt ON hd.[OrderID] = dt.[OrderID] and hd.[OrderType] = dt.[OrderType]
    `;

    if (startDate && endDate) {
      query += ` WHERE hd.[OrderDate] BETWEEN @StartDate AND @EndDate 
`;
    }
    query += ` ORDER BY hd.[OrderID] DESC`;

    const requestQuery = pool.request();

    if (startDate && endDate) {
      requestQuery.input("StartDate", sql.Date, new Date(startDate));
      requestQuery.input("EndDate", sql.Date, new Date(endDate));
    }

    const result = await requestQuery.query<PurchaseType>(query);

    // Format the HeaderProdDate to show only the date part
    const formattedRecords = result.recordset.map((record) => ({
      ...record,
      OrderDate: record.OrderDate.toISOString().split("T")[0],
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
    const jsonData: PurchaseType[] =
      XLSX.utils.sheet_to_json<PurchaseType>(worksheet);

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
        // MERGE untuk taPOHD
    
        const orderID =
          typeof row.OrderID === "string"
            ? row.OrderID.trim()
            : String(row.OrderID || "");
        // Log untuk memeriksa nilai ProdID
        console.log(`Processing ProdID: ${orderID}`);

        const requestHd = new sql.Request(transaction);
        await requestHd
          .input("OrderID", sql.VarChar, orderID)
          .input("OrderDate", sql.DateTime, new Date(row.OrderDate))
          .input("OrderType", sql.VarChar, row.OrderType)
          .input("CompanyID", sql.VarChar, row.CompanyID)
          .input("Total", sql.Float, row.Total)
          .input("Curr", sql.VarChar, row.Curr)
          .input("Rate", sql.Float, row.Rate)
          .input("TotalRp", sql.Float, row.TotalRp)
          .input("DueDate", sql.DateTime, new Date(row.DueDate))
          .input("Remark", sql.VarChar, row.Remark)
          .input("TipeDok", sql.VarChar, row.TipeDokumen)
          .input("DPP", sql.Float, row.DPP)
          .input("Remark", sql.VarChar, row.Remark).query(`
            MERGE INTO [cp].[dbo].[taPOHd] AS target
            USING (SELECT @OrderID AS OrderID) AS source
            ON target.OrderID = source.OrderID
            WHEN MATCHED THEN
                UPDATE SET 
                    OrderDate = @OrderDate, 
                    OrderType = @OrderType, 
                    CompanyID = @CompanyID, 
                    Total = @Total, 
                    Curr = @Curr, 
                    Rate = @Rate,
                    TotalRp = @TotalRp,
                    DueDate = @DueDate, 
                    Remark = @Remark,
                    TipeDok = @TipeDok,
                    DPP = @DPP
            WHEN NOT MATCHED THEN
                INSERT (OrderID, OrderDate, CompanyID, Total, Curr, Rate, TotalRp, DueDate, Remark, TipeDok, DPP)
                VALUES (@OrderID, @OrderDate, @OrderType, @CompanyID, @Total, @Curr, @Rate, @TotalRp, @DueDate, @Remark, @TipeDok, @DPP);
          `);

        // MERGE untuk taPODt
        const requestDt = new sql.Request(transaction);
        const margeResultDT = await requestDt
          .input("OrderID", sql.VarChar, row.OrderID)
          .input("OrderDate", sql.DateTime, new Date(row.OrderDate))
          .input("OrderType", sql.VarChar, row.OrderType)
          .input("ItemID", sql.VarChar, row.ItemID)
          .input("Bags", sql.Int, row.Bags)
          .input("Kgs", sql.Float, row.Kgs)
          .input("Price", sql.Float, row.Price)
          .input("Remark", sql.VarChar, row.Remark)
          .input("Total", sql.Float, row.Total)
          .input("Satuan", sql.VarChar, row.Satuan)
          .query(`
            MERGE INTO [cp].[dbo].[taPODt] AS target
            USING (SELECT @OrderID AS OrderID, @ItemID AS ItemID) AS source
            ON target.OrderID = source.OrderID AND target.ItemID = source.ItemID
            WHEN MATCHED THEN
                UPDATE SET
                    OrderDate = @OrderDate 
                    ProdType = @ProdType, 
                    Bags = @Bags, 
                    Kgs = @Kgs, 
                    Price = @Price,
                    Total = @Total,
                    Satuan = @Satuan
            WHEN NOT MATCHED THEN
                INSERT (OrderID, ProdType, ItemID, Bags, Kgs, Price, Total, Satuan)
                VALUES (@OrderID, @ProdType, @ItemID, @Bags, @Kgs, @Price, @Total, @Satuan);
          `);
        console.log(margeResultDT);
      } catch (rowError) {
        console.error("SQL Error:", rowError);
        errors.push(
          `Error processing row with ProdID ${row.OrderID}: ${
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

