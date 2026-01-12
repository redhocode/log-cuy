/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getPool } from "@/lib/config";

export async function GET() {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM taNumber");

    return NextResponse.json(result.recordset);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
