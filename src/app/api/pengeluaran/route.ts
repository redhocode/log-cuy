"use server";
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/config";
import sql from "mssql";
import { pengeluaran } from "@/components/pengeluaran/notifpengeluaran";

// Fungsi untuk memproses parameter tanggal
const parseDate = (dateString: string) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tgl1 = parseDate(searchParams.get("tgl1") || "");
  const tgl2 = parseDate(searchParams.get("tgl2") || "");

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("tgl1", sql.DateTime, tgl1 || new Date())
      .input("tgl2", sql.DateTime, tgl2 || new Date())
      .execute("rpPengeluaran");

    // Memformat TanggalSuratJalan agar hanya menampilkan tanggal tanpa waktu
    const formattedResults = result.recordset.map((item: pengeluaran) => ({
      ...item,
      TanggalSuratJalan: item.TanggalSuratJalan
        ? item.TanggalSuratJalan.toString().split("T")[0] // Format menjadi hanya tanggal
        : null,
    }));

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error("Error eksekusi stored procedure:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data." },
      { status: 500 }
    );
  }
}
