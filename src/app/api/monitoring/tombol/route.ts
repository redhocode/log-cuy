import { NextResponse } from "next/server";
import { getPool } from "@/lib/config";
import sql from "mssql";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})); // biar gak error kalau body kosong
    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: "StartDate & EndDate wajib diisi" },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const request = pool.request();
    request.input("StartDate", sql.Date, startDate);
    request.input("EndDate", sql.Date, endDate);

    await request.execute("sp_UpdateAllNoPO");

    return NextResponse.json({
      success: true,
      message: "Stored procedure berhasil dijalankan",
    });
  } catch (error: unknown) {
    console.error("Error eksekusi SP:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
