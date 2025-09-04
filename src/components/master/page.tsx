"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMasterData } from "@/lib/features/masterSlice";
import { RootState, AppDispatch } from "@/lib/store"; // Ensure this path is correct
import Loading from "@/app/loading";
import { DataTable } from "../data-table";
import { columns } from "./columns";
import { saveAs } from "file-saver";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader } from "../ui/card";
// import toast from "react-hot-toast";
import { toast } from "sonner";
import ExcelUploader from "@/components/ExcelUploader";
import ExcelUploader2 from "@/components/ExcelUploader";
import * as XLSX from "xlsx";
import { Button } from "../ui/button";
import { masterType,saldoType } from "@/lib/types";
import { FileUp, RefreshCcw, Search } from "lucide-react";
//import { set } from "date-fns";
// Create a typed version of useDispatch
const useAppDispatch = () => useDispatch<AppDispatch>();
const DataMasterBarangPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useSelector(
    (state: RootState) => state.master
  );
  
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<masterType[]>([]);
  const EXCEL_TYPE =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const EXCEL_EXTENSION = ".xlsx";

  useEffect(() => {
    const myPromise = dispatch(fetchMasterData());
    toast.promise(myPromise, {
      loading: "Loading...",
      success: "Data fetched successfully!",
      error: "Error fetching data",
    });
  }, [dispatch]);
  const handleExport = () => {
      const rowsToExport =
        selectedRows.length > 0 ? selectedRows : filteredData;
      if (rowsToExport.length === 0) {
        toast.error("Please select rows to export");
        return;
      }
     const ws = XLSX.utils.json_to_sheet(rowsToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master Barang");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: EXCEL_TYPE });
    saveAs(blob, `Data Master Barang${EXCEL_EXTENSION}`);
  };
  const handleRefresh = () => {
    const myPromise = dispatch(fetchMasterData()); // Fetch data without filters on initial load
    toast.promise(myPromise, {
      loading: "Loading...",
      success: "Data fetched successfully!",
      error: "Error fetching data",
    });
  };
 

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) return <Loading />;
  if (error) return <div>Error: {error}</div>;
  const handleDataLoaded = (newData: masterType[]) => {
    console.log("Data loaded:", newData);
    // Proses data yang diterima sesuai kebutuhan
  };
  const handleDataLoaded2 = (newData: saldoType[]) => {
    console.log("Data loaded:", newData);
    // Proses data yang diterima sesuai kebutuhan
  };
  return (
    <div className="flex flex-col p-14">
      <h1 className="text-5xl font-bold mb-4 flex justify-end">
        {" "}
        Master Kode Barang
      </h1>
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between">
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
          <ExcelUploader<masterType>
            onDataLoaded={handleDataLoaded}
            apiEndpoint="/api/master"
          />
          <ExcelUploader2<saldoType>
            onDataLoaded={handleDataLoaded2}
            apiEndpoint="/api/master/saldo"
          />
        </CardContent>
      </Card>
      <DataTable
        columns={columns(setSelectedRows, filteredData)}
        data={filteredData}
      />
    </div>
  );
};

export default DataMasterBarangPage;
