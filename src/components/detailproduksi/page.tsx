"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import { DataTable } from "../data-table";
import { columns, DataDetailProduksi } from "./columns"; // Ensure this import is correct
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import DateRangePicker from "../datarangepicker"; // Ensure this path is correct
import toast from "react-hot-toast";
import Loading from "@/app/loading";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader } from "../ui/card";
import { RefreshCcw, FileUp } from "lucide-react";
import { Button } from "../ui/button";

const DataDetailProduksiPage: React.FC = () => {
  const [data, setData] = useState<DataDetailProduksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchData = async (startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      const url = new URL("/api/detailproduksi", window.location.origin);
      if (startDate && endDate) {
        url.searchParams.append("startDate", startDate);
        url.searchParams.append("endDate", endDate);
      }
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const result: DataDetailProduksi[] = await response.json();
      setData(result);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : String(error));
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
    XLSX.utils.book_append_sheet(wb, ws, "Data Detail Produksi");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    saveAs(blob, `DataDetailProduksi.xlsx`);
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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Filter data based on search term
  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) return <Loading />;
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
            <Button
              onClick={handleRefresh}
              className="mb-4 px-4 py-2 bg-gray-500 text-white rounded-full w-full"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
            <Button
              onClick={handleExport}
              className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-full w-full"
            >
              <FileUp className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </CardContent>
      </Card>
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
};

export default DataDetailProduksiPage;
