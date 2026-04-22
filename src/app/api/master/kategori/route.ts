// app/api/master/kategori/route.ts
import { NextResponse } from "next/server";
import { getPool } from "@/lib/config";
import sql from 'mssql';

export async function GET() {
  try {
    const pool = await getPool();
    
    const result = await pool.request().query(`
      SELECT 
        KodeJenis,
        NamaJenis
      FROM [cp].[dbo].[taKindofGoods]
      ORDER BY KodeJenis
    `);

    return NextResponse.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error("Error fetching kategori:", error);
    return NextResponse.json(
      { success: false, error: "Error fetching kategori" },
      { status: 500 }
    );
  }
}