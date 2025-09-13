/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("q", sql.NVarChar, `%${q}%`)
      .query(
        `SELECT DISTINCT TOP 10 ItemID 
         FROM taPackingHD
         WHERE ItemID LIKE @q`
      );

    return NextResponse.json(result.recordset.map((r: any) => r.ItemID));
  } catch (error) {
    console.error("Error suggest:", error);
    return NextResponse.json([], { status: 500 });
  }
}
