"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchReturData } from "@/lib/features/returSlice";
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

import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { 
  FileUp, 
  RefreshCcw, 
  Search, 
  Calendar, 
  Filter,
  Package,
  Download,

  Truck,
  ClipboardCheck,
  Scale
} from "lucide-react";
import { LbmType } from "@/lib/types";

const useAppDispatch = () => useDispatch<AppDispatch>();

const DataReturPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useSelector(
    (state: RootState) => state.retur
  );

  const [selectedRows, setSelectedRows] = useState<LbmType[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateFilterActive, setDateFilterActive] = useState<boolean>(false);
  const [currentFilterInfo, setCurrentFilterInfo] = useState<string>("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  
  const EXCEL_TYPE =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const EXCEL_EXTENSION = ".xlsx";

  // Load data awal
  useEffect(() => {
    const myPromise = dispatch(fetchReturData({}));
    toast.promise(myPromise, {
      loading: "Memuat data Retur...",
      success: "Data Retur berhasil dimuat!",
      error: "Gagal memuat data Retur",
    });
  }, [dispatch]);

  // Update filter info
  useEffect(() => {
    const filters = [];
    
    if (dateFilterActive && startDate && endDate) {
      const start = new Date(startDate).toLocaleDateString("id-ID");
      const end = new Date(endDate).toLocaleDateString("id-ID");
      filters.push(`Tanggal: ${start} - ${end}`);
    }
    
    if (searchTerm) {
      filters.push(`Pencarian: "${searchTerm}"`);
    }
    
    const filterInfo = filters.join(" • ") || "Semua Data";
    setCurrentFilterInfo(filterInfo);
  }, [dateFilterActive, searchTerm, startDate, endDate]);

  const handleExport = () => {
    let rowsToExport = [];

    if (selectedRows.length > 0) {
      rowsToExport = selectedRows;
    } else if (searchTerm) {
      rowsToExport = data.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      rowsToExport = data;
    }

    if (rowsToExport.length === 0) {
      toast.error("Tidak ada data yang dapat diekspor. Silakan pilih baris atau pastikan ada data.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(rowsToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Retur");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: EXCEL_TYPE });

    const fileName = `Data_Retur_${searchTerm ? searchTerm : ''}_${new Date().toISOString().split('T')[0]}${EXCEL_EXTENSION}`;
    saveAs(blob, fileName);
    toast.success(`Data berhasil diekspor: ${rowsToExport.length} baris`);
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setDateFilterActive(false);
    setStartDate(null);
    setEndDate(null);
    const myPromise = dispatch(fetchReturData({}));
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
    setStartDate(startDate);
    setEndDate(endDate);
    
    const myPromise = dispatch(fetchReturData({ startDate, endDate }));
    toast.promise(myPromise, {
      loading: "Menerapkan filter tanggal...",
      success: "Filter tanggal berhasil diterapkan",
      error: "Gagal menerapkan filter",
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

  // Hitung statistik
  const totalItems = data.length;
  const filteredItems = filteredData.length;
  
  // Statistik tambahan berdasarkan field yang mungkin ada di data Retur
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
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Terjadi kesalahan saat memuat data Retur:</p>
          <code className="block p-3 bg-muted rounded-md text-sm">{error}</code>
          <Button onClick={handleRefresh} className="w-full">
            <RefreshCcw className="mr-2 h-4 w-4" />
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
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <Truck className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Retur</h1>
            <p className="text-muted-foreground">
              Kelola dan pantau seluruh data Laporan Barang Masuk (Retur)
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span>{today}</span>
          <Separator orientation="vertical" className="h-4" />
          <Badge variant="outline" className="font-normal">
            {filteredItems} Data
          </Badge>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1">
            <Filter className="h-3 w-3" />
            <span className="truncate max-w-xs">{currentFilterInfo}</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Data</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredItems}</div>
            <p className="text-xs text-muted-foreground">
              {searchTerm ? "Setelah pencarian" : `Dari ${totalItems} data`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan Aktif</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Semua laporan Retur</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Pemeriksaan</CardTitle>
            <Scale className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Data tidak tersedia</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Filter</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="text-lg font-semibold">
                {dateFilterActive || searchTerm ? "Filter Aktif" : "Semua Data"}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {currentFilterInfo}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Kontrol Data</CardTitle>
          <CardDescription>
            Filter data Retur berdasarkan kriteria tertentu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Filter Tanggal */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <label className="text-sm font-medium">Filter Berdasarkan Tanggal</label>
              </div>
              <DateRangePicker onDateRangeChange={handleDateRangeChange} />
              {dateFilterActive && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {startDate && endDate ? 
                      `${new Date(startDate).toLocaleDateString("id-ID")} - ${new Date(endDate).toLocaleDateString("id-ID")}` : 
                      "Tanggal aktif"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateFilterActive(false);
                      setStartDate(null);
                      setEndDate(null);
                      dispatch(fetchReturData({}));
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Hapus Filter
                  </Button>
                </div>
              )}
            </div>

            {/* Info Pencarian */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <label className="text-sm font-medium">Pencarian Data Retur</label>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari berdasarkan nomor Retur, supplier, atau nama barang..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-9 w-full"
                />
              </div>
              {searchTerm && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
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

          {/* Action Buttons */}
          <Separator />
          
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div className="text-sm text-muted-foreground">
              {searchTerm 
                ? `Menampilkan ${filteredItems} dari ${totalItems} data Retur (setelah pencarian)`
                : `Menampilkan ${totalItems} data Retur`
              }
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        
            
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                onClick={handleExport}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <FileUp className="h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Daftar Data Retur</CardTitle>
              <CardDescription>
                Detail semua Laporan Barang Masuk yang tercatat
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {selectedRows.length > 0 && (
                <Badge className="bg-blue-600">
                  {selectedRows.length} baris dipilih
                </Badge>
              )}
              <Badge variant="outline" className="text-sm">
                <Package className="mr-1 h-3 w-3" />
                {filteredData.length} Items
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="rounded-full bg-muted p-4">
                <Truck className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Tidak ada data Retur</h3>
                <p className="text-muted-foreground max-w-md">
                  Data Retur kosong. Coba refresh!!
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRefresh} variant="outline">
                  Refresh Data
                </Button>
            
              </div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="rounded-full bg-muted p-4">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Tidak ada data yang cocok</h3>
                <p className="text-muted-foreground max-w-md">
                  Pencarian {searchTerm} tidak menghasilkan data. Coba kata kunci lain atau reset filter.
                </p>
              </div>
              <Button onClick={() => setSearchTerm("")} variant="outline">
                Hapus Pencarian
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <DataTable 
                  columns={columns(setSelectedRows)} 
                  data={filteredData}
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  {selectedRows.length > 0 
                    ? `${selectedRows.length} baris dipilih dari ${filteredData.length} data`
                    : `Menampilkan ${Math.min(filteredData.length, 10)} dari ${filteredData.length} baris`
                  }
                </div>
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>Data siap di-export</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataReturPage;