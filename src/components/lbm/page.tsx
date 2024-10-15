"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import { DataTable } from "../data-table";
import { columns } from "./columns"; // Ensure this import is correct
import { LbmType } from "@/lib/types";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import DateRangePicker from "../datarangepicker"; // Ensure this path is correct
import toast from "react-hot-toast";
import Loading from "@/app/loading";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader } from "../ui/card";

const DataLBMPage: React.FC = () => {
  const [data, setData] = useState<LbmType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
   const [searchTerm, setSearchTerm] = useState<string>("");
  const EXCEL_TYPE =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const EXCEL_EXTENSION = ".xlsx";

  const fetchData = async (startDate?: string, endDate?: string) => {
    setLoading(false);
    try {
      const url = new URL("/api/lbm", window.location.origin);
      if (startDate && endDate) {
        url.searchParams.append("startDate", startDate);
        url.searchParams.append("endDate", endDate);
      }
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const result: LbmType[] = await response.json();
      setData(result);
      return Promise.resolve(); // Successfully fetched
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(String(error));
      }
      return Promise.reject(error); // Fetch failed
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const myPromise = fetchData(); // Fetch data without filters on initial load
    toast.promise(myPromise, {
      loading: "Loading...",
      success: "Data fetched successfully!",
      error: "Error fetching data",
    });
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
  }

  const handleRefresh = () => {
   const myPromise = fetchData(); // Fetch data without filters on initial load
   toast.promise(myPromise, {
     loading: "Loading...",
     success: "Data fetched successfully!",
     error: "Error fetching data",
   });
  }
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
    };

    // Filter data based on search term
    const filteredData = data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  if (loading) return <>
    <Loading/>  
    
  </>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex flex-col p-14">
      <Card className="mb-4">
      <CardHeader>
          <DateRangePicker onDateRangeChange={handleDateRangeChange} />

      </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{ marginBottom: "20px", padding: "10px", width: "100%" }}
          />
          <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="mb-4 px-4 py-2 bg-gray-500 text-white rounded-full w-full"
            >
            Refresh Data
          </button>
          <button
            onClick={handleExport}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-full w-full"
            >
            Eksport to Excel
          </button>
            </div>
        </CardContent>
      </Card>
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
};

export default DataLBMPage;
