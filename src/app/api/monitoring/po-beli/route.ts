/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getPool } from "@/lib/config";
interface POData {
    no:string;
    tgl1:string;
    tgl2:string;
    item:string;
    company:string;
    tipe:string;
    userinput:string;
}

export async function GET(req: Request) {
    const url = new URL(req.url);
    const tgl1 = url.searchParams.get("tgl1");
    const tgl2 = url.searchParams.get("tgl2");
    const no = url.searchParams.get("no") || "%";
    const item = url.searchParams.get("item") || "%";
    const company = url.searchParams.get("company") || "%";
    const tipe = url.searchParams.get("tipe") || "%";
    const userinput = url.searchParams.get("userinput") || 0;

    if (!tgl1 || !tgl2) {
        return NextResponse.json({ message: "Parameter tidak lengkap!" }, { status: 400 });
    }

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("tgl1", tgl1)
            .input("tgl2", tgl2)
            .input("item", item)
            .input("no", no)
            .input("company", company)
            .input("tipe", tipe)
            .input("userinput", userinput)
            .execute("dbo.rpMonitoringPO");

        return NextResponse.json(result.recordset as POData[]);
    } catch (error) {
        console.error("Error saat fetch data:", error);
        return NextResponse.json({ message: "Terjadi kesalahan server." }, { status: 500 });
    }
}
