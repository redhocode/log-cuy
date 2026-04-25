/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";

async function getRpStokPPIC(params: any) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("Tgl1", sql.DateTime, params.tgl1)
    .input("Tgl2", sql.DateTime, params.tgl2)
    .input("Loc", sql.VarChar(6), params.loc)
    .input("PeriodeR", sql.VarChar(6), params.periodeR)
    .input("kategori", sql.VarChar(20), params.kategori)
    .input("itemid", sql.VarChar(50), params.itemid)
    .execute("[dbo].[rpStokPPIC2]");
  return result.recordset;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tgl1 = new Date(url.searchParams.get("tgl1") || new Date());
    const tgl2 = new Date(url.searchParams.get("tgl2") || new Date());
    const loc = url.searchParams.get("loc") || "%";
    const periodeR = url.searchParams.get("periodeR") || "201905";
    const kategori = url.searchParams.get("kategori") || "%";
    const itemid = url.searchParams.get("itemid") || "%";

    const data = await getRpStokPPIC({ tgl1, tgl2, loc, periodeR, kategori, itemid });
    
    const processedData = data.map((item: any) => ({
      KodeBarang: item.KodeBarang,
      NamaBarang: item.NamaBarang || item.KodeBarang,
      SaldoAkhir: parseFloat(item.SaldoAkhir) || 0,
      SaldoAkhirFisik: parseFloat(item.SaldoAkhirFisik) || 0,
      Satuan: item.Satuan,
      TotalCommitted: parseFloat(item.TotalCommitted) || 0,
      TotalReserved: parseFloat(item.TotalReserved) || 0,
    }));

    console.log(`📊 API Response for ${itemid}:`, processedData);

    return NextResponse.json({ success: true, data: processedData, metadata: { totalRecords: processedData.length } });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}