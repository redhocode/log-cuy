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
  Info,
  Edit,
  Trash2,
  Save,
  Plus,
  Loader2,
  CheckCircle
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface BomData {
  TransID: number;
  itemidHD: string;
  itemnamehd: string;
  itemnamehd2?: string;
  ItemID: string;
  ItemName: string;
  ItemName2: string;
  BahanQty: number;
  BahanPackSatuan?: string;
  Departemen?: string;
  NamaJenis?: string;
}

interface MasterItem {
  ItemID: string;
  ItemName: string;
  ItemName2?: string;
  KodeJenis?: string;
  NamaJenis?: string;
  Departemen?: string;
  SatuanKecil?: string;
  warna?: string;
  Spec?: string;
}

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

const satuanOptions = [
  { value: "pcs", label: "PCS" },
  { value: "kg", label: "KG" },
  { value: "gram", label: "GRAM" },
  { value: "liter", label: "LITER" },
  { value: "meter", label: "METER" },
  { value: "cm", label: "CM" },
  { value: "roll", label: "ROLL" },
  { value: "set", label: "SET" },
  { value: "box", label: "BOX" },
  { value: "pack", label: "PACK" },
];

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
  
  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<BomData | null>(null);
  const [editItemID, setEditItemID] = useState<string>("");
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editSatuan, setEditSatuan] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Add component state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ itemidHD: string; itemnamehd: string; TransID: number } | null>(null);
  const [newItemID, setNewItemID] = useState<string>("");
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [newSatuan, setNewSatuan] = useState<string>("pcs");
  const [isAdding, setIsAdding] = useState(false);
  
  // Suggest state
  const [itemSuggestions, setItemSuggestions] = useState<MasterItem[]>([]);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [isCheckingItem, setIsCheckingItem] = useState(false);
  const [selectedItemData, setSelectedItemData] = useState<MasterItem | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingComponent, setDeletingComponent] = useState<BomData | null>(null);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const suggestTimeoutRef = useRef<NodeJS.Timeout>();

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Fetch item suggestions from master
  const fetchItemSuggestions = async (keyword: string) => {
    if (keyword.length < 2) {
      setItemSuggestions([]);
      setShowItemSuggestions(false);
      return;
    }
    
    setSuggestLoading(true);
    try {
      const res = await axios.get(`/api/master`, {
        params: { keyword, limit: 15 }
      });
      
      if (res.data.success) {
        setItemSuggestions(res.data.data);
        setShowItemSuggestions(res.data.data.length > 0);
      } else {
        setItemSuggestions([]);
        setShowItemSuggestions(false);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setItemSuggestions([]);
      setShowItemSuggestions(false);
    } finally {
      setSuggestLoading(false);
    }
  };

  // Check if item exists
  const checkItemExists = async (itemID: string) => {
    if (!itemID.trim()) return null;
    
    setIsCheckingItem(true);
    try {
      const res = await axios.post(`/api/master`, { ItemID: itemID });
      
      if (res.data.success && res.data.exists) {
        setSelectedItemData(res.data.data);
        return res.data.data;
      } else {
        setSelectedItemData(null);
        return null;
      }
    } catch (error) {
      console.error("Error checking item:", error);
      setSelectedItemData(null);
      return null;
    } finally {
      setIsCheckingItem(false);
    }
  };

  // Handle select suggestion
  const selectSuggestion = (item: MasterItem) => {
    setNewItemID(item.ItemID);
    setSelectedItemData(item);
    if (item.SatuanKecil) {
      setNewSatuan(item.SatuanKecil);
    }
    setShowItemSuggestions(false);
    toast.success(`Item ditemukan: ${item.ItemName}`);
  };

  // Handle ItemID change with debounce
  const handleNewItemIDChange = (value: string) => {
    setNewItemID(value);
    setSelectedItemData(null);
    
    if (suggestTimeoutRef.current) {
      clearTimeout(suggestTimeoutRef.current);
    }
    
    if (value.length >= 2) {
      suggestTimeoutRef.current = setTimeout(() => {
        fetchItemSuggestions(value);
      }, 300);
    } else {
      setItemSuggestions([]);
      setShowItemSuggestions(false);
    }
  };

  // Handle blur to check item exists
  const handleNewItemIDBlur = async () => {
    if (newItemID && newItemID.trim()) {
      const itemData = await checkItemExists(newItemID);
      if (!itemData) {
        toast.warning(`Item ID "${newItemID}" tidak ditemukan di database master`);
      }
    }
  };

  // API Calls
  const updateBomComponent = async (TransID: string, ItemID: string, newItemID: string, BahanQty: number, BahanPackSatuan: string) => {
    const response = await axios.put("/api/bom", { 
      TransID, 
      ItemID, 
      newItemID,
      BahanQty, 
      BahanPackSatuan,
      action: "update" 
    });
    return response.data;
  };

  const deleteBomComponent = async (TransID: string, ItemID: string) => {
    const response = await axios.put("/api/bom", { 
      TransID, 
      ItemID, 
      action: "delete" 
    });
    return response.data;
  };

  const addBomComponent = async (TransID: string, ItemID: string, BahanQty: number, BahanPackSatuan: string) => {
    const response = await axios.patch("/api/bom", { 
      action: "add",
      TransID,
      components: [{ ItemID, BahanQty, BahanPackSatuan }]
    });
    return response.data;
  };

  // Group data
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

  const totalHeaders = useMemo(() => Object.keys(grouped).length, [grouped]);
  const totalComponents = useMemo(() => data.length, [data]);

  // Fetch BOM data
  const fetchBOM = useCallback(async (searchItem?: string) => {
    setLoading(true);
    const startTime = performance.now();
    
    try {
      const params: any = {};
      
      if (searchItem && searchItem.trim() !== "") {
        params.itemid = searchItem;
        params.searchType = searchType;
      }
      
      const res = await axios.get<BomData[]>(`/api/bom`, { params });
      let bomData = res.data;
      
      const uniqueMap = new Map<string, BomData>();
      for (const item of bomData) {
        const uniqueKey = `${item.itemidHD}|${item.ItemID}`;
        if (!uniqueMap.has(uniqueKey)) {
          uniqueMap.set(uniqueKey, item);
        }
      }
      
      bomData = Array.from(uniqueMap.values());
      setData(bomData);
      setViewMode(searchItem && searchItem.trim() !== "" ? 'filtered' : 'all');
      setHasSearched(true);
      
      const headers = Array.from(new Set(bomData.map((item) => item.itemidHD)));
      if (headers.length > 20) {
        setExpandedAll(headers.slice(0, 5));
      } else {
        setExpandedAll(headers);
      }
      
      const endTime = performance.now();
      showNotification(`Berhasil memuat ${bomData.length} komponen dari ${headers.length} produk`, 'success');
      
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

  // Handle edit component
  const handleEditClick = (component: BomData) => {
    setEditingComponent(component);
    setEditItemID(component.ItemID);
    setEditQuantity(component.BahanQty);
    setEditSatuan(component.BahanPackSatuan || "");
    setSelectedItemData(null);
    setEditDialogOpen(true);
    checkItemExists(component.ItemID);
  };

  const handleUpdateComponent = async () => {
    if (!editingComponent) return;
    
    if (!editItemID.trim()) {
      toast.error("ID Komponen harus diisi");
      return;
    }
    
    if (editQuantity <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }
    
    setIsUpdating(true);
    try {
      const response = await updateBomComponent(
        editingComponent.TransID.toString(),
        editingComponent.ItemID,
        editItemID,
        editQuantity,
        editSatuan
      );
      
      if (response.success) {
        setData(prevData => 
          prevData.map(item => 
            item.TransID === editingComponent.TransID && item.ItemID === editingComponent.ItemID
              ? { 
                  ...item, 
                  ItemID: editItemID,
                  BahanQty: editQuantity,
                  BahanPackSatuan: editSatuan
                }
              : item
          )
        );
        
        toast.success(`Berhasil update komponen`);
        setEditDialogOpen(false);
        setEditingComponent(null);
        setSelectedItemData(null);
      } else {
        toast.error(response.message || "Gagal update komponen");
      }
    } catch (error: any) {
      console.error("Error updating:", error);
      toast.error(error.response?.data?.error || "Gagal update komponen");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle add component
  const handleAddClick = (productId: string, productName: string, TransID: number) => {
    setSelectedProduct({ itemidHD: productId, itemnamehd: productName, TransID });
    setNewItemID("");
    setNewQuantity(1);
    setNewSatuan("pcs");
    setSelectedItemData(null);
    setItemSuggestions([]);
    setShowItemSuggestions(false);
    setAddDialogOpen(true);
  };

  const handleAddComponent = async () => {
    if (!selectedProduct) return;
    
    if (!newItemID.trim()) {
      toast.error("ID Komponen harus diisi");
      return;
    }
    
    if (newQuantity <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }
    
    setIsAdding(true);
    try {
      const response = await addBomComponent(
        selectedProduct.TransID.toString(),
        newItemID,
        newQuantity,
        newSatuan
      );
      
      if (response.success) {
        // Refresh data to get the new component
        await fetchBOM();
        toast.success(`Berhasil menambahkan komponen ${newItemID}`);
        setAddDialogOpen(false);
        setSelectedProduct(null);
        setNewItemID("");
        setNewQuantity(1);
        setNewSatuan("pcs");
        setSelectedItemData(null);
      } else {
        toast.error(response.message || "Gagal menambahkan komponen");
      }
    } catch (error: any) {
      console.error("Error adding component:", error);
      toast.error(error.response?.data?.error || "Gagal menambahkan komponen");
    } finally {
      setIsAdding(false);
    }
  };

  // Handle delete component
  const handleDeleteClick = (component: BomData) => {
    setDeletingComponent(component);
    setDeleteDialogOpen(true);
  };

  const handleDeleteComponent = async () => {
    if (!deletingComponent) return;
    
    setIsUpdating(true);
    try {
      const response = await deleteBomComponent(
        deletingComponent.TransID.toString(),
        deletingComponent.ItemID
      );
      
      if (response.success) {
        setData(prevData => 
          prevData.filter(item => 
            !(item.TransID === deletingComponent.TransID && item.ItemID === deletingComponent.ItemID)
          )
        );
        
        toast.success(`Berhasil hapus ${deletingComponent.ItemName}`);
        setDeleteDialogOpen(false);
        setDeletingComponent(null);
      } else {
        toast.error(response.message || "Gagal hapus komponen");
      }
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast.error(error.response?.data?.error || "Gagal hapus komponen");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle search
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

  const handleReset = useCallback(() => {
    setItemid("");
    setSuggestions([]);
    setShowSuggestions(false);
    fetchBOM();
  }, [fetchBOM]);

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

  // Export to Excel
  const exportToExcel = () => {
    if (data.length === 0) {
      showNotification("Tidak ada data untuk diexport", 'error');
      return;
    }
    
    setIsExporting(true);
    
    setTimeout(() => {
      try {
        const today = new Date();
        const timestamp = `${today.toISOString().split('T')[0]}_${today.toLocaleTimeString('id-ID').replace(/:/g, '-')}`;
        
        let fileName = viewMode === 'filtered' && itemid
          ? `BOM_${searchType === 'itemid' ? 'ID' : 'Name'}_${itemid}_${timestamp}.xlsx`
          : `BOM_Complete_${totalHeaders}Products_${timestamp}.xlsx`;
        
        const worksheetData: any[][] = [];
        
        worksheetData.push(["LAPORAN BILL OF MATERIALS (BOM)"]);
        worksheetData.push([`Tanggal Export: ${today.toLocaleDateString('id-ID')} ${today.toLocaleTimeString('id-ID')}`]);
        worksheetData.push([`Jumlah Produk: ${totalHeaders} produk`]);
        worksheetData.push([`Jumlah Komponen: ${totalComponents} komponen`]);
        worksheetData.push([]);
        
        Object.entries(grouped).forEach(([hd, group]) => {
          worksheetData.push([`PRODUK: ${hd}`]);
          worksheetData.push([`Nama Produk: ${group.headerName}`]);
          if (group.headerName2 && group.headerName2 !== group.headerName) {
            worksheetData.push([`Nama Produk (China): ${group.headerName2}`]);
          }
          worksheetData.push([`Total Komponen: ${group.totalComponents}`]);
          worksheetData.push([]);
          
          worksheetData.push(["No", "Komponen ID", "Nama Komponen", "Nama Komponen (China)", "Jumlah", "Satuan"]);
          
          group.children.forEach((row, idx) => {
            worksheetData.push([
              idx + 1,
              row.ItemID,
              row.ItemName,
              row.ItemName2 || "-",
              row.BahanQty,
              row.BahanPackSatuan || "-"
            ]);
          });
          
          worksheetData.push([]);
          worksheetData.push([]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "BOM Report");
        
        ws['!cols'] = [{ wch: 8 }, { wch: 20 }, { wch: 45 }, { wch: 45 }, { wch: 12 }, { wch: 10 }];
        
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

  // Render accordion items
  const renderAccordionItems = useMemo(() => {
    const entries = Object.entries(grouped);
    if (entries.length === 0) return null;
    
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
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddClick(hd, group.headerName, parseInt(group.children[0]?.TransID.toString() || "0"));
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Tambah Komponen
              </Button>
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
                      <TableHead className="min-w-[200px]">Nama Komponen</TableHead>
                      <TableHead className="min-w-[200px]">Nama China</TableHead>
                      <TableHead className="w-24 text-right">Jumlah</TableHead>
                      <TableHead className="w-24 text-center">Satuan</TableHead>
                      <TableHead className="w-24 text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.children.length === 0 ? (
                      <TableRow>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          Belum ada komponen. Klik "Tambah Komponen" untuk menambahkan.
                        </td>
                      </TableRow>
                    ) : (
                      group.children.map((row, index: number) => (
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
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-xs">
                              {row.BahanPackSatuan || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      onClick={() => handleEditClick(row)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit Komponen</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDeleteClick(row)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Hapus Komponen</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm text-muted-foreground">
                <div>Total: <span className="font-semibold">{group.totalComponents}</span> komponen</div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(hd)} className="flex items-center gap-2">
                    <Copy className="h-3 w-3" />
                    Copy ID Produk
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleAddClick(hd, group.headerName, parseInt(group.children[0]?.TransID.toString() || "0"))}>
                    <Plus className="h-3 w-3 mr-1" />
                    Tambah Komponen
                  </Button>
                </div>
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

      {/* Kontrol Pencarian */}
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Komponen BOM
            </DialogTitle>
            <DialogDescription>
              Ubah ID komponen, jumlah, atau satuan
            </DialogDescription>
          </DialogHeader>
          
          {editingComponent && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Produk</Label>
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                  {editingComponent.itemidHD} - {editingComponent.itemnamehd}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editItemID">ID Komponen *</Label>
                <Input
                  id="editItemID"
                  placeholder="Masukkan ID Komponen"
                  value={editItemID}
                  onChange={(e) => setEditItemID(e.target.value)}
                  className="font-mono"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editQuantity">Jumlah (Qty) *</Label>
                <Input
                  id="editQuantity"
                  type="number"
                  step="0.01"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editSatuan">Satuan</Label>
                <Select value={editSatuan} onValueChange={setEditSatuan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih satuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {satuanOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isUpdating}>
              Batal
            </Button>
            <Button onClick={handleUpdateComponent} disabled={isUpdating}>
              {isUpdating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Component Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Tambah Komponen BOM
            </DialogTitle>
            <DialogDescription>
              Tambahkan komponen baru ke dalam BOM produk ini
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Produk</Label>
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                  {selectedProduct.itemidHD} - {selectedProduct.itemnamehd}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newItemID">ID Komponen *</Label>
                <div className="relative">
                  <Input
                    id="newItemID"
                    placeholder="Masukkan ID Komponen"
                    value={newItemID}
                    onChange={(e) => handleNewItemIDChange(e.target.value)}
                    onBlur={handleNewItemIDBlur}
                    className={`font-mono ${selectedItemData ? 'border-green-500' : newItemID ? 'border-yellow-500' : ''}`}
                  />
                  
                  {isCheckingItem && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                  
                  {!isCheckingItem && newItemID && selectedItemData && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                  
                  {showItemSuggestions && itemSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-60 overflow-auto">
                      {itemSuggestions.map((item, idx) => (
                        <div
                          key={item.ItemID + idx}
                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0"
                          onClick={() => selectSuggestion(item)}
                        >
                          <div className="font-mono text-sm font-medium">{item.ItemID}</div>
                          <div className="text-sm">{item.ItemName}</div>
                          {item.ItemName2 && (
                            <div className="text-xs text-gray-500">{item.ItemName2}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {suggestLoading && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                      Mencari data...
                    </div>
                  )}
                </div>
                
                {selectedItemData && (
                  <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                    <p className="text-green-700">{selectedItemData.ItemName}</p>
                    {selectedItemData.ItemName2 && (
                      <p className="text-xs text-green-600">{selectedItemData.ItemName2}</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newQuantity">Jumlah (Qty) *</Label>
                <Input
                  id="newQuantity"
                  type="number"
                  step="0.01"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newSatuan">Satuan</Label>
                <Select value={newSatuan} onValueChange={setNewSatuan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih satuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {satuanOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={isAdding}>
              Batal
            </Button>
            <Button onClick={handleAddComponent} disabled={isAdding || !newItemID.trim() || newQuantity <= 0}>
              {isAdding ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Tambah Komponen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Hapus Komponen
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus komponen ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          
          {deletingComponent && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm font-medium">Komponen yang akan dihapus:</p>
                <p className="text-sm mt-1">
                  <span className="font-mono">{deletingComponent.ItemID}</span> - {deletingComponent.ItemName}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dari produk: {deletingComponent.itemidHD} - {deletingComponent.itemnamehd}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isUpdating}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteComponent} disabled={isUpdating}>
              {isUpdating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}