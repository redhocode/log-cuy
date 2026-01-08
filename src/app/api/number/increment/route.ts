/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getPool } from "@/lib/config";

/**
 * ⚠️ WHITELIST KOLOM
 * Tambahkan kolom sesuai kebutuhan
 */
const ALLOWED_COLUMNS = [
  "PONoN",
  "PONoJ",
  "PONoP",
  "PONoB",
  "PONoG",
  "PONoM",
  "PONoE",
  "PONoF",
  "PONoA",
  "PONoS",
  "SONoN",
  "SONoJ",
  "SONoP",
  "SONoB",
  "SONoM",
  "SONoE",
  "SONoF",
  "SONoA",
  "SONoS",
  "Jurnal"
];

export async function POST(req: Request) {
  try {
    const { uniqueId, column } = await req.json();

    if (!uniqueId || !column) {
      return NextResponse.json(
        { message: "uniqueId dan column wajib diisi" },
        { status: 400 }
      );
    }

    if (!ALLOWED_COLUMNS.includes(column)) {
      return NextResponse.json(
        { message: "Kolom tidak diizinkan" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    const query = `
      UPDATE taNumber
      SET ${column} = ${column} + 1
      WHERE UniqueID = @uniqueId
    `;

    await pool.request().input("uniqueId", uniqueId).query(query);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
