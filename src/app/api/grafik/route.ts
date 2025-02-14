import { NextResponse} from "next/server";
import sql from "mssql";
import {getPool} from "@/lib/config";
import {grafikType} from "@/lib/types";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    try {
        const pool = await getPool();

        let query = `
            SELECT                
                a.transdate
                a.itemid,
                a.itemname AS Item,
                SUM (a.kgs) AS total_terjual,
                c.CompanyName1 AS Customer
            FROM taTransODT AS a
                INNER JOIN taTransOHD AS b
            ON a.TransID = b.TransID
                INNER JOIN taCustomer AS c ON b.CompanyID = c.CompanyID
            GROUP BY
                a.transdate,
                a.itemid,
                a.ItemName,
                b.CompanyID,
                c.CompanyName1
            
    `;

        if (startDate && endDate) {
            query += ` WHERE a.[Transdate] >= @startDate AND a.[transdate] <= @endDate
`;
        }
        query += ` ORDER BY a.[transdate] DESC`;

        const requestQuery = pool.request();

        if (startDate && endDate) {
            requestQuery.input("StartDate", sql.Date, new Date(startDate));
            requestQuery.input("EndDate", sql.Date, new Date(endDate));
        }

        const result = await requestQuery.query<grafikType>(query);

        // Format the HeaderProdDate to show only the date part
        const formattedRecords = result.recordset.map((record) => ({
            ...record,
            transdate: record.transdate.toISOString().split("T")[0],
        }));

        return NextResponse.json(formattedRecords);
        // return NextResponse.json(result.recordset);
    } catch (error) {
        console.error("Error fetching data:", error);
        return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
    }
}
