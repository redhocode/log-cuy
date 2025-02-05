import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";

export async function POST(req: Request) {
  const pool = await getPool();
  const connection = await pool.connect();

  let transaction: sql.Transaction | undefined = undefined;

  try {
    const { orderId } = await req.json();

    transaction = new sql.Transaction(connection);
    await transaction.begin();

    // 1. Ambil data header dari taSOhd (TAX di taSOhd untuk referensi)
    const sohdResult = await transaction
      .request()
      .input("OrderID", sql.VarChar(50), orderId).query(`
        SELECT TOP 1 
          CompanyID,
          Tax  -- Kolom Tax di taSOhd berisi 11 atau 12
        FROM [CP].[dbo].[taSOhd] 
        WHERE OrderID = @OrderID
      `);

    if (sohdResult.recordset.length === 0) {
      await transaction.rollback();
      return NextResponse.json(
        { error: "Data SO tidak ditemukan" },
        { status: 404 }
      );
    }

    const { CompanyID, Tax } = sohdResult.recordset[0];

    // Check if CompanyID is a valid number
    if (isNaN(CompanyID) || CompanyID == null) {
      await transaction.rollback();
      return NextResponse.json({ error: "Invalid CompanyID" }, { status: 400 });
    }

    const taxRate = Tax / 100; // Konversi ke decimal (0.11 atau 0.12)

    // 2. Ambil dan insert detail dengan harga termasuk PPN
    const sodtResult = await transaction
      .request()
      .input("OrderID", sql.VarChar(50), orderId).query(`
        SELECT 
          ItemID,
          Bags,
          Kgs,
          Price, 
          Price * (1 + ${taxRate}) AS PriceWithTax -- Hitung harga dengan PPN
        FROM [CP].[dbo].[taSOdt] 
        WHERE OrderID = @OrderID
      `);

    // 3. Hitung subtotal
    let subtotal = 0;
    sodtResult.recordset.forEach((item) => {
      subtotal += item.Price * item.Kgs; // Subtotal tanpa PPN, untuk total tanpa tax
    });

    // 4. Hitung total dengan PPN
    const totalWithTax = subtotal * (1 + taxRate);

    // 5. Insert ke taTransOHD
    const transOHDResult = await transaction
      .request()
      .input("OrderID", sql.VarChar(50), orderId)
      .input("TransDate", sql.DateTime, new Date())
      .input("CompanyID", sql.Int, CompanyID)
      .input("Total", sql.Decimal(18, 2), totalWithTax)
      .input("Tax", sql.Int, Tax) // Simpan nilai 11 atau 12
      .query(`
        INSERT INTO [CP].[dbo].[taTransOHD] (
          TransType,
          OrderID,
          TransDate,
          CompanyID,
          Total,
          Tax,
          Curr,
          Rate
        )
        OUTPUT INSERTED.TransID
        VALUES (
          'SO',
          @OrderID,
          @TransDate,
          @CompanyID,
          @Total,
          @Tax,
          'IDR',
          1
        )
      `);

    const newTransID = transOHDResult.recordset[0].TransID;

    // 6. Insert ke taTransODT (detail per item)
    for (const item of sodtResult.recordset) {
      await transaction
        .request()
        .input("TransID", sql.Int, newTransID)
        .input("ItemID", sql.VarChar(50), item.ItemID)
        .input("Bags", sql.Int, item.Bags)
        .input("Kgs", sql.Decimal(18, 2), item.Kgs)
        .input("Price", sql.Decimal(18, 2), item.PriceWithTax) // Harga termasuk PPN
        .input("HPPPrice", sql.Decimal(18, 2), item.Price) // Harga tanpa PPN
        .query(`
          INSERT INTO [CP].[dbo].[taTransODT] (
            TransID,
            ItemID,
            Bags,
            Kgs,
            Price,
            HPPPrice,
            TransDate,
            Satuan
          )
          VALUES (
            @TransID,
            @ItemID,
            @Bags,
            @Kgs,
            @Price,
            @HPPPrice,
            GETDATE(),
            'KG'
          )
        `);
    }

    await transaction.commit();

    return NextResponse.json({
      success: true,
      transId: newTransID,
      taxRate: Tax,
      total: totalWithTax.toFixed(2),
      message: "Data transaksi berhasil dibuat dengan PPN " + Tax + "%",
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback(); // Rollback the transaction if it exists
    }
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Gagal membuat transaksi" },
      { status: 500 }
    );
  } finally {
    connection.close(); // Close the connection to the pool
  }
}
