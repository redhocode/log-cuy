/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Filter, Search, FileText, Download, Package, AlertCircle, CheckCircle, Clock, RefreshCw, Loader2, ChevronDown, ChevronRight, Building, Hash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import * as XLSX from 'xlsx';

interface SOData {
  orderid: string;
  ordertype: string;
  orderdate: string;
  companyid: string;
  companyname1: string;
  itemid: string;
  itemname: string;
  sobags: number;
  sokgs: number;
  nota: string;
  movedate: string;
  mbags: number;
  mkgs: number;
  spb: string;
  SuratJln: string;
  moveid: string;
  docid?: string;
  status?: 'pending' | 'partial' | 'complete';
}

interface SummaryStats {
  totalSO: number;
  totalItems: number;
  totalCustomers: number;
  totalKg: number;
  totalBags: number;
  pending: number;
  partial: number;
  complete: number;
}

interface GroupedBySOCustomer {
  [key: string]: {
    orderId: string;
    companyName: string;
    companyId: string;
    orderDate: string;
    rows: SOData[];
    totalItems: number;
    totalBags: number;
    totalKg: number;
    deliveredBags: number;
    deliveredKg: number;
    progress: number;
    status: 'pending' | 'partial' | 'complete';
  }
}

export default function MonitoringSOPage() {
  const [tgl1, setTgl1] = useState<string>(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [tgl2, setTgl2] = useState<string>(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });
  const [company, setCompany] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<SOData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterNota, setFilterNota] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [expandedSOs, setExpandedSOs] = useState<Set<string>>(new Set());
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalSO: 0,
    totalItems: 0,
    totalCustomers: 0,
    totalKg: 0,
    totalBags: 0,
    pending: 0,
    partial: 0,
    complete: 0
  });

  const fetchData = useCallback(async () => {
    if (!tgl1 || !tgl2) {
      alert("Tanggal harus diisi!");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        tgl1,
        tgl2,
        item: "%",
        company: company || "%",
        tipe: "%",
        kredit: "0",
        jenisTOP: "0",
      });

      const res = await fetch(`/api/monitoring/so?${params}`);
      const result = await res.json();
      
      const processedData = Array.isArray(result) ? result : result.recordset || [];
      
      // Tambahkan status untuk setiap data
      const dataWithStatus = processedData.map((row: SOData) => {
        const hasNota = row.moveid || row.nota || row.docid;
        const isPartial = row.mbags > 0 && row.mbags < row.sobags;
        
        let status: 'pending' | 'partial' | 'complete' = 'pending';
        if (hasNota && row.mbags === row.sobags) {
          status = 'complete';
        } else if (isPartial || (hasNota && row.mbags > 0)) {
          status = 'partial';
        }
        
        return { ...row, status };
      });
      
      setData(dataWithStatus);
    } catch (err) {
      console.error("❌ Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [tgl1, tgl2, company]);

  // Hanya fetch data saat komponen mount pertama kali
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ Filtering di frontend menggunakan useMemo untuk optimasi
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const notaNumber = row.moveid || row.nota || row.docid;
      if (filterNota && notaNumber) return false;
      
      // Filter berdasarkan search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          row.orderid.toLowerCase().includes(searchLower) ||
          row.companyname1.toLowerCase().includes(searchLower) ||
          row.itemname.toLowerCase().includes(searchLower) ||
          row.moveid?.toLowerCase().includes(searchLower) ||
          row.SuratJln?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [data, filterNota, searchTerm]);

  // Group data berdasarkan SO Number dan Customer menggunakan useMemo
  const groupedData = useMemo(() => {
    const grouped: GroupedBySOCustomer = {};
    
    filteredData.forEach((row) => {
      const key = `${row.orderid}-${row.companyid}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          orderId: row.orderid,
          companyName: row.companyname1,
          companyId: row.companyid,
          orderDate: row.orderdate,
          rows: [],
          totalItems: 0,
          totalBags: 0,
          totalKg: 0,
          deliveredBags: 0,
          deliveredKg: 0,
          progress: 0,
          status: 'pending'
        };
      }
      
      grouped[key].rows.push(row);
    });
    
    // Hitung totals untuk setiap group
    Object.values(grouped).forEach(group => {
      const uniqueItems = new Set(group.rows.map(r => r.itemid));
      group.totalItems = uniqueItems.size;
      
      group.totalBags = group.rows.reduce((sum, r) => sum + (r.sobags || 0), 0);
      group.totalKg = group.rows.reduce((sum, r) => sum + (r.sokgs || 0), 0);
      group.deliveredBags = group.rows.reduce((sum, r) => sum + (r.mbags || 0), 0);
      group.deliveredKg = group.rows.reduce((sum, r) => sum + (r.mkgs || 0), 0);
      
      group.progress = group.totalBags > 0 ? (group.deliveredBags / group.totalBags) * 100 : 0;
      
      // Tentukan status group
      if (group.progress >= 100) {
        group.status = 'complete';
      } else if (group.progress > 0) {
        group.status = 'partial';
      } else {
        group.status = 'pending';
      }
    });
    
    return grouped;
  }, [filteredData]);

  // Hitung statistik menggunakan useMemo
  const calculatedStats = useMemo(() => {
    const stats: SummaryStats = {
      totalSO: 0,
      totalItems: 0,
      totalCustomers: 0,
      totalKg: 0,
      totalBags: 0,
      pending: 0,
      partial: 0,
      complete: 0
    };

    const uniqueSOs = new Set();
    const uniqueCustomers = new Set();
    const uniqueItems = new Set();

    filteredData.forEach(row => {
      uniqueSOs.add(row.orderid);
      uniqueCustomers.add(row.companyname1);
      uniqueItems.add(row.itemid);
      
      stats.totalKg += row.sokgs || 0;
      stats.totalBags += row.sobags || 0;
      
      if (row.status === 'pending') stats.pending++;
      else if (row.status === 'partial') stats.partial++;
      else if (row.status === 'complete') stats.complete++;
    });

    stats.totalSO = uniqueSOs.size;
    stats.totalCustomers = uniqueCustomers.size;
    stats.totalItems = uniqueItems.size;
    
    return stats;
  }, [filteredData]);

  // Update summary stats ketika calculatedStats berubah
  useEffect(() => {
    setSummaryStats(calculatedStats);
  }, [calculatedStats]);

  // Toggle expand SO
  const toggleSO = (key: string) => {
    setExpandedSOs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Export ke Excel
  const exportToExcel = () => {
    try {
      // 1. Data Detail SO
      const detailData = filteredData.map(row => ({
        'SO Number': row.orderid,
        'SO Date': new Date(row.orderdate).toLocaleDateString('id-ID'),
        'Customer': row.companyname1 || '',
        'Customer ID': row.companyid || '',
        'Item ID': row.itemid || '',
        'Item Name': row.itemname || '',
        'SO Quantity (Bags)': row.sobags || 0,
        'SO Quantity (Kg)': row.sokgs || 0,
        'Delivery Note': row.SuratJln || '',
        'Invoice Number': row.moveid || row.nota || row.docid || '',
        'Invoice Date': row.movedate ? new Date(row.movedate).toLocaleDateString('id-ID') : '',
        'Delivered Bags': row.mbags || 0,
        'Delivered Kg': row.mkgs || 0,
        'SPB Number': row.spb || '',
        'Status': row.status?.toUpperCase() || 'PENDING',
        'Remaining Bags': (row.sobags || 0) - (row.mbags || 0),
        'Remaining Kg': (row.sokgs || 0) - (row.mkgs || 0),
        'Progress (%)': row.sobags > 0 ? Math.round(((row.mbags || 0) / row.sobags) * 100) : 0
      }));

      // 2. Data Summary per SO & Customer
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const summaryData = Object.entries(groupedData).map(([key, group]) => {
        return {
          'SO Number': group.orderId,
          'Customer': group.companyName,
          'Customer ID': group.companyId,
          'SO Date': new Date(group.orderDate).toLocaleDateString('id-ID'),
          'Total Items': group.totalItems,
          'Total Ordered (Bags)': group.totalBags,
          'Total Ordered (Kg)': group.totalKg,
          'Total Delivered (Bags)': group.deliveredBags,
          'Total Delivered (Kg)': group.deliveredKg,
          'Status': group.status.toUpperCase(),
          'Progress (%)': Math.round(group.progress),
          'Remaining Bags': group.totalBags - group.deliveredBags,
          'Remaining Kg': group.totalKg - group.deliveredKg
        };
      });

      // 3. Buat workbook
      const workbook = XLSX.utils.book_new();
      
      // Worksheet 1: SO Detail
      const ws1 = XLSX.utils.json_to_sheet(detailData);
      XLSX.utils.book_append_sheet(workbook, ws1, 'Sales Order Detail');
      
      // Worksheet 2: SO Summary
      const ws2 = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, ws2, 'SO Summary');
      
      // Worksheet 3: Statistics
      const statsData = [
        { 'Metric': 'Total Sales Orders', 'Value': summaryStats.totalSO },
        { 'Metric': 'Total Customers', 'Value': summaryStats.totalCustomers },
        { 'Metric': 'Total Items', 'Value': summaryStats.totalItems },
        { 'Metric': 'Total Ordered (Kg)', 'Value': summaryStats.totalKg },
        { 'Metric': 'Total Ordered (Bags)', 'Value': summaryStats.totalBags },
        { 'Metric': 'Pending Orders', 'Value': summaryStats.pending },
        { 'Metric': 'Partial Orders', 'Value': summaryStats.partial },
        { 'Metric': 'Complete Orders', 'Value': summaryStats.complete },
        { 'Metric': 'Period', 'Value': `${tgl1} to ${tgl2}` },
        { 'Metric': 'Filter Applied', 'Value': filterNota ? 'Belum ada Nota' : 'All Orders' }
      ];
      const ws3 = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, ws3, 'Statistics');
      
      // 4. Download file
      const fileName = `Monitoring_SO_${tgl1}_to_${tgl2}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Gagal mengekspor data ke Excel. Silakan coba lagi.');
    }
  };

  // Format number dengan separator
  const formatNumber = useCallback((num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  }, []);

  // Format tanggal
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  }, []);

  // Get status badge untuk SO
  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Partial
          </Badge>
        );
      case 'complete':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Complete
          </Badge>
        );
      default:
        return null;
    }
  }, []);

  // Render card view berdasarkan SO dan Customer
  const renderCardView = useMemo(() => {
    return (
      <div className="space-y-4">
        {Object.entries(groupedData).map(([key, group]) => {
          const isExpanded = expandedSOs.has(key);
          
          return (
            <Card key={key} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSO(key)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg font-bold text-blue-700">
                        {group.orderId}
                      </CardTitle>
                      {getStatusBadge(group.status)}
                      <Badge variant="outline" className="ml-2">
                        {group.totalItems} Items
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Customer:</span> {group.companyName}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">SO Date:</span> {formatDate(group.orderDate)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Customer ID:</span> {group.companyId}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      {isExpanded ? "Tutup" : "Lihat Detail"}
                    </Button>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Progress Pengiriman</span>
                    <span>{Math.round(group.progress)}%</span>
                  </div>
                  <Progress value={group.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>
                      {formatNumber(group.deliveredBags)} / {formatNumber(group.totalBags)} zak
                      ({formatNumber(group.deliveredKg)} / {formatNumber(group.totalKg)} kg)
                    </span>
                    <span>
                      Sisa: {formatNumber(group.totalBags - group.deliveredBags)} zak
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0 border-t">
                  <div className="space-y-4 mt-4">
                    {/* Detail Items dalam SO */}
                    {group.rows.map((row, idx) => (
                      <div key={`${row.itemid}-${idx}`} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-800">{row.itemname}</h4>
                            <div className="text-sm text-gray-600 mt-1">
                              <span>Item ID: {row.itemid}</span>
                              <span className="mx-2">•</span>
                              <span>Status: {getStatusBadge(row.status || 'pending')}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatNumber(row.mbags)} / {formatNumber(row.sobags)} zak
                            </div>
                            <div className="text-xs text-gray-500">
                              {row.sobags > 0 ? Math.round((row.mbags / row.sobags) * 100) : 0}% terkirim
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          <div className="space-y-1">
                            <div className="text-gray-500">Order</div>
                            <div className="font-medium">
                              {formatNumber(row.sobags)} zak • {formatNumber(row.sokgs)} kg
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-gray-500">Delivery</div>
                            <div className="font-medium">
                              {formatNumber(row.mbags)} zak • {formatNumber(row.mkgs)} kg
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-gray-500">Invoice</div>
                            <div className="font-medium">
                              {row.moveid || "-"}
                              {row.movedate && (
                                <div className="text-xs text-gray-500">
                                  {formatDate(row.movedate)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-gray-500">Delivery Note</div>
                            <div className="font-medium">
                              {row.SuratJln || "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    );
  }, [groupedData, expandedSOs, getStatusBadge, formatNumber, formatDate]);

  // Render table view berdasarkan SO dan Customer
  const renderTableView = useMemo(() => {
    return (
      <div className="space-y-4">
        {Object.entries(groupedData).map(([key, group]) => {
          const isExpanded = expandedSOs.has(key);
          
          return (
            <Card key={key} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSO(key)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <CardTitle className="text-lg font-bold text-blue-700">
                        {group.orderId}
                      </CardTitle>
                      {getStatusBadge(group.status)}
                      <Badge variant="outline" className="ml-2">
                        {group.totalItems} Items
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        <Building className="h-3 w-3 mr-1" />
                        {group.companyName}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">SO Date:</span> {formatDate(group.orderDate)}
                      </div>
                      <div>
                        <span className="font-medium">Customer ID:</span> {group.companyId}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Progress Summary */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Total Progress</span>
                    <span>{Math.round(group.progress)}%</span>
                  </div>
                  <Progress value={group.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>
                      {formatNumber(group.deliveredBags)} / {formatNumber(group.totalBags)} zak
                    </span>
                    <span>
                      {formatNumber(group.deliveredKg)} / {formatNumber(group.totalKg)} kg
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0 border-t">
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 text-left font-medium">Item ID</th>
                          <th className="p-2 text-left font-medium">Item Name</th>
                          <th className="p-2 text-left font-medium">Status</th>
                          <th className="p-2 text-left font-medium">Order (zak)</th>
                          <th className="p-2 text-left font-medium">Order (kg)</th>
                          <th className="p-2 text-left font-medium">#Nota</th>
                          <th className="p-2 text-left font-medium">Tgl Nota</th>
                          <th className="p-2 text-left font-medium">Delivery (zak)</th>
                          <th className="p-2 text-left font-medium">Delivery (kg)</th>
                          <th className="p-2 text-left font-medium">#SJ</th>
                          <th className="p-2 text-left font-medium">Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((row, idx) => {
                          const progress = row.sobags > 0 ? (row.mbags / row.sobags) * 100 : 0;
                          
                          return (
                            <tr key={idx} className="border-t hover:bg-gray-50">
                              <td className="p-2 font-medium">{row.itemid}</td>
                              <td className="p-2">{row.itemname}</td>
                              <td className="p-2">{getStatusBadge(row.status || 'pending')}</td>
                              <td className="p-2 text-right">{formatNumber(row.sobags)}</td>
                              <td className="p-2 text-right">{formatNumber(row.sokgs)}</td>
                              <td className="p-2 font-medium">{row.moveid || "-"}</td>
                              <td className="p-2 whitespace-nowrap">
                                {row.movedate ? formatDate(row.movedate) : ""}
                              </td>
                              <td className="p-2 text-right">{formatNumber(row.mbags)}</td>
                              <td className="p-2 text-right">{formatNumber(row.mkgs)}</td>
                              <td className="p-2">{row.SuratJln || "-"}</td>
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-green-600 h-2 rounded-full" 
                                      style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs">{Math.round(progress)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        
                        {/* Total Row */}
                        <tr className="border-t bg-gray-100 font-semibold">
                          <td className="p-2" colSpan={3}>Total</td>
                          <td className="p-2 text-right">{formatNumber(group.totalBags)}</td>
                          <td className="p-2 text-right">{formatNumber(group.totalKg)}</td>
                          <td className="p-2" colSpan={2}>Overall Progress</td>
                          <td className="p-2 text-right">{formatNumber(group.deliveredBags)}</td>
                          <td className="p-2 text-right">{formatNumber(group.deliveredKg)}</td>
                          <td className="p-2" colSpan={2}>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-300 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${Math.min(group.progress, 100)}%` }}
                                />
                              </div>
                              <span>{Math.round(group.progress)}%</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    );
  }, [groupedData, expandedSOs, getStatusBadge, formatNumber, formatDate]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">LAPORAN MONITORING SALES ORDER</h1>
          <p className="text-gray-500 mt-1">Monitoring dan tracking penjualan berdasarkan SO Number dan Customer</p>
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

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Data
          </CardTitle>
          <CardDescription>Tetapkan periode dan kriteria pencarian</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <Label htmlFor="tgl1">Tanggal Awal</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="tgl1"
                  type="date"
                  value={tgl1}
                  onChange={(e) => setTgl1(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <Label htmlFor="tgl2">Tanggal Akhir</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="tgl2"
                  type="date"
                  value={tgl2}
                  onChange={(e) => setTgl2(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <Label htmlFor="company">Company/Customer</Label>
              <Input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Kode company/customer"
              />
            </div>
            <div className="md:col-span-3">
              <Label htmlFor="search">Pencarian</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari SO, customer, item..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterNota"
                checked={filterNota}
                onCheckedChange={(checked) => setFilterNota(checked as boolean)}
              />
              <Label htmlFor="filterNota" className="cursor-pointer">
                Tampilkan hanya yang belum ada Nota
              </Label>
            </div>
            
            <div className="text-sm text-gray-500">
              Periode: {new Date(tgl1).toLocaleDateString('id-ID')} - {new Date(tgl2).toLocaleDateString('id-ID')}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => {
            const firstDay = new Date();
            firstDay.setDate(1);
            setTgl1(firstDay.toISOString().split('T')[0]);
            setTgl2(new Date().toISOString().split('T')[0]);
            setCompany("");
            setSearchTerm("");
            setFilterNota(false);
          }}>
            Reset Filter
          </Button>
          
          <Button onClick={fetchData} disabled={loading}>
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
        </CardFooter>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{summaryStats.totalSO}</div>
              <div className="text-sm text-gray-500">Total SO</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summaryStats.totalCustomers}</div>
              <div className="text-sm text-gray-500">Customer</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summaryStats.totalItems}</div>
              <div className="text-sm text-gray-500">Items</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatNumber(summaryStats.totalBags)}</div>
              <div className="text-sm text-gray-500">Zak</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatNumber(summaryStats.totalKg)}</div>
              <div className="text-sm text-gray-500">Kg</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summaryStats.pending}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summaryStats.partial}</div>
              <div className="text-sm text-gray-500">Partial</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summaryStats.complete}</div>
              <div className="text-sm text-gray-500">Complete</div>
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
      ) : filteredData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak ada data</h3>
            <p className="text-gray-500 mb-4">
              Tidak ditemukan Sales Order untuk periode yang dipilih.
            </p>
            <Button onClick={fetchData}>
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
              Daftar Data
            </TabsTrigger>
            <TabsTrigger value="summary">
              <Package className="h-4 w-4 mr-2" />
              Ringkasan
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">
                  Menampilkan {Object.keys(groupedData).length} Sales Order dari {filteredData.length} data
                </h3>
                {filterNota && (
                  <Alert className="mt-2 bg-blue-50 border-blue-200">
                    <AlertDescription>
                      Hanya menampilkan Sales Order yang belum memiliki Nota
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Group by: SO Number & Customer
              </div>
            </div>
            
            {viewMode === "table" ? renderTableView : renderCardView}
          </TabsContent>
          
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Monitoring Sales Order</CardTitle>
                <CardDescription>
                  Analisis dan statistik periode {new Date(tgl1).toLocaleDateString('id-ID')} - {new Date(tgl2).toLocaleDateString('id-ID')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* SO Summary Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-3 text-left font-medium">SO Number</th>
                          <th className="p-3 text-left font-medium">Customer</th>
                          <th className="p-3 text-left font-medium">SO Date</th>
                          <th className="p-3 text-left font-medium">Items</th>
                          <th className="p-3 text-left font-medium">Order (zak)</th>
                          <th className="p-3 text-left font-medium">Order (kg)</th>
                          <th className="p-3 text-left font-medium">Delivery (zak)</th>
                          <th className="p-3 text-left font-medium">Delivery (kg)</th>
                          <th className="p-3 text-left font-medium">Progress</th>
                          <th className="p-3 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(groupedData).map(([key, group]) => (
                          <tr key={key} className="border-t hover:bg-gray-50">
                            <td className="p-3 font-medium">{group.orderId}</td>
                            <td className="p-3">
                              <div className="font-medium">{group.companyName}</div>
                              <div className="text-xs text-gray-500">{group.companyId}</div>
                            </td>
                            <td className="p-3 whitespace-nowrap">{formatDate(group.orderDate)}</td>
                            <td className="p-3 text-center">{group.totalItems}</td>
                            <td className="p-3 text-right">{formatNumber(group.totalBags)}</td>
                            <td className="p-3 text-right">{formatNumber(group.totalKg)}</td>
                            <td className="p-3 text-right">{formatNumber(group.deliveredBags)}</td>
                            <td className="p-3 text-right">{formatNumber(group.deliveredKg)}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-600 h-2 rounded-full" 
                                    style={{ width: `${Math.min(group.progress, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs">{Math.round(group.progress)}%</span>
                              </div>
                            </td>
                            <td className="p-3">{getStatusBadge(group.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Customer Performance */}
                  <div>
                    <h4 className="font-semibold text-lg mb-4">Performance per Customer</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from(
                        filteredData.reduce((acc, row) => {
                          if (!acc.has(row.companyname1)) {
                            acc.set(row.companyname1, {
                              name: row.companyname1,
                              id: row.companyid,
                              totalSO: 0,
                              totalBags: 0,
                              totalKg: 0,
                              deliveredBags: 0,
                              deliveredKg: 0,
                              pending: 0,
                              complete: 0
                            });
                          }
                          const customer = acc.get(row.companyname1)!;
                          customer.totalSO++;
                          customer.totalBags += row.sobags || 0;
                          customer.totalKg += row.sokgs || 0;
                          customer.deliveredBags += row.mbags || 0;
                          customer.deliveredKg += row.mkgs || 0;
                          if (row.status === 'pending') customer.pending++;
                          if (row.status === 'complete') customer.complete++;
                          return acc;
                        }, new Map())
                      )
                      .slice(0, 6)
                      .map(([name, data]: [string, any]) => {
                        const progress = data.totalBags > 0 ? (data.deliveredBags / data.totalBags) * 100 : 0;
                        
                        return (
                          <Card key={name}>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <div className="font-semibold mb-2 truncate">{name}</div>
                                <div className="text-xs text-gray-500 mb-3">{data.id}</div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <div className="font-medium">{data.totalSO}</div>
                                    <div className="text-gray-500">SO</div>
                                  </div>
                                  <div>
                                    <div className="font-medium">{Math.round(progress)}%</div>
                                    <div className="text-gray-500">Progress</div>
                                  </div>
                                  <div>
                                    <div className="font-medium">{formatNumber(data.deliveredBags)}/{formatNumber(data.totalBags)}</div>
                                    <div className="text-gray-500">Zak</div>
                                  </div>
                                  <div>
                                    <div className="font-medium">{data.complete}</div>
                                    <div className="text-gray-500">Selesai</div>
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div 
                                      className="bg-green-600 h-1.5 rounded-full" 
                                      style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                  </div>
                                </div>
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