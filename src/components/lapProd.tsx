/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx"; // Import SheetJS library
import { DataProduksi2 } from "@/lib/types";

const LapProd = () => {
  const [startDate, setStartDate] = useState<string>("2024-12-01");
  const [endDate, setEndDate] = useState<string>("2024-12-31");
  const [data, setData] = useState<DataProduksi2[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Function to aggregate Kgs for same ItemID and ProdDate
  const aggregateData = (data: DataProduksi2[]) => {
    const aggregatedData: { [key: string]: DataProduksi2 } = {};

    // Aggregating Kgs for the same ItemID and ProdDate
    data.forEach((row) => {
      const key = `${row.ItemID}-${row.DateValue}`;
      if (!aggregatedData[key]) {
        aggregatedData[key] = { ...row };
        aggregatedData[key].Kgs = row.Kgs || 0; // Start with the Kgs value
      } else {
        aggregatedData[key].Kgs += row.Kgs || 0; // Add Kgs for the same ItemID and ProdDate
      }
    });

    // Convert the aggregated data back to an array
    return Object.values(aggregatedData);
  };

  // Fetch data when startDate or endDate changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/lapprod", {
          params: { startDate, endDate },
        });
        const aggregatedData = aggregateData(response.data); // Aggregate data
        setData(aggregatedData);
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  // Function to get unique dates from the data and format them as "YYYY-MM-DD"
  const getUniqueDates = () => {
    const dates = data.map((row) => row.DateValue);
    return Array.from(new Set(dates)).map((date: any) => {
      // Check if the date is a string, if yes, create a Date object
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return dateObj.toISOString().split("T")[0]; // Format to "YYYY-MM-DD"
    });
  };

  // Function to get unique item types
  // const getUniqueItemTypes = () => {
  //   const itemTypes = data.map((row) => row.ItemType);
  //   return Array.from(new Set(itemTypes)); // Get unique ItemTypes
  // };

  // Function to convert data to Excel format
  const exportToExcel = () => {
    const dates = getUniqueDates(); // Get unique dates within the date range (e.g., Dec 2024)

    // Header row for the columns
    const header = [
      "ProdType",
      "ItemID",
      "DeptID",
      "OrderID",
      "Remark",
      ...dates, // Add each unique date as a column
    ];

    // Prepare rows with Kgs data for Bahan and Hasil
    const rows = data.map((row) => {
      const rowData = [
        row.ProdType,
        row.ItemID,
        row.DeptID,
        row.OrderID,
        row.Remark,
        // Add Kgs data under each date column for Bahan and Hasil
        ...dates.map((date) => {
          // If the row matches the date and is a Bahan or Hasil, display the Kgs value
          return row.ItemType === "Bahan" &&
            new Date(row.DateValue).toISOString().split("T")[0] === date
            ? row.Kgs || 0
            : row.ItemType === "Hasil" &&
              new Date(row.DateValue).toISOString().split("T")[0] === date
            ? row.Kgs || 0
            : "";
        }),
      ];
      return rowData;
    });

    // Create worksheet from data
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

    // Apply styling (padding, borders) to the worksheet
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = { r: row, c: col };
        const cell = ws[XLSX.utils.encode_cell(cellAddress)];
        if (cell) {
          // Add padding and borders to each cell
          cell.s = {
            ...cell.s,
            border: {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            },
            alignment: { horizontal: "center", vertical: "center" },
            font: { sz: 12 },
            fill: { fgColor: { rgb: "FFFFFF" } },
          };
        }
      }
    }

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Production Data");

    // Write the Excel file
    XLSX.writeFile(wb, "production_data.xlsx");
  };





  return (
    <div className="container">
      <h1>Production Dashboard</h1>

      {/* Date Range Input */}
      <div className="date-range">
        <label htmlFor="startDate">Start Date: </label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label htmlFor="endDate">End Date: </label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {loading && <p>Loading...</p>}

      {/* Data Table */}
      {!loading && data.length > 0 && (
        <div>
          <button onClick={exportToExcel} style={{ marginBottom: "20px" }}>
            Download Excel
          </button>
          <table className="border-collapse border border-gray-400 table-auto p-5">
            <thead>
              <tr className="m-5 p-5">
                <th className="border border-gray-300 p-5">ProdType</th>
                <th className="border border-gray-300 p-5">ItemID</th>
                <th className="border border-gray-300 p-5">DeptID</th>
                <th className="border border-gray-300 p-5">OrderID</th>
                <th className="border border-gray-300 p-5">Remark</th>
                <th
                  colSpan={getUniqueDates().length}
                  className="border border-gray-300 p-5"
                >
                  Bahan
                </th>
                <th
                  colSpan={getUniqueDates().length}
                  className="border border-gray-300 p-5"
                >
                  Hasil
                </th>
              </tr>
              <tr>
                {/* Empty headers to match the "Bahan" and "Hasil" columns */}
                <th colSpan={5} className="border border-gray-300 p-5"></th>
                {/* Render dates dynamically */}
                {getUniqueDates().map((date, index) => (
                  <th key={index} className="border border-gray-300 p-5">
                    {date}
                  </th>
                ))}
                {/* Same dates for "Hasil" */}
                {getUniqueDates().map((date, index) => (
                  <th key={index} className="border border-gray-300 p-5">
                    {date}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="border border-gray-300 p-5">{row.ProdType}</td>
                  <td className="border border-gray-300 p-5">{row.ItemID}</td>
                  <td className="border border-gray-300 p-5">{row.DeptID}</td>
                  <td className="border border-gray-300 p-5">{row.OrderID}</td>
                  <td className="border border-gray-300 p-5">{row.Remark}</td>

                  {/* Render "Bahan" data under the appropriate date columns */}
                  {getUniqueDates().map((date, index) => (
                    <td key={index} className="border border-gray-300 p-5">
                      {row.ItemType === "Bahan" &&
                      new Date(row.DateValue).toISOString().split("T")[0] ===
                        date
                        ? row.Kgs || 0
                        : ""}
                    </td>
                  ))}

                  {/* Render "Hasil" data under the appropriate date columns */}
                  {getUniqueDates().map((date, index) => (
                    <td key={index} className="border border-gray-300 p-5">
                      {row.ItemType === "Hasil" &&
                      new Date(row.DateValue).toISOString().split("T")[0] ===
                        date
                        ? row.Kgs || 0
                        : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty Data */}
      {!loading && data.length === 0 && <p>No data available for this range</p>}
    </div>
  );
};

export default LapProd;
