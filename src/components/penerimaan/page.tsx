"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPenerimaanData } from "@/lib/features/penerimaanSlice";
import { RootState, AppDispatch } from "@/lib/store";
import Loading from "@/app/loading";
import { DataTable } from "../data-table";
import { columns } from "./columns";
import { saveAs } from "file-saver";
import DateRangePicker from "../datarangepicker";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "../ui/button";
import { FileUp, RefreshCcw, Search, Calendar, Download, Filter } from "lucide-react";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const useAppDispatch = () => useDispatch<AppDispatch>();

const DataPenerimaanPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useSelector(
    (state: RootState) => state.penerimaan
  );

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateFilterActive, setDateFilterActive] = useState<boolean>(false);
  const [currentFilterInfo, setCurrentFilterInfo] = useState<string>("");
  
  const EXCEL_TYPE =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const EXCEL_EXTENSION = ".xlsx";

  useEffect(() => {
    const myPromise = dispatch(fetchPenerimaanData({}));
    toast.promise(myPromise, {
      loading: "Memuat data...",
      success: "Data berhasil dimuat!",
      error: "Gagal memuat data",
    });
  }, [dispatch]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Penerimaan");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: EXCEL_TYPE });
    saveAs(blob, `DataPenerimaan_${new Date().toISOString().split('T')[0]}${EXCEL_EXTENSION}`);
    toast.success("Data berhasil diekspor ke Excel");
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setDateFilterActive(false);
    setCurrentFilterInfo("");
    const myPromise = dispatch(fetchPenerimaanData({}));
    toast.promise(myPromise, {
      loading: "Memuat ulang data...",
      success: "Data berhasil dimuat ulang!",
      error: "Gagal memuat ulang data",
    });
  };

  const handleDateRangeChange = (
    startDate: string | null,
    endDate: string | null
  ) => {
    if (!startDate || !endDate) {
      toast.error("Pilih rentang tanggal yang valid");
      return;
    }
    
    setDateFilterActive(true);
    const start = new Date(startDate).toLocaleDateString("id-ID");
    const end = new Date(endDate).toLocaleDateString("id-ID");
    setCurrentFilterInfo(`${start} - ${end}`);
    
    console.log("Dispatching fetchPenerimaanData with:", { startDate, endDate });
    const myPromise = dispatch(fetchPenerimaanData({ startDate, endDate }));
    toast.promise(myPromise, {
      loading: "Memfilter data...",
      success: "Filter tanggal berhasil diterapkan",
      error: "Gagal memfilter data",
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

  const totalItems = filteredData.length;
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (loading) return <Loading />;
  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Terjadi kesalahan: {error}</p>
          <Button onClick={handleRefresh} className="mt-4">
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Data Penerimaan Barang</h1>
        <p className="text-muted-foreground">
          Kelola dan pantau seluruh data penerimaan barang Gudang
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{today}</span>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Data</CardTitle>
            <div className="h-4 w-4 rounded-full bg-primary/20" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Data penerimaan barang</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filter Aktif</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {dateFilterActive ? "Rentang Tanggal" : "Tidak Ada"}
            </div>
            {currentFilterInfo && (
              <p className="text-xs text-muted-foreground truncate">
                {currentFilterInfo}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aksi</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleExport} className="flex-1">
                <FileUp className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button size="sm" variant="outline" onClick={handleRefresh} className="flex-1">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Data</CardTitle>
          <CardDescription>
            Filter data berdasarkan tanggal atau kata kunci pencarian
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rentang Tanggal</label>
              <DateRangePicker onDateRangeChange={handleDateRangeChange} />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Pencarian</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari data penerimaan..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-9"
                />
              </div>
              {searchTerm && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {filteredData.length} hasil ditemukan
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="h-6 px-2 text-xs"
                  >
                    Hapus
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Menampilkan {filteredData.length} dari {data.length} data
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reset Filter
              </Button>
              <Button onClick={handleExport}>
                <FileUp className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Data Penerimaan</CardTitle>
              <CardDescription>
                Daftar lengkap data penerimaan barang
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {filteredData.length} Items
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Tidak ada data ditemukan</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                {searchTerm 
                  ? `Tidak ada data yang cocok dengan pencarian "${searchTerm}"`
                  : "Data penerimaan barang kosong atau filter tidak menghasilkan data"}
              </p>
              <Button variant="outline" onClick={handleRefresh} className="mt-4">
                Tampilkan Semua Data
              </Button>
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={filteredData} 
              // className="border rounded-md"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataPenerimaanPage;