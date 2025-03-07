import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
//   const remark = url.searchParams.get("remark");
//   const prodType = url.searchParams.get("prodType");
//   const itemType = url.searchParams.get("itemType");

  try {
    const pool = await getPool();
    const query = `
      WITH DateRange AS (
        -- Membuat daftar tanggal dalam rentang yang diinginkan
        SELECT CAST(@StartDate AS DATETIME) AS DateValue
        UNION ALL
        SELECT DATEADD(DAY, 1, DateValue)
        FROM DateRange
        WHERE DateValue < CAST(@EndDate AS DATETIME)
      ),
      ItemData AS (
        SELECT 
          dt.ItemID, 
          dt.ItemType, 
          CAST(hd.ProdDate AS DATE) AS ProdDate,
          dt.Bags, 
          dt.Kgs, 
          hd.DeptID,          
          hd.OrderID,         
          hd.OrderType,       
          hd.Shift AS NO_Rator, 
          hd.LocID,           
          hd.Remark,          
          dt.UserName, 
          dt.UserDateTime,
          hd.ProdType         
        FROM 
          [cp].[dbo].[taPRProdHd] AS hd
        INNER JOIN 
          [cp].[dbo].[taPRProdDt] AS dt 
          ON hd.ProdID = dt.ProdID AND hd.ProdType = dt.ProdType
        WHERE 
          hd.ProdType IN ('IN', 'SP', 'MO', 'PL', 'AS')
          AND dt.ItemType IN ('B', 'H')
          AND hd.ProdDate >= CAST(@StartDate AS DATETIME)
          AND hd.ProdDate < CAST(@EndDate AS DATETIME)
      )
        SELECT 
          dr.DateValue, 
          id.ProdType,             
          id.ItemID,
          id.ItemType,
          id.Bags, 
          id.Kgs,
          id.DeptID, 
          id.OrderID, 
          id.LocID, 
          id.Remark
        FROM 
          DateRange dr
        LEFT JOIN 
          ItemData id ON dr.DateValue = id.ProdDate
        ORDER BY 
          dr.DateValue, id.ProdType, id.ItemID

    `;

    const requestQuery = pool.request();

    // Menambahkan parameter tanggal yang dinamis
    if (startDate && endDate) {
      requestQuery.input("StartDate", sql.Date, new Date(startDate));
      requestQuery.input("EndDate", sql.Date, new Date(endDate));
    }

    const result = await requestQuery.query(query);

    // Format tanggal menjadi string tanpa waktu
    const formattedRecords = result.recordset.map((record) => ({
      ...record,
      // Handle ProdType to display the corresponding label
      ItemType: record.ItemType === "B" ? "Bahan" :record.ItemType === "H" ? "Hasil" : record.ItemType,
      DeptID:
        record.DeptID === "AS"
          ? "Assembly"
          : record.DeptID === "PL"
          ? "Plating"
          : record.DeptID === "IN"
          ? "Injeksi"
          : record.DeptID === "MO"
          ? "Molding"
          : record.DeptID === "SP"
          ? "Spray"
          : record.DeptID, 
      ProdDate: record.ProdDate
        ? record.ProdDate.toISOString().split("T")[0]
        : null, // If ProdDate is null or undefined, return null
    }));

    return NextResponse.json(formattedRecords);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}
