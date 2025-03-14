import { NextResponse } from "next/server";
import sql from "mssql";
import { Spktype } from "@/lib/types";
// SQL Server Configuration
import { getPool } from "@/lib/config";
 import * as XLSX from "xlsx";

// Define a type for the record structure

export async function GET(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  try {
    const pool = await getPool();

    let query = `
      SELECT DISTINCT
        hd.[OrderID],
        hd.[OrderDate],
        hd.[Remark],
        hd.[PRDeptID]
        FROM [cp].[dbo].[taPROrder] AS hd
        LEFT JOIN [cp].[dbo].[taPROrderDt] AS dt ON hd.[OrderID] = dt.[OrderID] AND hd.[OrderType] = dt.[OrderType]
    `;

    if (startDate && endDate) {
      query += ` WHERE hd.[OrderDate] >= @StartDate AND hd.[OrderDate] <= @EndDate
`;
    }
    query += ` ORDER BY hd.[OrderDate] DESC`;

    const requestQuery = pool.request();

    if (startDate && endDate) {
      requestQuery.input("StartDate", sql.Date, new Date(startDate));
      requestQuery.input("EndDate", sql.Date, new Date(endDate));
    }

    const result = await requestQuery.query<Spktype>(query);

    // Format the HeaderProdDate to show only the date part
    const formattedRecords = result.recordset.map((record) => ({
      ...record,
      OrderDate: record.OrderDate.toISOString().split("T")[0],
      // PRDeptID:
      //   record.PRDeptID === "PL"
      //     ? "Platting"
      //     : record.PRDeptID === "IN"
      //     ? "Injeksi"
      //     : record.PRDeptID
      //     ? "Molding" 
      //     : record.PRDeptID === "MO"
      //     ? "Assembly"
      //     : record.PRDeptID === "AS"
      //     ? "Spary" 
      //     : record.PRDeptID === "SP"
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

    console.log("Sheet Names:", workbook.SheetNames);

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    console.log("Worksheet:", worksheet);

    const jsonData: Spktype[] = XLSX.utils.sheet_to_json<Spktype>(worksheet);
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

    for (const row of jsonData) {
      try {
        // MERGE untuk taORderHD
        const requestIHD = new sql.Request(transaction);
        await requestIHD
          .input("OrderID", sql.VarChar, row.OrderID)
          .input("OrderType", sql.VarChar, row.OrderType)
          .input("OrderDate", sql.DateTime, new Date(row.OrderDate))
          .input("PlanDate", sql.DateTime, new Date(row.PlanDate))
          .input("ItemID", sql.VarChar, row.ItemID)
          .input("Bags", sql.Int, row.Bags)
          .input("Kgs", sql.Float, row.Kgs)
          .input("Remark", sql.VarChar, row.Remark)
          .input("PRDeptID", sql.VarChar, row.PRDeptID)
          .input("TypeSO", sql.VarChar, row.TypeSO)
          .input("UserName", sql.VarChar, row.UserName)
          .input("UserDateTime", sql.VarChar, row.UserDateTime)
          .query(`
            MERGE INTO [cp].[dbo].[taPROrderhd] AS target
            USING (SELECT @OrderID AS OrderID) AS source
            ON target.OrderID = source.OrderID
            WHEN MATCHED THEN
                UPDATE SET 
                    OrderType = @OrderType, 
                    OrderDate = @OrderDate, 
                    PlanDate = @PlanDate, 
                    Remark = @Remark
                    ItemID = @ItemID,
                    Bags = @Bags,
                    Kgs = @Kgs,
                    PRDeptID = @PRDeptID,
                    TypeSO = @TypeSO,
                    UserName = @UserName,
                    UserDateTime = @UserDateTime 
            WHEN NOT MATCHED THEN
                INSERT (OrderID, OrderType, OrderDate, PlanDate,Remark,ItemID,Bags,Kgs,PRDeptID,TypeSO,UserName,UserDateTime)
                VALUES (@OrderID, @OrderType, @OrderDate, @PlanDate,@Remark,@ItemID,@Bags,@Kgs,@PRDeptID,@TypeSO,@UserName,@UserDateTime);
          `);

        // MERGE untuk taOrderDT
        const requestIDT = new sql.Request(transaction);
        await requestIDT
          .input("OrderID", sql.VarChar, row.OrderID)
          .input("OrderType", sql.VarChar, row.OrderType)
          .input("ItemID", sql.VarChar, row.ItemID)
          .input("Bags", sql.Int, row.Bags)
          .input("Kgs", sql.Float, row.Kgs)
          .query(`
            MERGE INTO [cp].[dbo].[taORDerDT] AS target
            USING (SELECT @OrderID AS OrderID, @ItemID AS ItemID) AS source
            ON target.OrderID = source.OrderID AND target.ItemID = source.ItemID
            WHEN MATCHED THEN
                UPDATE SET 
                    OrderType = @MoveType, 
                    Bags = @Bags, 
                    Kgs = @Kgs, 
            WHEN NOT MATCHED THEN
                INSERT (OrderID, OrderType, ItemID, Bags, Kgs)
                VALUES (@MoveID, @OrderType, @ItemID, @Bags, @Kgs);
          `);
      } catch (rowError: unknown) {
        console.error("SQL Error:", rowError);
        errors.push(
          `Error at row: ${
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


