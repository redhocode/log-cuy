"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProduksiData } from "@/lib/features/produksiSlice";
import { RootState, AppDispatch } from "@/lib/store";
import Loading from "@/app/loading";
import { DataTable } from "../data-table";
import { columns } from "./columns";
import { saveAs } from "file-saver";
import DateRangePicker from "../datarangepicker";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { toast } from "sonner";
import { 
  FileUp, 
  RefreshCcw, 
  Search, 
  Calendar, 
  Filter,
  Factory,
  Package,
  Download,
  ExternalLink,
  BarChart3,
  Layers
} from "lucide-react";
import { ProduksiType } from "@/lib/types";
import * as XLSX from "xlsx";
import { Button } from "../ui/button";
import Link from "next/link";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

const useAppDispatch = () => useDispatch<AppDispatch>();

const DataProduksiPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useSelector(
    (state: RootState) => state.produksi
  );
  const [selectedRows, setSelectedRows] = useState<ProduksiType[]>([]);
  const [prodType, setProdType] = useState<string>("");
  const [itemType, setItemType] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateFilterActive, setDateFilterActive] = useState<boolean>(false);
  const [currentFilterInfo, setCurrentFilterInfo] = useState<string>("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  
  const EXCEL_TYPE =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const EXCEL_EXTENSION = ".xlsx";

  // Fungsi untuk mendapatkan parameter API
  const getApiParams = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {};
    
    if (prodType && prodType !== "all") {
      params.prodType = prodType;
    }
    
    if (itemType && itemType !== "all") {
      params.itemType = itemType;
    }
    
    if (startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    }
    
    return params;
  };

  // Fungsi untuk membangun string informasi filter aktif
  const buildFilterInfo = () => {
    const filters = [];
    
    if (prodType && prodType !== "all") {
      const prodTypeLabels: { [key: string]: string } = {
        "AS": "Assembly",
        "IN": "Injeksi", 
        "MO": "Molding",
        "SP": "Spray",
        "PL": "Platting"
      };
      filters.push(`Departemen: ${prodTypeLabels[prodType] || prodType}`);
    }
    
    if (itemType && itemType !== "all") {
      filters.push(itemType === "B" ? "Bahan Produksi" : "Hasil Produksi");
    }
    
    if (dateFilterActive && startDate && endDate) {
      const start = new Date(startDate).toLocaleDateString("id-ID");
      const end = new Date(endDate).toLocaleDateString("id-ID");
      filters.push(`Tanggal: ${start} - ${end}`);
    }
    
    if (searchTerm) {
      filters.push(`Pencarian: "${searchTerm}"`);
    }
    
    return filters.join(" • ") || "Semua Data";
  };

  // Load data awal (tanpa filter)
  useEffect(() => {
    const myPromise = dispatch(fetchProduksiData({}));
    toast.promise(myPromise, {
      loading: "Memuat data produksi...",
      success: "Data produksi berhasil dimuat!",
      error: "Gagal memuat data produksi",
    });
  }, [dispatch]);

  // Update filter info ketika filter berubah
  useEffect(() => {
    const filterInfo = buildFilterInfo();
    setCurrentFilterInfo(filterInfo);
  }, [prodType, itemType, dateFilterActive, searchTerm, startDate, endDate]);

  // Fetch data ketika filter berubah (kecuali searchTerm)
  useEffect(() => {
    if (!loading) {
      const apiParams = getApiParams();
      const myPromise = dispatch(fetchProduksiData(apiParams));
      toast.promise(myPromise, {
        loading: "Memfilter data...",
        success: "Filter berhasil diterapkan!",
        error: "Gagal menerapkan filter",
      });
    }
  }, [dispatch, prodType, itemType, startDate, endDate]);

  // Debug: Log data when it changes
  useEffect(() => {
    if (data.length > 0) {
      console.log("=== DEBUG DATA PRODUKSI ===");
      console.log("Data received from API:", data);
      console.log("Sample item:", data[0]);
      console.log("Sample ItemType:", data[0]?.ItemType);
      
      // Check all possible ItemType values - FIXED VERSION
      const itemTypesMap: {[key: string]: number} = {};
      data.forEach(item => {
        const type = item.ItemType;
        if (type !== undefined && type !== null) {
          itemTypesMap[type] = (itemTypesMap[type] || 0) + 1;
        }
      });
      console.log("ItemType distribution:", itemTypesMap);
      
      // Count specific values
      const bahanCount = data.filter(item => item.ItemType === "B").length;
      const hasilCount = data.filter(item => item.ItemType === "H").length;
      const bahanLowerCount = data.filter(item => item.ItemType === "b").length;
      const hasilLowerCount = data.filter(item => item.ItemType === "h").length;
      
      console.log("Bahan count (B):", bahanCount);
      console.log("Hasil count (H):", hasilCount);
      console.log("Bahan count (b):", bahanLowerCount);
      console.log("Hasil count (h):", hasilLowerCount);
      console.log("Total count:", data.length);
      console.log("=== END DEBUG ===");
    }
  }, [data]);

  const handleExport = () => {
    let rowsToExport = [];

    // Gunakan data yang sudah difilter dari Redux state
    if (selectedRows.length > 0) {
      rowsToExport = selectedRows;
    } else if (searchTerm) {
      // Filter tambahan untuk pencarian client-side
      rowsToExport = data.filter(
        (item) =>
          item.ItemID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.OrderID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.Remark?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.NoRator !== null &&
            item.NoRator !== undefined &&
            String(item.NoRator).toLowerCase().includes(searchTerm.toLowerCase())) ||
          item.ProdID?.toLowerCase().includes(searchTerm.toLowerCase())
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
    XLSX.utils.book_append_sheet(wb, ws, "Data Produksi");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: EXCEL_TYPE });

    const fileName = `Data_Produksi_${searchTerm ? searchTerm : ''}_${new Date().toISOString().split('T')[0]}${EXCEL_EXTENSION}`;
    saveAs(blob, fileName);
    toast.success(`Data berhasil diekspor: ${rowsToExport.length} baris`);
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setProdType("all");
    setItemType("all");
    setDateFilterActive(false);
    setStartDate(null);
    setEndDate(null);
    const myPromise = dispatch(fetchProduksiData({}));
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
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Filter data untuk pencarian client-side saja
  const filteredData = data.filter((item: ProduksiType) => {
    if (!searchTerm) return true;
    
    return (
      item.ItemID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.OrderID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.Remark?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.NoRator !== null &&
        item.NoRator !== undefined &&
        String(item.NoRator).toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.ProdID?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // PERBAIKAN: Hitung statistik dengan cara yang lebih sederhana dan jelas
  const totalItems = data.length;
  const filteredItems = filteredData.length;
  
  // Hitung statistik dengan console log untuk debugging
  const calculateStats = () => {
    console.log("=== CALCULATING STATS ===");
    
    // Mencoba berbagai kemungkinan field name untuk ItemType
    const bahanCount = data.filter(item => {
      // Cek semua kemungkinan field name dan nilai
      const itemTypeValue = item.ItemType || item.ItemType || item.type;
      return itemTypeValue === "B" || itemTypeValue === "b" || itemTypeValue === "BP" || itemTypeValue === "Bahan";
    }).length;
    
    const hasilCount = data.filter(item => {
      const itemTypeValue = item.ItemType || item.ItemType || item.type;
      return itemTypeValue === "H" || itemTypeValue === "h" || itemTypeValue === "HP" || itemTypeValue === "Hasil";
    }).length;
    
    console.log("Bahan count calculated:", bahanCount);
    console.log("Hasil count calculated:", hasilCount);
    console.log("=== END STATS CALC ===");
    
    return { bahanCount, hasilCount };
  };

  const { bahanCount, hasilCount } = calculateStats();
  
  // Data yang ditampilkan setelah pencarian client-side
  const displayedBahan = filteredData.filter(item => {
    const itemTypeValue = item.ItemType || item.ItemType || item.type;
    return itemTypeValue === "B" || itemTypeValue === "b" || itemTypeValue === "BP" || itemTypeValue === "Bahan";
  }).length;
  
  const displayedHasil = filteredData.filter(item => {
    const itemTypeValue = item.ItemType || item.ItemType || item.type;
    return itemTypeValue === "H" || itemTypeValue === "h" || itemTypeValue === "HP" || itemTypeValue === "Hasil";
  }).length;
  
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
          <p className="text-muted-foreground">Terjadi kesalahan saat memuat data produksi:</p>
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
            <Factory className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Produksi</h1>
            <p className="text-muted-foreground">
              Kelola dan pantau seluruh data produksi pabrik
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

      {/* Stats Overview - PERBAIKAN DI SINI */}
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
            <CardTitle className="text-sm font-medium">Bahan Produksi</CardTitle>
            <Layers className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayedBahan}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {searchTerm ? "Setelah pencarian" : `Total: ${bahanCount}`}
              </p>
              {displayedBahan > 0 && (
                <Badge variant="outline" className="text-xs">
                  BP
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hasil Produksi</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayedHasil}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {searchTerm ? "Setelah pencarian" : `Total: ${hasilCount}`}
              </p>
              {displayedHasil > 0 && (
                <Badge variant="outline" className="text-xs">
                  HP
                </Badge>
              )}
            </div>
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
                {(prodType && prodType !== "all") || (itemType && itemType !== "all") || dateFilterActive || searchTerm ? "Filter Aktif" : "Semua Data"}
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
            Filter data produksi berdasarkan kriteria tertentu
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
                      // Fetch data tanpa filter tanggal
                      const apiParams = getApiParams();
                      delete apiParams.startDate;
                      delete apiParams.endDate;
                      dispatch(fetchProduksiData(apiParams));
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Hapus Filter
                  </Button>
                </div>
              )}
            </div>

            {/* Filter Departemen & Type */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Departemen</label>
                  <Select 
                    value={prodType || "all"} 
                    onValueChange={(value) => setProdType(value === "all" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Departemen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Departemen</SelectItem>
                      <SelectItem value="AS">Assembly</SelectItem>
                      <SelectItem value="IN">Injeksi</SelectItem>
                      <SelectItem value="MO">Molding</SelectItem>
                      <SelectItem value="SP">Spray</SelectItem>
                      <SelectItem value="PL">Platting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Type Produksi</label>
                  <Select 
                    value={itemType || "all"} 
                    onValueChange={(value) => setItemType(value === "all" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Type</SelectItem>
                      <SelectItem value="B">Bahan Produksi (BP)</SelectItem>
                      <SelectItem value="H">Hasil Produksi (HP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tabs untuk filter cepat */}
              <div className="pt-2">
                <Tabs 
                  defaultValue="all" 
                  value={itemType || "all"} 
                  onValueChange={(value) => setItemType(value === "all" ? "" : value)}
                >
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="all">Semua</TabsTrigger>
                    <TabsTrigger value="B">Bahan Produksi</TabsTrigger>
                    <TabsTrigger value="H">Hasil Produksi</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Pencarian dan Action Buttons */}
          <Separator />
          
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="w-full md:w-auto space-y-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <label className="text-sm font-medium">Cari Data Produksi</label>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari berdasarkan ItemID, OrderID, atau Remark..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-9 w-full md:w-[300px]"
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

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                className="gap-2"
                asChild
              >
                <Link href="https://kiiw.citiplumb.id" target="_blank">
                  <ExternalLink className="h-4 w-4" />
                  Export ke ERP
                </Link>
              </Button>
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

          {/* Info Filter */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {searchTerm 
                ? `Menampilkan ${filteredItems} dari ${totalItems} data produksi (setelah pencarian)`
                : `Menampilkan ${totalItems} data produksi`
              }
            </div>
            {(prodType || itemType || dateFilterActive || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="gap-1"
              >
                <RefreshCcw className="h-3 w-3" />
                Reset Semua Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Daftar Data Produksi</CardTitle>
              <CardDescription>
                Detail semua transaksi produksi yang tercatat
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {selectedRows.length > 0 && (
                <Badge className="bg-blue-600">
                  {selectedRows.length} baris dipilih
                </Badge>
              )}
              <div className="flex items-center gap-2">
                <Badge variant={itemType === "B" ? "default" : "outline"} className="bg-blue-600">
                  <Layers className="mr-1 h-3 w-3" />
                  {displayedBahan} BP
                </Badge>
                <Badge variant={itemType === "H" ? "default" : "outline"} className="bg-green-600">
                  <BarChart3 className="mr-1 h-3 w-3" />
                  {displayedHasil} HP
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="rounded-full bg-muted p-4">
                <Factory className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Tidak ada data produksi</h3>
                <p className="text-muted-foreground max-w-md">
                  Data produksi kosong. Coba refresh atau periksa koneksi server.
                </p>
              </div>
              <Button onClick={handleRefresh} variant="outline">
                Refresh Data
              </Button>
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

export default DataProduksiPage;