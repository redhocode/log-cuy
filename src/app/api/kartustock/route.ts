// app/api/kartu-stock/route.ts

import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";

interface KartuStockData {
  Item: string;
  Loc: string;
  Jumlah: number;
  Tanggal: string;
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const tgl1 = url.searchParams.get("tgl1");
  const tgl2 = url.searchParams.get("tgl2");
  const loc = url.searchParams.get("loc") || "%";
  const item = url.searchParams.get("item");
  const kategori = url.searchParams.get("kategori") || "0";
  const itemid = url.searchParams.get("itemid");

  if (!tgl1 || !tgl2 || !item || !itemid) {
    return NextResponse.json(
      { message: "Parameter tidak lengkap!" },
      { status: 400 }
    );
  }

  try {
    const periodeR = "201905"; // periode tetap

    const pool = await getPool();

    const result = await pool
      .request()
      .input("Tgl1", sql.Date, tgl1)
      .input("Tgl2", sql.Date, tgl2)
      .input("Loc", sql.NVarChar, loc)
      .input("Item", sql.NVarChar, item)
      .input("PeriodeR", sql.NVarChar, periodeR)
      .input("kategori", sql.NVarChar, kategori)
      .input("itemid", sql.NVarChar, itemid)
      .execute("dbo.rpKartuStockBrgL"); // ← Nama SP yang benar

    return NextResponse.json(result.recordset as KartuStockData[]);
  } catch (err) {
    console.error("Error saat fetch data:", err);
    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
