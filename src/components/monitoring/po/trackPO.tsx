/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Filter,
  Search,
  Package,
  Truck,
  Factory,
  ShoppingCart,
  ChevronDown,
  Loader2,
  RefreshCw,
  FileText,
  Download,
  BarChart3,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  AlertCircle,
  Layers,
  Hash
} from "lucide-react";
import * as XLSX from 'xlsx';
import UpdateNoPOButton from "@/components/poButton";

interface TrackingRow {
  SPK: string;
  tanggal_planning: string;
  Nama_PO: string;
  item_po: string;
  status_produksi: string;
  item_produksi: string | null;
  qty: number | null;
  departemen: string | null;
  tanggal_produksi: string | null;
  qty_po: number | null;
  NamaJenis?: string | null;
  Nama_PO_Kirim?: string | null;
  tanggal_kirim?: string | null;
  status_kirim?: string | null;
  additionalDates?: string[];
}

interface BomData {
  TransID: number;
  ItemidHD: string;
  itemnamehd: string;
  ItemID: string;
  ItemName: string;
  BahanQty: number;
  Departemen: string;
  NamaJenis: string;
}

interface GroupedData {
  [key: string]: {
    info: {
      tanggal_planning: string;
      Nama_PO: string;
    };
    itemsPO: TrackingRow[];
    itemsHasil: TrackingRow[];
    itemsBahan: TrackingRow[];
  };
}

interface SummaryStats {
  totalSPK: number;
  totalPO: number;
  totalItems: number;
  completedProduction: number;
  pendingProduction: number;
  completedDelivery: number;
  pendingDelivery: number;
}

export default function TrackingTree() {
  const [data, setData] = useState<TrackingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [start, setStart] = useState<string>(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [end, setEnd] = useState<string>(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [expandedSPKs, setExpandedSPKs] = useState<Set<string>>(new Set());
  const [openBOM, setOpenBOM] = useState<Record<string, boolean>>({});
  const [bomData, setBomData] = useState<Record<string, BomData[]>>({});
  const [bomLoading, setBomLoading] = useState<Record<string, boolean>>({});
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalSPK: 0,
    totalPO: 0,
    totalItems: 0,
    completedProduction: 0,
    pendingProduction: 0,
    completedDelivery: 0,
    pendingDelivery: 0
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      if (search) params.append('search', search);

      const res = await fetch(`/api/monitoring/po?${params}`);
      const json = await res.json();
      
      if (json.success) {
        setData(json.data);
      } else {
        console.error("Gagal load data:", json.message);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [start, end, search]);

  useEffect(() => {
    loadData();
  }, []);

  // Filter data berdasarkan status dan departemen
  const filtered = useMemo(() => {
    return data.filter((row) => {
      if (!search && statusFilter === "ALL" && deptFilter === "ALL") return true;

      const q = search.toLowerCase();
      const rowStr = [
        row.SPK,
        row.Nama_PO,
        row.item_po,
        row.item_produksi,
        row.departemen,
        row.status_produksi,
        row.status_kirim,
        row.tanggal_planning,
        row.tanggal_produksi,
        row.tanggal_kirim,
      ]
        .map((v) => (v ?? "").toString().toLowerCase())
        .join(" ");

      const matchSearch = !search || rowStr.includes(q);
      const matchStatus = statusFilter === "ALL" || row.status_produksi === statusFilter;
      const matchDept = deptFilter === "ALL" || row.departemen === deptFilter;

      return matchSearch && matchStatus && matchDept;
    });
  }, [data, search, statusFilter, deptFilter]);

  // Fungsi untuk mengelompokkan dan menjumlahkan item
  const groupAndSumItems = (items: TrackingRow[], isBahan: boolean = false) => {
    const groupedMap = new Map<string, TrackingRow>();
    
    items.forEach(item => {
      if (!item.item_produksi) return;
      
      // Buat key unik berdasarkan item_produksi dan departemen
      const key = `${item.item_produksi}_${item.departemen || ''}`;
      
      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!;
        existing.qty = (existing.qty || 0) + (item.qty || 0);
        
        // Tambahkan tanggal ke dalam array jika ada
        if (item.tanggal_produksi && !existing.additionalDates?.includes(item.tanggal_produksi)) {
          existing.additionalDates = [
            ...(existing.additionalDates || []),
            item.tanggal_produksi
          ];
        }
        
        // Untuk hasil produksi, update status kirim jika ada
        if (!isBahan && item.status_kirim && item.tanggal_kirim) {
          // Ambil tanggal kirim terbaru
          if (!existing.tanggal_kirim || new Date(item.tanggal_kirim) > new Date(existing.tanggal_kirim)) {
            existing.status_kirim = item.status_kirim;
            existing.tanggal_kirim = item.tanggal_kirim;
          }
        }
      } else {
        // Jika belum ada, tambahkan sebagai item baru dengan properti additionalDates
        groupedMap.set(key, {
          ...item,
          additionalDates: []
        });
      }
    });
    
    return Array.from(groupedMap.values());
  };

  // Group data by SPK
  const grouped: GroupedData = useMemo(() => {
    const result: GroupedData = {};
    
    filtered.forEach((row) => {
      if (!result[row.SPK]) {
        result[row.SPK] = {
          info: {
            tanggal_planning: row.tanggal_planning,
            Nama_PO: row.Nama_PO,
          },
          itemsPO: [],
          itemsHasil: [],
          itemsBahan: [],
        };
      }

      const existsPO = result[row.SPK].itemsPO.some(
        (x) => x.item_po === row.item_po && x.qty_po === row.qty_po
      );
      
      if (!existsPO) {
        result[row.SPK].itemsPO.push(row);
      }

      if (row.item_produksi) {
        if (row.NamaJenis === "B") {
          result[row.SPK].itemsBahan.push(row);
        } else {
          result[row.SPK].itemsHasil.push(row);
        }
      }
    });

    // Setelah semua data terkumpul, kelompokkan dan jumlahkan
    Object.keys(result).forEach(spk => {
      result[spk].itemsBahan = groupAndSumItems(result[spk].itemsBahan, true);
      result[spk].itemsHasil = groupAndSumItems(result[spk].itemsHasil, false);
    });

    return result;
  }, [filtered]);

  // Calculate summary statistics
  useEffect(() => {
    const stats: SummaryStats = {
      totalSPK: 0,
      totalPO: 0,
      totalItems: 0,
      completedProduction: 0,
      pendingProduction: 0,
      completedDelivery: 0,
      pendingDelivery: 0
    };

    const uniqueSPKs = new Set<string>();
    const uniquePOs = new Set<string>();
    const uniqueItems = new Set<string>();

    data.forEach((row) => {
      uniqueSPKs.add(row.SPK);
      uniquePOs.add(row.Nama_PO);
      uniqueItems.add(row.item_po);

      if (row.status_produksi === "Sudah Produksi") {
        stats.completedProduction++;
      } else if (row.status_produksi === "Belum Produksi" || row.status_produksi === "Proses Produksi") {
        stats.pendingProduction++;
      }

      if (row.status_kirim === "Sudah Kirim") {
        stats.completedDelivery++;
      } else if (row.status_kirim === "Belum Kirim") {
        stats.pendingDelivery++;
      }
    });

    stats.totalSPK = uniqueSPKs.size;
    stats.totalPO = uniquePOs.size;
    stats.totalItems = uniqueItems.size;

    setSummaryStats(stats);
  }, [data]);

  const formatDate = useCallback((dateStr: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

const formatDateRange = useCallback((dateStr: string | null, additionalDates?: string[]) => {
  if (!dateStr && (!additionalDates || additionalDates.length === 0)) return "-";
  
  const allDates = [dateStr, ...(additionalDates || [])].filter(Boolean) as string[];
  
  // Gunakan Array.from untuk mengonversi Set menjadi array
  const uniqueDates = Array.from(new Set(allDates)); // Hapus duplikat
  
  if (uniqueDates.length === 1) {
    return formatDate(uniqueDates[0]);
  } else {
    // Urutkan tanggal
    const sortedDates = uniqueDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    // Jika tanggal berurutan, tampilkan rentang
    if (sortedDates.length === 2) {
      return `${formatDate(sortedDates[0])} - ${formatDate(sortedDates[1])}`;
    } else {
      // Jika banyak tanggal, tampilkan yang pertama dan jumlah lainnya
      return `${formatDate(sortedDates[0])} (+${sortedDates.length - 1} tanggal)`;
    }
  }
}, [formatDate]);

  const mapDept = useCallback((code: string | null) => {
    if (!code) return "-";
    const dict: Record<string, string> = {
      SP: "Spray",
      IN: "Injeksi",
      MO: "Molding",
      AS: "Assembly",
      PL: "Plating",
    };
    return dict[code] || code;
  }, []);

  const toggleBOM = useCallback(async (key: string, item_po: string) => {
    if (openBOM[key]) {
      setOpenBOM((prev) => ({ ...prev, [key]: false }));
      return;
    }
    
    if (!bomData[key]) {
      setBomLoading((prev) => ({ ...prev, [key]: true }));
      try {
        const res = await fetch(`/api/bom?itemid=${item_po}`);
        const json: BomData[] = await res.json();
        setBomData((prev) => ({ ...prev, [key]: json }));
      } catch (err) {
        console.error(err);
      }
      setBomLoading((prev) => ({ ...prev, [key]: false }));
    }
    
    setOpenBOM((prev) => ({ ...prev, [key]: true }));
  }, [openBOM, bomData]);

  const toggleSPK = useCallback((spk: string) => {
    setExpandedSPKs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(spk)) {
        newSet.delete(spk);
      } else {
        newSet.add(spk);
      }
      return newSet;
    });
  }, []);

  const getStatusBadge = useCallback((status: string | null | undefined) => {
    if (!status) return null;
    
    switch (status) {
      case 'Sudah Produksi':
      case 'Sudah Kirim':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
      case 'Belum Produksi':
      case 'Belum Kirim':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
      case 'Proses Produksi':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  }, []);

  const getDeptBadge = useCallback((dept: string | null) => {
    const deptName = mapDept(dept);
    if (!deptName || deptName === '-') return null;
    
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700">
        <Factory className="h-3 w-3 mr-1" />
        {deptName}
      </Badge>
    );
  }, [mapDept]);

  const exportToExcel = useCallback(() => {
    try {
      // Siapkan data untuk export dengan format yang sudah dikelompokkan
      const exportData: any[] = [];
      
      Object.entries(grouped).forEach(([spk, spkData]) => {
        // Item PO
        spkData.itemsPO.forEach(poItem => {
          exportData.push({
            'SPK': spk,
            'Tanggal Planning': formatDate(spkData.info.tanggal_planning),
            'Nama PO': spkData.info.Nama_PO,
            'Jenis': 'ORDER',
            'Item': poItem.item_po,
            'Qty': poItem.qty_po,
            'Status Produksi': poItem.status_produksi,
            'Departemen': '-',
            'Tanggal Produksi': '-',
            'Status Kirim': '-',
            'Tanggal Kirim': '-'
          });
        });
        
        // Bahan Produksi
        spkData.itemsBahan.forEach(bahan => {
          const allDates = [bahan.tanggal_produksi, ...(bahan.additionalDates || [])].filter(Boolean);
          exportData.push({
            'SPK': spk,
            'Tanggal Planning': formatDate(spkData.info.tanggal_planning),
            'Nama PO': spkData.info.Nama_PO,
            'Jenis': 'BAHAN',
            'Item': bahan.item_produksi,
            'Qty': bahan.qty,
            'Status Produksi': bahan.status_produksi,
            'Departemen': mapDept(bahan.departemen),
            'Tanggal Produksi': formatDateRange(bahan.tanggal_produksi, bahan.additionalDates),
            'Detail Tanggal': allDates.map(date => formatDate(date)).join(', '),
            'Status Kirim': '-',
            'Tanggal Kirim': '-'
          });
        });
        
        // Hasil Produksi
        spkData.itemsHasil.forEach(hasil => {
          const allDates = [hasil.tanggal_produksi, ...(hasil.additionalDates || [])].filter(Boolean);
          exportData.push({
            'SPK': spk,
            'Tanggal Planning': formatDate(spkData.info.tanggal_planning),
            'Nama PO': spkData.info.Nama_PO,
            'Jenis': 'HASIL',
            'Item': hasil.item_produksi,
            'Qty': hasil.qty,
            'Status Produksi': hasil.status_produksi,
            'Departemen': mapDept(hasil.departemen),
            'Tanggal Produksi': formatDateRange(hasil.tanggal_produksi, hasil.additionalDates),
            'Detail Tanggal': allDates.map(date => formatDate(date)).join(', '),
            'Status Kirim': hasil.status_kirim || '-',
            'Tanggal Kirim': formatDate(hasil.tanggal_kirim || null)
          });
        });
      });

      // Create workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tracking Produksi');

      // Download file
      const fileName = `Tracking_Produksi_${start}_to_${end}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Gagal mengekspor data ke Excel');
    }
  }, [grouped, start, end, formatDate, formatDateRange, mapDept]);

  const renderCardView = useMemo(() => {
    return (
      <div className="space-y-4">
        {Object.entries(grouped).map(([spk, spkData]) => {
          const isExpanded = expandedSPKs.has(spk);
          const hasProduksi = spkData.itemsHasil.length > 0 || spkData.itemsBahan.length > 0;
          
          return (
            <Card key={spk} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSPK(spk)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Hash className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">SPK: {spk}</CardTitle>
                        <CardDescription className="mt-1">
                          PO: {spkData.info.Nama_PO} • Planning: {formatDate(spkData.info.tanggal_planning)}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="secondary">
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        {spkData.itemsPO.length} Item PO
                      </Badge>
                      {hasProduksi && (
                        <>
                          {spkData.itemsBahan.length > 0 && (
                            <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">
                              <Package className="h-3 w-3 mr-1" />
                              {spkData.itemsBahan.length} Bahan
                            </Badge>
                          )}
                          {spkData.itemsHasil.length > 0 && (
                            <Badge variant="secondary" className="bg-green-50 text-green-700">
                              <Factory className="h-3 w-3 mr-1" />
                              {spkData.itemsHasil.length} Hasil
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    {isExpanded ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Tutup
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Detail
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0 border-t">
                  {/* Item PO Section */}
                  <div className="mt-4">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-blue-600" />
                      Item Order
                    </h4>
                    
                    <div className="space-y-3">
                      {spkData.itemsPO.map((row, index) => {
                        const key = `${spk}-${row.item_po}`;
                        
                        return (
                          <div key={index} className="p-3 border rounded-lg hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium">{row.item_po}</div>
                                <div className="text-sm text-gray-500">
                                  Qty PO: {row.qty_po} unit
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => toggleBOM(key, row.item_po)}
                              >
                                {openBOM[key] ? (
                                  <>
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    Tutup BOM
                                  </>
                                ) : (
                                  <>
                                    <Layers className="h-3 w-3 mr-1" />
                                    Lihat BOM
                                  </>
                                )}
                              </Button>
                            </div>
                            
                            {/* BOM Details */}
                            {openBOM[key] && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <Layers className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium">Bill of Materials</span>
                                </div>
                                
                                {bomLoading[key] ? (
                                  <div className="text-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Memuat BOM...</p>
                                  </div>
                                ) : bomData[key] && bomData[key].length > 0 ? (
                                  <div className="space-y-2">
                                    {bomData[key].map((bom, bomIndex) => (
                                      <div key={bomIndex} className="p-2 bg-white rounded border">
                                        <div className="flex justify-between items-center">
                                          <div>
                                            <div className="font-medium text-sm">{bom.ItemName}</div>
                                            <div className="text-xs text-gray-500">{bom.ItemID}</div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-sm font-medium">{bom.BahanQty} unit</div>
                                            <Badge variant="outline" className="text-xs">
                                              {mapDept(bom.Departemen)}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">Tidak ada data BOM</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Production Section */}
                  {(spkData.itemsBahan.length > 0 || spkData.itemsHasil.length > 0) && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Factory className="h-5 w-5 text-green-600" />
                        Proses Produksi
                      </h4>

                      {/* Bahan Baku */}
                      {spkData.itemsBahan.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium mb-2 text-sm text-gray-600">Bahan Baku:</h5>
                          <div className="space-y-2">
                            {spkData.itemsBahan.map((row, index) => {
                              const totalProduksi = 1 + (row.additionalDates?.length || 0);
                              return (
                                <div key={index} className="p-3 border rounded-lg bg-yellow-50">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium">{row.item_produksi}</div>
                                      <div className="text-sm text-gray-600 mt-1">
                                        {getDeptBadge(row.departemen)}
                                      </div>
                                      {totalProduksi > 1 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {totalProduksi} kali produksi
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold">{row.qty} unit</div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {formatDateRange(row.tanggal_produksi, row.additionalDates)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Hasil Produksi */}
                      {spkData.itemsHasil.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2 text-sm text-gray-600">Hasil Produksi:</h5>
                          <div className="space-y-3">
                            {spkData.itemsHasil.map((row, index) => {
                              const totalProduksi = 1 + (row.additionalDates?.length || 0);
                              return (
                                <div key={index} className="p-3 border rounded-lg bg-green-50">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <div className="font-medium">{row.item_produksi}</div>
                                      <div className="text-sm text-gray-600 mt-1">
                                        {getDeptBadge(row.departemen)}
                                      </div>
                                      {totalProduksi > 1 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {totalProduksi} kali produksi
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold">{row.qty} unit</div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {formatDateRange(row.tanggal_produksi, row.additionalDates)}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {getStatusBadge(row.status_produksi)}
                                    {getStatusBadge(row.status_kirim)}
                                  </div>
                                  
                                  <div className="mt-2 text-xs text-gray-500">
                                    {row.tanggal_kirim && (
                                      <div className="flex items-center gap-1">
                                        <Truck className="h-3 w-3" />
                                        Kirim: {formatDate(row.tanggal_kirim)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    );
  }, [grouped, expandedSPKs, openBOM, bomData, bomLoading, formatDate, formatDateRange, mapDept, getStatusBadge, getDeptBadge, toggleBOM, toggleSPK]);

  const renderTableView = useMemo(() => {
    return (
      <div className="space-y-4">
        {Object.entries(grouped).map(([spk, spkData]) => {
          const isExpanded = expandedSPKs.has(spk);
          
          return (
            <Card key={spk}>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSPK(spk)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="h-5 w-5 text-blue-600" />
                      SPK: {spk}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {spkData.info.Nama_PO} • Planning: {formatDate(spkData.info.tanggal_planning)}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    {isExpanded ? "Tutup Detail" : "Lihat Detail"}
                  </Button>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0 border-t">
                  {/* PO Items Table */}
                  <div className="mt-4">
                    <h4 className="font-semibold mb-3">Item Order</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-2 text-left font-medium">Item PO</th>
                            <th className="p-2 text-left font-medium">Qty PO</th>
                            <th className="p-2 text-left font-medium">BOM</th>
                          </tr>
                        </thead>
                        <tbody>
                          {spkData.itemsPO.map((row, index) => {
                            const key = `${spk}-${row.item_po}`;
                            
                            return (
                              <>
                                <tr key={index} className="border-t hover:bg-gray-50">
                                  <td className="p-3">{row.item_po}</td>
                                  <td className="p-3">{row.qty_po}</td>
                                  <td className="p-3">
                                    <Button 
                                      variant="link" 
                                      className="h-auto p-0"
                                      onClick={() => toggleBOM(key, row.item_po)}
                                    >
                                      {openBOM[key] ? "Tutup BOM" : "Lihat BOM"}
                                    </Button>
                                  </td>
                                </tr>
                                
                                {openBOM[key] && (
                                  <tr>
                                    <td colSpan={3} className="p-3">
                                      {bomLoading[key] ? (
                                        <div className="text-center py-4">
                                          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                                        </div>
                                      ) : (
                                        <div className="bg-blue-50 p-3 rounded-lg">
                                          <h5 className="font-medium mb-2">Bill of Materials</h5>
                                          <table className="w-full text-sm">
                                            <thead>
                                              <tr className="bg-blue-100">
                                                <th className="p-2 text-left">Item</th>
                                                <th className="p-2 text-left">Departemen</th>
                                                <th className="p-2 text-left">Jenis</th>
                                                <th className="p-2 text-left">Qty</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {bomData[key]?.map((bom, bomIndex) => (
                                                <tr key={bomIndex} className="border-t">
                                                  <td className="p-2">
                                                    <div>{bom.ItemName}</div>
                                                    <div className="text-xs text-gray-500">{bom.ItemID}</div>
                                                  </td>
                                                  <td className="p-2">{mapDept(bom.Departemen)}</td>
                                                  <td className="p-2">{bom.NamaJenis}</td>
                                                  <td className="p-2">{bom.BahanQty}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Production Results */}
                  {(spkData.itemsBahan.length > 0 || spkData.itemsHasil.length > 0) && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Hasil Produksi</h4>
                      
                      {/* Bahan Baku */}
                      {spkData.itemsBahan.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-600 mb-2">Bahan Baku:</h5>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-yellow-50">
                                  <th className="p-2 text-left font-medium">Item</th>
                                  <th className="p-2 text-left font-medium">Qty</th>
                                  <th className="p-2 text-left font-medium">Departemen</th>
                                  <th className="p-2 text-left font-medium">Tanggal Produksi</th>
                                  <th className="p-2 text-left font-medium">Jumlah Produksi</th>
                                </tr>
                              </thead>
                              <tbody>
                                {spkData.itemsBahan.map((row, index) => {
                                  const totalProduksi = 1 + (row.additionalDates?.length || 0);
                                  return (
                                    <tr key={index} className="border-t hover:bg-yellow-50">
                                      <td className="p-3">{row.item_produksi}</td>
                                      <td className="p-3 font-medium">{row.qty}</td>
                                      <td className="p-3">{mapDept(row.departemen)}</td>
                                      <td className="p-3">
                                        <div className="flex flex-col">
                                          {formatDateRange(row.tanggal_produksi, row.additionalDates)}
                                          {row.additionalDates && row.additionalDates.length > 0 && (
                                            <span className="text-xs text-gray-500">
                                              {row.additionalDates.map(date => formatDate(date)).join(', ')}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        <Badge variant="outline">
                                          {totalProduksi} kali
                                        </Badge>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Hasil Produksi */}
                      {spkData.itemsHasil.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-600 mb-2">Hasil Produksi:</h5>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-green-50">
                                  <th className="p-2 text-left font-medium">Item</th>
                                  <th className="p-2 text-left font-medium">Status Produksi</th>
                                  <th className="p-2 text-left font-medium">Qty</th>
                                  <th className="p-2 text-left font-medium">Departemen</th>
                                  <th className="p-2 text-left font-medium">Tanggal Produksi</th>
                                  <th className="p-2 text-left font-medium">Status Kirim</th>
                                  <th className="p-2 text-left font-medium">Tanggal Kirim</th>
                                </tr>
                              </thead>
                              <tbody>
                                {spkData.itemsHasil.map((row, index) => {
                                  const totalProduksi = 1 + (row.additionalDates?.length || 0);
                                  return (
                                    <tr key={index} className="border-t hover:bg-green-50">
                                      <td className="p-3">{row.item_produksi}</td>
                                      <td className="p-3">{getStatusBadge(row.status_produksi)}</td>
                                      <td className="p-3 font-medium">{row.qty}</td>
                                      <td className="p-3">{mapDept(row.departemen)}</td>
                                      <td className="p-3">
                                        <div className="flex flex-col">
                                          {formatDateRange(row.tanggal_produksi, row.additionalDates)}
                                          {row.additionalDates && row.additionalDates.length > 0 && (
                                            <span className="text-xs text-gray-500">
                                              {totalProduksi} kali produksi
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-3">{getStatusBadge(row.status_kirim)}</td>
                                      <td className="p-3">{formatDate(row.tanggal_kirim || null)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    );
  }, [grouped, expandedSPKs, openBOM, bomData, bomLoading, formatDate, formatDateRange, mapDept, getStatusBadge, toggleBOM, toggleSPK]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Factory className="h-8 w-8 text-blue-600" />
            Tracking Production Order
          </h1>
          <p className="text-gray-500 mt-1">Monitoring dan tracking proses produksi dari PO hingga pengiriman</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={viewMode} onValueChange={(value: "table" | "card") => setViewMode(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih Tampilan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="table">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Tabel
                </div>
              </SelectItem>
              <SelectItem value="card">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Kartu
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>
      
      <UpdateNoPOButton/>
      
      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Data
          </CardTitle>
          <CardDescription>Filter data berdasarkan periode dan kriteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <Label htmlFor="start">Tanggal Awal</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="start"
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <Label htmlFor="end">Tanggal Akhir</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="end"
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <Label htmlFor="status">Status Produksi</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="Sudah Produksi">Sudah Produksi</SelectItem>
                  <SelectItem value="Belum Produksi">Belum Produksi</SelectItem>
                  <SelectItem value="Proses Produksi">Proses Produksi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label htmlFor="dept">Departemen</Label>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger id="dept">
                  <SelectValue placeholder="Semua Departemen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Departemen</SelectItem>
                  <SelectItem value="SP">Spray</SelectItem>
                  <SelectItem value="IN">Injeksi</SelectItem>
                  <SelectItem value="MO">Molding</SelectItem>
                  <SelectItem value="AS">Assembly</SelectItem>
                  <SelectItem value="PL">Plating</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-6">
              <Label htmlFor="search">Pencarian</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Cari SPK, PO, Item..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:col-span-6 flex items-end gap-2">
              <Button onClick={loadData} className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Cari Data
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => {
                const firstDay = new Date();
                firstDay.setDate(1);
                setStart(firstDay.toISOString().split('T')[0]);
                setEnd(new Date().toISOString().split('T')[0]);
                setSearch("");
                setStatusFilter("ALL");
                setDeptFilter("ALL");
              }}>
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summaryStats.totalSPK}</div>
              <div className="text-sm text-gray-500">Total SPK</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summaryStats.totalPO}</div>
              <div className="text-sm text-gray-500">Order</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{summaryStats.totalItems}</div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summaryStats.completedProduction}</div>
              <div className="text-sm text-gray-500">Selesai Produksi</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summaryStats.pendingProduction}</div>
              <div className="text-sm text-gray-500">Pending Produksi</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summaryStats.completedDelivery}</div>
              <div className="text-sm text-gray-500">Selesai Kirim</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summaryStats.pendingDelivery}</div>
              <div className="text-sm text-gray-500">Pending Kirim</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {summaryStats.totalSPK > 0 
                  ? Math.round((summaryStats.completedProduction / summaryStats.totalItems) * 100) 
                  : 0}%
              </div>
              <div className="text-sm text-gray-500">Progress Produksi</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak ada data</h3>
            <p className="text-gray-500 mb-4">
              Tidak ditemukan data tracking untuk periode yang dipilih.
            </p>
            <Button onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-2">
            <TabsTrigger value="list">
              <FileText className="h-4 w-4 mr-2" />
              Daftar Tracking
            </TabsTrigger>
            <TabsTrigger value="summary">
              <BarChart3 className="h-4 w-4 mr-2" />
              Ringkasan
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">
                  Menampilkan {Object.keys(grouped).length} SPK dari {filtered.length} data
                </h3>
                <div className="text-sm text-gray-500 mt-1">
                  Klik pada header SPK untuk melihat detail
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Mode: {viewMode === "table" ? "Tabel" : "Kartu"}
              </div>
            </div>
            
            {viewMode === "table" ? renderTableView : renderCardView}
          </TabsContent>
          
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Produksi</CardTitle>
                <CardDescription>
                  Analisis dan statistik periode {formatDate(start)} - {formatDate(end)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Production Progress */}
                  <div>
                    <h4 className="font-semibold text-lg mb-4">Progress Produksi</h4>
                    <div className="space-y-4">
                      {Object.entries(grouped).map(([spk, spkData]) => {
                        const progress = spkData.itemsHasil.length > 0 ? 100 : 0;
                        
                        return (
                          <div key={spk} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <div className="font-medium">SPK: {spk}</div>
                                <div className="text-sm text-gray-500">{spkData.info.Nama_PO}</div>
                              </div>
                              <Badge variant={progress === 100 ? "outline" : "secondary"}>
                                {progress === 100 ? "Selesai" : "Belum Produksi"}
                              </Badge>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>{spkData.itemsPO.length} Item PO</span>
                              <span>{spkData.itemsHasil.length} Hasil Produksi</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Department Distribution */}
                  <div>
                    <h4 className="font-semibold text-lg mb-4">Distribusi per Departemen</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {['SP', 'IN', 'MO', 'AS', 'PL'].map((dept) => {
                        const count = filtered.filter(row => row.departemen === dept).length;
                        
                        return (
                          <Card key={dept}>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <div className="text-2xl font-bold">{count}</div>
                                <div className="text-sm text-gray-500">{mapDept(dept)}</div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}