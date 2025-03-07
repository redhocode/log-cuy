import { NextResponse } from "next/server";
import { getPool } from "@/lib/config";

export async function GET(request: Request) {
  try {
    // Dapatkan pool koneksi ke database
    const pool = await getPool();

    // Jalankan query SQL yang diberikan
    await pool.query(`
      ALTER DATABASE absensi
      SET RECOVERY SIMPLE;
      
      DBCC SHRINKFILE (absensi_log, 1);
      
      ALTER DATABASE absensi
      SET RECOVERY FULL;
    `);

    // Jika query berhasil, kembalikan respons sukses
    return NextResponse.json({ message: "Query executed successfully" });
  } catch (error) {
    // Pengecekan tipe dengan `instanceof`
    if (error instanceof Error) {
      console.error('Error executing SQL query:', error.message);
      return NextResponse.json({ message: 'Error executing query', error: error.message }, { status: 500 });
    }

    // Jika bukan instance dari Error, tangani error yang lebih umum
    console.error('Unknown error occurred:', error);
    return NextResponse.json({ message: 'Unknown error occurred' }, { status: 500 });
  }
}
   