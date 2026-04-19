/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  RefreshCw, 
  ChevronRight, 
  Package,
  Layers,
  Hash,
  FileText,
  Filter,
  Download,
  Box,
  ListTree,
  Copy,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  CheckCircle2,
  AlertTriangle,
  Info
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as XLSX from "xlsx";

interface BomData {
  TransID: number;
  itemidHD: string;
  itemnamehd: string;
  itemnamehd2?: string;
  ItemID: string;
  ItemName: string;
  ItemName2: string;
  BahanQty: number;
  Departemen?: string;
  NamaJenis?: string;
}

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function BOMView() {
  const [itemid, setItemid] = useState("");
  const [data, setData] = useState<BomData[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<BomData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchType, setSearchType] = useState<'itemid' | 'itemname'>('itemid');
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'filtered'>('all');
  const [expandedAll, setExpandedAll] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'success'
  });
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // OPTIMASI: Gunakan useMemo untuk grouping data
  const grouped = useMemo(() => {
    if (data.length === 0) return {};
    
    const result: Record<string, { 
      headerName: string; 
      headerName2: string;
      children: BomData[]; 
      totalComponents: number 
    }> = {};
    
    for (const row of data) {
      if (!result[row.itemidHD]) {
        result[row.itemidHD] = {
          headerName: row.itemnamehd,
          headerName2: row.itemnamehd2 || "",
          children: [],
          totalComponents: 0
        };
      }
      
      // Cek duplikasi lebih cepat dengan Set
      const exists = result[row.itemidHD].children.some(
        child => child.ItemID === row.ItemID
      );
      
      if (!exists) {
        result[row.itemidHD].children.push(row);
        result[row.itemidHD].totalComponents++;
      }
    }
    
    return result;
  }, [data]);

  // OPTIMASI: Hitung statistik dengan useMemo
  const totalHeaders = useMemo(() => Object.keys(grouped).length, [grouped]);
  const totalComponents = useMemo(() => data.length, [data]);

  // OPTIMASI: Fungsi fetch BOM dengan virtual scrolling
  const fetchBOM = useCallback(async (searchItem?: string) => {
    setLoading(true);
    const startTime = performance.now();
    
    try {
      const params: any = {};
      
      if (searchItem && searchItem.trim() !== "") {
        params.itemid = searchItem;
        params.searchType = searchType;
        console.log("Searching with filter:", searchItem);
      } else {
        console.log("Fetching ALL BOM data");
      }
      
      const res = await axios.get<BomData[]>(`/api/bom`, { params });
      
      let bomData = res.data;
      
      console.log(`Raw data received: ${bomData.length} items in ${(performance.now() - startTime).toFixed(0)}ms`);
      
      // OPTIMASI: Gunakan Map untuk deduplikasi yang lebih cepat
      const uniqueMap = new Map<string, BomData>();
      for (const item of bomData) {
        const uniqueKey = `${item.itemidHD}|${item.ItemID}`;
        if (!uniqueMap.has(uniqueKey)) {
          uniqueMap.set(uniqueKey, item);
        }
      }
      
      bomData = Array.from(uniqueMap.values());
      
      console.log(`Unique data: ${bomData.length} items`);
      
      setData(bomData);
      setViewMode(searchItem && searchItem.trim() !== "" ? 'filtered' : 'all');
      setHasSearched(true);
      
      // OPTIMASI: Hanya buka accordion untuk 10 produk pertama jika terlalu banyak
      const headers = Array.from(new Set(bomData.map((item) => item.itemidHD)));
      if (headers.length > 20) {
        // Jika banyak produk, hanya buka 5 pertama
        setExpandedAll(headers.slice(0, 5));
        console.log(`Too many products (${headers.length}), only expanding first 5`);
      } else {
        setExpandedAll(headers);
      }
      
      const endTime = performance.now();
      showNotification(`Berhasil memuat ${bomData.length} komponen dari ${headers.length} produk (${(endTime - startTime).toFixed(0)}ms)`, 'success');
      
    } catch (err) {
      console.error("Gagal ambil BOM:", err);
      setData([]);
      setHasSearched(true);
      showNotification("Gagal memuat data BOM", 'error');
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [searchType]);

  // Fungsi untuk handle search
  const handleSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      if (itemid && itemid.trim() !== "") {
        fetchBOM(itemid);
      } else {
        fetchBOM();
      }
    }, 300);
  }, [itemid, fetchBOM]);

  // Fungsi untuk reset dan load semua data
  const handleReset = useCallback(() => {
    setItemid("");
    setSuggestions([]);
    setShowSuggestions(false);
    fetchBOM();
  }, [fetchBOM]);

  // Fungsi untuk handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setItemid(val);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (val.length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, []);

  // Fungsi untuk toggle semua accordion
  const toggleAllAccordions = useCallback(() => {
    if (expandedAll.length > 0) {
      setExpandedAll([]);
      showNotification("Semua detail ditutup", 'info');
    } else {
      const headers = Array.from(new Set(data.map(item => item.itemidHD)));
      setExpandedAll(headers);
      showNotification(`Semua detail dibuka (${headers.length} produk)`, 'info');
    }
  }, [data, expandedAll.length]);

  // Fungsi untuk export ke Excel dengan format per produk
const exportToExcel = () => {
  if (data.length === 0) {
    showNotification("Tidak ada data untuk diexport", 'error');
    return;
  }
  
  setIsExporting(true);
  
  setTimeout(() => {
    try {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const timeStr = today.toLocaleTimeString('id-ID').replace(/:/g, '-');
      const timestamp = `${dateStr}_${timeStr}`;
      
      let fileName = '';
      
      if (viewMode === 'filtered' && itemid) {
        if (searchType === 'itemid') {
          fileName = `BOM_By_ItemID_${itemid}_${timestamp}.xlsx`;
        } else {
          const cleanItemName = itemid.replace(/[\\/:*?"<>|]/g, '_').substring(0, 30);
          fileName = `BOM_By_ItemName_${cleanItemName}_${timestamp}.xlsx`;
        }
      } else {
        fileName = `BOM_Complete_${totalHeaders}Products_${timestamp}.xlsx`;
      }
      
      // Buat data per produk dengan baris kosong sebagai pemisah
      const worksheetData: any[][] = [];
      
      // Header utama
      worksheetData.push(["LAPORAN BILL OF MATERIALS (BOM)"]);
      worksheetData.push([`Tanggal Export: ${today.toLocaleDateString('id-ID')} ${today.toLocaleTimeString('id-ID')}`]);
      worksheetData.push([`Jumlah Produk: ${totalHeaders} produk`]);
      worksheetData.push([`Jumlah Komponen: ${totalComponents} komponen`]);
      
      if (viewMode === 'filtered' && itemid) {
        worksheetData.push([`Kata Kunci: ${itemid} (${searchType === 'itemid' ? 'ID Item' : 'Nama Item'})`]);
      }
      
      worksheetData.push([]); // Baris kosong separator
      
      // Loop per produk
      let globalNo = 0;
      
      Object.entries(grouped).forEach(([hd, group]) => {
        // Header produk
        worksheetData.push([`PRODUK: ${hd}`]);
        worksheetData.push([`Nama Produk: ${group.headerName}`]);
        if (group.headerName2 && group.headerName2 !== group.headerName) {
          worksheetData.push([`Nama Produk (China): ${group.headerName2}`]);
        }
        worksheetData.push([`Total Komponen: ${group.totalComponents}`]);
        worksheetData.push([]); // Baris kosong sebelum tabel
        
        // Header tabel komponen
        worksheetData.push([
          "No", 
          "Komponen ID", 
          "Nama Komponen (Indonesia)", 
          "Nama Komponen (China)", 
          "Jumlah"
        ]);
        
        // Data komponen
        group.children.forEach((row, idx) => {
          globalNo++;
          worksheetData.push([
            idx + 1,
            row.ItemID,
            row.ItemName,
            row.ItemName2 || "-",
            row.BahanQty
          ]);
        });
        
        worksheetData.push([]); // Baris kosong setelah tabel
        worksheetData.push([]); // Baris kosong separator antar produk
      });
      
      // Footer
      worksheetData.push(["=".repeat(80)]);
      worksheetData.push([`Total Keseluruhan: ${totalHeaders} produk, ${totalComponents} komponen`]);
      worksheetData.push([`Generate Date: ${today.toLocaleString('id-ID')}`]);
      
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "BOM Report");
      
      // Atur lebar kolom
      const wscols = [
        { wch: 8 },   // No
        { wch: 20 },  // Komponen ID
        { wch: 45 },  // Nama Komponen Indonesia
        { wch: 45 },  // Nama Komponen China
        { wch: 12 },  // Jumlah
      ];
      ws['!cols'] = wscols;
      
      // Merge cells untuk header
      if (!ws['!merges']) ws['!merges'] = [];
      
      // Merge untuk judul utama
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } });
      ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 4 } });
      ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 4 } });
      ws['!merges'].push({ s: { r: 3, c: 0 }, e: { r: 3, c: 4 } });
      
      if (viewMode === 'filtered' && itemid) {
        ws['!merges'].push({ s: { r: 4, c: 0 }, e: { r: 4, c: 4 } });
      }
      
      XLSX.writeFile(wb, fileName);
      showNotification(`Berhasil export ke: ${fileName}`, 'success');
      
    } catch (error) {
      console.error("❌ Gagal export Excel:", error);
      showNotification("Gagal mengexport data", 'error');
    } finally {
      setIsExporting(false);
    }
  }, 100);
};

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification(`Berhasil copy: ${text}`, 'success');
  };

  // OPTIMASI: Render dengan virtualisasi jika perlu
  const renderAccordionItems = useMemo(() => {
    const entries = Object.entries(grouped);
    if (entries.length === 0) return null;
    
    // Batasi jumlah yang dirender jika terlalu banyak
    const maxDisplay = 100;
    const itemsToRender = entries.slice(0, maxDisplay);
    
    return itemsToRender.map(([hd, group]) => (
      <AccordionItem key={hd} value={hd} className="border rounded-lg overflow-hidden">
        <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-accent/50">
          <div className="flex flex-col items-start text-left w-full pr-4">
            <div className="flex items-center gap-2">
              <span 
                className="font-semibold text-lg font-mono bg-primary/10 px-2 py-1 rounded cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(hd);
                }}
              >
                {hd}
              </span>
              <Badge variant="secondary" className="text-xs">
                {group.totalComponents} komponen
              </Badge>
            </div>
            <span className="text-sm text-foreground text-left mt-1 max-w-md">
              {group.headerName}
            </span>
            {group.headerName2 && group.headerName2 !== group.headerName && (
              <span className="text-xs text-muted-foreground text-left mt-0.5 max-w-md">
                {group.headerName2}
              </span>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Daftar Komponen
              </h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">No</TableHead>
                      <TableHead className="min-w-[150px]">ID Komponen</TableHead>
                      <TableHead className="min-w-[200px]">Nama Komponen (Indonesia)</TableHead>
                      <TableHead className="min-w-[200px]">Nama Komponen (China)</TableHead>
                      <TableHead className="w-24 text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.children.map((row, index: number) => (
                      <TableRow key={`${row.itemidHD}-${row.ItemID}`} className="hover:bg-muted/50">
                        <TableCell className="text-center font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div 
                            className="font-mono text-sm bg-secondary/20 px-2 py-1 rounded inline-block cursor-pointer hover:bg-secondary/40 transition-colors"
                            onClick={() => copyToClipboard(row.ItemID)}
                          >
                            {row.ItemID}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span title={row.ItemName}>{row.ItemName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground" title={row.ItemName2 || "-"}>
                              {row.ItemName2 || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="default" className="font-mono">
                            {row.BahanQty.toLocaleString()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm text-muted-foreground">
                <div>Total: <span className="font-semibold">{group.totalComponents}</span> komponen</div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(hd)} className="flex items-center gap-2">
                  <Copy className="h-3 w-3" />
                  Copy ID Produk
                </Button>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    ));
  }, [grouped]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <Alert className={`border ${
            notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
            'bg-blue-50 border-blue-500 text-blue-800'
          }`}>
            {notification.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
            {notification.type === 'error' && <AlertTriangle className="h-4 w-4" />}
            {notification.type === 'info' && <Info className="h-4 w-4" />}
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <ListTree className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bill of Materials (BOM)</h1>
            <p className="text-muted-foreground">Struktur bahan lengkap untuk semua produk</p>
          </div>
        </div>
      </div>

      {/* Kontrol Pencarian - Sama seperti sebelumnya */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Pencarian & Filter
          </CardTitle>
          <CardDescription>Cari atau filter BOM berdasarkan kriteria tertentu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipe Pencarian</label>
              <div className="flex gap-2">
                <Button variant={searchType === 'itemid' ? "default" : "outline"} size="sm" onClick={() => {
                  setSearchType('itemid');
                  setItemid("");
                  setSuggestions([]);
                  setData([]);
                  setHasSearched(false);
                }} className="flex-1">
                  <Hash className="h-4 w-4 mr-2" /> ID Item
                </Button>
                <Button variant={searchType === 'itemname' ? "default" : "outline"} size="sm" onClick={() => {
                  setSearchType('itemname');
                  setItemid("");
                  setSuggestions([]);
                  setData([]);
                  setHasSearched(false);
                }} className="flex-1">
                  <FileText className="h-4 w-4 mr-2" /> Nama Item
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kata Kunci</label>
              <div className="relative">
                <div className="relative">
                  <Input
                    placeholder={`Cari ${searchType === 'itemid' ? 'ID Item' : 'Nama Item'}...`}
                    value={itemid}
                    onChange={handleInputChange}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    className="pl-10 pr-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  {itemid && (
                    <button onClick={() => { setItemid(""); setSuggestions([]); setShowSuggestions(false); }} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} disabled={loading || isSearching} className="flex-1">
                {(loading || isSearching) ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                {(loading || isSearching) ? "Memuat..." : "Cari"}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Reset & Load Semua
            </Button>
            
            <Button variant="outline" size="sm" onClick={toggleAllAccordions} disabled={data.length === 0} className="flex items-center gap-2">
              {expandedAll.length > 0 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {expandedAll.length > 0 ? "Tutup Semua" : "Buka Semua"}
            </Button>

            <Button onClick={exportToExcel} disabled={data.length === 0 || isExporting} variant="secondary" className="flex items-center gap-2">
              {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isExporting ? "Mengekspor..." : "Export Excel"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistik */}
      {hasSearched && !loading && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><div className="flex flex-col space-y-2"><div className="flex items-center justify-between"><p className="text-sm font-medium text-muted-foreground">Total Produk</p><Package className="h-4 w-4 text-muted-foreground" /></div><div className="flex items-center justify-between"><h3 className="text-2xl font-bold">{totalHeaders}</h3><Badge variant="secondary">Produk</Badge></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex flex-col space-y-2"><div className="flex items-center justify-between"><p className="text-sm font-medium text-muted-foreground">Total Komponen</p><Layers className="h-4 w-4 text-muted-foreground" /></div><div className="flex items-center justify-between"><h3 className="text-2xl font-bold">{totalComponents}</h3><Badge variant="secondary">Item</Badge></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex flex-col space-y-2"><div className="flex items-center justify-between"><p className="text-sm font-medium text-muted-foreground">Rata-rata Komponen</p><Box className="h-4 w-4 text-muted-foreground" /></div><div className="flex items-center justify-between"><h3 className="text-2xl font-bold">{totalHeaders > 0 ? (totalComponents / totalHeaders).toFixed(1) : 0}</h3><Badge variant="outline">per Produk</Badge></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex flex-col space-y-2"><div className="flex items-center justify-between"><p className="text-sm font-medium text-muted-foreground">Status Tampilan</p>{viewMode === 'all' ? <Eye className="h-4 w-4 text-muted-foreground" /> : <Filter className="h-4 w-4 text-muted-foreground" />}</div><div className="flex items-center justify-between"><h3 className="text-lg font-bold">{viewMode === 'all' ? "Semua Data" : "Hasil Filter"}</h3><Badge variant={viewMode === 'all' ? "default" : "secondary"}>{viewMode === 'all' ? "Lengkap" : "Difilter"}</Badge></div></div></CardContent></Card>
        </div>
      )}

      {/* Hasil BOM */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Struktur BOM Lengkap</CardTitle>
            <CardDescription>
              {!hasSearched ? "Klik tombol Cari untuk menampilkan data" :
               loading ? "Sedang memuat data..." :
               data.length === 0 ? "Tidak ada data ditemukan" : 
               `Menampilkan ${totalHeaders} produk dengan ${totalComponents} komponen`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <Skeleton className="h-8 w-3/4 mb-4" />
                    <div className="space-y-2 ml-6">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                      <Skeleton className="h-4 w-3/6" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !hasSearched ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Belum Ada Pencarian</h3>
              <p className="text-muted-foreground mb-6">Masukkan kata kunci dan klik tombol Cari untuk menampilkan data BOM</p>
              <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" /> Load Semua Data
              </Button>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Data BOM tidak ditemukan</h3>
              <p className="text-muted-foreground mb-6">{itemid ? `Tidak ada hasil untuk "${itemid}"` : "Belum ada data BOM yang tersedia"}</p>
              {itemid && <Button variant="outline" onClick={handleReset} className="flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Tampilkan Semua Data</Button>}
            </div>
          ) : (
            <Accordion type="multiple" value={expandedAll} onValueChange={setExpandedAll} className="space-y-4">
              {renderAccordionItems}
              {Object.keys(grouped).length > 100 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Data Besar</AlertTitle>
                  <AlertDescription>
                    Menampilkan 100 dari {Object.keys(grouped).length} produk. Gunakan pencarian untuk filter data.
                  </AlertDescription>
                </Alert>
              )}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}