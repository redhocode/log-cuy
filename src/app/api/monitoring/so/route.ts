import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";

interface SOData {
    no:string;
    tgl1:string;
    tgl2:string;
    item:string;
    company:string;
    tipe:string;
    kredit:number;
    jenisTOP:number;

}
export async function GET(request:Request) {
    const url = new URL(request.url);
    const tgl1 = url.searchParams.get("tgl1");
    const tgl2 = url.searchParams.get("tgl2");
    const no = url.searchParams.get("No") || "%";
    const item = url.searchParams.get("item") || "%";
    const company = url.searchParams.get("company") || "%";
    const kredit = url.searchParams.get("kredit") || 0;
    const tipe = url.searchParams.get("tipe") || "%";
    const jenisTOP = url.searchParams.get("jenisTOP") || 0;

    if (!tgl1 || !tgl2) {
        return NextResponse.json({ message: "Parameter tidak lengkap!" }, { status: 400 });
    }

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("tgl1", sql.Date, tgl1)
            .input("tgl2", sql.Date, tgl2)
            .input("item", sql.NVarChar, item)
            .input("no", sql.NVarChar, no)
            .input("company", sql.NVarChar, company)
            .input("tipe", sql.NVarChar, tipe)
            .input("kredit", sql.Int, kredit)
            .input("jenisTOP", sql.Int, jenisTOP)
            .execute("dbo.rpMonitoringSO");

        return NextResponse.json(result.recordset as SOData[]);
    } catch (error) {
        console.error("Error saat fetch data:", error);
        return NextResponse.json({ message: "Terjadi kesalahan server." }, { status: 500 });
    }
}