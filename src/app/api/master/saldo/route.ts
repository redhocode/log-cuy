//saldo ini di ambil dari data dari laporan excel admin
import { NextResponse } from "next/server";
import { getPool } from "@/lib/config";
import * as XLSX from "xlsx";
import { saldoType } from "@/lib/types";
import sql from "mssql";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const bulan = url.searchParams.get("bulan");
    const tahun = url.searchParams.get("tahun");

    const pool = await getPool();

    const query = `
      SELECT 
          [ItemID],
          [Bulan],
          [Gudang],
          [Tahun],
          [Saldo]
      FROM [cp].[dbo].[SaldoGudang]
      WHERE (@bulan IS NULL OR Bulan = @bulan)
        AND (@tahun IS NULL OR Tahun = @tahun)
    `;

    const result = await pool
      .request()
      .input("bulan", bulan ? Number(bulan) : null)
      .input("tahun", tahun ? Number(tahun) : null)
      .query(query);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.formData();
    const file = body.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file -> buffer
    const buffer = await file.arrayBuffer();
    const data = Buffer.from(buffer);

    // Baca file Excel
    const workbook = XLSX.read(data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Partial<saldoType>>(worksheet);

    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: "No data found in Excel file" },
        { status: 400 }
      );
    }

    // Validasi data
    const errors: string[] = [];
    for (let i = 0; i < jsonData.length; i++) {
      const item = jsonData[i];
if (
  !item.ItemID ||
  !item.Gudang ||
  !item.Bulan ||
  !item.Tahun ||
  isNaN(Number(item.Saldo))
) {
  errors.push(`Invalid data at row ${i + 2}: ${JSON.stringify(item)}`);
}
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // SQL Server connection & transaction
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      for (const item of jsonData) {
        await transaction
          .request()
          .input("ItemID", sql.VarChar(50), item.ItemID ?? "")
          .input("Gudang", sql.VarChar(50), item.Gudang ?? "")
          .input("Bulan", sql.Int, Number(item.Bulan))
          .input("Tahun", sql.Int, Number(item.Tahun))
          .input("Saldo", sql.Decimal(18, 2), Number(item.Saldo)).query(`
            INSERT INTO [cp].[dbo].[SaldoGudang] 
            ([ItemID], [Gudang], [Bulan], [Tahun], [Saldo]) 
            VALUES (@ItemID, @Gudang, @Bulan, @Tahun, @Saldo)
          `);
      }

      await transaction.commit();
      return NextResponse.json(
        { message: "Saldo data imported successfully" },
        { status: 200 }
      );
    } catch (err) {
      await transaction.rollback();
      console.error("Error inserting saldo:", err);
      return NextResponse.json(
        { error: "Failed to insert saldo data" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing file:", error);
    const errorMessage =
      typeof error === "object" && error !== null && "message" in error
        ? (error as { message?: string }).message
        : undefined;
    return NextResponse.json(
      { error: "Internal Server Error", detail: errorMessage },
      { status: 500 }
    );
  }
}