"use client";

import { useEffect, useState } from "react";
import { DataTable } from "./data-table";
import { columns, DataProduksi } from "./coloums"; // Corrected the import name from 'coloums' to 'columns'
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import DateRangePicker from "./datarangepincker"; // Ensure this path is correct

const DataProduksiPage: React.FC = () => {
  const [data, setData] = useState<DataProduksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const EXCEL_TYPE =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const EXCEL_EXTENSION = ".xlsx";

  const fetchData = async (startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      const url = new URL("/api/produksi", window.location.origin);
      if (startDate && endDate) {
        url.searchParams.append("startDate", startDate);
        url.searchParams.append("endDate", endDate);
      }
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const result: DataProduksi[] = await response.json();
      setData(result);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(String(error));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Fetch data without filters on initial load
  }, []);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Produksi");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: EXCEL_TYPE });
    saveAs(blob, `DataProduksi${EXCEL_EXTENSION}`);
  };

  const handleDateRangeChange = (
    startDate: string | null,
    endDate: string | null
  ) => {
    fetchData(startDate || undefined, endDate || undefined);
  };
    const handleRefresh = () => {
      fetchData(); // Refresh data without filters
    };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 gap-2">
      <DateRangePicker onDateRangeChange={handleDateRangeChange} />
      <button
        onClick={handleRefresh}
        className="mb-4 px-4 py-2 bg-gray-500 text-white rounded"
      >
        Refresh Data
      </button>
      <button
        onClick={handleExport}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Ekspor ke Excel
      </button>
      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default DataProduksiPage;
