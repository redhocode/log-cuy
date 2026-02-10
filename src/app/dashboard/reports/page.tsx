/* eslint-disable @typescript-eslint/no-unused-vars */
// app/laporan/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  subDays,
  addDays,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
  startOfYear,
  endOfYear,
  subMonths,
} from "date-fns";
import { id } from "date-fns/locale";
import { ProduksiType } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Info,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Printer,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ItemData {
  [ItemID: string]: {
    [tanggal: string]: {
      kgs: number;
      bags: number;
      count: number;
      transactions: ProduksiType[];
    };
  };
}

interface DepartmentItemData {
  [departemen: string]: ItemData;
}

interface DateData {
  [tanggal: string]: {
    totalKgs: number;
    totalBags: number;
    totalCount: number;
  };
}

interface ItemSummary {
  ItemID: string;
  itemName?: string;
  kategori?: string;
  totalKgs: number;
  totalBags: number;
  totalCount: number;
  dataByDate: {
    [tanggal: string]: {
      kgs: number;
      bags: number;
      count: number;
    };
  };
}

// Preset date ranges
const DATE_PRESETS = [
  { label: "Hari Ini", value: "today" },
  { label: "Kemarin", value: "yesterday" },
  { label: "Minggu Ini", value: "thisWeek" },
  { label: "Minggu Lalu", value: "lastWeek" },
  { label: "Bulan Ini", value: "thisMonth" },
  { label: "Bulan Lalu", value: "lastMonth" },
  { label: "3 Bulan Terakhir", value: "last3Months" },
  { label: "6 Bulan Terakhir", value: "last6Months" },
  { label: "Tahun Ini", value: "thisYear" },
  { label: "Tahun Lalu", value: "lastYear" },
  { label: "Semua Waktu", value: "allTime" },
];

export default function LaporanProduksiShadcn() {
  const [data, setData] = useState<ProduksiType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    prodType: "",
    itemType: "",
  });

  const [departmentItemData, setDepartmentItemData] = useState<DepartmentItemData>({});
  const [dateData, setDateData] = useState<DateData>({});
  const [departemenList, setDepartemenList] = useState<string[]>([]);
  const [dateRangeList, setDateRangeList] = useState<string[]>([]);
  const [itemSummaries, setItemSummaries] = useState<{
    [departemen: string]: ItemSummary[];
  }>({});
  const [expandedDepartemen, setExpandedDepartemen] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedItem, setSelectedItem] = useState<ItemSummary | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string>("thisMonth");

  // Fetch data dari API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.prodType && { prodType: filters.prodType }),
        ...(filters.itemType && { itemType: filters.itemType }),
      });

      const response = await fetch(`/api/produksi?${params}`);
      if (!response.ok) throw new Error("Gagal mengambil data");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  // Apply date preset
  const applyDatePreset = (preset: string) => {
    const today = new Date();
    let startDate: string;
    let endDate: string;

    switch (preset) {
      case "today":
        startDate = format(startOfDay(today), "yyyy-MM-dd");
        endDate = format(endOfDay(today), "yyyy-MM-dd");
        break;
      case "yesterday":
        const yesterday = subDays(today, 1);
        startDate = format(startOfDay(yesterday), "yyyy-MM-dd");
        endDate = format(endOfDay(yesterday), "yyyy-MM-dd");
        break;
      case "thisWeek":
        startDate = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
        endDate = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
        break;
      case "lastWeek":
        const lastWeekStart = subDays(today, 7);
        startDate = format(startOfWeek(lastWeekStart, { weekStartsOn: 1 }), "yyyy-MM-dd");
        endDate = format(endOfWeek(lastWeekStart, { weekStartsOn: 1 }), "yyyy-MM-dd");
        break;
      case "thisMonth":
        startDate = format(startOfMonth(today), "yyyy-MM-dd");
        endDate = format(endOfMonth(today), "yyyy-MM-dd");
        break;
      case "lastMonth":
        const lastMonth = subMonths(today, 1);
        startDate = format(startOfMonth(lastMonth), "yyyy-MM-dd");
        endDate = format(endOfMonth(lastMonth), "yyyy-MM-dd");
        break;
      case "last3Months":
        const threeMonthsAgo = subMonths(today, 3);
        startDate = format(startOfMonth(threeMonthsAgo), "yyyy-MM-dd");
        endDate = format(endOfMonth(today), "yyyy-MM-dd");
        break;
      case "last6Months":
        const sixMonthsAgo = subMonths(today, 6);
        startDate = format(startOfMonth(sixMonthsAgo), "yyyy-MM-dd");
        endDate = format(endOfMonth(today), "yyyy-MM-dd");
        break;
      case "thisYear":
        startDate = format(startOfYear(today), "yyyy-MM-dd");
        endDate = format(endOfYear(today), "yyyy-MM-dd");
        break;
      case "lastYear":
        const lastYear = subMonths(today, 12);
        startDate = format(startOfYear(lastYear), "yyyy-MM-dd");
        endDate = format(endOfYear(lastYear), "yyyy-MM-dd");
        break;
      case "allTime":
        // Set to a very old date and today
        startDate = "2020-01-01";
        endDate = format(today, "yyyy-MM-dd");
        break;
      default:
        startDate = format(startOfMonth(today), "yyyy-MM-dd");
        endDate = format(endOfMonth(today), "yyyy-MM-dd");
    }

    setFilters(prev => ({
      ...prev,
      startDate,
      endDate,
    }));
    setActivePreset(preset);
  };

  // Handler untuk perubahan tanggal manual
  const handleDateChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setActivePreset("custom");
  };

  // Clear semua filter
  const handleClearFilters = () => {
    const today = new Date();
    const startDate = format(startOfMonth(today), "yyyy-MM-dd");
    const endDate = format(endOfMonth(today), "yyyy-MM-dd");
    
    setFilters({
      startDate,
      endDate,
      prodType: "",
      itemType: "",
    });
    setActivePreset("thisMonth");
  };

  // Proses data untuk struktur tabel
  const processData = useMemo(() => {
    const tempDepartmentItemData: DepartmentItemData = {};
    const tempDateData: DateData = {};
    const departemenSet = new Set<string>();
    const tempItemSummaries: { [departemen: string]: ItemSummary[] } = {};

    // Generate date range sebagai string
    const start = parseISO(filters.startDate);
    const end = parseISO(filters.endDate);
    const dates = eachDayOfInterval({ start, end });
    
    // Convert dates to string array (descending)
    const dateStrings = dates.map(date => format(date, "yyyy-MM-dd"))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Initialize date data dengan nilai 0 untuk semua tanggal
    dateStrings.forEach((tanggalKey) => {
      tempDateData[tanggalKey] = {
        totalKgs: 0,
        totalBags: 0,
        totalCount: 0,
      };
    });

    // Process data dari API
    data.forEach((item) => {
      const tanggalKey = typeof item.Tanggal === 'string' 
        ? item.Tanggal 
        : item.Tanggal 
          ? format(new Date(item.Tanggal), 'yyyy-MM-dd')
          : null;
      
      if (!tanggalKey || !item.Departemen || !item.ItemID) return;

      const deptKey = item.Departemen;
      const itemKey = item.ItemID;
      const kgs = Number(item.Kgs) || 0;
      const bags = Number(item.Bags) || 0;

      // Initialize department jika belum ada
      if (!tempDepartmentItemData[deptKey]) {
        tempDepartmentItemData[deptKey] = {};
      }

      // Initialize item jika belum ada
      if (!tempDepartmentItemData[deptKey][itemKey]) {
        tempDepartmentItemData[deptKey][itemKey] = {};
        
        // Initialize untuk semua tanggal dengan nilai 0
        dateStrings.forEach((dateKey) => {
          tempDepartmentItemData[deptKey][itemKey][dateKey] = {
            kgs: 0,
            bags: 0,
            count: 0,
            transactions: [],
          };
        });
      }

      // Tambahkan ke item data untuk tanggal ini
      if (tempDepartmentItemData[deptKey][itemKey][tanggalKey]) {
        tempDepartmentItemData[deptKey][itemKey][tanggalKey].kgs += kgs;
        tempDepartmentItemData[deptKey][itemKey][tanggalKey].bags += bags;
        tempDepartmentItemData[deptKey][itemKey][tanggalKey].count += 1;
        tempDepartmentItemData[deptKey][itemKey][tanggalKey].transactions.push(item);
      }

      // Tambahkan ke date data (total per tanggal)
      if (tempDateData[tanggalKey]) {
        tempDateData[tanggalKey].totalKgs += kgs;
        tempDateData[tanggalKey].totalBags += bags;
        tempDateData[tanggalKey].totalCount += 1;
      }

      // Tambahkan ke set departemen
      departemenSet.add(deptKey);
    });

    // Buat summary untuk setiap item dalam setiap departemen
    Object.keys(tempDepartmentItemData).forEach((dept) => {
      tempItemSummaries[dept] = [];
      
      Object.keys(tempDepartmentItemData[dept]).forEach((ItemID) => {
        let totalKgs = 0;
        let totalBags = 0;
        let totalCount = 0;
        const dataByDate: { [tanggal: string]: { kgs: number; bags: number; count: number } } = {};

        // Hitung total dan data per tanggal
        dateStrings.forEach((tanggalKey) => {
          const itemDateData = tempDepartmentItemData[dept][ItemID][tanggalKey];
          dataByDate[tanggalKey] = {
            kgs: itemDateData.kgs,
            bags: itemDateData.bags,
            count: itemDateData.count,
          };
          
          totalKgs += itemDateData.kgs;
          totalBags += itemDateData.bags;
          totalCount += itemDateData.count;
        });

        // Cari nama item dari data asli
        const sampleTransaction = tempDepartmentItemData[dept][ItemID][dateStrings[0]]?.transactions[0];
        
        tempItemSummaries[dept].push({
          ItemID,
          itemName: sampleTransaction?.Nama_PO || ItemID,
          kategori: sampleTransaction?.Kategori,
          totalKgs,
          totalBags,
          totalCount,
          dataByDate,
        });
      });

      // Urutkan item berdasarkan total KG (descending)
      tempItemSummaries[dept].sort((a, b) => b.totalKgs - a.totalKgs);
    });

    return {
      departmentItemData: tempDepartmentItemData,
      dateData: tempDateData,
      itemSummaries: tempItemSummaries,
      departemen: Array.from(departemenSet).sort(),
      dates: dateStrings,
    };
  }, [data, filters.startDate, filters.endDate]);

  useEffect(() => {
    if (processData.departmentItemData) {
      setDepartmentItemData(processData.departmentItemData);
      setDateData(processData.dateData);
      setItemSummaries(processData.itemSummaries);
      setDepartemenList(processData.departemen);
      setDateRangeList(processData.dates);
    }
  }, [processData]);

  useEffect(() => {
    fetchData();
  }, []);

  // Handler untuk submit filter
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
    setIsFilterOpen(false);
  };

  // Hitung total per departemen
  const calculateDepartmentTotals = () => {
    const totals: { 
      [key: string]: { 
        kgs: number; 
        bags: number; 
        count: number;
        itemCount: number;
      } 
    } = {};

    departemenList.forEach((dept) => {
      totals[dept] = { kgs: 0, bags: 0, count: 0, itemCount: 0 };
      
      if (itemSummaries[dept]) {
        itemSummaries[dept].forEach((item) => {
          totals[dept].kgs += item.totalKgs;
          totals[dept].bags += item.totalBags;
          totals[dept].count += item.totalCount;
        });
        totals[dept].itemCount = itemSummaries[dept].length;
      }
    });

    return totals;
  };

  // Hitung grand total
  const calculateGrandTotal = () => {
    let grandTotalKgs = 0;
    let grandTotalBags = 0;
    let grandTotalCount = 0;
    let totalItems = 0;

    departemenList.forEach((dept) => {
      if (itemSummaries[dept]) {
        itemSummaries[dept].forEach((item) => {
          grandTotalKgs += item.totalKgs;
          grandTotalBags += item.totalBags;
          grandTotalCount += item.totalCount;
        });
        totalItems += itemSummaries[dept].length;
      }
    });

    return { grandTotalKgs, grandTotalBags, grandTotalCount, totalItems };
  };

  // Filter departemen berdasarkan search query
  const filteredDepartemen = useMemo(() => {
    if (!searchQuery) return departemenList;
    return departemenList.filter(dept =>
      dept.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [departemenList, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredDepartemen.length / itemsPerPage);
  const paginatedDepartemen = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDepartemen.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDepartemen, currentPage, itemsPerPage]);

  // Format tanggal untuk header
  const formatDateHeader = (tanggalKey: string) => {
    const date = parseISO(tanggalKey);
    return (
      <div className="text-center">
        <div className="font-medium">{format(date, "dd")}</div>
        <div className="text-xs text-muted-foreground">{format(date, "EEE", { locale: id })}</div>
      </div>
    );
  };

  // Toggle expand departemen
  const toggleExpandDepartemen = (dept: string) => {
    if (expandedDepartemen === dept) {
      setExpandedDepartemen(null);
    } else {
      setExpandedDepartemen(dept);
    }
  };

  // Export to Excel
  const handleExport = () => {
    const dataToExport = {
      periode: `${format(parseISO(filters.startDate), "dd MMM yyyy")} - ${format(parseISO(filters.endDate), "dd MMM yyyy")}`,
      totalTransaksi: data.length,
      totalKgs: grandTotal.grandTotalKgs,
      totalBags: grandTotal.grandTotalBags,
      departemen: departmentTotals,
      filter: filters,
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-produksi-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Format date untuk display
  const formatDateDisplay = (dateString: string) => {
    return format(parseISO(dateString), "dd MMM yyyy", { locale: id });
  };

  // Navigasi periode
  const navigatePeriod = (direction: 'prev' | 'next') => {
    const start = parseISO(filters.startDate);
    const end = parseISO(filters.endDate);
    const duration = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    
    let newStart: Date;
    let newEnd: Date;
    
    if (direction === 'prev') {
      newStart = subDays(start, duration + 1);
      newEnd = subDays(end, duration + 1);
    } else {
      newStart = addDays(start, duration + 1);
      newEnd = addDays(end, duration + 1);
      
      // Jangan melebihi hari ini
      const today = new Date();
      if (newEnd > today) {
        newEnd = today;
        newStart = subDays(newEnd, duration);
      }
    }
    
    setFilters(prev => ({
      ...prev,
      startDate: format(newStart, "yyyy-MM-dd"),
      endDate: format(newEnd, "yyyy-MM-dd"),
    }));
    setActivePreset("custom");
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Memuat Data</CardTitle>
          <CardDescription>Sedang mengambil data produksi...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
  
  if (error) return (
    <div className="p-8">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" className="ml-4" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );

  const departmentTotals = calculateDepartmentTotals();
  const grandTotal = calculateGrandTotal();

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan Produksi</h1>
          <p className="text-muted-foreground">
            Periode: {formatDateDisplay(filters.startDate)} - {formatDateDisplay(filters.endDate)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={activePreset === "custom" ? "default" : "secondary"}>
              {DATE_PRESETS.find(p => p.value === activePreset)?.label || "Custom"}
            </Badge>
            {filters.prodType && (
              <Badge variant="outline">
                Tipe: {filters.prodType}
              </Badge>
            )}
            {filters.itemType && (
              <Badge variant="outline">
                Item: {filters.itemType}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filter Laporan</SheetTitle>
                <SheetDescription>
                  Sesuaikan parameter laporan sesuai kebutuhan
                </SheetDescription>
              </SheetHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                {/* Date Range Presets */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Rentang Waktu</label>
                  <div className="grid grid-cols-2 gap-2">
                    {DATE_PRESETS.map((preset) => (
                      <Button
                        key={preset.value}
                        type="button"
                        variant={activePreset === preset.value ? "default" : "outline"}
                        size="sm"
                        className="justify-start"
                        onClick={() => applyDatePreset(preset.value)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Date Range */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Rentang Tanggal Kustom</label>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm mb-1 block">Tanggal Mulai</label>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          name="startDate"
                          value={filters.startDate}
                          onChange={(e) => handleDateChange("startDate", e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm mb-1 block">Tanggal Akhir</label>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          name="endDate"
                          value={filters.endDate}
                          onChange={(e) => handleDateChange("endDate", e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Production Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipe Produksi</label>
                  <Select
                    name="prodType"
                    value={filters.prodType}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, prodType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua Tipe</SelectItem>
                      <SelectItem value="IN">IN</SelectItem>
                      <SelectItem value="SP">SP</SelectItem>
                      <SelectItem value="MO">MO</SelectItem>
                      <SelectItem value="PL">PL</SelectItem>
                      <SelectItem value="AS">AS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Item Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipe Item</label>
                  <Select
                    name="itemType"
                    value={filters.itemType}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, itemType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua Item</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="H">H</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Terapkan Filter
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearFilters}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-xs text-muted-foreground">
              {grandTotal.grandTotalCount} total operasi
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kilogram</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grandTotal.grandTotalKgs.toLocaleString()} KG</div>
            <p className="text-xs text-muted-foreground">
              Rata-rata {dateRangeList.length > 0 ? Math.round(grandTotal.grandTotalKgs / dateRangeList.length).toLocaleString() : 0} KG/hari
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sak</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grandTotal.grandTotalBags.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Rata-rata {dateRangeList.length > 0 ? Math.round(grandTotal.grandTotalBags / dateRangeList.length).toLocaleString() : 0} sak/hari
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departemen</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departemenList.length}</div>
            <p className="text-xs text-muted-foreground">
              {grandTotal.totalItems} item diproduksi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Date Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigatePeriod('prev')}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Periode Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigatePeriod('next')}
              >
                Periode Berikutnya
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {dateRangeList.length} hari • {departemenList.length} departemen • {data.length} transaksi
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for View Modes */}
      <Tabs defaultValue="table">
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="table">Tabel Detail</TabsTrigger>
          <TabsTrigger value="summary">Ringkasan</TabsTrigger>
        </TabsList>
        
        <TabsContent value="table" className="space-y-4">
          {/* Search and Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari departemen..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Aksi
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Ekspor Data</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleExport}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export ke JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.print()}>
                        <Printer className="h-4 w-4 mr-2" />
                        Cetak Laporan
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Table */}
          <Card>
            <CardHeader>
              <CardTitle>Data Produksi per Departemen</CardTitle>
              <CardDescription>
                Menampilkan {filteredDepartemen.length} dari {departemenList.length} departemen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="relative overflow-auto max-h-[600px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background z-20 min-w-[250px]">
                          <div className="font-bold">DEPARTEMEN</div>
                          <div className="text-xs text-muted-foreground">Total per Departemen</div>
                        </TableHead>
                        {dateRangeList.map((tanggalKey) => (
                          <TableHead key={tanggalKey} className="text-center min-w-[100px]">
                            <div className="space-y-1">
                              <div className="font-medium">{formatDateHeader(tanggalKey)}</div>
                              <div className="text-xs">
                                <div className="text-green-600">
                                  {dateData[tanggalKey]?.totalKgs.toLocaleString() || 0} KG
                                </div>
                                <div className="text-amber-600">
                                  {dateData[tanggalKey]?.totalBags.toLocaleString() || 0} Sak
                                </div>
                              </div>
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="sticky right-0 bg-background z-20 text-center min-w-[120px]">
                          <div className="font-bold">TOTAL</div>
                          <div className="text-xs text-muted-foreground">Keseluruhan</div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDepartemen.map((dept) => {
                        const deptTotal = departmentTotals[dept];
                        const isExpanded = expandedDepartemen === dept;
                        const items = itemSummaries[dept] || [];

                        return (
                          <>
                            <TableRow
                              key={dept}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => toggleExpandDepartemen(dept)}
                            >
                              <TableCell className="sticky left-0 bg-background z-10 font-medium">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-semibold">{dept}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {items.length} item • {deptTotal.count} transaksi
                                    </div>
                                  </div>
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${
                                      isExpanded ? "rotate-180" : ""
                                    }`}
                                  />
                                </div>
                              </TableCell>
                              {dateRangeList.map((tanggalKey) => {
                                let deptKgs = 0;
                                let deptBags = 0;

                                if (items) {
                                  items.forEach(item => {
                                    const itemData = item.dataByDate[tanggalKey];
                                    if (itemData) {
                                      deptKgs += itemData.kgs;
                                      deptBags += itemData.bags;
                                    }
                                  });
                                }

                                return (
                                  <TableCell key={`${dept}-${tanggalKey}`} className="text-center">
                                    {deptKgs > 0 ? (
                                      <div className="space-y-1">
                                        <div className="font-medium text-green-700">
                                          {deptKgs.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-amber-700">
                                          {deptBags.toLocaleString()}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-muted-foreground">-</div>
                                    )}
                                  </TableCell>
                                );
                              })}
                              <TableCell className="sticky right-0 bg-background z-10 text-center font-bold">
                                <div className="space-y-1">
                                  <div className="text-green-800">
                                    {deptTotal.kgs.toLocaleString()} KG
                                  </div>
                                  <div className="text-sm text-amber-800">
                                    {deptTotal.bags.toLocaleString()} Sak
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>

                            {isExpanded && (
                              <>
                                {items.map((item) => (
                                  <TableRow
                                    key={`${dept}-${item.ItemID}`}
                                    className="bg-muted/30"
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setIsDetailsOpen(true);
                                    }}
                                  >
                                    <TableCell className="sticky left-0 bg-muted/30 z-10">
                                      <div className="pl-6">
                                        <div className="font-medium">{item.ItemID}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {item.kategori && (
                                            <Badge variant="secondary" className="mr-2">
                                              {item.kategori}
                                            </Badge>
                                          )}
                                          {item.itemName}
                                        </div>
                                      </div>
                                    </TableCell>
                                    {dateRangeList.map((tanggalKey) => {
                                      const itemData = item.dataByDate[tanggalKey];

                                      return (
                                        <TableCell key={`${dept}-${item.ItemID}-${tanggalKey}`} className="text-center">
                                          {itemData && itemData.kgs > 0 ? (
                                            <div className="space-y-1">
                                              <div className="text-green-600">
                                                {itemData.kgs.toLocaleString()}
                                              </div>
                                              <div className="text-sm text-amber-600">
                                                {itemData.bags.toLocaleString()}
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="text-muted-foreground">-</div>
                                          )}
                                        </TableCell>
                                      );
                                    })}
                                    <TableCell className="sticky right-0 bg-muted/30 z-10 text-center">
                                      <div className="space-y-1">
                                        <div className="font-medium text-green-800">
                                          {item.totalKgs.toLocaleString()} KG
                                        </div>
                                        <div className="text-sm text-amber-800">
                                          {item.totalBags.toLocaleString()} Sak
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {item.totalCount} transaksi
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </>
                            )}
                          </>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Menampilkan {paginatedDepartemen.length} dari {filteredDepartemen.length} departemen
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(prev => Math.max(prev - 1, 1));
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                      if (currentPage > 3) pageNum = currentPage - 2 + i;
                      if (currentPage > totalPages - 2) pageNum = totalPages - 4 + i;
                    }
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(pageNum);
                          }}
                          isActive={currentPage === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(prev => Math.min(prev + 1, totalPages));
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Performa Departemen</CardTitle>
              <CardDescription>
                Statistik kinerja produksi per departemen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {departemenList.map((dept) => {
                  const total = departmentTotals[dept];
                  const items = itemSummaries[dept] || [];
                  const avgKgsPerItem = items.length > 0 ? Math.round(total.kgs / items.length) : 0;

                  return (
                    <AccordionItem key={dept} value={dept}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="text-left">
                            <div className="font-semibold">{dept}</div>
                            <div className="text-sm text-muted-foreground">
                              {items.length} item • {total.count} transaksi
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-medium text-green-700">
                                {total.kgs.toLocaleString()} KG
                              </div>
                              <div className="text-sm text-amber-700">
                                {total.bags.toLocaleString()} Sak
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-3">Statistik Item</h4>
                            <div className="space-y-3">
                              {items.slice(0, 5).map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setIsDetailsOpen(true);
                                  }}
                                >
                                  <div>
                                    <div className="font-medium">{item.ItemID}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {item.kategori && (
                                        <Badge variant="outline" className="mr-2">
                                          {item.kategori}
                                        </Badge>
                                      )}
                                      {item.itemName}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium text-green-700">
                                      {item.totalKgs.toLocaleString()} KG
                                    </div>
                                    <div className="text-sm text-amber-700">
                                      {item.totalBags.toLocaleString()} Sak
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-3">Analisis</h4>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Rata-rata per Item</span>
                                  <span className="font-medium">{avgKgsPerItem.toLocaleString()} KG</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Rata-rata per Transaksi</span>
                                  <span className="font-medium">
                                    {total.count > 0 ? Math.round(total.kgs / total.count).toLocaleString() : 0} KG
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Produktivitas</span>
                                  <span className="font-medium">
                                    {dateRangeList.length > 0 ? Math.round(total.kgs / dateRangeList.length).toLocaleString() : 0} KG/hari
                                  </span>
                                </div>
                              </div>
                              <div className="pt-4 border-t">
                                <h5 className="text-sm font-medium mb-2">Distribusi Tanggal Tertinggi</h5>
                                {dateRangeList.slice(0, 3).map((tanggalKey) => {
                                  const dateTotal = dateData[tanggalKey];
                                  const deptContribution = items.reduce((sum, item) => {
                                    const itemData = item.dataByDate[tanggalKey];
                                    return sum + (itemData?.kgs || 0);
                                  }, 0);

                                  if (deptContribution === 0) return null;

                                  const percentage = (deptContribution / dateTotal.totalKgs) * 100;

                                  return (
                                    <div key={tanggalKey} className="flex items-center justify-between mb-2">
                                      <span className="text-sm">
                                        {format(parseISO(tanggalKey), "dd MMM", { locale: id })}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <div className="w-24 bg-secondary h-2 rounded-full overflow-hidden">
                                          <div
                                            className="bg-primary h-full"
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                          />
                                        </div>
                                        <span className="text-sm font-medium">
                                          {deptContribution.toLocaleString()} KG
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }).filter(Boolean)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Item</DialogTitle>
            <DialogDescription>
              Informasi lengkap untuk item {selectedItem?.ItemID}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Item ID</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedItem.ItemID}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Kilogram</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-700">
                      {selectedItem.totalKgs.toLocaleString()} KG
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Sak</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-700">
                      {selectedItem.totalBags.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Distribusi per Tanggal</CardTitle>
                  <CardDescription>
                    Sebaran produksi item ini selama periode yang dipilih
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {dateRangeList.map((tanggalKey) => {
                      const itemData = selectedItem.dataByDate[tanggalKey];
                      if (!itemData || itemData.kgs === 0) return null;

                      return (
                        <div
                          key={tanggalKey}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="font-bold text-lg">
                                {format(parseISO(tanggalKey), "dd")}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(parseISO(tanggalKey), "MMM", { locale: id })}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">
                                {format(parseISO(tanggalKey), "EEEE", { locale: id })}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(parseISO(tanggalKey), "yyyy", { locale: id })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-700">
                              {itemData.kgs.toLocaleString()} KG
                            </div>
                            <div className="text-sm text-amber-700">
                              {itemData.bags.toLocaleString()} Sak
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {itemData.count} transaksi
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {selectedItem.kategori && (
                <Card>
                  <CardHeader>
                    <CardTitle>Informasi Tambahan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Kategori</span>
                        <Badge variant="secondary">{selectedItem.kategori}</Badge>
                      </div>
                      {selectedItem.itemName && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nama PO</span>
                          <span className="font-medium">{selectedItem.itemName}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Transaksi</span>
                        <span className="font-medium">{selectedItem.totalCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rata-rata per Transaksi</span>
                        <span className="font-medium">
                          {selectedItem.totalCount > 0
                            ? Math.round(selectedItem.totalKgs / selectedItem.totalCount).toLocaleString()
                            : 0} KG
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}