"use client";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPurchaseData } from "@/lib/features/purchaseSlice";
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
// Create a typed version of useDispatch
const useAppDispatch = () => useDispatch<AppDispatch>();

const DataPurchasePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useSelector((state: RootState) => state.purchase);

  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const EXCEL_TYPE =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const EXCEL_EXTENSION = ".xlsx";

  useEffect(() => {
    const myPromise = dispatch(fetchPurchaseData({}));
    toast.promise(myPromise, {
      loading: "Loading...",
      success: "Data fetched successfully!",
      error: "Error fetching data",
    });
  }, [dispatch]);
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Mutasi");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: EXCEL_TYPE });
    saveAs(blob, `Data_Mutasi${EXCEL_EXTENSION}`);
  };
  const handleRefresh = () => {
    const myPromise = dispatch(fetchPurchaseData({})); // Fetch data without filters on initial load
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
    console.log("Dispatching fetchProduksiData with:", { startDate, endDate });
    dispatch(fetchPurchaseData({ startDate, endDate }));
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

  return (
    <div className="flex flex-col p-14">
      <h1 className="text-3xl font-bold mb-4">Data Purchase</h1>
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
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
};

export default DataPurchasePage;
