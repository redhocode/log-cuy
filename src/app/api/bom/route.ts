import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";

interface BomData {
  TransID: number;
  ItemidHD: string;
  itemnamehd: string;
  ItemID: string;
  ItemName: string;
  BahanQty: number;
  Departemen: string;
  KodeJenis: string;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const itemid = url.searchParams.get("itemid") || "%";

  try {
    const pool = await getPool();
    let result;

    if (itemid && itemid.trim() !== "") {
      // Jika ada parameter itemid → filter
      result = await pool
        .request()
        .input("itemid", sql.NVarChar, itemid)
        .execute("dbo.rpBOM");
    } else {
      // Jika tidak ada → ambil semua data
      result = await pool.request().execute("dbo.rpBOM");
    }

    return NextResponse.json(result.recordset as BomData[]);
  } catch (error) {
    console.error("Error saat fetch data:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
