"use client";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProduksiData } from "@/lib/features/produksiSlice";
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
import { FileUp, RefreshCcw, Search } from "lucide-react";
import { ProduksiType } from "@/lib/types";
import * as XLSX from "xlsx";
import { Button } from "../ui/button";
// import ChartComponent from "../chartexp";
// Create a typed version of useDispatch
const useAppDispatch = () => useDispatch<AppDispatch>();

const DataProduksiPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useSelector(
    (state: RootState) => state.produksi
  );
   const [selectedRows, setSelectedRows] = React.useState<ProduksiType[]>([]);
   const [searchTermRemark, setSearchTermRemark] = React.useState<string>("");
   const [prodType, setProdType] = React.useState<string>("");
   const [itemType, setitemType] = React.useState<string>("");
  const [searchTerm, setSearchTerm] = React.useState<string>("");
   const EXCEL_TYPE =
     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
   const EXCEL_EXTENSION = ".xlsx";

  useEffect(() => {
    const myPromise = dispatch(
      fetchProduksiData({prodType, itemType
      })
    );
    toast.promise(myPromise, {
      loading: "Loading...",
      success: "Data fetched successfully!",
      error: "Error fetching data",
    });
  }, [dispatch, prodType, itemType]);
  const handleExport = () => {
 const rowsToExport = selectedRows.length > 0 ? selectedRows : data;
 if (rowsToExport.length === 0) {
   toast.error("Please select rows to export");
   return;
 }

 const ws = XLSX.utils.json_to_sheet(rowsToExport); 
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Produksi");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: EXCEL_TYPE });
    saveAs(blob, `Data_Produksi${EXCEL_EXTENSION}`);
  };
    const handleRefresh = () => {
      const myPromise = dispatch(fetchProduksiData({})); // Fetch data without filters on initial load
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
    console.log("Dispatching fetchProduksiData with:", { startDate, endDate, prodType, itemType });
    dispatch(fetchProduksiData({ startDate, endDate, prodType, itemType }));
  };

const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setSearchTerm(event.target.value);
};

const handleRemarkSearchChange = (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  setSearchTermRemark(event.target.value);
};
const handleProdTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  setProdType(event.target.value);
};
const handleItemTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  setitemType(event.target.value);
}
const filteredData = data.filter((item) => {
  // Pencarian umum untuk semua kolom
  const matchesGeneralSearch = Object.values(item).some((value) =>
    String(value).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pencarian berdasarkan Remark
  const matchesRemarkSearch = item.Remark
    ? item.Remark.toLowerCase().includes(searchTermRemark.toLowerCase())
    : true; // jika tidak ada Remark, anggap cocok

  // Return data yang memenuhi kedua kriteria pencarian
  return matchesGeneralSearch && matchesRemarkSearch;
});


  if (loading) return <Loading />;
  if (error) return <div>Error: {error}</div>;
  // const chartData = data.map((item) => ({
  //   month: item.HeaderProdDate,
  //   bahan: item.Bags, // Ganti sesuai field di database
  //   hasil: item.Kgs, // Ganti sesuai field di database
  // }));
  return (
    <div className="flex flex-col p-14">
      <h1 className="text-5xl font-bold mb-4 flex justify-end">
        {" "}
        Data Produksi
      </h1>
      <Card className="mb-4">
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
              <div className="mt-3 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  onChange={handleRemarkSearchChange}
                  value={searchTermRemark}
                  placeholder="Search by No Rator"
                  className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                />
              </div>
            </form>
          </div>
          <select
            value={prodType}
            onChange={handleProdTypeChange}
            className="border p-2 rounded-md"
          >
            <option value="">-- Pilih Type --</option>
            <option value="AS">Assembly</option>
            <option value="IN">Injeksi</option>
            <option value="MO">Molding</option>
            <option value="SP">Spray</option>
            <option value="PL">Platting</option>
            {/* Add other RefType options as needed */}
          </select>
          <select
            value={itemType}
            onChange={handleItemTypeChange}
            className="border p-2 rounded-md"
          >
            <option value="">-- Type Produksi --</option>
            <option value="B">Bahan</option>
            <option value="H">Hasil</option>
            {/* Add other RefType options as needed */}
          </select>
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
  );
};

export default DataProduksiPage;
