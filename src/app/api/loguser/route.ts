import { NextResponse } from "next/server";
import { getPool } from "@/lib/config";
import sql from "mssql";
import { loguserType } from "@/lib/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  try {
    const pool = await getPool();

    // Query dasar untuk mengambil data
    let query = `
      SELECT TOP (10000)
        [Username],
        [UserDateTime],
        CONVERT(time, [UserDateTime]) AS [UserTime],
        [Kgs],
        [Remark],
        [TransNo],
        [ItemID],
        [TransDateTime],
        CONVERT(date, [TransDateTime]) AS [TransDate],
        [IpAddr]
      FROM [cp].[dbo].[taLogNew]
    `;

    // Menambahkan filter berdasarkan tanggal jika ada
    if (startDate && !endDate) {
      // Filter untuk pencarian satu tanggal (single date)
      query += ` WHERE CONVERT(date, [UserDateTime]) = @StartDate`;
    } else if (startDate && endDate) {
      // Filter untuk rentang tanggal
      query += ` WHERE [UserDateTime] BETWEEN @StartDate AND @EndDate`;
    }

    query += ` ORDER BY [UserDateTime] DESC`;

    const requestQuery = pool.request();

    // Menambahkan parameter input untuk startDate
    if (startDate) {
      requestQuery.input("StartDate", sql.Date, new Date(startDate)); // Untuk pencarian satu tanggal atau rentang
    }

    if (endDate) {
      requestQuery.input("EndDate", sql.Date, new Date(endDate));
    }

    // Menjalankan query SQL dan mendapatkan hasilnya
    const result = await requestQuery.query<loguserType>(query);

    // Format hasil untuk menampilkan tanggal dan waktu
    const formattedRecords = result.recordset.map((record) => {
      let userDate = "N/A";
      let userTime = "N/A";
      let transDate = "N/A";

      // Pisahkan UserDateTime menjadi tanggal dan waktu jika valid
      if (record.UserDateTime) {
        const userDateTime = new Date(record.UserDateTime);
        if (!isNaN(userDateTime.getTime())) {
          userDate = userDateTime.toISOString().split("T")[0]; // Hanya tanggal
          userTime = userDateTime.toISOString().split("T")[1].split(".")[0]; // Hanya waktu
        }
      }

      // Pisahkan TransDateTime menjadi tanggal jika valid
      if (record.TransDateTime) {
        const transDateTime = new Date(record.TransDateTime);
        if (!isNaN(transDateTime.getTime())) {
          transDate = transDateTime.toISOString().split("T")[0]; // Hanya tanggal
        }
      }

      return {
        ...record,
        UserDate: userDate,
        UserTime: userTime,
        TransDate: transDate,
      };
    });

    // Mengembalikan hasil dalam format JSON
    return NextResponse.json(formattedRecords);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}

