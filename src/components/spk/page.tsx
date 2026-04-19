"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSpkData, updateSpkStatus, bulkUpdateSpkStatus } from "@/lib/features/spkSlice";
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
  FileText,
  Package,
  Download,
  CheckCircle,
  Clock,
  CheckSquare,
  XSquare,
  ListFilter,
  Eye,
  Building2,
  X
} from "lucide-react";
import { Spktype } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const useAppDispatch = () => useDispatch<AppDispatch>();

type StatusFilter = 'all' | 'completed' | 'pending';

const DataSpkPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useSelector(
    (state: RootState) => state.spk
  );
  const [selectedRows, setSelectedRows] = useState<Spktype[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateFilterActive, setDateFilterActive] = useState<boolean>(false);
  const [currentFilterInfo, setCurrentFilterInfo] = useState<string>("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [departemenFilter, setDepartemenFilter] = useState<string>("all");
  
  // Dialog states
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [pendingCompleteSpk, setPendingCompleteSpk] = useState<Spktype | null>(null);
  const [bulkCompleteDialogOpen, setBulkCompleteDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'complete' | 'incomplete' | null>(null);
  
  const EXCEL_TYPE =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const EXCEL_EXTENSION = ".xlsx";

  // Get unique departemen for filter
  const uniqueDepartemen = useMemo(() => {
    const deptSet = new Set<string>();
    data.forEach(item => {
      if (item.Departemen && item.Departemen !== "") {
        deptSet.add(item.Departemen);
      }
    });
    return Array.from(deptSet).sort();
  }, [data]);

  // Load data awal
  useEffect(() => {
    const myPromise = dispatch(fetchSpkData({}));
    toast.promise(myPromise, {
      loading: "Memuat data SPK...",
      success: "Data SPK berhasil dimuat!",
      error: "Gagal memuat data SPK",
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
    
    if (statusFilter !== 'all') {
      filters.push(statusFilter === 'completed' ? 'Status: Selesai' : 'Status: Belum Selesai');
    }
    
    if (departemenFilter !== 'all') {
      filters.push(`Departemen: ${departemenFilter}`);
    }
    
    const filterInfo = filters.join(" • ") || "Semua Data";
    setCurrentFilterInfo(filterInfo);
  }, [dateFilterActive, searchTerm, startDate, endDate, statusFilter, departemenFilter]);

  // Handle toggle complete single SPK
  const handleToggleComplete = (spk: Spktype) => {
    setPendingCompleteSpk(spk);
    setCompleteDialogOpen(true);
  };

  const confirmToggleComplete = async () => {
    if (!pendingCompleteSpk) return;
    
    setIsUpdating(true);
    const newStatus = !pendingCompleteSpk.Completed;
    const action = newStatus ? "menyelesaikan" : "membatalkan";
    
    try {
      await dispatch(updateSpkStatus({
        No_SPK: pendingCompleteSpk.No_SPK,
        Completed: newStatus
      })).unwrap();
      
      toast.success(`Berhasil ${action} SPK: ${pendingCompleteSpk.No_SPK}`);
      setCompleteDialogOpen(false);
      setPendingCompleteSpk(null);
      
      // Refresh data
      await dispatch(fetchSpkData({}));
    } catch (error) {
      toast.error(`Gagal ${action} SPK`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle bulk complete
  const handleBulkComplete = (action: 'complete' | 'incomplete') => {
    if (selectedRows.length === 0) {
      toast.error("Pilih minimal satu SPK terlebih dahulu");
      return;
    }
    setBulkAction(action);
    setBulkCompleteDialogOpen(true);
  };

  const confirmBulkComplete = async () => {
    if (selectedRows.length === 0) return;
    
    setIsUpdating(true);
    const newStatus = bulkAction === 'complete';
    const actionText = newStatus ? "menyelesaikan" : "membatalkan";
    
    try {
      const spkList = selectedRows.map(row => row.No_SPK);
      await dispatch(bulkUpdateSpkStatus({
        spkList,
        Completed: newStatus
      })).unwrap();
      
      toast.success(`Berhasil ${actionText} ${selectedRows.length} SPK`);
      setBulkCompleteDialogOpen(false);
      setSelectedRows([]);
      setBulkAction(null);
      
      // Refresh data
      await dispatch(fetchSpkData({}));
    } catch (error) {
      toast.error(`Gagal ${actionText} SPK`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExport = () => {
    let rowsToExport = [];

    if (selectedRows.length > 0) {
      rowsToExport = selectedRows;
    } else if (searchTerm || statusFilter !== 'all' || departemenFilter !== 'all') {
      rowsToExport = filteredData;
    } else {
      rowsToExport = data;
    }

    if (rowsToExport.length === 0) {
      toast.error("Tidak ada data yang dapat diekspor");
      return;
    }

    // Prepare data for export
    const exportData = rowsToExport.map(item => ({
      "No SPK": item.No_SPK,
      "Tanggal Order": item.Tanggal_Order,
      "Nama PO": item.Nama_PO,
      "Departemen": item.Departemen,
      "Status": item.Completed ? "Selesai" : "Dalam Proses",
      "Tanggal Selesai": item.FinishedDate ? new Date(item.FinishedDate).toLocaleDateString("id-ID") : "-"
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data SPK");

    ws['!cols'] = [
      { wch: 15 }, // No SPK
      { wch: 12 }, // Tanggal Order
      { wch: 40 }, // Nama PO
      { wch: 15 }, // Departemen
      { wch: 12 }, // Status
      { wch: 15 }, // Tanggal Selesai
    ];

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: EXCEL_TYPE });

    const statusText = statusFilter === 'completed' ? 'Selesai' : statusFilter === 'pending' ? 'BelumSelesai' : 'All';
    const deptText = departemenFilter !== 'all' ? departemenFilter : '';
    const fileName = `Data_SPK_${statusText}${deptText ? `_${deptText}` : ''}_${searchTerm ? searchTerm : ''}_${new Date().toISOString().split('T')[0]}${EXCEL_EXTENSION}`;
    saveAs(blob, fileName);
    toast.success(`Data berhasil diekspor: ${rowsToExport.length} baris`);
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setDateFilterActive(false);
    setStartDate(null);
    setEndDate(null);
    setStatusFilter('all');
    setDepartemenFilter('all');
    setSelectedRows([]);
    const myPromise = dispatch(fetchSpkData({}));
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
    
    const myPromise = dispatch(fetchSpkData({ startDate, endDate }));
    toast.promise(myPromise, {
      loading: "Menerapkan filter tanggal...",
      success: "Filter tanggal berhasil diterapkan",
      error: "Gagal menerapkan filter",
    });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Apply filters: search + status + departemen
  const filteredData = data.filter((item) => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'completed') {
      matchesStatus = item.Completed === true;
    } else if (statusFilter === 'pending') {
      matchesStatus = item.Completed !== true;
    }
    
    // Departemen filter
    let matchesDepartemen = true;
    if (departemenFilter !== 'all') {
      matchesDepartemen = item.Departemen === departemenFilter;
    }
    
    return matchesSearch && matchesStatus && matchesDepartemen;
  });

  // Hitung statistik
  const totalItems = data.length;
  const filteredItems = filteredData.length;
  const completedItems = data.filter(item => item.Completed === true).length;
  const pendingItems = totalItems - completedItems;
  
  // Statistik per departemen
  const deptStats = useMemo(() => {
    const stats: Record<string, { total: number; completed: number; pending: number }> = {};
    data.forEach(item => {
      const dept = item.Departemen || "Unknown";
      if (!stats[dept]) {
        stats[dept] = { total: 0, completed: 0, pending: 0 };
      }
      stats[dept].total++;
      if (item.Completed) {
        stats[dept].completed++;
      } else {
        stats[dept].pending++;
      }
    });
    return stats;
  }, [data]);
  
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
          <p className="text-muted-foreground">Terjadi kesalahan saat memuat data SPK:</p>
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
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data SPK</h1>
            <p className="text-muted-foreground">
              Kelola dan pantau seluruh Surat Perintah Kerja (SPK)
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
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
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'completed' ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedItems}</div>
            <p className="text-xs text-muted-foreground">SPK sudah selesai</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'pending' ? 'ring-2 ring-yellow-500 bg-yellow-50' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dalam Proses</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingItems}</div>
            <p className="text-xs text-muted-foreground">SPK belum selesai</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Filter</CardTitle>
            <ListFilter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="text-lg font-semibold">
                {statusFilter === 'all' ? 'Semua Data' : statusFilter === 'completed' ? '✅ Selesai' : '🔄 Dalam Proses'}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                Klik card untuk filter
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departemen</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="text-lg font-semibold">
                {departemenFilter === 'all' ? 'Semua Dept' : departemenFilter}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {uniqueDepartemen.length} Departemen
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filter Aktif</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="text-lg font-semibold">
                {dateFilterActive || searchTerm || statusFilter !== 'all' || departemenFilter !== 'all' ? "Aktif" : "Tidak Ada"}
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
            Filter data SPK berdasarkan kriteria tertentu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Filter Tanggal */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <label className="text-sm font-medium">Filter Tanggal Order</label>
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
                      dispatch(fetchSpkData({}));
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Hapus Filter
                  </Button>
                </div>
              )}
            </div>

            {/* Filter Status */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ListFilter className="h-4 w-4" />
                <label className="text-sm font-medium">Filter Status</label>
              </div>
              <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📋 Semua Data</SelectItem>
                  <SelectItem value="completed">✅ Selesai</SelectItem>
                  <SelectItem value="pending">🔄 Dalam Proses / Belum Selesai</SelectItem>
                </SelectContent>
              </Select>
              {statusFilter !== 'all' && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {statusFilter === 'completed' ? 'Menampilkan SPK Selesai' : 'Menampilkan SPK Belum Selesai'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                    className="h-6 px-2 text-xs"
                  >
                    Hapus Filter
                  </Button>
                </div>
              )}
            </div>

            {/* Filter Departemen */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <label className="text-sm font-medium">Filter Departemen</label>
              </div>
              <Select value={departemenFilter} onValueChange={setDepartemenFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih departemen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🏢 Semua Departemen</SelectItem>
                  {uniqueDepartemen.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{dept}</span>
                        <Badge variant="outline" className="text-xs">
                          {deptStats[dept]?.total || 0}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {departemenFilter !== 'all' && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Departemen: {departemenFilter}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDepartemenFilter('all')}
                    className="h-6 px-2 text-xs"
                  >
                    Hapus Filter
                  </Button>
                </div>
              )}
            </div>

            {/* Pencarian */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <label className="text-sm font-medium">Pencarian Data SPK</label>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari No SPK, Nama PO, atau Departemen..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-9 w-full"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              {searchTerm && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {filteredData.length} hasil ditemukan
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {(statusFilter !== 'all' || departemenFilter !== 'all' || searchTerm || dateFilterActive) && (
            <div className="flex flex-wrap gap-2 items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Filter Aktif:</span>
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {statusFilter === 'completed' ? '✅ Selesai' : '🔄 Belum Selesai'}
                  <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {departemenFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  🏢 {departemenFilter}
                  <button onClick={() => setDepartemenFilter('all')} className="ml-1 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  🔍 {searchTerm}
                  <button onClick={() => setSearchTerm("")} className="ml-1 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {dateFilterActive && (
                <Badge variant="secondary" className="gap-1">
                  📅 {startDate && endDate ? `${new Date(startDate).toLocaleDateString("id-ID")} - ${new Date(endDate).toLocaleDateString("id-ID")}` : 'Tanggal'}
                  <button onClick={() => {
                    setDateFilterActive(false);
                    setStartDate(null);
                    setEndDate(null);
                    dispatch(fetchSpkData({}));
                  }} className="ml-1 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="h-6 px-2 text-xs ml-auto"
              >
                Reset Semua
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <Separator />
          
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div className="text-sm text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || departemenFilter !== 'all' || dateFilterActive
                ? `Menampilkan ${filteredItems} dari ${totalItems} data SPK (setelah filter)`
                : `Menampilkan ${totalItems} data SPK`
              }
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* Bulk Actions */}
              {selectedRows.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkComplete('complete')}
                    className="gap-2 border-green-500 text-green-600 hover:bg-green-50"
                    disabled={isUpdating}
                  >
                    <CheckSquare className="h-4 w-4" />
                    Tandai Selesai ({selectedRows.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkComplete('incomplete')}
                    className="gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                    disabled={isUpdating}
                  >
                    <XSquare className="h-4 w-4" />
                    Batalkan ({selectedRows.length})
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="gap-2"
                disabled={isUpdating}
              >
                <RefreshCcw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
                Reset Semua Filter
              </Button>
              <Button
                onClick={handleExport}
                className="gap-2 bg-green-600 hover:bg-green-700"
                disabled={isUpdating}
              >
                <Download className="h-4 w-4" />
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
              <CardTitle>Daftar Data SPK</CardTitle>
              <CardDescription>
                Detail semua Surat Perintah Kerja yang tercatat
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
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Tidak ada data SPK</h3>
                <p className="text-muted-foreground max-w-md">
                  Data SPK kosong. Silakan upload data atau refresh.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCcw className="mr-2 h-4 w-4" />
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
                  {searchTerm && `Pencarian "${searchTerm}" `}
                  {statusFilter !== 'all' && `dengan status ${statusFilter === 'completed' ? 'Selesai' : 'Belum Selesai'} `}
                  {departemenFilter !== 'all' && `di departemen ${departemenFilter} `}
                  tidak menghasilkan data. Coba kata kunci lain atau reset filter.
                </p>
              </div>
              <Button onClick={handleRefresh} variant="outline">
                Reset Semua Filter
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <DataTable 
                  columns={columns(setSelectedRows, handleToggleComplete)} 
                  data={filteredData}
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  {selectedRows.length > 0 
                    ? `${selectedRows.length} baris dipilih dari ${filteredData.length} data`
                    : `Menampilkan ${filteredData.length} dari ${totalItems} total data`
                  }
                </div>
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>Klik Export Excel untuk download data</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog Single */}
      <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingCompleteSpk?.Completed ? "Batalkan Status Selesai?" : "Tandai SPK sebagai Selesai?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingCompleteSpk?.Completed 
                ? `Apakah Anda yakin ingin membatalkan status selesai untuk SPK: ${pendingCompleteSpk?.No_SPK}?
                   Tanggal selesai akan dihapus.`
                : `Apakah Anda yakin ingin menandai SPK: ${pendingCompleteSpk?.No_SPK} sebagai selesai?
                   Tanggal selesai akan diisi dengan tanggal hari ini.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleComplete} disabled={isUpdating}>
              {isUpdating ? "Memproses..." : (pendingCompleteSpk?.Completed ? "Ya, Batalkan" : "Ya, Selesai")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog Bulk */}
      <AlertDialog open={bulkCompleteDialogOpen} onOpenChange={setBulkCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === 'complete' ? "Tandai SPK sebagai Selesai?" : "Batalkan Status Selesai?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === 'complete'
                ? `Apakah Anda yakin ingin menandai ${selectedRows.length} SPK sebagai selesai?
                   Tanggal selesai akan diisi dengan tanggal hari ini untuk semua SPK yang dipilih.`
                : `Apakah Anda yakin ingin membatalkan status selesai untuk ${selectedRows.length} SPK?
                   Tanggal selesai akan dihapus untuk semua SPK yang dipilih.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkComplete} disabled={isUpdating}>
              {isUpdating ? "Memproses..." : (bulkAction === 'complete' ? "Ya, Selesai Semua" : "Ya, Batalkan Semua")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DataSpkPage;