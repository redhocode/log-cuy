"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPurchaseData } from "@/lib/features/purchaseSlice";
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
import { 
  FileUp, 
  RefreshCcw, 
  Search, 
  Calendar, 
  Download, 
  Filter,
  ShoppingCart,
  BarChart3,
  Package
} from "lucide-react";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";

const useAppDispatch = () => useDispatch<AppDispatch>();

const DataPurchasePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useSelector((state: RootState) => state.purchase);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateFilterActive, setDateFilterActive] = useState<boolean>(false);
  const [currentFilterInfo, setCurrentFilterInfo] = useState<string>("");
  
  const EXCEL_TYPE =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const EXCEL_EXTENSION = ".xlsx";

  useEffect(() => {
    const myPromise = dispatch(fetchPurchaseData({}));
    toast.promise(myPromise, {
      loading: "Memuat data purchase...",
      success: "Data purchase berhasil dimuat!",
      error: "Gagal memuat data purchase",
    });
  }, [dispatch]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Purchase");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: EXCEL_TYPE });
    saveAs(blob, `DataPurchase_${new Date().toISOString().split('T')[0]}${EXCEL_EXTENSION}`);
    toast.success("Data purchase berhasil diekspor ke Excel");
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setDateFilterActive(false);
    setCurrentFilterInfo("");
    const myPromise = dispatch(fetchPurchaseData({}));
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
    
    console.log("Dispatching fetchPurchaseData with:", { startDate, endDate });
    const myPromise = dispatch(fetchPurchaseData({ startDate, endDate }));
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

  const totalItems = filteredData.length;
  const totalPurchaseAmount = filteredData.reduce((sum, item) => {
    const amount = parseFloat(item.total_harga) || 0;
    return sum + amount;
  }, 0);

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
          <CardTitle className="text-destructive">Error Loading Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Terjadi kesalahan saat memuat data purchase:</p>
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
            <ShoppingCart className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Purchase</h1>
            <p className="text-muted-foreground">
              Kelola dan pantau seluruh data pembelian (purchase order)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{today}</span>
          <Separator orientation="vertical" className="h-4" />
          <Badge variant="outline" className="font-normal">
            {totalItems} Transaksi
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              {searchTerm ? 'Setelah pencarian' : 'Semua transaksi purchase'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nilai Purchase</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
              }).format(totalPurchaseAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total nilai pembelian
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Filter</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="text-lg font-semibold">
                {dateFilterActive ? "Filter Aktif" : "Semua Data"}
              </div>
              {currentFilterInfo && (
                <Badge variant="secondary" className="w-fit">
                  {currentFilterInfo}
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="outline" className="w-fit">
                  Pencarian: {searchTerm}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Kontrol Data</CardTitle>
          <CardDescription>
            Gunakan filter tanggal atau pencarian untuk menemukan data purchase spesifik
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Date Range Picker */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <label className="text-sm font-medium">Filter Berdasarkan Tanggal</label>
              </div>
              <DateRangePicker onDateRangeChange={handleDateRangeChange} />
              {dateFilterActive && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {currentFilterInfo}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateFilterActive(false);
                      setCurrentFilterInfo("");
                      handleRefresh();
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Hapus Filter
                  </Button>
                </div>
              )}
            </div>

            {/* Search */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <label className="text-sm font-medium">Cari Data Purchase</label>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari berdasarkan nomor PO, supplier, atau item..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-9"
                />
              </div>
              {searchTerm && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {filteredData.length} hasil ditemukan
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                  >
                    Bersihkan Pencarian
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="text-sm text-muted-foreground">
              Menampilkan {filteredData.length} dari {data.length} transaksi purchase
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh Data
              </Button>
              <Button
                onClick={handleExport}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <FileUp className="h-4 w-4" />
                Export ke Excel
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
              <CardTitle>Daftar Transaksi Purchase</CardTitle>
              <CardDescription>
                Detail semua transaksi purchase order yang tercatat
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                <Package className="mr-1 h-3 w-3" />
                {filteredData.length} Items
              </Badge>
              <div className="text-sm text-muted-foreground">
                Total: {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0
                }).format(totalPurchaseAmount)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="rounded-full bg-muted p-4">
                <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Tidak ada data purchase ditemukan</h3>
                <p className="text-muted-foreground max-w-md">
                  {searchTerm 
                    ? `Tidak ada transaksi purchase yang cocok dengan pencarian "${searchTerm}"`
                    : dateFilterActive
                    ? "Tidak ada transaksi purchase pada rentang tanggal yang dipilih"
                    : "Belum ada data purchase yang tercatat"}
                </p>
              </div>
              {(searchTerm || dateFilterActive) && (
                <Button onClick={handleRefresh} variant="outline">
                  Tampilkan Semua Data Purchase
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <DataTable 
                  columns={columns} 
                  data={filteredData}
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  Menampilkan {Math.min(filteredData.length, 10)} dari {filteredData.length} baris
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

export default DataPurchasePage;