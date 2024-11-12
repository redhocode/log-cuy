"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProduksiData } from "@/lib/features/produksiSlice";
import { RootState, AppDispatch } from "@/lib/store";
import Loading from "@/app/loading";
import { toast } from "sonner";
import { FileUp, RefreshCcw, Search } from "lucide-react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import DateRangePicker from "@/components/datarangepicker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { columns } from "@/components/dataproduksi/columns";
import ExcelUploader from "@/components/ExcelUploader";
import {  ProduksiType } from "@/lib/types";

const useAppDispatch = () => useDispatch<AppDispatch>();

const DataProduksiPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useSelector(
    (state: RootState) => state.produksi
  );

  const [searchTerm, setSearchTerm] = useState<string>("");

  const EXCEL_TYPE =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const EXCEL_EXTENSION = ".xlsx";

  useEffect(() => {
    const myPromise = dispatch(fetchProduksiData({}));
    toast.promise(myPromise, {
      loading: "Loading...",
      success: "Data fetched successfully!",
      error: "Error fetching data",
    });
  }, [dispatch]);
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Produksi");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: EXCEL_TYPE });
    saveAs(blob, `Data_Template_Produksi${EXCEL_EXTENSION}`);
  };

  const handleRefresh = () => {
    const myPromise = dispatch(fetchProduksiData({}));
    toast.promise(myPromise, {
      loading: "Loading...",
      success: "Data fetched successfully!",
      error: "Error fetching data",
    });
  };

  // const handleDateRangeChange = (
  //   startDate: string | null,
  //   endDate: string | null
  // ) => {
  //   if (!startDate || !endDate) {
  //     console.log("Both start date and end date must be selected");
  //     return;
  //   }
  //   dispatch(fetchProdHDData({ startDate, endDate }));
  // };

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

  const handleDataLoaded = (newData: ProduksiType[]) => {
    console.log("Data loaded:", newData);
    // Proses data yang diterima sesuai kebutuhan
  };

  return (
    <div className="flex flex-col p-14">
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between">
            {/* <DateRangePicker onDateRangeChange={handleDateRangeChange} /> */}
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
          <ExcelUploader<ProduksiType>
            onDataLoaded={handleDataLoaded}
            apiEndpoint="/api/produksi"
          />
        </CardContent>
      </Card>
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
};

export default DataProduksiPage;
