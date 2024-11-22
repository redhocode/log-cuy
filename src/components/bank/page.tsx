"use client";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBankData } from "@/lib/features/bankSlice";
import { RootState, AppDispatch } from "@/lib/store"; // Ensure this path is correct
import Loading from "@/app/loading";
import { DataTable } from "../data-table";
import { columns } from "./columns";
import { saveAs } from "file-saver";
import DateRangePicker from "../datarangepicker";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader } from "../ui/card";
// import toast from "react-hot-toast";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "../ui/button";
import { FileUp, RefreshCcw, Search } from "lucide-react";
// import BackButton from "../back-button";
// Create a typed version of useDispatch
import { kasType } from "@/lib/types";
const useAppDispatch = () => useDispatch<AppDispatch>();

const DataBankPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useSelector(
    (state: RootState) => state.bank
  );
  const [selectedRows, setSelectedRows] = React.useState<kasType[]>([]);
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [refType, setRefType] = React.useState<string>("");
  const EXCEL_TYPE =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const EXCEL_EXTENSION = ".xlsx";

  useEffect(() => {
    const myPromise = dispatch(fetchBankData({ refType }));
    toast.promise(myPromise, {
      loading: "Loading...",
      success: "Data fetched successfully!",
      error: "Error fetching data",
    });
  }, [dispatch, refType]);
  const handleExport = () => {
     const rowsToExport = selectedRows.length > 0 ? selectedRows : data;
     if (rowsToExport.length === 0) {
       toast.error("Please select rows to export");
       return;
     }
     const ws = XLSX.utils.json_to_sheet(rowsToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Bank");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: EXCEL_TYPE });
    saveAs(blob, `Data_Bank${EXCEL_EXTENSION}`);
  };
  const handleRefresh = () => {
    const myPromise = dispatch(fetchBankData({})); // Fetch data without filters on initial load
    toast.promise(myPromise, {
      loading: "Loading...",
      success: "Data fetched successfully!",
      error: "Error fetching data",
    });
  };
  const handleDateRangeChange = (
    startDate: string | null,
    endDate: string | null
  ) => {
    if (!startDate || !endDate) {
      console.log("Both start date and end date must be selected");
      return; // Mungkin beri tahu pengguna
    }
    console.log("Dispatching fetchData with:", { startDate, endDate });
    dispatch(fetchBankData({ startDate, endDate }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  const handleRefTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRefType(event.target.value); // Update refType state
  };
  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) return <Loading />;
  if (error) return <div>Error: {error}</div>;

  return (
    <>
      <div className="flex flex-col p-14 justify-center">
        <h1 className="text-5xl font-bold mb-4 flex justify-end"> Data Bank</h1>
        <Card className="mb-4">
          <CardHeader>
            <CardHeader>
              <div className="flex justify-between">
                <DateRangePicker onDateRangeChange={handleDateRangeChange} />
                <form className="ml-auto flex-1 sm:flex-initial">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      onChange={handleSearchChange}
                      value={searchTerm}
                      placeholder="Search data"
                      className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                    />
                  </div>
                </form>
              </div>
              <select
                value={refType}
                onChange={handleRefTypeChange}
                className="border p-2 rounded-md"
              >
                <option value="">-- Pilih Type --</option>
                <option value="BK">Bank Keluar</option>
                <option value="BM">Bank Masuk</option>
                {/* Add other RefType options as needed */}
              </select>
            </CardHeader>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                className="mb-4 px-6 py-6 bg-gray-500 text-white rounded-full w-full"
              >
                <RefreshCcw className="h-6 w-6 mr-3" />
                Refresh Data
              </Button>
              <Button
                onClick={handleExport}
                className="mb-4 px-6 py-6 bg-green-500 text-white rounded-full w-full"
              >
                <FileUp className="h-6 w-6 mr-3" />
                Eksport to Excel
              </Button>
            </div>
          </CardContent>
        </Card>
        <DataTable columns={columns(setSelectedRows)} data={filteredData} />
      </div>
    </>
  );
};

export default DataBankPage;
