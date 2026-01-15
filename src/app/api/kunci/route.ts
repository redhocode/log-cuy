/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";
import { kunciType } from "@/lib/types";

/**
 * GET endpoint untuk mengambil semua data kunci form
 * @returns {Array} List semua data form dengan tanggal kunci
 */
export async function GET() {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .query<kunciType>(
        "SELECT Form_alias as name, LockDate FROM [cp].[dbo].[taLockForm]"
      );

    // Format tanggal dari Date object ke string YYYY-MM-DD
    const formattedRecords = result.recordset.map((record) => ({
      ...record,
      LockDate: record.LockDate
        ? record.LockDate.toISOString().split("T")[0]
        : null,
    }));

    return NextResponse.json(formattedRecords);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}

/**
 * PUT endpoint untuk mengupdate tanggal kunci form
 * Mendukung: Body JSON atau Query Parameters
 * @param {Request} request - Request object
 * @returns {Object} Response status dan data yang telah diupdate
 */
export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    let name: string | null = null;
    let LockDate: string | null = null;

    // Coba parse body JSON terlebih dahulu
    try {
      if (request.headers.get("content-type")?.includes("application/json")) {
        const body = await request.json();
        name = body.name;
        LockDate = body.LockDate;
      }
    } catch (parseError) {
      console.log(
        "Tidak ada body JSON atau format tidak valid, coba query parameters"
      );
    }

    // Jika tidak ada dari body, coba dari query parameters
    if (!name || !LockDate) {
      name = searchParams.get("name");
      LockDate = searchParams.get("LockDate");
    }

    // Validasi input
    if (!name || !LockDate) {
      return NextResponse.json(
        {
          error:
            "Name dan LockDate diperlukan. Kirim via body JSON atau query parameters",
        },
        { status: 400 }
      );
    }

    // Validasi format tanggal YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(LockDate)) {
      return NextResponse.json(
        { error: "Format tanggal harus YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Update data di database menggunakan parameterized query
    const result = await pool
      .request()
      .input("name", sql.VarChar, name)
      .input("lockDate", sql.Date, LockDate).query(`
        UPDATE [cp].[dbo].[taLockForm] 
        SET LockDate = @lockDate
        WHERE Form_alias = @name
      `);

    // Cek apakah data berhasil diupdate
    if (result.rowsAffected[0] === 0) {
      return NextResponse.json(
        { error: "Data tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Data berhasil diupdate",
      data: { name, LockDate },
    });
  } catch (error) {
    console.error("Error updating data:", error);
    return NextResponse.json({ error: "Error updating data" }, { status: 500 });
  }
}
