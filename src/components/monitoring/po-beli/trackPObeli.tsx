/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Loading from "@/app/loading";
import { useEffect, useState, useCallback, Key } from "react";
import { Search, Filter, Calendar, Download, FileText, Package, CheckCircle, AlertCircle, Clock, ChevronDown, ChevronRight, BarChart3, Globe, Home, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
// Tambahkan import untuk xlsx
import * as XLSX from 'xlsx';

interface PORecord {
  orderid: string;
  orderdate: string;
  companyid: string;
  companyname1: string;
  itemid: string;
  itemname: string;
  poprice: number;
  pobags: number;
  pokgs: number;
  moveid: string;
  movedate: string;
  mbags: number;
  mkgs: number;
  transid: string;
  transdate: string;
  nbags: number;
  nkgs: number;
  CompanyInvNo: string;
  currency?: string;
  Curr?: string;
}

interface KartuStockData {
  ItemID: string;
  locid: string;
  MoveDate: string;
  Kegiatan: string;
  Keterangan: string;
  KgI: number;
  KgO: number;
  NoMemo: string;
  Saldo?: number;
}

interface POStatus {
  orderid: string;
  totalItems: number;
  totalBags: number;
  totalKg: number;
  totalReceivedBags: number;
  totalReceivedKg: number;
  progressBags: number;
  progressKg: number;
  status: 'pending' | 'partial' | 'completed' | 'overdue';
  currency: string;
}

// Terjemahan untuk bahasa
const translations = {
  id: {
    // Judul dan deskripsi
    title: "Tracking Purchase Order",
    description: "Monitoring PO Pembelian dengan Kartu Stock Terintegrasi",
    
    // Tab
    listTab: "Daftar PO",
    summaryTab: "Ringkasan",
    
    // Filter
    startDate: "Tanggal Mulai",
    endDate: "Tanggal Akhir",
    poStatus: "Status PO",
    all: "Semua PO",
    purchaseProcess: "Proses Pembelian",
    goodsIn: "Barang Masuk",
    currency: "Mata Uang (Curr)",
    allCurrency: "Semua (Lokal & Impor)",
    local: "Lokal (IDR)",
    import: "Impor (USD)",
    search: "Cari",
    searchPlaceholder: "Cari PO, supplier, barang...",
    searchData: "Cari Data",
    resetFilter: "Reset Filter",
    
    // Status PO
    pending: "Menunggu",
    partial: "Parsial",
    completed: "Selesai",
    overdue: "Terlambat",
    
    // Table headers
    receiptNo: "No. Penerimaan",
    dtmDate: "Tgl DTM",
    bags: "Zak",
    kg: "Kg",
    memoNo: "No. Memo",
    memoDate: "Tgl Memo",
    supplierInvoice: "Invoice Supplier",
    
    // Progress
    progress: "Progress Penerimaan",
    unit: "Satuan",
    remaining: "Sisa",
    received: "Diterima",
    
    // Item info
    supplier: "Supplier",
    poDate: "Tanggal PO",
    currencyLabel: "Mata Uang",
    item: "Item",
    price: "Harga",
    totalReceipt: "Total Penerimaan",
    fromTotalPO: "dari total PO",
    
    // Stock card
    tracking: "Tracking",
    period: "Periode",
    dateRange: "Rentang Tanggal",
    days: "hari",
    warehouse: "Gudang",
    activity: "Kegiatan",
    // description: "Keterangan",
    in: "IN (kg)",
    out: "OUT (kg)",
    balance: "Saldo",
    totalPeriod: "Total Periode",
    totalIn: "Total Masuk",
    totalOut: "Total Keluar",
    finalBalance: "Saldo Akhir",
    transactions: "transaksi",
    average: "Rata-rata",
    net: "Netto",
    per: "Per",
    last: "Terakhir",
    loadStockData: "Muat Kartu Stock",
    loadingStock: "Memuat data kartu stock...",
    stockDataUnavailable: "Data kartu stock belum tersedia",
    refreshStock: "Refresh Data Stock",
    reloading: "Memuat Ulang...",
    
    // Summary
    summaryTitle: "Ringkasan PO Pembelian",
    summaryDescription: "Statistik dan analisis PO periode",
    to: "sampai",
    totalPOs: "Total PO",
    totalLocal: "PO Lokal",
    totalImport: "PO Impor",
    
    // Empty state
    noData: "Tidak ada data PO",
    noDataDescription: "Tidak ditemukan Purchase Order untuk periode yang dipilih.",
    noDataLocal: "Tidak ditemukan Purchase Order Lokal (IDR) untuk periode yang dipilih.",
    noDataImport: "Tidak ditemukan Purchase Order Impor (USD) untuk periode yang dipilih.",
    
    // Export
    exportData: "Export Data",
    
    // Language
    language: "Bahasa",
    indonesian: "Indonesia",
    chinese: "中文 (Chinese)",
    
    // Other
    items: "Item",
    purchaseOrder: "Purchase Order",
  },
  zh: {
    // Judul dan deskripsi
    title: "采购订单跟踪",
    description: "集成库存卡的采购订单监控",
    
    // Tab
    listTab: "订单列表",
    summaryTab: "摘要",
    
    // Filter
    startDate: "开始日期",
    endDate: "结束日期",
    poStatus: "订单状态",
    all: "所有订单",
    purchaseProcess: "采购中",
    goodsIn: "已收货",
    currency: "货币",
    allCurrency: "所有 (本地 & 进口)",
    local: "本地 (IDR)",
    import: "进口 (USD)",
    search: "搜索",
    searchPlaceholder: "搜索订单号、供应商、商品...",
    searchData: "搜索数据",
    resetFilter: "重置筛选",
    
    // Status PO
    pending: "等待中",
    partial: "部分",
    completed: "完成",
    overdue: "逾期",
    
    // Table headers
    receiptNo: "收货单号",
    dtmDate: "收货日期",
    bags: "袋数",
    kg: "公斤",
    memoNo: "备忘录号",
    memoDate: "备忘录日期",
    supplierInvoice: "供应商发票",
    
    // Progress
    progress: "收货进度",
    unit: "单位",
    remaining: "剩余",
    received: "已接收",
    
    // Item info
    supplier: "供应商",
    poDate: "订单日期",
    currencyLabel: "货币",
    item: "商品",
    price: "价格",
    totalReceipt: "总收货",
    fromTotalPO: "占总订单",
    
    // Stock card
    tracking: "跟踪",
    period: "期间",
    dateRange: "日期范围",
    days: "天",
    warehouse: "仓库",
    activity: "活动",
    // description: "说明",
    in: "入库 (公斤)",
    out: "出库 (公斤)",
    balance: "余额",
    totalPeriod: "期间总计",
    totalIn: "总入库",
    totalOut: "总出库",
    finalBalance: "最终余额",
    transactions: "交易",
    average: "平均",
    net: "净额",
    per: "于",
    last: "最后",
    loadStockData: "加载库存卡",
    loadingStock: "正在加载库存数据...",
    stockDataUnavailable: "库存数据不可用",
    refreshStock: "刷新库存数据",
    reloading: "重新加载...",
    
    // Summary
    summaryTitle: "采购订单摘要",
    summaryDescription: "统计分析期间",
    to: "到",
    totalPOs: "总订单数",
    totalLocal: "本地订单",
    totalImport: "进口订单",
    
    // Empty state
    noData: "无订单数据",
    noDataDescription: "所选期间未找到采购订单。",
    noDataLocal: "所选期间未找到本地采购订单 (IDR)。",
    noDataImport: "所选期间未找到进口采购订单 (USD)。",
    
    // Export
    exportData: "导出数据",
    
    // Language
    language: "语言",
    indonesian: "印度尼西亚语",
    chinese: "中文",
    
    // Other
    items: "商品",
    purchaseOrder: "采购订单",
  }
};

type Language = 'id' | 'zh';

export default function MonitoringPOPage() {
  const [data, setData] = useState<PORecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [tgl1, setTgl1] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [tgl2, setTgl2] = useState(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });
  const [filter, setFilter] = useState<"all" | "masuk" | "pembelian">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [stockData, setStockData] = useState<Record<string, KartuStockData[]>>({});
  const [stockLoading, setStockLoading] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("list");
  const [expandedPOs, setExpandedPOs] = useState<Set<string>>(new Set());
  const [expandedStocks, setExpandedStocks] = useState<Record<string, boolean>>({});
  const [progressUnit, setProgressUnit] = useState<"kg" | "bags">("kg");
  const [currencyFilter, setCurrencyFilter] = useState<"all" | "IDR" | "USD">("all");
  const [language, setLanguage] = useState<Language>('id'); // State untuk bahasa

  const t = (key: keyof typeof translations.id) => translations[language][key];

  // Toggle PO expansion
  const togglePO = (orderId: string) => {
    setExpandedPOs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Toggle stock expansion
  const toggleStock = (key: string) => {
    setExpandedStocks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Fungsi untuk mendapatkan currency dari data
  const getCurrencyFromData = (record: PORecord): string => {
    if (record.currency) {
      return record.currency.toUpperCase();
    }
    
    if (record.Curr) {
      return record.Curr.toUpperCase();
    }
    
    const companyName = (record.companyname1 || '').toLowerCase();
    const orderId = (record.orderid || '').toUpperCase();
    const companyId = (record.companyid || '').toUpperCase();
    
    if (
      companyName.includes('import') ||
      companyName.includes('impor') ||
      companyName.includes('internasional') ||
      companyName.includes('asing') ||
      orderId.includes('IMP') ||
      orderId.includes('USD') ||
      companyId.includes('IMP') ||
      companyId.includes('USD')
    ) {
      return 'USD';
    }
    
    return 'IDR';
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/monitoring/po-beli?tgl1=${tgl1}&tgl2=${tgl2}`
      );
      const d = await res.json();
      const processedData = Array.isArray(d) ? d : d.recordset ?? [];
      
      const dataWithCurrency = processedData.map((item: any) => {
        const currency = getCurrencyFromData(item);
        return {
          ...item,
          currency: currency
        };
      });
      
      setData(dataWithCurrency);
    } catch (err) {
      console.error("Gagal fetch data:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [tgl1, tgl2]);

  const fetchStock = useCallback(
    async (orderId: string, item: string, itemid: string, startDate: string, endDate: string) => {
      const key = `${orderId}-${itemid}`;
      if (stockLoading[key]) return;
      
      setStockLoading((prev) => ({ ...prev, [key]: true }));
      try {
        const res = await fetch(
          `/api/kartustock?tgl1=${startDate}&tgl2=${endDate}&item=${encodeURIComponent(
            item
          )}&itemid=${encodeURIComponent(itemid)}`
        );
        const d = await res.json();
        const records: KartuStockData[] = Array.isArray(d)
          ? d
          : d.recordset ?? [];

        let saldo = 0;
        const withSaldo = records.map((r) => {
          saldo += (r.KgI || 0) - (r.KgO || 0);
          return { ...r, Saldo: saldo };
        });

        setStockData((prev) => ({ ...prev, [key]: withSaldo }));
      } catch (err) {
        console.error("Gagal fetch kartu stock:", err);
      } finally {
        setStockLoading((prev) => ({ ...prev, [key]: false }));
      }
    },
    [stockLoading]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Grouping data
  const grouped = data.reduce((acc: Record<string, PORecord[]>, row) => {
    if (!acc[row.orderid]) acc[row.orderid] = [];
    acc[row.orderid].push(row);
    return acc;
  }, {});

  // Calculate PO statuses
  const poStatuses: POStatus[] = Object.entries(grouped).map(([orderId, rows]) => {
    const itemMap = new Map<string, PORecord>();
    
    rows.forEach(row => {
      const key = `${row.itemid}-${row.pobags || 0}-${row.pokgs || 0}`;
      if (!itemMap.has(key)) {
        itemMap.set(key, row);
      }
    });
    
    const uniquePOItems = Array.from(itemMap.values());
    
    const totalBags = uniquePOItems.reduce((sum, r) => sum + (r.pobags || 0), 0);
    const totalKg = uniquePOItems.reduce((sum, r) => sum + (r.pokgs || 0), 0);
    
    const totalReceivedBags = rows.reduce((sum, r) => sum + (r.mbags || 0), 0);
    const totalReceivedKg = rows.reduce((sum, r) => sum + (r.mkgs || 0), 0);
    
    const progressBags = totalBags > 0 ? (totalReceivedBags / totalBags) * 100 : 0;
    const progressKg = totalKg > 0 ? (totalReceivedKg / totalKg) * 100 : 0;
    
    const currentProgress = progressUnit === "kg" ? progressKg : progressBags;

    let status: POStatus['status'] = 'pending';
    if (currentProgress >= 100) status = 'completed';
    else if (currentProgress > 0) status = 'partial';
    
    const orderDate = new Date(rows[0]?.orderdate || new Date());
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (orderDate < sevenDaysAgo && currentProgress < 100) {
      status = 'overdue';
    }

    const currency = rows[0] ? getCurrencyFromData(rows[0]) : 'IDR';

    return {
      orderid: orderId,
      totalItems: Array.from(new Set(rows.map(r => r.itemid))).length,
      totalBags,
      totalKg,
      totalReceivedBags,
      totalReceivedKg,
      progressBags,
      progressKg,
      status,
      currency
    };
  });

  // Filter dan search POs
  const poList = Object.entries(grouped)
    .map(([orderId, rows]) => {
      if (!rows || rows.length === 0) return null;
      
      const itemsMap = new Map();
      
      rows.forEach(r => {
        const key = `${r.itemid}-${r.pobags || 0}-${r.pokgs || 0}`;
        if (!itemsMap.has(key)) {
          itemsMap.set(key, {
            itemid: r.itemid,
            itemname: r.itemname || '',
            poprice: r.poprice || 0,
            pobags: r.pobags || 0,
            pokgs: r.pokgs || 0,
            currency: getCurrencyFromData(r),
            records: [] as PORecord[]
          });
        }
        itemsMap.get(key).records.push(r);
      });
      
      const items = Array.from(itemsMap.values()).map(item => {
        const totalMbags = item.records.reduce((s: number, r: PORecord) => s + (r.mbags || 0), 0);
        const totalMkgs = item.records.reduce((s: number, r: PORecord) => s + (r.mkgs || 0), 0);
        const progressBags = item.pobags > 0 ? (totalMbags / item.pobags) * 100 : 0;
        const progressKg = item.pokgs > 0 ? (totalMkgs / item.pokgs) * 100 : 0;
        
        return {
          ...item,
          totals: { 
            mbags: totalMbags, 
            mkgs: totalMkgs 
          },
          progressBags,
          progressKg
        };
      });

      const adaPenerimaan = items.some(
        (it) => it.totals.mbags > 0 || it.totals.mkgs > 0
      );

      const header = rows[0];
      const headerCurrency = getCurrencyFromData(header);

      return { 
        orderId, 
        header: { ...header, currency: headerCurrency },
        items, 
        adaPenerimaan 
      };
    })
    .filter((po): po is NonNullable<typeof po> => po !== null)
    .filter((po) => {
      if (filter === "all") return true;
      if (filter === "masuk") return po.adaPenerimaan;
      if (filter === "pembelian") return !po.adaPenerimaan;
      return true;
    })
    .filter((po) => {
      if (currencyFilter !== "all") {
        const poCurrency = getCurrencyFromData(po.header);
        return poCurrency === currencyFilter;
      }
      return true;
    })
    .filter((po) => {
      if (!searchTerm.trim()) return true;
      const keyword = searchTerm.toLowerCase();
      return (
        po.header.orderid.toLowerCase().includes(keyword) ||
        (po.header.companyname1?.toLowerCase() || '').includes(keyword) ||
        po.items.some((it) =>
          (it.itemname?.toLowerCase() || '').includes(keyword)
        )
      );
    });

  // Helper function untuk mendapatkan style badge
  const getBadgeStyle = (status: POStatus['status']) => {
    switch (status) {
      case 'pending':
        return { variant: "secondary" as const, className: "gap-1" };
      case 'partial':
        return { variant: "outline" as const, className: "gap-1 border-amber-300 text-amber-700 bg-amber-50" };
      case 'completed':
        return { variant: "outline" as const, className: "gap-1 border-green-300 text-green-700 bg-green-50" };
      case 'overdue':
        return { variant: "destructive" as const, className: "gap-1" };
      default:
        return { variant: "outline" as const, className: "gap-1" };
    }
  };

  const getStatusBadge = (status: POStatus['status']) => {
    const icons = {
      pending: <Clock className="h-3 w-3" />,
      partial: <AlertCircle className="h-3 w-3" />,
      completed: <CheckCircle className="h-3 w-3" />,
      overdue: <AlertCircle className="h-3 w-3" />
    };
    
    const labels = {
      pending: t('pending'),
      partial: t('partial'),
      completed: t('completed'),
      overdue: t('overdue')
    };
    
    const { variant, className } = getBadgeStyle(status);
    
    return (
      <Badge variant={variant} className={className}>
        {icons[status]}
        {labels[status]}
      </Badge>
    );
  };

  // Helper function untuk badge mata uang
  const getCurrencyBadge = (currency: string) => {
    const normalizedCurrency = currency?.toUpperCase() || 'IDR';
    if (normalizedCurrency === 'USD') {
      return (
        <Badge variant="outline" className="gap-1 border-blue-300 text-blue-700 bg-blue-50">
          <Globe className="h-3 w-3" />
          {t('import')}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="gap-1 border-green-300 text-green-700 bg-green-50">
          <Home className="h-3 w-3" />
          {t('local')}
        </Badge>
      );
    }
  };

  const getProgressBadge = (progress: number) => {
    let className = "gap-1";
    
    if (progress >= 100) {
      className = "gap-1 border-green-300 text-green-700 bg-green-50";
    } else if (progress > 0) {
      className = "gap-1 border-amber-300 text-amber-700 bg-amber-50";
    } else {
      className = "gap-1 border-gray-300 text-gray-700 bg-gray-50";
    }
    
    return (
      <Badge variant="outline" className={className}>
        {Math.round(progress)}% {t('received')}
      </Badge>
    );
  };

  // Fungsi untuk ekspor ke Excel
  const exportToExcel = () => {
    try {
      // 1. Buat data untuk worksheet PO Detail
      const poDetailData = poList.flatMap(po => 
        po.items.flatMap(item => 
          item.records.map((record: { moveid: any; movedate: string | number | Date; mbags: any; mkgs: any; transid: any; transdate: string | number | Date; CompanyInvNo: any; }) => ({
            'PO Number': po.header.orderid,
            'PO Date': new Date(po.header.orderdate).toLocaleDateString('id-ID'),
            'Supplier': po.header.companyname1 || '',
            'Currency': po.header.currency || getCurrencyFromData(po.header),
            'Item ID': item.itemid || '',
            'Item Name': item.itemname || '',
            'PO Price': item.poprice || 0,
            'PO Quantity (Bags)': item.pobags || 0,
            'PO Quantity (Kg)': item.pokgs || 0,
            'Receipt Number': record.moveid || '',
            'Receipt Date': record.movedate ? new Date(record.movedate).toLocaleDateString('id-ID') : '',
            'Received Bags': record.mbags || 0,
            'Received Kg': record.mkgs || 0,
            'Memo Number': record.transid || '',
            'Memo Date': record.transdate ? new Date(record.transdate).toLocaleDateString('id-ID') : '',
            'Supplier Invoice': record.CompanyInvNo || '',
            'Progress Bags (%)': Math.round(item.progressBags) || 0,
            'Progress Kg (%)': Math.round(item.progressKg) || 0
          }))
        )
      );

      // 2. Buat data untuk worksheet PO Summary
      const poSummaryData = poList.map(po => {
        const status = poStatuses.find(s => s.orderid === po.orderId);
        const totalPOBags = po.items.reduce((sum, item) => sum + (item.pobags || 0), 0);
        const totalPOKg = po.items.reduce((sum, item) => sum + (item.pokgs || 0), 0);
        const totalReceivedBags = po.items.reduce((sum, item) => sum + (item.totals.mbags || 0), 0);
        const totalReceivedKg = po.items.reduce((sum, item) => sum + (item.totals.mkgs || 0), 0);
        
        return {
          'PO Number': po.header.orderid,
          'PO Date': new Date(po.header.orderdate).toLocaleDateString('id-ID'),
          'Supplier': po.header.companyname1 || '',
          'Currency': po.header.currency || getCurrencyFromData(po.header),
          'Total Items': po.items.length,
          'Total PO Bags': totalPOBags,
          'Total PO Kg': totalPOKg,
          'Total Received Bags': totalReceivedBags,
          'Total Received Kg': totalReceivedKg,
          'Progress Bags (%)': totalPOBags > 0 ? Math.round((totalReceivedBags / totalPOBags) * 100) : 0,
          'Progress Kg (%)': totalPOKg > 0 ? Math.round((totalReceivedKg / totalPOKg) * 100) : 0,
          'Status': status?.status || 'pending',
          'Has Receipt': po.adaPenerimaan ? 'Yes' : 'No'
        };
      });

      // 3. Buat data untuk worksheet Stock Card (jika ada)
      const stockCardData = Object.entries(stockData).flatMap(([key, stockItems]) => {
        const [orderId, itemId] = key.split('-');
        return stockItems.map(stock => ({
          'PO Number': orderId,
          'Item ID': itemId,
          'Warehouse': stock.locid || '',
          'Date': stock.MoveDate ? new Date(stock.MoveDate).toLocaleDateString('id-ID') : '',
          'Activity': stock.Kegiatan || '',
          'Memo Number': stock.NoMemo || '',
          'Description': stock.Keterangan || '',
          'IN (kg)': stock.KgI || 0,
          'OUT (kg)': stock.KgO || 0,
          'Balance': stock.Saldo || 0
        }));
      });

      // 4. Buat workbook dengan multiple worksheets
      const workbook = XLSX.utils.book_new();
      
      // Worksheet 1: PO Detail
      const ws1 = XLSX.utils.json_to_sheet(poDetailData);
      XLSX.utils.book_append_sheet(workbook, ws1, 'PO Detail');
      
      // Worksheet 2: PO Summary
      const ws2 = XLSX.utils.json_to_sheet(poSummaryData);
      XLSX.utils.book_append_sheet(workbook, ws2, 'PO Summary');
      
      // Worksheet 3: Stock Card (jika ada data)
      if (stockCardData.length > 0) {
        const ws3 = XLSX.utils.json_to_sheet(stockCardData);
        XLSX.utils.book_append_sheet(workbook, ws3, 'Stock Card');
      }
      
      // 5. Atur lebar kolom otomatis
      const setAutoWidth = (worksheet: any, data: any[]) => {
        const colWidths = data.reduce((widths, row) => {
          Object.keys(row).forEach((key, idx) => {
            const length = row[key]?.toString().length || 0;
            if (!widths[idx] || length > widths[idx]) {
              widths[idx] = length;
            }
          });
          return widths;
        }, []);
        
        worksheet['!cols'] = colWidths.map((w: number) => ({ 
          width: Math.min(Math.max(w + 2, 10), 50) 
        }));
      };
      
      setAutoWidth(ws1, poDetailData);
      setAutoWidth(ws2, poSummaryData);
      if (stockCardData.length > 0) {
        setAutoWidth(ws2, stockCardData);
      }
      
      // 6. Generate dan download file
      const fileName = `PO-Tracking-${tgl1}-to-${tgl2}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      // Optional: Tambahkan notifikasi
      alert(`${language === 'zh' ? '文件导出成功！' : 'File berhasil diekspor!'}`);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert(`${language === 'zh' ? '导出失败，请重试' : 'Gagal mengekspor, silakan coba lagi'}`);
    }
  };

  // Alternatif: Fungsi untuk ekspor ke CSV (lebih ringan)
  const exportToCSV = () => {
    try {
      // Buat data untuk CSV
      const csvData = poList.flatMap(po => 
        po.items.flatMap(item => 
          item.records.map((record: { moveid: any; movedate: string | number | Date; mbags: any; mkgs: any; transid: any; transdate: string | number | Date; CompanyInvNo: any; }) => ({
            'PO Number': po.header.orderid,
            'PO Date': new Date(po.header.orderdate).toLocaleDateString('id-ID'),
            'Supplier': po.header.companyname1 || '',
            'Currency': po.header.currency || getCurrencyFromData(po.header),
            'Item ID': item.itemid || '',
            'Item Name': item.itemname || '',
            'PO Price': item.poprice || 0,
            'PO Quantity (Bags)': item.pobags || 0,
            'PO Quantity (Kg)': item.pokgs || 0,
            'Receipt Number': record.moveid || '',
            'Receipt Date': record.movedate ? new Date(record.movedate).toLocaleDateString('id-ID') : '',
            'Received Bags': record.mbags || 0,
            'Received Kg': record.mkgs || 0,
            'Memo Number': record.transid || '',
            'Memo Date': record.transdate ? new Date(record.transdate).toLocaleDateString('id-ID') : '',
            'Supplier Invoice': record.CompanyInvNo || ''
          }))
        )
      );

      // Konversi ke CSV string
      const headers = Object.keys(csvData[0] || {}).join(',');
      const rows = csvData.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      const csvString = [headers, ...rows].join('\n');
      
      // Buat blob dan download
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PO-Tracking-${tgl1}-${tgl2}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert(`${language === 'zh' ? '导出失败，请重试' : 'Gagal mengekspor, silakan coba lagi'}`);
    }
  };

  const formatCurrency = (amount: number, currencyCode: string = 'IDR') => {
    try {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } catch (error) {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  // Function untuk render stock card dengan scroll
  const renderStockCard = (orderId: string, itemId: string, itemName: string, orderDate: string) => {
    const key = `${orderId}-${itemId}`;
    const isExpanded = expandedStocks[key] || false;
    
    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      } catch {
        return new Date().toISOString().split('T')[0];
      }
    };

    const today = new Date().toISOString().split('T')[0];
    const poDate = formatDate(orderDate);

    const handleLoadStock = () => {
      fetchStock(orderId, itemName, itemId, poDate, today);
    };

    return (
      <Card key={key} className="mt-4 border border-blue-100">
        <CardHeader 
          className="pb-3 cursor-pointer bg-blue-50" 
          onClick={() => toggleStock(key)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-lg font-semibold text-blue-800">
                  {t('tracking')} - {itemName}
                </CardTitle>
                <CardDescription className="text-xs text-blue-600 mt-1">
                  {t('period')}: {new Date(poDate).toLocaleDateString('id-ID')} - {new Date().toLocaleDateString('id-ID')}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white">
                {t('item')} ID: {itemId}
              </Badge>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0">
            {/* Info Rentang Tanggal */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="text-sm text-blue-700">
                  <span className="font-medium">{t('dateRange')}: </span>
                  {new Date(poDate).toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })} - {new Date().toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
                <div className="text-xs text-blue-600">
                  {Math.ceil((new Date().getTime() - new Date(poDate).getTime()) / (1000 * 3600 * 24))} {t('days')}
                </div>
              </div>
            </div>

            {stockLoading[key] ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">{t('loadingStock')}</p>
              </div>
            ) : stockData[key] ? (
              <>
                {/* Tabel dengan Scroll Horizontal dan Vertikal */}
                <div className="overflow-auto max-h-[400px] border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-blue-50 z-10">
                      <tr>
                        <th className="p-2 text-left font-medium">{t('dtmDate')}</th>
                        <th className="p-2 text-left font-medium">{t('warehouse')}</th>
                        <th className="p-2 text-left font-medium">{t('activity')}</th>
                        <th className="p-2 text-left font-medium">{t('memoNo')}</th>
                        <th className="p-2 text-left font-medium">{t('description')}</th>
                        <th className="p-2 text-right font-medium">{t('in')}</th>
                        <th className="p-2 text-right font-medium">{t('out')}</th>
                        <th className="p-2 text-right font-medium">{t('balance')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockData[key].map((s, idx) => {
                        const kegiatanClass = s.Kegiatan === 'PEMBELIAN' ? 'bg-green-50' : 
                                             s.Kegiatan === 'PRODUKSI' ? 'bg-blue-50' : 
                                             s.Kegiatan === 'PENJUALAN' ? 'bg-red-50' : '';
                        
                        return (
                          <tr key={idx} className={`border-t ${kegiatanClass}`}>
                            <td className="p-2 whitespace-nowrap">
                              {s.MoveDate ? new Date(s.MoveDate).toLocaleDateString('id-ID') : '-'}
                            </td>
                            <td className="p-2">{s.locid}</td>
                            <td className="p-2">
                              <Badge variant="outline" className="text-xs">
                                {s.Kegiatan || '-'}
                              </Badge>
                            </td>
                            <td className="p-2 font-medium">{s.NoMemo || '-'}</td>
                            <td className="p-2 min-w-[200px]">{s.Keterangan || '-'}</td>
                            <td className="p-2 text-right whitespace-nowrap">
                              {s.KgI > 0 ? (
                                <span className="text-green-600 font-medium">
                                  {formatNumber(s.KgI)}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="p-2 text-right whitespace-nowrap">
                              {s.KgO > 0 ? (
                                <span className="text-red-600 font-medium">
                                  {formatNumber(s.KgO)}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="p-2 text-right font-bold whitespace-nowrap">
                              {formatNumber(s.Saldo || 0)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="sticky bottom-0 bg-blue-100 font-semibold">
                      <tr>
                        <td className="p-2" colSpan={5}>{t('totalPeriod')}</td>
                        <td className="p-2 text-right text-green-600 whitespace-nowrap">
                          {formatNumber(stockData[key].reduce((sum, s) => sum + (s.KgI || 0), 0))}
                        </td>
                        <td className="p-2 text-right text-red-600 whitespace-nowrap">
                          {formatNumber(stockData[key].reduce((sum, s) => sum + (s.KgO || 0), 0))}
                        </td>
                        <td className="p-2 text-right whitespace-nowrap">
                          {formatNumber(stockData[key].at(-1)?.Saldo || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                {/* Summary Cards */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Card className="border-green-200">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatNumber(stockData[key].reduce((sum, s) => sum + (s.KgI || 0), 0))}
                        </div>
                        <div className="text-sm text-gray-500">{t('totalIn')}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {stockData[key].filter(s => s.KgI > 0).length} {t('transactions')}
                        </div>
                        <div className="text-xs text-green-600 font-medium mt-2">
                          {stockData[key].length > 0 && (
                            <>{t('average')}: {formatNumber(
                              stockData[key].reduce((sum, s) => sum + (s.KgI || 0), 0) / 
                              Math.max(stockData[key].filter(s => s.KgI > 0).length, 1)
                            )} kg/{language === 'zh' ? '交易' : 'transaksi'}</>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-red-200">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {formatNumber(stockData[key].reduce((sum, s) => sum + (s.KgO || 0), 0))}
                        </div>
                        <div className="text-sm text-gray-500">{t('totalOut')}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {stockData[key].filter(s => s.KgO > 0).length} {t('transactions')}
                        </div>
                        <div className="text-xs text-red-600 font-medium mt-2">
                          {stockData[key].length > 0 && (
                            <>{t('average')}: {formatNumber(
                              stockData[key].reduce((sum, s) => sum + (s.KgO || 0), 0) / 
                              Math.max(stockData[key].filter(s => s.KgO > 0).length, 1)
                            )} kg/{language === 'zh' ? '交易' : 'transaksi'}</>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-blue-200">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatNumber(stockData[key].at(-1)?.Saldo || 0)}
                        </div>
                        <div className="text-sm text-gray-500">{t('finalBalance')}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {stockData[key].at(-1)?.MoveDate ? 
                            `${language === 'zh' ? '截至' : t('per')} ${new Date(stockData[key].at(-1)!.MoveDate).toLocaleDateString('id-ID')}` : 
                            t('last')}
                        </div>
                        <div className="text-xs text-blue-600 font-medium mt-2">
                          {t('net')}: {formatNumber(
                            stockData[key].reduce((sum, s) => sum + (s.KgI || 0), 0) - 
                            stockData[key].reduce((sum, s) => sum + (s.KgO || 0), 0)
                          )} kg
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Tombol Load Data */}
                <div className="mt-4 flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleLoadStock}
                    disabled={stockLoading[key]}
                  >
                    {stockLoading[key] ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-2"></div>
                        {t('reloading')}
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-3 w-3 mr-2" />
                        {t('refreshStock')}
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">{t('stockDataUnavailable')}</p>
                <p className="text-sm text-gray-500 mb-4">
                  {t('period')}: {new Date(poDate).toLocaleDateString('id-ID')} - {new Date().toLocaleDateString('id-ID')}
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleLoadStock}
                  disabled={stockLoading[key]}
                >
                  {stockLoading[key] ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      {language === 'zh' ? '加载中...' : 'Memuat...'}
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {t('loadStockData')}
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  // Render progress bar
  const renderProgressBar = (status: POStatus) => {
    const currentProgress = progressUnit === "kg" ? status.progressKg : status.progressBags;
    const currentTotal = progressUnit === "kg" ? status.totalKg : status.totalBags;
    const currentReceived = progressUnit === "kg" ? status.totalReceivedKg : status.totalReceivedBags;
    const unitLabel = progressUnit === "kg" ? "kg" : language === 'zh' ? "袋" : "zak";
    
    return (
      <div className="mt-3">
        <div className="flex justify-between items-center mb-1">
          <div className="text-sm font-medium">{t('progress')}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{t('unit')}:</span>
            <Select value={progressUnit} onValueChange={(value: "kg" | "bags") => setProgressUnit(value)}>
              <SelectTrigger className="h-6 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kg</SelectItem>
                <SelectItem value="bags">{language === 'zh' ? "袋" : "Zak"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">
            {formatNumber(currentReceived)} / {formatNumber(currentTotal)} {unitLabel}
          </span>
          <span>{Math.round(currentProgress)}%</span>
        </div>
        <Progress value={currentProgress} className="h-2" />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{t('progress')}: {Math.round(currentProgress)}%</span>
          <span>{t('remaining')}: {formatNumber(currentTotal - currentReceived)} {unitLabel}</span>
        </div>
      </div>
    );
  };

  // Render item progress
  const renderItemProgress = (item: any) => {
    const currentProgress = progressUnit === "kg" ? item.progressKg : item.progressBags;
    const currentTotal = progressUnit === "kg" ? item.pokgs : item.pobags;
    const currentReceived = progressUnit === "kg" ? item.totals.mkgs : item.totals.mbags;
    const unitLabel = progressUnit === "kg" ? "kg" : language === 'zh' ? "袋" : "zak";
    
    return (
      <div className="flex items-center gap-3">
        {getProgressBadge(currentProgress)}
        <div className="text-right">
          <div className="text-sm">
            <span className="font-medium">{formatNumber(currentReceived)}</span>
            <span className="text-gray-500"> / {formatNumber(currentTotal)} {unitLabel}</span>
          </div>
          <div className="text-xs text-gray-500">
            {Math.round(currentProgress)}% {t('fromTotalPO')}
          </div>
        </div>
      </div>
    );
  };

  // Statistik untuk summary
  const totalPO = poList.length;
  const totalLokal = poList.filter(po => {
    const currency = getCurrencyFromData(po.header);
    return currency === 'IDR';
  }).length;
  const totalImpor = poList.filter(po => {
    const currency = getCurrencyFromData(po.header);
    return currency === 'USD';
  }).length;
  const totalSelesai = poStatuses.filter(s => s.status === 'completed').length;
  const totalParsial = poStatuses.filter(s => s.status === 'partial').length;
  const totalTerlambat = poStatuses.filter(s => s.status === 'overdue').length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('title')}</h1>
          <p className="text-gray-500">{t('description')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Language Selector */}
          <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
            <SelectTrigger className="w-[180px]">
              <Languages className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('language')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">
                <div className="flex items-center gap-2">
                  <span>🇮🇩</span>
                  {t('indonesian')}
                </div>
              </SelectItem>
              <SelectItem value="zh">
                <div className="flex items-center gap-2">
                  <span>🇨🇳</span>
                  {t('chinese')}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {/* Dropdown untuk pilihan export */}
          <Select onValueChange={(value) => {
            if (value === 'excel') exportToExcel();
            if (value === 'csv') exportToCSV();
          }}>
            <SelectTrigger className="w-[180px]">
              <Download className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('exportData')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excel">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Excel (.xlsx)
                </div>
              </SelectItem>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  CSV (.csv)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="list">
            <FileText className="h-4 w-4 mr-2" />
            {t('listTab')}
          </TabsTrigger>
          <TabsTrigger value="summary">
            <Package className="h-4 w-4 mr-2" />
            {t('summaryTab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filter Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-1 block">{t('startDate')}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={tgl1}
                      onChange={(e) => setTgl1(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-1 block">{t('endDate')}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={tgl2}
                      onChange={(e) => setTgl2(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-1 block">{t('poStatus')}</label>
                  <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder={t('poStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('all')}</SelectItem>
                      <SelectItem value="pembelian">{t('purchaseProcess')}</SelectItem>
                      <SelectItem value="masuk">{t('goodsIn')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <label className="text-sm font-medium mb-1 block">{t('currency')}</label>
                  <Select 
                    value={currencyFilter} 
                    onValueChange={(value: "all" | "IDR" | "USD") => setCurrencyFilter(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('allCurrency')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3" />
                          <Home className="h-3 w-3" />
                          {t('allCurrency')}
                        </div>
                      </SelectItem>
                      <SelectItem value="IDR">
                        <div className="flex items-center gap-2">
                          <Home className="h-3 w-3" />
                          {t('local')}
                        </div>
                      </SelectItem>
                      <SelectItem value="USD">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3" />
                          {t('import')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <label className="text-sm font-medium mb-1 block">{t('search')}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={t('searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-500">
                  {language === 'zh' ? '显示' : 'Menampilkan'} {poList.length} {language === 'zh' ? '个订单，共' : 'dari'} {Object.keys(grouped).length} {t('purchaseOrder')}
                  {currencyFilter !== 'all' && (
                    <span className="ml-2">
                      • {currencyFilter === 'IDR' ? t('local') : t('import')}: {currencyFilter === 'IDR' ? totalLokal : totalImpor}
                    </span>
                  )}
                </div>
                <Button onClick={fetchData}>
                  <Search className="h-4 w-4 mr-2" />
                  {t('searchData')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && <Loading />}

          {/* Empty State */}
          {!loading && poList.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('noData')}</h3>
                <p className="text-gray-500 mb-4">
                  {currencyFilter !== 'all' 
                    ? currencyFilter === 'IDR' ? t('noDataLocal') : t('noDataImport')
                    : t('noDataDescription')}
                </p>
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-gray-600">
                    {language === 'zh' ? '当前筛选：' : 'Filter yang aktif:'} 
                    {currencyFilter !== 'all' && ` ${t('currency')}: ${currencyFilter === 'IDR' ? t('local') : t('import')}`}
                    {filter !== 'all' && `, ${t('poStatus')}: ${filter === 'masuk' ? t('goodsIn') : t('purchaseProcess')}`}
                  </div>
                  <Button onClick={() => {
                    setCurrencyFilter('all');
                    setFilter('all');
                    setSearchTerm('');
                    fetchData();
                  }} variant="outline">
                    {t('resetFilter')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PO List */}
          {!loading && poList.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{language === 'zh' ? '采购订单列表' : 'Daftar Purchase Order'}</h3>
                <div className="text-sm text-gray-500">
                  {language === 'zh' ? '总计' : 'Total'}: {totalPO} {t('purchaseOrder')} • 
                  {language === 'zh' ? ' 本地' : ' Lokal'}: {totalLokal} • 
                  {language === 'zh' ? ' 进口' : ' Impor'}: {totalImpor} • 
                  {language === 'zh' ? ' 完成' : ' Selesai'}: {totalSelesai} • 
                  {language === 'zh' ? ' 部分' : ' Parsial'}: {totalParsial}
                </div>
              </div>
              
              {poList.map((po) => {
                const status = poStatuses.find(s => s.orderid === po.orderId);
                const isExpanded = expandedPOs.has(po.orderId);
                const poCurrency = getCurrencyFromData(po.header);

                return (
                  <div key={po.orderId} className="space-y-4">
                    <Card className="overflow-hidden border hover:shadow-md transition-shadow">
                      <CardHeader 
                        className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors" 
                        onClick={() => togglePO(po.orderId)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <CardTitle className="text-lg font-bold text-blue-700">
                                {po.header.orderid}
                              </CardTitle>
                              {status && getStatusBadge(status.status)}
                              {getCurrencyBadge(poCurrency)}
                              <Badge variant="outline" className="ml-2">
                                {status?.totalItems || 0} {t('items')}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="font-medium">{t('supplier')}:</span> {po.header.companyname1 || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">{t('poDate')}:</span> {new Date(po.header.orderdate).toLocaleDateString('id-ID')}
                              </div>
                              <div>
                                <span className="font-medium">{t('currencyLabel')}:</span> {poCurrency}
                                {po.header.Curr && ` (Curr: ${po.header.Curr})`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {status && renderProgressBar(status)}
                      </CardHeader>
                      
                      {isExpanded && (
                        <CardContent className="pt-0 border-t">
                          <div className="space-y-6 mt-4">
                            {po.items.map((it, idx) => {
                              const totalPOBags = it.pobags || 0;
                              const totalPOKg = it.pokgs || 0;
                              const totalReceivedBags = it.totals.mbags || 0;
                              const totalReceivedKg = it.totals.mkgs || 0;
                              const progressBags = totalPOBags > 0 ? (totalReceivedBags / totalPOBags) * 100 : 0;
                              const progressKg = totalPOKg > 0 ? (totalReceivedKg / totalPOKg) * 100 : 0;

                              return (
                                <div key={`${it.itemid}-${idx}`}>
                                  {/* Item Header */}
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg">
                                    <div>
                                      <h4 className="font-semibold text-gray-800">{it.itemname || (language === 'zh' ? '商品名称未知' : 'Nama Item Tidak Diketahui')}</h4>
                                      <div className="text-sm text-gray-600">
                                        <span>{t('item')} ID: {it.itemid || 'N/A'}</span>
                                        <span className="mx-2">•</span>
                                        <span>{t('price')}: {formatCurrency(it.poprice || 0, it.currency)}</span>
                                        <span className="mx-2">•</span>
                                        <span>{t('purchaseOrder')}: {formatNumber(totalPOBags)} {language === 'zh' ? '袋' : 'zak'} ({formatNumber(totalPOKg)} kg)</span>
                                        <span className="mx-2">•</span>
                                        <span>{t('currencyLabel')}: {it.currency}</span>
                                      </div>
                                    </div>
                                    {renderItemProgress({
                                      ...it,
                                      progressBags,
                                      progressKg
                                    })}
                                  </div>

                                  {/* Detail Table */}
                                  <div className="mt-3 overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="bg-gray-100">
                                          <th className="p-2 text-left font-medium">{t('receiptNo')}</th>
                                          <th className="p-2 text-left font-medium">{t('dtmDate')}</th>
                                          <th className="p-2 text-left font-medium">{t('bags')}</th>
                                          <th className="p-2 text-left font-medium">{t('kg')}</th>
                                          <th className="p-2 text-left font-medium">{t('memoNo')}</th>
                                          <th className="p-2 text-left font-medium">{t('memoDate')}</th>
                                          <th className="p-2 text-left font-medium">{t('supplierInvoice')}</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {it.records.map((r: any, recordIdx: Key | null | undefined) => (
                                          <tr key={recordIdx} className="border-t hover:bg-gray-50">
                                            <td className="p-2 font-medium">{r.moveid || "-"}</td>
                                            <td className="p-2">
                                              {r.movedate ? new Date(r.movedate).toLocaleDateString('id-ID') : "-"}
                                            </td>
                                            <td className="p-2 text-right">{r.mbags || 0}</td>
                                            <td className="p-2 text-right">{formatNumber(r.mkgs || 0)}</td>
                                            <td className="p-2">{r.transid || "-"}</td>
                                            <td className="p-2">
                                              {r.transdate ? new Date(r.transdate).toLocaleDateString('id-ID') : "-"}
                                            </td>
                                            <td className="p-2">{r.CompanyInvNo || "-"}</td>
                                          </tr>
                                        ))}
                                        
                                        {/* Totals Row */}
                                        <tr className="border-t bg-gray-100 font-semibold">
                                          <td className="p-2" colSpan={2}>{t('totalReceipt')}</td>
                                          <td className="p-2 text-right">{it.totals.mbags.toLocaleString('id-ID')}</td>
                                          <td className="p-2 text-right">{formatNumber(it.totals.mkgs)}</td>
                                          <td className="p-2" colSpan={3}>
                                            {Math.round(progressUnit === "kg" ? progressKg : progressBags)}% {t('fromTotalPO')}
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* Render Stock Card */}
                                  {renderStockCard(po.orderId, it.itemid, it.itemname, po.header.orderdate)}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>{t('summaryTitle')}</CardTitle>
              <CardDescription>
                {t('summaryDescription')} {new Date(tgl1).toLocaleDateString('id-ID')} {t('to')} {new Date(tgl2).toLocaleDateString('id-ID')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{totalPO}</div>
                      <div className="text-sm text-gray-500">{t('totalPOs')}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{totalLokal}</div>
                      <div className="text-sm text-gray-500">{t('totalLocal')}</div>
                      <div className="text-xs text-gray-400">(IDR)</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{totalImpor}</div>
                      <div className="text-sm text-gray-500">{t('totalImport')}</div>
                      <div className="text-xs text-gray-400">(USD)</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {totalSelesai}
                      </div>
                      <div className="text-sm text-gray-500">{t('completed')}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        {totalParsial}
                      </div>
                      <div className="text-sm text-gray-500">{t('partial')}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {totalTerlambat}
                      </div>
                      <div className="text-sm text-gray-500">{t('overdue')}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status Overview */}
              {poStatuses.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">{language === 'zh' ? '订单状态' : 'Status PO'}</h4>
                  <div className="space-y-3">
                    {poStatuses.map((status) => (
                      <div key={status.orderid} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="font-medium text-blue-700">{status.orderid}</div>
                            {getStatusBadge(status.status)}
                            {getCurrencyBadge(status.currency)}
                            <div className="text-sm text-gray-600">
                              {status.totalItems} {t('items')} • {formatNumber(status.totalKg)} kg ({formatNumber(status.totalBags)} {language === 'zh' ? '袋' : 'zak'})
                            </div>
                          </div>
                          <div className="flex-1 max-w-md">
                            <div className="flex justify-between text-sm mb-1">
                              <span>{t('progress')}: {Math.round(progressUnit === "kg" ? status.progressKg : status.progressBags)}%</span>
                              <span className="font-medium">
                                {formatNumber(progressUnit === "kg" ? status.totalReceivedKg : status.totalReceivedBags)} / {formatNumber(progressUnit === "kg" ? status.totalKg : status.totalBags)} {progressUnit === "kg" ? "kg" : language === 'zh' ? "袋" : "zak"}
                              </span>
                            </div>
                            <Progress value={progressUnit === "kg" ? status.progressKg : status.progressBags} className="h-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}