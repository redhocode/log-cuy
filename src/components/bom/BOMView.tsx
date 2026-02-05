/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  X
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
  ItemID: string;
  ItemName: string;
  BahanQty: number;
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
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchBOM = useCallback(async (searchItem?: string) => {
    setLoading(true);
    try {
      const res = await axios.get<BomData[]>(`/api/bom`, {
        params: { 
          itemid: searchItem || "%",
          searchType: searchType
        },
      });
      
      const bomData = res.data;
      setData(bomData);
      setViewMode(searchItem ? 'filtered' : 'all');
      
      // Set accordion terbuka untuk semua item jika tidak ada pencarian
      if (!searchItem) {
        const headers = Array.from(new Set(bomData.map((item) => item.itemidHD)));
        setExpandedAll(headers);
      } else {
        setExpandedAll([]);
      }
    } catch (err) {
      console.error("Gagal ambil BOM:", err);
      setData([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [searchType]);

  // const fetchSuggestions = useCallback(async (keyword: string) => {
  //   if (keyword.length < 2) {
  //     setSuggestions([]);
  //     return;
  //   }
    
  //   try {
  //     const res = await axios.get<BomData[]>(`/api/bom/suggestions`, {
  //       params: { 
  //         keyword: keyword,
  //         searchType: searchType,
  //         limit: 8 
  //       },
  //     });
  //     setSuggestions(res.data);
  //   } catch (err) {
  //     console.error("Gagal ambil suggestion:", err);
  //     // Fallback jika endpoint suggestions tidak ada
  //     try {
  //       const res = await axios.get<BomData[]>(`/api/bom`, {
  //         params: { 
  //           itemid: `%${keyword}%`,
  //           searchType: searchType,
  //           limit: 8
  //         },
  //       });
  //       setSuggestions(res.data.slice(0, 8));
  //     } catch (fallbackErr) {
  //       console.error("Gagal ambil fallback suggestion:", fallbackErr);
  //     }
  //   }
  // }, [searchType]);

  // Fungsi untuk handle search dengan debounce
  const handleSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      fetchBOM(itemid);
    }, 300);
  }, [itemid, fetchBOM]);

  // Fungsi untuk handle input change dengan debounce
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setItemid(val);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (val.length >= 2) {
      setShowSuggestions(true);
      searchTimeoutRef.current = setTimeout(() => {
        // fetchSuggestions(val);
      }, 200);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    fetchBOM();
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [fetchBOM]);

  // Fungsi untuk toggle semua accordion
  const toggleAllAccordions = useCallback(() => {
    if (expandedAll.length > 0) {
      // Jika sudah ada yang terbuka, tutup semua
      setExpandedAll([]);
    } else {
      // Jika semua tertutup, buka semua
      const headers = Array.from(new Set(data.map(item => item.itemidHD)));
      setExpandedAll(headers);
    }
  }, [data, expandedAll.length]);

  // Fungsi untuk export ke Excel - DIUBAH untuk nomor yang benar
  const exportToExcel = () => {
    setIsExporting(true);
    try {
      // Buat array untuk seluruh konten worksheet
      const today = new Date();
      const worksheetData = [
        ["LAPORAN BILL OF MATERIALS (BOM)"],
        [`Tanggal Export: ${today.toLocaleDateString('id-ID')} ${today.toLocaleTimeString('id-ID')}`],
        [`Jumlah Data: ${data.length} komponen, ${totalHeaders} produk`],
        [], // Baris kosong
        ["No", "Produk ID", "Nama Produk", "Komponen ID", "Nama Komponen", "Jumlah"],
        ...data.map((item, index) => [
          index + 1, // Nomor urut dimulai dari 1
          item.itemidHD,
          item.itemnamehd,
          item.ItemID,
          item.ItemName,
          item.BahanQty
        ])
      ];

      // Buat worksheet dari array data
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Buat workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data BOM");

      // Atur lebar kolom
      const wscols = [
        { wch: 5 },    // No
        { wch: 15 },   // Produk ID
        { wch: 30 },   // Nama Produk
        { wch: 15 },   // Komponen ID
        { wch: 40 },   // Nama Komponen
        { wch: 10 },   // Jumlah
      ];
      ws['!cols'] = wscols;

      // Merge cells untuk header info
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push(
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Baris 1: Judul
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Baris 2: Tanggal
        { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }  // Baris 3: Jumlah Data
      );

      const fileName = `BOM_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("❌ Gagal export Excel:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Group data untuk tampilan
  const grouped = data.reduce((acc: Record<string, { headerName: string; children: BomData[]; totalComponents: number }>, row) => {
    if (!acc[row.itemidHD]) {
      acc[row.itemidHD] = {
        headerName: row.itemnamehd,
        children: [],
        totalComponents: 0
      };
    }
    acc[row.itemidHD].children.push(row);
    acc[row.itemidHD].totalComponents += 1;
    return acc;
  }, {});

  // Hitung statistik
  const totalHeaders = Object.keys(grouped).length;
  const totalComponents = data.length;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <ListTree className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bill of Materials (BOM)</h1>
            <p className="text-muted-foreground">
              Struktur bahan lengkap untuk semua produk
            </p>
          </div>
        </div>
      </div>

      {/* Kontrol Pencarian */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Pencarian & Filter
          </CardTitle>
          <CardDescription>
            Cari atau filter BOM berdasarkan kriteria tertentu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipe Pencarian</label>
              <div className="flex gap-2">
                <Button
                  variant={searchType === 'itemid' ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSearchType('itemid');
                    setItemid("");
                    setSuggestions([]);
                  }}
                  className="flex-1"
                >
                  <Hash className="h-4 w-4 mr-2" />
                  ID Item
                </Button>
                <Button
                  variant={searchType === 'itemname' ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSearchType('itemname');
                    setItemid("");
                    setSuggestions([]);
                  }}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Nama Item
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    className="pl-10 pr-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  {itemid && (
                    <button
                      onClick={() => {
                        setItemid("");
                        setSuggestions([]);
                        setShowSuggestions(false);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
                
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50">
                    <ScrollArea className="h-60">
                      {suggestions.map((s) => (
                        <div
                          key={s.TransID}
                          className="px-4 py-3 hover:bg-accent cursor-pointer border-b last:border-b-0 transition-colors"
                          onClick={() => {
                            setItemid(searchType === 'itemid' ? s.ItemID : s.ItemName);
                            fetchBOM(searchType === 'itemid' ? s.ItemID : s.ItemName);
                            setShowSuggestions(false);
                          }}
                        >
                          <div className="font-medium flex items-center gap-2">
                            {searchType === 'itemid' ? s.ItemID : s.ItemName}
                            <Badge variant="outline" className="text-xs">
                              {searchType === 'itemid' ? 
                                (s.ItemName.length > 30 ? s.ItemName.substring(0, 30) + '...' : s.ItemName) : 
                                s.ItemID}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                onClick={handleSearch}
                disabled={loading || isSearching}
                className="flex-1"
              >
                {(loading || isSearching) ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Filter className="h-4 w-4 mr-2" />
                )}
                {(loading || isSearching) ? "Memuat..." : "Cari"}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setItemid("");
                fetchBOM();
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Semua
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAllAccordions}
                    className="flex items-center gap-2"
                  >
                    {expandedAll.length > 0 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {expandedAll.length > 0 ? "Tutup Semua" : "Buka Semua"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{expandedAll.length > 0 ? "Tutup semua detail BOM" : "Buka semua detail BOM"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              onClick={exportToExcel}
              disabled={data.length === 0 || isExporting}
              variant="secondary"
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isExporting ? "Mengekspor..." : "Export Excel"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total Produk</p>
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">{totalHeaders}</h3>
                <Badge variant="secondary">Produk</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total Komponen</p>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">{totalComponents}</h3>
                <Badge variant="secondary">Item</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Rata-rata Komponen</p>
                <Box className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">
                  {totalHeaders > 0 ? (totalComponents / totalHeaders).toFixed(1) : 0}
                </h3>
                <Badge variant="outline">per Produk</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Status Tampilan</p>
                {viewMode === 'all' ? 
                  <Eye className="h-4 w-4 text-muted-foreground" /> : 
                  <Filter className="h-4 w-4 text-muted-foreground" />
                }
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  {viewMode === 'all' ? "Semua Data" : "Hasil Filter"}
                </h3>
                <Badge variant={viewMode === 'all' ? "default" : "secondary"}>
                  {viewMode === 'all' ? "Lengkap" : "Difilter"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hasil BOM */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Struktur BOM Lengkap</CardTitle>
            <CardDescription>
              {data.length === 0 ? "Tidak ada data ditemukan" : 
               `Menampilkan semua ${totalHeaders} produk dengan ${totalComponents} komponen`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {data.length > 0 && (
              <>
                <Badge variant="outline" className="px-3 py-1">
                  {totalHeaders} Produk
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  {totalComponents} Komponen
                </Badge>
              </>
            )}
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
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Data BOM tidak ditemukan</h3>
              <p className="text-muted-foreground mb-6">
                {itemid ? `Tidak ada hasil untuk "${itemid}"` : "Belum ada data BOM yang tersedia"}
              </p>
              {itemid && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setItemid("");
                    fetchBOM();
                  }}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tampilkan Semua Data
                </Button>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'filtered' && itemid && (
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Hasil Pencarian</AlertTitle>
                  <AlertDescription className="flex items-center">
                    Menampilkan hasil untuk {itemid}
                    <Button 
                      variant="link" 
                      className="ml-2 p-0 h-auto" 
                      onClick={() => {
                        setItemid("");
                        fetchBOM();
                      }}
                    >
                      Tampilkan semua data
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <Accordion 
                type="multiple" 
                value={expandedAll}
                onValueChange={setExpandedAll}
                className="space-y-4"
              >
                {Object.entries(grouped).map(([hd, group]) => (
                  <AccordionItem key={hd} value={hd} className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-accent/50">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-start text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-lg font-mono bg-primary/10 px-2 py-1 rounded">
                                {hd}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {group.totalComponents} komponen
                              </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground text-left mt-1 max-w-md">
                              {group.headerName}
                            </span>
                          </div>
                        </div>
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
                                  <TableHead>Nama Komponen</TableHead>
                                  <TableHead className="w-24 text-right">Jumlah</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.children.map((row, index: number) => (
                                  <TableRow key={row.TransID} className="hover:bg-muted/50">
                                    <TableCell className="text-center font-medium">
                                      {index + 1}
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-mono text-sm bg-secondary/20 px-2 py-1 rounded">
                                        {row.ItemID}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                        <span title={row.ItemName}>
                                          {row.ItemName}
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
                            <div>
                              Total: <span className="font-semibold">{group.totalComponents}</span> komponen
                            </div>
                            <div className="flex items-center gap-2">
                              <Copy className="h-3 w-3" />
                              <span>ID Produk: <span className="font-mono">{hd}</span></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {data.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Menampilkan <span className="font-semibold">{totalHeaders}</span> produk 
                      dengan <span className="font-semibold">{totalComponents}</span> komponen
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Ke Atas
                      </Button>
                      <Button
                        onClick={exportToExcel}
                        disabled={isExporting}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {isExporting ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Export Data
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}