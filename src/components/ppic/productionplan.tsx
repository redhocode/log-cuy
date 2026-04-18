/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/production-plan/page.tsx
"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Eye,
  FileSpreadsheet,
  Package,
  Factory,
  BarChart3,
  Calendar,
  ClipboardList,
  Zap,
  AlertTriangle,
  Info,
  ExternalLink,
  Plus,
  Minus,
  MoreVertical,
  BarChart,
  Layers,
  TreePine,
  Table as TableIcon,
  Save,
  Lock,
  Unlock,
} from "lucide-react";
import { itemsWithVariants } from "./itemsWithVariants";

// ==================== TIPE DATA ====================
interface ProductionOrder {
  No_SPK: string;
  Tanggal_Order: string;
  Nama_PO: string;
  Kode_Barang: string;
  QTY: number;
  isCombined?: boolean;
  combinedItems?: ProductionOrder[];
  originalOrders?: ProductionOrder[];
}

interface BomItem {
  ItemID: string;
  ItemName: string;
  Qty: number;
  Level: number;
  Departemen: string;
  NamaJenis: string;
  ParentItemID?: string;
  children?: BomItem[];
}

interface StockItem {
  itemid: string;
  itemname: string;
  stockAkhir: number;
  physicalStock?: number;
  committedQty?: number;
  reservedQty?: number;
}

interface ProductionPlan {
  order: ProductionOrder;
  bom?: {
    flat: BomItem[];
    tree: BomItem[];
    combinedBoms?: {
      [kodeBarang: string]: {
        flat: BomItem[];
        tree: BomItem[];
      };
    };
  };
  expanded: boolean;
  loading: boolean;
  selected: boolean;
  loadingBom: boolean;
  stock?: StockItem[];
  error?: string;
  viewMode: "table" | "tree";
  committed: boolean;
  CommitID?: number;
  stockLastUpdated?: string;
}

// ==================== TIPE DATA UNTUK COMMIT ====================
interface CommittedPO {
  CommitID: number;
  noSPK: string;
  kodeBarang: string;
  namaPO: string;
  qty: number;
  tanggalCommit: string;
  userID: string;
  status: string;
  totalMaterials: number;
  totalQtyReserved: number;
}

interface MaterialUsageItem {
  itemId: string;
  itemName: string;
  qtyPerUnit: number;
  totalNeeded: number;
  stockBefore: number;
  stockAfter: number;
  qtyUsed: number;
  departemen?: string;
  level: number;
}

interface StockReservation {
  reservationID: number;
  CommitID: number;
  itemID: string;
  itemName: string;
  reservedQty: number;
  reservationDate: string;
  status: string;
  expiryDate: string;
  noSPK: string;
}

// ==================== TIPE DATA UNTUK PREVIEW EXPORT ====================
interface ExportPreviewData {
  stockSummary: any[];
  selectedPOData: any[];
  problemItems: any[];
  pengeluaranSummary: any[];
  variantItems: any[];
  today: string;
  totalItems: number;
  sufficientItems: number;
  problemItemsCount: number;
  itemsWithVariantCount: number;
  totalPengeluaran: number;
  itemsWithPengeluaran: number;
  totalStockAvailable: number;
  selectedOrdersCount: number;
}

interface ExportData {
  stockSummary: any[];
  departmentSummary: any[];
  productionOrders: any[];
}

// ==================== FUNGSI BANTU UNTUK FILTER INJEKSI-BB ====================
const isINJECTIONDepartment = (departemen?: string): boolean => {
  if (!departemen) return false;
  const deptString = String(departemen).trim().toUpperCase();
  return (
    deptString.includes("INJEKSI-BB") ||
    deptString === "INJEKSI-BB" ||
    deptString.includes("INJEKSI BB") ||
    deptString.includes("INJEKSI_BB") ||
    deptString === "INJEKSIBB"
  );
};

// ==================== KOMPONEN PREVIEW EXPORT ====================
const ExportPreviewModal: React.FC<{
  previewData: ExportPreviewData | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmExport: () => void;
  exportLoading: boolean;
}> = ({ previewData, isOpen, onClose, onConfirmExport, exportLoading }) => {
  if (!isOpen || !previewData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Preview Export Data - 导出数据预览
          </DialogTitle>
          <DialogDescription>
            Preview data sebelum melakukan export ke Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">
                  Total Items 总项目数
                </div>
                <div className="text-2xl font-bold">{previewData.totalItems}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">
                  Stock Cukup 库存充足
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {previewData.sufficientItems}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">
                  Problem Items 问题项目
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {previewData.problemItemsCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">
                  Items dengan Variant 有变体项目
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {previewData.itemsWithVariantCount}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stock Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Stock Summary 库存汇总 ({previewData.stockSummary.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode Item 物料代码</TableHead>
                      <TableHead>Nama Item 物料名称</TableHead>
                      <TableHead className="text-right">Sum of Total 总需求</TableHead>
                      <TableHead className="text-right">Stock Available 可用库存</TableHead>
                      <TableHead className="text-right">Remaining Stock 剩余库存</TableHead>
                      <TableHead className="text-center">Status 状态</TableHead>
                      <TableHead className="text-center">Warning 警告</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.stockSummary.slice(0, 50).map((item, idx) => (
                      <TableRow
                        key={idx}
                        className={
                          item["Remaining Stock 剩余库存"] < 0
                            ? "bg-red-50"
                            : item["Warning 警告"]
                            ? "bg-yellow-50"
                            : ""
                        }
                      >
                        <TableCell className="font-mono text-xs">
                          {item["Kode Item 物料代码"]}
                        </TableCell>
                        <TableCell className="text-xs">
                          {item["Nama Item 物料名称"]}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {item["Sum of Total 总需求 (PO)"]?.toLocaleString() ?? '0'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {item["Stock Available 可用库存"]?.toLocaleString() ?? '0'}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono text-xs font-bold ${
                            item["Remaining Stock 剩余库存"] < 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {item["Remaining Stock 剩余库存"]?.toLocaleString() ?? '0'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              item["Status 状态"] === "CUKUP 充足"
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {item["Status 状态"]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-yellow-600 text-xs">
                          {item["Warning 警告"] || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {previewData.stockSummary.length > 50 && (
                  <div className="mt-2 text-center text-sm text-muted-foreground">
                    Menampilkan 50 dari {previewData.stockSummary.length} items.
                    显示前50条，共{previewData.stockSummary.length}个项目
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Problem Items */}
          {previewData.problemItems.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-lg text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Problem Items 问题项目 ({previewData.problemItems.length} items)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-64">
                  <Table>
                    <TableHeader className="bg-red-50">
                      <TableRow>
                        <TableHead>Kode Item 物料代码</TableHead>
                        <TableHead>Nama Item 物料名称</TableHead>
                        <TableHead className="text-right">Kekurangan 短缺</TableHead>
                        <TableHead className="text-right">Stock Available 可用库存</TableHead>
                        <TableHead className="text-center">Warning 警告</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.problemItems.slice(0, 20).map((item, idx) => (
                        <TableRow key={idx} className="bg-red-50">
                          <TableCell className="font-mono text-xs">
                            {item["Kode Item 物料代码"]}
                          </TableCell>
                          <TableCell className="text-xs">
                            {item["Nama Item 物料名称"]}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-red-600 font-bold">
                            {item["Kekurangan 短缺"]?.toLocaleString() ?? '0'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {item["Stock Available 可用库存"]?.toLocaleString() ?? '0'}
                          </TableCell>
                          <TableCell className="text-center text-yellow-600 text-xs">
                            {item["Warning 警告"] || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Informasi Export 导出信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label>Tanggal Data 数据日期:</Label>
                  <div className="font-medium">{previewData.today}</div>
                </div>
                <div>
                  <Label>PO Terpilih 选择的PO:</Label>
                  <div className="font-medium">{previewData.selectedOrdersCount}</div>
                </div>
                <div>
                  <Label>Total Stock Available 总可用库存:</Label>
                  <div className="font-medium">
                    {previewData.totalStockAvailable.toLocaleString() ?? '0'}
                  </div>
                </div>
                <div>
                  <Label>Total Pengeluaran 总支出:</Label>
                  <div className="font-medium">
                    {previewData.totalPengeluaran.toLocaleString() ?? '0'}
                  </div>
                </div>
                <div>
                  <Label>Items dengan Pengeluaran 有支出项目:</Label>
                  <div className="font-medium">{previewData.itemsWithPengeluaran}</div>
                </div>
                <div>
                  <Label>Periode R 期间R:</Label>
                  <div className="font-medium">201905</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <div className="text-sm text-muted-foreground flex-1">
            Data akan diexport ke file Excel dengan {previewData.stockSummary.length} items
          </div>
          <Button variant="outline" onClick={onClose} disabled={exportLoading}>
            Batal 取消
          </Button>
          <Button
            onClick={onConfirmExport}
            disabled={exportLoading}
            className="gap-2"
          >
            {exportLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Exporting... 导出中...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export to Excel 导出到Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== FUNGSI BANTU ====================

// FUNGSI: Filter hanya komponen (bukan barang jadinya)
const filterOnlyComponents = (bomItems: BomItem[]): BomItem[] => {
  return bomItems.filter((item) => item.Level > 0);
};

const filterOutINJECTIONDepartments = (bomItems: BomItem[]): BomItem[] => {
  return bomItems.filter((item) => {
    const dept = item.Departemen?.toLowerCase() || '';
    return !dept.includes('INJEKSI-BB');
  });
};

// FUNGSI: Build tree structure dari flat BOM
const buildTreeStructure = (flatBom: BomItem[]): BomItem[] => {
  if (!flatBom || flatBom.length === 0) return [];

  const itemMap = new Map<string, BomItem>();
  const rootItems: BomItem[] = [];

  flatBom.forEach((item) => {
    const treeItem = { ...item, children: [] as BomItem[] };
    itemMap.set(item.ItemID, treeItem);
  });

  flatBom.forEach((item) => {
    const treeItem = itemMap.get(item.ItemID)!;

    if (
      !item.ParentItemID ||
      item.ParentItemID === item.ItemID ||
      !itemMap.has(item.ParentItemID)
    ) {
      rootItems.push(treeItem);
    } else {
      const parent = itemMap.get(item.ParentItemID);
      if (parent && parent.children) {
        parent.children.push(treeItem);
      }
    }
  });

  return rootItems;
};

// ==================== FUNGSI PERHITUNGAN MATERIAL ====================

// Perhitungan material needs untuk single PO
const calculateMaterialNeeds = (
  bom: BomItem[],
  productionQty: number,
  stock: StockItem[] = []
) => {
  if (!bom) return { totalNeeded: 0, totalShortage: 0, items: [] };

  const componentsOnly = filterOnlyComponents(bom);

  let totalNeeded = 0;
  let totalShortage = 0;
  const items = componentsOnly.map((item) => {
    const needed = item.Qty * productionQty;
    const availableStock =
      stock.find((s) => s.itemid === item.ItemID)?.stockAkhir || 0;
    const shortage = Math.max(0, needed - availableStock);

    totalNeeded += needed;
    totalShortage += shortage;

    return {
      ...item,
      needed,
      availableStock,
      shortage,
    };
  });

  return { totalNeeded, totalShortage, items };
};

// FUNGSI: Perhitungan material needs untuk PO gabungan - FIXED VERSION
const calculateMaterialNeedsForCombinedPO = (
  bom: { flat: BomItem[]; tree: BomItem[]; combinedBoms?: any },
  productionOrders: ProductionOrder[],
  stock: StockItem[] = []
) => {
  if (!bom || !productionOrders || productionOrders.length === 0) {
    return { totalNeeded: 0, totalShortage: 0, items: [] };
  }

  const materialMap = new Map<
    string,
    {
      item: BomItem;
      totalNeeded: number;
    }
  >();

  // Hitung kebutuhan untuk setiap PO dalam gabungan
  productionOrders.forEach((po) => {
    // PERBAIKAN: Ambil BOM yang sesuai untuk item ini
    let bomForThisItem: BomItem[] = [];

    if (bom.combinedBoms && bom.combinedBoms[po.Kode_Barang]) {
      bomForThisItem = bom.combinedBoms[po.Kode_Barang].flat;
    } else {
      bomForThisItem = bom.flat;
    }

    const componentsOnly = filterOnlyComponents(bomForThisItem);

    componentsOnly.forEach((item) => {
      // PERBAIKAN: Gunakan QTY dari PO individual, bukan QTY gabungan
      const neededForThisPO = item.Qty * po.QTY;
      const existing = materialMap.get(item.ItemID);

      if (existing) {
        existing.totalNeeded += neededForThisPO;
      } else {
        materialMap.set(item.ItemID, {
          item: item,
          totalNeeded: neededForThisPO,
        });
      }
    });
  });

  let totalNeeded = 0;
  let totalShortage = 0;
  const items = Array.from(materialMap.values()).map((material) => {
    const availableStock =
      stock.find((s) => s.itemid === material.item.ItemID)?.stockAkhir || 0;
    const shortage = Math.max(0, material.totalNeeded - availableStock);

    totalNeeded += material.totalNeeded;
    totalShortage += shortage;

    return {
      ...material.item,
      needed: material.totalNeeded,
      availableStock,
      shortage,
    };
  });

  return { totalNeeded, totalShortage, items };
};

// ==================== FUNGSI BANTU YANG DIPERBAIKI UNTUK RESERVED QTY ====================

// FUNGSI: Ambil stok untuk SATU item - FIXED VERSION untuk stock real
const fetchStockForItem = async (
  itemId: string,
  orderDate: string
): Promise<StockItem | null> => {
  try {
    if (!itemId) return null;

    if (!orderDate) {
      orderDate = new Date().toISOString().split("T")[0];
    }

    const apiUrl = `/api/stock/ppic?tgl1=${orderDate}&tgl2=${orderDate}&loc=%25&periodeR=201905&kategori=%25&itemid=${encodeURIComponent(
      itemId
    )}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return {
        itemid: itemId,
        itemname: itemId,
        stockAkhir: 0,
        physicalStock: 0,
        committedQty: 0,
        reservedQty: 0,
      };
    }

    const result = await response.json();

    if (!result.success) {
      return {
        itemid: itemId,
        itemname: itemId,
        stockAkhir: 0,
        physicalStock: 0,
        committedQty: 0,
        reservedQty: 0,
      };
    }

    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      const itemData = result.data.find(
        (item: any) => item.KodeBarang === itemId
      );

      if (itemData) {
        const stockAkhir = parseFloat(itemData.SaldoAkhir) || 0;
        const committedQty = parseFloat(itemData.TotalCommitted) || 0;
        const reservedQty = parseFloat(itemData.TotalReserved) || 0;
        const physicalStock =  parseFloat(itemData.SaldoAkhirFisik) || 0;

        return {
          itemid: itemData.KodeBarang,
          itemname: itemData.NamaBarang || itemData.KodeBarang,
          stockAkhir: stockAkhir,
          physicalStock: physicalStock,
          committedQty: committedQty,
          reservedQty: reservedQty,
        };
      }
    }

    return {
      itemid: itemId,
      itemname: itemId,
      stockAkhir: 0,
      physicalStock: 0,
      committedQty: 0,
      reservedQty: 0,
    };
  } catch (err: unknown) {
    console.error(`Error fetching stock for ${itemId}:`, err);
    return {
      itemid: itemId,
      itemname: itemId,
      stockAkhir: 0,
      physicalStock: 0,
      committedQty: 0,
      reservedQty: 0,
    };
  }
};

// FUNGSI: Ambil stock dengan data committed yang lengkap - FIXED VERSION untuk reservedQty
const fetchStockForItemsWithCommitment = async (
  itemIds: string[],
  orderDate: string
): Promise<StockItem[]> => {
  const stockData: StockItem[] = [];
  const delay = 100;

  const uniqueItemIds = Array.from(new Set(itemIds)).filter(
    (id) => id && id.trim() !== ""
  );

  for (let i = 0; i < uniqueItemIds.length; i++) {
    const itemId = uniqueItemIds[i];

    try {
      const stockItem = await fetchStockForItem(itemId, orderDate);
      if (stockItem) {
        stockData.push(stockItem);
      }
    } catch (err) {
      stockData.push({
        itemid: itemId,
        itemname: itemId,
        stockAkhir: 0,
        physicalStock: 0,
        committedQty: 0,
        reservedQty: 0,
      });
    }

    if (i < uniqueItemIds.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return stockData;
};

// ==================== KOMPONEN BOM TREE YANG DIPERBAIKI ====================
const SimpleBomTree: React.FC<{
  treeData: BomItem[];
  productionQty: number;
  stock: StockItem[];
  orderDate: string;
  isCombinedPO?: boolean;
  combinedItems?: ProductionOrder[];
  combinedBoms?: { [kodeBarang: string]: { flat: BomItem[]; tree: BomItem[] } };
}> = ({
  treeData,
  productionQty,
  stock,
  orderDate,
  isCombinedPO,
  combinedItems,
  combinedBoms,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  if (!treeData || treeData.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-muted">
          <CardTitle className="text-lg flex items-center gap-2">
            <TreePine className="h-5 w-5" />
            Struktur BOM (Tree View) BOM结构(树状视图)
          </CardTitle>
          <CardDescription>
            Stok per tanggal: {orderDate} 库存日期: {orderDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-2">🌳</div>
          <div className="font-bold mb-2">Tree View Tidak Tersedia 树状视图不可用</div>
          <div className="text-sm text-muted-foreground">
            Silakan gunakan Table View untuk melihat daftar komponen.
            请使用表格视图查看组件列表。
          </div>
        </CardContent>
      </Card>
    );
  }

  const toggleNode = (itemId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const getStock = (itemId: string): number => {
    const stockItem = stock.find((s) => s.itemid === itemId);
    return stockItem ? stockItem.stockAkhir : 0;
  };

  // PERBAIKAN: Untuk PO gabungan, gunakan combinedBoms untuk menampilkan BOM yang spesifik per item
  if (
    isCombinedPO &&
    combinedItems &&
    combinedItems.length > 0 &&
    combinedBoms
  ) {
    return (
      <Card>
        <CardHeader className="bg-muted">
          <CardTitle className="text-lg flex items-center gap-2">
            <TreePine className="h-5 w-5" />
            Struktur BOM (Tree View) - PO Gabungan BOM结构(树状视图) - 合并PO
          </CardTitle>
          <CardDescription>
            Stok per tanggal: {orderDate} 库存日期: {orderDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {combinedItems.map((combinedItem, itemIndex) => {
              const itemBom = combinedBoms[combinedItem.Kode_Barang];

              if (!itemBom || !itemBom.tree || itemBom.tree.length === 0) {
                return (
                  <div
                    key={`${combinedItem.Kode_Barang}-${itemIndex}`}
                    className="border-t border-purple-300 first:border-t-0"
                  >
                    <div className="bg-purple-100 px-4 py-2 border-b border-purple-200">
                      <div className="font-bold text-purple-800">
                        📦 {combinedItem.Kode_Barang} - {combinedItem.Nama_PO}
                      </div>
                      <div className="text-sm text-purple-600">
                        QTY: {combinedItem.QTY} unit 单位
                      </div>
                    </div>
                    <div className="p-4 text-center text-gray-500">
                      BOM tidak tersedia untuk item ini 此项目无BOM
                    </div>
                  </div>
                );
              }

              const TreeNode: React.FC<{
                node: BomItem;
                depth: number;
                itemQty: number;
                parentItemId?: string;
              }> = ({ node, depth, itemQty, parentItemId }) => {
                const hasChildren = node.children && node.children.length > 0;
                const isExpanded = expandedNodes.has(
                  `${node.ItemID}-${combinedItem.Kode_Barang}-${itemIndex}${
                    parentItemId ? `-${parentItemId}` : ""
                  }`
                );

                const needed = node.Qty * itemQty;
                const availableStock = getStock(node.ItemID);
                const shortage = Math.max(0, needed - availableStock);
                const isMainItem = depth === 0;

                return (
                  <div>
                    <div
                      className="flex items-center border-b border-gray-200 hover:bg-gray-50 py-2"
                      style={{
                        paddingLeft: `${depth * 20 + 12}px`,
                        backgroundColor: isMainItem ? "#f0f9ff" : "white",
                      }}
                    >
                      <div className="w-8 flex-shrink-0">
                        {hasChildren ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleNode(
                                `${node.ItemID}-${
                                  combinedItem.Kode_Barang
                                }-${itemIndex}${
                                  parentItemId ? `-${parentItemId}` : ""
                                }`
                              )
                            }
                            className="w-6 h-6 p-0"
                          >
                            {isExpanded ? <Minus size={12} /> : <Plus size={12} />}
                          </Button>
                        ) : (
                          <div className="w-6 h-6 flex items-center justify-center text-gray-400">
                            •
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="font-mono text-sm font-bold text-blue-600 mr-3">
                                {node.ItemID}
                              </span>
                              <span className="text-sm flex-1">
                                {node.ItemName}
                              </span>
                            </div>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              {node.Departemen && (
                                <span className="mr-3">
                                  Dept: {node.Departemen}
                                </span>
                              )}
                              {node.NamaJenis && (
                                <span className="mr-3">
                                  Jenis: {node.NamaJenis}
                                </span>
                              )}
                              <span>
                                Level: {node.Level}
                              </span>
                            </div>

                            {isMainItem && (
                              <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                                <div className="text-xs text-purple-700 font-medium">
                                  PO: {combinedItem.Kode_Barang} -{" "}
                                  {combinedItem.Nama_PO}
                                </div>
                                <div className="text-xs text-purple-600">
                                  QTY: {combinedItem.QTY} unit | Butuh: {node.Qty}{" "}
                                  × {combinedItem.QTY} = {needed}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mr-4">
                            <div className="text-right">
                              <div className="text-xs text-gray-500">
                                Per Unit
                              </div>
                              <div className="font-mono text-sm font-bold">
                                {node.Qty}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">
                                Butuh
                              </div>
                              <div className="font-mono text-sm font-bold text-red-600">
                                {needed.toLocaleString() ?? '0'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">
                                Stok
                              </div>
                              <div className="font-mono text-sm font-bold text-green-600">
                                {availableStock.toLocaleString() ?? '0'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">
                                Status
                              </div>
                              <div
                                className={`font-mono text-sm font-bold ${
                                  shortage > 0 ? "text-red-600" : "text-green-600"
                                }`}
                              >
                                {shortage > 0
                                  ? `-${shortage.toLocaleString() ?? '0'}`
                                  : "✓"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && hasChildren && (
                      <div>
                        {node.children!.map((child, index) => (
                          <TreeNode
                            key={`${child.ItemID}-${combinedItem.Kode_Barang}-${itemIndex}-${index}`}
                            node={child}
                            depth={depth + 1}
                            itemQty={itemQty}
                            parentItemId={node.ItemID}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              };

              return (
                <div
                  key={`${combinedItem.Kode_Barang}-${itemIndex}`}
                  className="border-t border-purple-300 first:border-t-0"
                >
                  <div className="bg-purple-100 px-4 py-2 border-b border-purple-200">
                    <div className="font-bold text-purple-800">
                      📦 {combinedItem.Kode_Barang} - {combinedItem.Nama_PO}
                    </div>
                    <div className="text-sm text-purple-600">
                      QTY: {combinedItem.QTY} unit 单位
                    </div>
                  </div>
                  {itemBom.tree.map((node, index) => (
                    <TreeNode
                      key={`${node.ItemID}-${combinedItem.Kode_Barang}-${itemIndex}-${index}`}
                      node={node}
                      depth={0}
                      itemQty={combinedItem.QTY}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 flex justify-between">
          <div className="text-xs text-muted-foreground">
            Total PO: {combinedItems.length} 总PO数: {combinedItems.length}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allNodeIds = new Set<string>();
                combinedItems.forEach((item, itemIndex) => {
                  const itemBom = combinedBoms[item.Kode_Barang];
                  if (itemBom && itemBom.tree) {
                    const collectAllIds = (
                      nodes: BomItem[],
                      currentDepth: number,
                      parentId?: string
                    ) => {
                      nodes.forEach((node) => {
                        const nodeId = `${node.ItemID}-${
                          item.Kode_Barang
                        }-${itemIndex}${parentId ? `-${parentId}` : ""}`;
                        allNodeIds.add(nodeId);
                        if (node.children && node.children.length > 0) {
                          collectAllIds(
                            node.children,
                            currentDepth + 1,
                            node.ItemID
                          );
                        }
                      });
                    };
                    collectAllIds(itemBom.tree, 0);
                  }
                });
                setExpandedNodes(allNodeIds);
              }}
            >
              Expand All 全部展开
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedNodes(new Set())}
            >
              Collapse All 全部折叠
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  }

  const TreeNode: React.FC<{ node: BomItem; depth: number }> = ({
    node,
    depth,
  }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.ItemID);

    const needed = node.Qty * productionQty;
    const availableStock = getStock(node.ItemID);
    const shortage = Math.max(0, needed - availableStock);

    return (
      <div>
        <div
          className="flex items-center border-b border-gray-200 hover:bg-gray-50 py-2"
          style={{
            paddingLeft: `${depth * 20 + 12}px`,
            backgroundColor: depth === 0 ? "#f0f9ff" : "white",
          }}
        >
          <div className="w-8 flex-shrink-0">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleNode(node.ItemID)}
                className="w-6 h-6 p-0"
              >
                {isExpanded ? <Minus size={12} /> : <Plus size={12} />}
              </Button>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center text-gray-400">
                •
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-mono text-sm font-bold text-blue-600 mr-3">
                    {node.ItemID}
                  </span>
                  <span className="text-sm flex-1">{node.ItemName}</span>
                </div>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  {node.Departemen && (
                    <span className="mr-3">
                      Dept: {node.Departemen}
                    </span>
                  )}
                  {node.NamaJenis && (
                    <span className="mr-3">
                      Jenis: {node.NamaJenis}
                    </span>
                  )}
                  <span>
                    Level: {node.Level}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 mr-4">
                <div className="text-right">
                  <div className="text-xs text-gray-500">Per Unit</div>
                  <div className="font-mono text-sm font-bold">{node.Qty}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Butuh</div>
                  <div className="font-mono text-sm font-bold text-red-600">
                    {needed.toLocaleString() ?? '0'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Stok</div>
                  <div className="font-mono text-sm font-bold text-green-600">
                    {availableStock.toLocaleString() ?? '0'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Status</div>
                  <div
                    className={`font-mono text-sm font-bold ${
                      shortage > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {shortage > 0 ? `-${shortage.toLocaleString() ?? '0'}` : "✓"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {node.children!.map((child, index) => (
              <TreeNode
                key={`${child.ItemID}-${index}`}
                node={child}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="bg-muted">
        <CardTitle className="text-lg flex items-center gap-2">
          <TreePine className="h-5 w-5" />
          Struktur BOM (Tree View) BOM结构(树状视图)
        </CardTitle>
        <CardDescription>
          Stok per tanggal: {orderDate} 库存日期: {orderDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {treeData.map((node, index) => (
            <TreeNode key={`${node.ItemID}-${index}`} node={node} depth={0} />
          ))}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 flex justify-between">
        <div className="text-xs text-muted-foreground">
          Total Nodes: {treeData.length} 总节点数: {treeData.length}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allNodeIds = new Set<string>();
              const collectAllIds = (nodes: BomItem[]) => {
                nodes.forEach((node) => {
                  allNodeIds.add(node.ItemID);
                  if (node.children) collectAllIds(node.children);
                });
              };
              collectAllIds(treeData);
              setExpandedNodes(allNodeIds);
            }}
          >
            Expand All 全部展开
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedNodes(new Set())}
          >
            Collapse All 全部折叠
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

// ==================== KOMPONEN BOM TABLE VIEW YANG DIPERBAIKI ====================
const BomTableView: React.FC<{
  bom: BomItem[];
  productionQty: number;
  stock: StockItem[];
  orderDate: string;
  stockLastUpdated?: string;
  isCombinedPO?: boolean;
  combinedItems?: ProductionOrder[];
  combinedBoms?: { [kodeBarang: string]: { flat: BomItem[]; tree: BomItem[] } };
}> = ({
  bom,
  productionQty,
  stock,
  orderDate,
  stockLastUpdated,
  isCombinedPO,
  combinedItems,
  combinedBoms,
}) => {
  const materialNeeds = useMemo(() => {
    if (isCombinedPO && combinedItems && combinedBoms) {
      const allMaterialNeeds: any[] = [];

      combinedItems.forEach((combinedItem) => {
        const itemBom = combinedBoms[combinedItem.Kode_Barang];
        if (itemBom && itemBom.flat) {
          const componentsOnly = filterOnlyComponents(itemBom.flat);
          const itemNeeds = calculateMaterialNeeds(
            componentsOnly,
            combinedItem.QTY,
            stock
          );

          itemNeeds.items.forEach((item: any) => {
            allMaterialNeeds.push({
              ...item,
              sourcePO: combinedItem.Kode_Barang,
              sourcePOName: combinedItem.Nama_PO,
              sourceQTY: combinedItem.QTY,
            });
          });
        }
      });

      const materialMap = new Map();
      allMaterialNeeds.forEach((item) => {
        const existing = materialMap.get(item.ItemID);
        if (existing) {
          existing.needed += item.needed;
          existing.shortage = Math.max(
            0,
            existing.needed - item.availableStock
          );
          existing.sourcePOs = [
            ...(existing.sourcePOs || []),
            {
              po: item.sourcePO,
              name: item.sourcePOName,
              qty: item.sourceQTY,
              needed: item.needed,
            },
          ];
        } else {
          materialMap.set(item.ItemID, {
            ...item,
            sourcePOs: [
              {
                po: item.sourcePO,
                name: item.sourcePOName,
                qty: item.sourceQTY,
                needed: item.needed,
              },
            ],
          });
        }
      });

      const items = Array.from(materialMap.values());
      const totalNeeded = items.reduce((sum, item) => sum + item.needed, 0);
      const totalShortage = items.reduce((sum, item) => sum + item.shortage, 0);

      return { totalNeeded, totalShortage, items };
    } else {
      const componentsOnly = filterOnlyComponents(bom);
      return calculateMaterialNeeds(componentsOnly, productionQty, stock);
    }
  }, [bom, productionQty, stock, isCombinedPO, combinedItems, combinedBoms]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TableIcon className="h-5 w-5" />
          Daftar Komponen (Table View) 组件列表(表格视图)
        </CardTitle>
        <CardDescription>
          *Hanya menampilkan komponen (Level 1+), tidak termasuk barang jadinya (Level 0)
          {isCombinedPO && " | PO Gabungan: QTY per item sesuai dengan PO aslinya"}
        </CardDescription>
        {stockLastUpdated && (
          <Alert className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Stok Terbaru 最新库存</AlertTitle>
            <AlertDescription>
              Diperbarui: {new Date(stockLastUpdated).toLocaleString("id-ID")}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Item 物料代码</TableHead>
                <TableHead>Nama Item 物料名称</TableHead>
                <TableHead>Departemen 部门</TableHead>
                <TableHead>Jenis 类型</TableHead>
                {isCombinedPO && <TableHead>Sumber PO PO来源</TableHead>}
                <TableHead className="text-right">Per Unit 每单位</TableHead>
                <TableHead className="text-right">Butuh 需求</TableHead>
                <TableHead className="text-right">Stok Tersedia 可用库存</TableHead>
                <TableHead className="text-right">Status 状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materialNeeds.items.map((item: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-sm">{item.ItemID}</TableCell>
                  <TableCell className="text-sm">{item.ItemName}</TableCell>
                  <TableCell className="text-sm">{item.Departemen || "-"}</TableCell>
                  <TableCell className="text-sm">{item.NamaJenis || "-"}</TableCell>
                  {isCombinedPO && (
                    <TableCell className="text-sm">
                      {item.sourcePOs ? (
                        <div className="space-y-1">
                          {item.sourcePOs.map((source: any, index: number) => (
                            <div
                              key={index}
                              className="text-xs bg-purple-50 p-1 rounded"
                            >
                              <div className="font-medium text-purple-700">
                                {source.po}
                              </div>
                              <div className="text-purple-600">
                                QTY: {source.qty} → Butuh: {source.needed}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-right text-sm">{item.Qty}</TableCell>
                  <TableCell className="text-right text-sm font-mono text-red-600">
                    {item.needed.toLocaleString() ?? '0'}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono text-green-600">
                    {item.availableStock.toLocaleString() ?? '0'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={item.shortage > 0 ? "destructive" : "default"}
                      className="font-mono"
                    >
                      {item.shortage > 0
                        ? `-${item.shortage.toLocaleString() ?? '0'}`
                        : "Cukup"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50">
        <div className="text-sm">
          Total: {materialNeeds.items.length} komponen | Butuh:{" "}
          {materialNeeds.totalNeeded.toLocaleString() ?? '0'} | Kekurangan:{" "}
          <span className="font-bold text-red-600">
            {materialNeeds.totalShortage.toLocaleString() ?? '0'}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
};

const CommittedPOsPanel: React.FC<{
  committedPOs: CommittedPO[];
  stockReservations: StockReservation[];
  onRefresh: () => void;
}> = ({ committedPOs, stockReservations, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [showUnique, setShowUnique] = useState(true);

  const [commitDetailDrawer, setCommitDetailDrawer] = useState({
    open: false,
    spk: "",
    commits: [] as CommittedPO[],
  });

  const openCommitDetailDrawer = (noSPK: string) => {
    const allCommitsForSPK = committedPOs
      .filter((p) => p.noSPK === noSPK)
      .sort((a, b) => b.CommitID - a.CommitID);

    setCommitDetailDrawer({
      open: true,
      spk: noSPK,
      commits: allCommitsForSPK,
    });
  };

  const displayedPOs = useMemo(() => {
    if (showUnique) {
      const poMap = new Map<string, CommittedPO>();

      committedPOs.forEach((po) => {
        const existingPO = poMap.get(po.noSPK);

        if (!existingPO || po.CommitID > existingPO.CommitID) {
          poMap.set(po.noSPK, po);
        }
      });

      return Array.from(poMap.values()).sort((a, b) => b.CommitID - a.CommitID);
    } else {
      return committedPOs.sort((a, b) => b.CommitID - a.CommitID);
    }
  }, [committedPOs, showUnique]);

  const activeReservations = stockReservations.filter(
    (r) => r.status === "RESERVED"
  );

  const totalReservedQty = activeReservations.reduce(
    (sum, r) => sum + r.reservedQty,
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            History PO yang Sudah Di-commit
            {showUnique && " (Unique by No SPK)"}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={showUnique ? "default" : "outline"}
              size="sm"
              onClick={() => setShowUnique(!showUnique)}
            >
              {showUnique ? "Show All" : "Show Unique"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Sembunyikan" : "Tampilkan"}
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-muted-foreground">
                    {showUnique ? "Unique PO" : "Total PO"}
                  </div>
                  <div className="text-2xl font-bold">{displayedPOs.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-muted-foreground">
                    Active Reservations
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {activeReservations.length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-muted-foreground">
                    Total Qty Reserved
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {totalReservedQty.toLocaleString() ?? '0'}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-muted-foreground">
                    Items Reserved
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {
                      Array.from(new Set(activeReservations.map((r) => r.itemID)))
                        .length
                    }
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Info Mode Tampilan</AlertTitle>
              <AlertDescription>
                {showUnique
                  ? `Menampilkan ${displayedPOs.length} data unik (berdasarkan No SPK) dari total ${committedPOs.length} records.`
                  : `Menampilkan semua ${displayedPOs.length} records commit.`}
              </AlertDescription>
            </Alert>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commit ID</TableHead>
                    <TableHead>No SPK</TableHead>
                    <TableHead>PO</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Materials</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedPOs.map((po, index) => (
                    // Gunakan key kombinasi CommitID + index untuk memastikan unik
                    <TableRow key={`${po.CommitID}-${index}`}>
                      <TableCell className="font-mono text-xs">
                        {po.CommitID}
                      </TableCell>
                      <TableCell className="font-medium">{po.noSPK}</TableCell>
                      <TableCell>
                        <div className="font-medium">{po.namaPO}</div>
                        <div className="text-xs text-muted-foreground">
                          {po.kodeBarang}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {po.qty.toLocaleString() ?? '0'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(po.tanggalCommit).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={po.status === "COMMITTED" ? "default" : "secondary"}>
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>{po.totalMaterials} items</div>
                        <div className="text-xs text-muted-foreground">
                          {po.totalQtyReserved.toLocaleString() ?? '0'} qty
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCommitDetailDrawer(po.noSPK)}
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter>
            {displayedPOs.length === 0 && (
              <div className="text-center w-full text-muted-foreground">
                Tidak ada PO yang di-commit
              </div>
            )}
          </CardFooter>
        </>
      )}

      <Sheet
        open={commitDetailDrawer.open}
        onOpenChange={(open) =>
          setCommitDetailDrawer((prev) => ({ ...prev, open }))
        }
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Detail Commit untuk SPK {commitDetailDrawer.spk}
            </SheetTitle>
            <SheetDescription>
              Total: {commitDetailDrawer.commits.length} records
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 py-4">
            {commitDetailDrawer.commits.map((commit, index) => (
              <Card key={`${commit.CommitID}-${index}`}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className="font-mono">ID: {commit.CommitID}</Badge>
                      <Badge variant={commit.status === "COMMITTED" ? "default" : "secondary"}>
                        {commit.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label>Tanggal</Label>
                      <div className="font-medium">
                        {new Date(commit.tanggalCommit).toLocaleDateString("id-ID")}
                      </div>
                    </div>
                    <div>
                      <Label>Qty</Label>
                      <div className="font-medium text-right">
                        {commit.qty.toLocaleString() ?? '0'}
                      </div>
                    </div>
                    <div>
                      <Label>Materials</Label>
                      <div className="font-medium">
                        {commit.totalMaterials} items
                      </div>
                    </div>
                    <div>
                      <Label>Qty Reserved</Label>
                      <div className="font-medium text-right">
                        {commit.totalQtyReserved.toLocaleString() ?? '0'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    <div>Kode Barang: {commit.kodeBarang}</div>
                    <div>User ID: {commit.userID}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {commitDetailDrawer.commits.length > 0 && (
            <div className="mt-4">
              <Alert>
                <BarChart className="h-4 w-4" />
                <AlertTitle>Summary</AlertTitle>
                <AlertDescription>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Total Records: {commitDetailDrawer.commits.length}</div>
                    <div>Active: {commitDetailDrawer.commits.filter(c => c.status === "COMMITTED").length}</div>
                    <div>Latest Commit: {commitDetailDrawer.commits[0]?.CommitID}</div>
                    <div>Total Qty: {commitDetailDrawer.commits.reduce((sum, c) => sum + c.qty, 0).toLocaleString() ?? '0'}</div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
};

// ==================== KOMPONEN UTAMA ====================
export default function ProductionPlanPage() {
  const [orders, setOrders] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [committing, setCommitting] = useState<string | null>(null);

  const [committedPOs, setCommittedPOs] = useState<CommittedPO[]>([]);
  const [stockReservations, setStockReservations] = useState<
    StockReservation[]
  >([]);

  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [exportProgress, setExportProgress] = useState({
    visible: false,
    current: 0,
    total: 0,
    message: "",
  });

  const [exportPreview, setExportPreview] = useState<{
    isOpen: boolean;
    data: ExportPreviewData | null;
  }>({
    isOpen: false,
    data: null,
  });

  // ==================== FUNGSI BANTU ====================

  const forceRefreshUI = useCallback(() => {
    setOrders((prev) => [...prev]);
  }, []);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) {
      return orders;
    }

    const query = searchQuery.toLowerCase().trim();
    return orders.filter((order) => {
      const noSPK = order.order.No_SPK || "";
      const namaPO = order.order.Nama_PO || "";
      const kodeBarang = order.order.Kode_Barang || "";

      const mainMatch =
        noSPK.toLowerCase().includes(query) ||
        namaPO.toLowerCase().includes(query) ||
        kodeBarang.toLowerCase().includes(query);

      const combinedMatch =
        order.order.combinedItems &&
        order.order.combinedItems.some((item) => {
          const itemNamaPO = item.Nama_PO || "";
          const itemKodeBarang = item.Kode_Barang || "";
          return (
            itemNamaPO.toLowerCase().includes(query) ||
            itemKodeBarang.toLowerCase().includes(query)
          );
        });

      return mainMatch || combinedMatch;
    });
  }, [orders, searchQuery]);

  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const getAllKodeBarang = (kodeBarang: string): string[] => {
    if (kodeBarang.includes(" | ")) {
      return kodeBarang.split(" | ");
    }
    return [kodeBarang];
  };

  // ==================== FUNGSI UTAMA YANG DIPERBAIKI ====================

  const combineDuplicatePOs = (
    orders: ProductionOrder[],
  ): ProductionOrder[] => {
    const poMap = new Map<string, ProductionOrder>();

    orders.forEach((order) => {
      const existingPO = poMap.get(order.No_SPK);

      if (existingPO) {
        if (!existingPO.combinedItems) {
          existingPO.combinedItems = [
            {
              ...existingPO,
              isCombined: false,
            },
          ];
        }

        existingPO.combinedItems.push({
          ...order,
          isCombined: true,
        });

        existingPO.QTY = existingPO.QTY;

        if (existingPO.Nama_PO !== order.Nama_PO) {
          existingPO.Nama_PO = `${existingPO.Nama_PO} | ${order.Nama_PO}`;
        }

        if (existingPO.Kode_Barang !== order.Kode_Barang) {
          existingPO.Kode_Barang = `${existingPO.Kode_Barang} | ${order.Kode_Barang}`;
        }

        if (
          new Date(order.Tanggal_Order) > new Date(existingPO.Tanggal_Order)
        ) {
          existingPO.Tanggal_Order = order.Tanggal_Order;
        }
      } else {
        poMap.set(order.No_SPK, {
          ...order,
          combinedItems: [
            {
              ...order,
              isCombined: false,
            },
          ],
        });
      }
    });

    return Array.from(poMap.values());
  };

  const combineBoms = (boms: {
    [kodeBarang: string]: { flat: BomItem[]; tree: BomItem[] };
  }): {
    flat: BomItem[];
    tree: BomItem[];
    combinedBoms: {
      [kodeBarang: string]: { flat: BomItem[]; tree: BomItem[] };
    };
  } => {
    const combinedFlat: BomItem[] = [];
    const itemMap = new Map<string, BomItem>();

    Object.values(boms).forEach((bom) => {
      bom.flat.forEach((item) => {
        const existingItem = itemMap.get(item.ItemID);
        if (existingItem) {
          existingItem.Qty += item.Qty;
        } else {
          const newItem = { ...item };
          itemMap.set(item.ItemID, newItem);
          combinedFlat.push(newItem);
        }
      });
    });

    const combinedTree: BomItem[] = [];
    Object.values(boms).forEach((bom) => {
      if (bom.tree && bom.tree.length > 0) {
        combinedTree.push(...bom.tree);
      }
    });

    return {
      flat: combinedFlat,
      tree: combinedTree,
      combinedBoms: boms,
    };
  };

  // ==================== FUNGSI SINKRONISASI COMMIT ====================
  const syncCommitStatus = useCallback(() => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        const committedPO = committedPOs.find(
          (po) => po.noSPK === order.order.No_SPK && po.status === "COMMITTED",
        );

        const shouldBeCommitted = !!committedPO;
        const currentCommitID = order.CommitID;
        const newCommitID = committedPO?.CommitID;

        if (
          order.committed !== shouldBeCommitted ||
          currentCommitID !== newCommitID
        ) {
          return {
            ...order,
            committed: shouldBeCommitted,
            CommitID: newCommitID,
            selected: shouldBeCommitted ? false : order.selected,
          };
        }

        return order;
      }),
    );
  }, [committedPOs]);

  const loadCommittedPOs = async (): Promise<void> => {
    try {
      const response = await fetch("/api/ppic/committed-pos", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const newCommittedPOs = result.data.committedPOs || [];
        const newReservations = result.data.reservations || [];

        setCommittedPOs(newCommittedPOs);
        setStockReservations(newReservations);

        setTimeout(() => {
          syncCommitStatus();
        }, 100);
      }
    } catch (error) {
      console.error("Error loading committed POs:", error);
    }
  };

  const refreshAllData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await loadCommittedPOs();
      await fetchOrders(dateFilter.startDate, dateFilter.endDate);
    } catch (error) {
      console.error("Error refreshAllData:", error);
    } finally {
      setLoading(false);
    }
  }, [dateFilter.startDate, dateFilter.endDate]);

  // ==================== FUNGSI PAGINATION ====================

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // ==================== FUNGSI LAINNYA ====================

  const fetchOrders = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      setError("");

      let url = "/api/ppic";
      const params = new URLSearchParams();

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get<ProductionOrder[]>(url);
      const combinedOrders = combineDuplicatePOs(response.data);

      const productionPlans: ProductionPlan[] = combinedOrders.map((order) => {
        const existingOrder = orders.find(
          (o) => o.order.No_SPK === order.No_SPK,
        );
        const committedPO = committedPOs.find(
          (po) => po.noSPK === order.No_SPK && po.status === "COMMITTED",
        );

        const isCommitted = existingOrder?.committed ?? !!committedPO;
        const CommitID = existingOrder?.CommitID ?? committedPO?.CommitID;

        return {
          order: {
            ...order,
            QTY: order.QTY || 0,
            originalOrders: order.combinedItems || [order],
          },
          expanded: existingOrder?.expanded ?? false,
          loading: false,
          selected: existingOrder?.selected ?? false,
          loadingBom: false,
          viewMode: existingOrder?.viewMode ?? "table",
          committed: isCommitted,
          CommitID: CommitID,
          bom: existingOrder?.bom,
          stock: existingOrder?.stock,
          stockLastUpdated: existingOrder?.stockLastUpdated,
        };
      });

      setOrders(productionPlans);
      setCurrentPage(1);
    } catch (err: unknown) {
      console.error("Error fetchOrders:", err);
      if (err instanceof Error) {
        setError("Gagal mengambil data produksi: " + err.message);
      } else {
        setError("Gagal mengambil data produksi: Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyDateFilter = () => {
    fetchOrders(dateFilter.startDate, dateFilter.endDate);
  };

  const resetDateFilter = () => {
    setDateFilter({ startDate: "", endDate: "" });
    fetchOrders();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const refreshStockForPlan = async (index: number) => {
    const globalIndex = (currentPage - 1) * itemsPerPage + index;
    const plan = filteredOrders[globalIndex];

    if (plan.bom && plan.stock) {
      try {
        setOrders((prev) =>
          prev.map((item, i) =>
            i === globalIndex ? { ...item, loading: true } : item,
          ),
        );

        const updatedStock = await fetchStockForItemsWithCommitment(
          plan.bom.flat.map((item) => item.ItemID),
          plan.order.Tanggal_Order,
        );

        setOrders((prev) =>
          prev.map((item, i) =>
            i === globalIndex
              ? {
                  ...item,
                  stock: updatedStock,
                  loading: false,
                  stockLastUpdated: new Date().toISOString(),
                }
              : item,
          ),
        );
      } catch (error) {
        console.error(`Gagal refresh stok:`, error);
        setOrders((prev) =>
          prev.map((item, i) =>
            i === globalIndex ? { ...item, loading: false } : item,
          ),
        );
      }
    }
  };

  const refreshReservedQtyData = useCallback(async () => {
    try {
      const allItemIds: string[] = [];
      orders.forEach((order) => {
        if (order.bom && order.stock) {
          order.bom.flat.forEach((item) => {
            allItemIds.push(item.ItemID);
          });
        }
      });

      const uniqueItemIds = Array.from(new Set(allItemIds));
      const refreshedStock = await fetchStockForItemsWithCommitment(
        uniqueItemIds,
        new Date().toISOString().split("T")[0],
      );

      setOrders((prev) =>
        prev.map((order) => {
          if (order.bom) {
            const orderItemIds = order.bom.flat.map((item) => item.ItemID);
            const relevantStock = refreshedStock.filter((stock) =>
              orderItemIds.includes(stock.itemid),
            );

            return {
              ...order,
              stock: relevantStock,
              stockLastUpdated: new Date().toISOString(),
            };
          }
          return order;
        }),
      );
    } catch (error) {
      console.error("Error refreshing reservedQty data:", error);
    }
  }, [orders]);

const commitPO = async (index: number): Promise<void> => {
  const globalIndex = (currentPage - 1) * itemsPerPage + index;
  const plan = filteredOrders[globalIndex];

  if (!plan.bom || !plan.stock) {
    alert("BOM belum diload untuk PO ini!");
    return;
  }

  const alreadyCommitted = committedPOs.find(
    (po) => po.noSPK === plan.order.No_SPK && po.status === "COMMITTED",
  );

  if (alreadyCommitted) {
    alert(`PO ${plan.order.No_SPK} sudah di-commit sebelumnya!`);
    return;
  }

  setCommitting(plan.order.No_SPK);

  try {
    const materialUsage: MaterialUsageItem[] = [];

    // Fungsi untuk menghitung akumulasi qty dari BOM bertingkat
    const calculateAccumulatedQtyForCommit = (itemId: string, bomFlat: BomItem[]): number => {
      const item = bomFlat.find(b => b.ItemID === itemId);
      if (!item) return 0;
      
      // Level 0 (produk jadi) selalu 1
      if (item.Level === 0) return 1;
      
      // Level 1 langsung dari produk jadi
      if (item.Level === 1) return item.Qty;
      
      // Level > 1: cari parent dan kalikan
      if (item.Level > 1 && item.ParentItemID) {
        const parent = bomFlat.find(b => b.ItemID === item.ParentItemID);
        if (parent) {
          const parentQty = calculateAccumulatedQtyForCommit(parent.ItemID, bomFlat);
          return item.Qty * parentQty;
        }
      }
      
      return item.Qty;
    };

    if (plan.order.combinedItems && plan.order.combinedItems.length > 1) {
      for (const combinedItem of plan.order.combinedItems) {
        let bomForThisItem: BomItem[] = [];
        if (
          plan.bom.combinedBoms &&
          plan.bom.combinedBoms[combinedItem.Kode_Barang]
        ) {
          bomForThisItem = plan.bom.combinedBoms[combinedItem.Kode_Barang].flat;
        } else {
          bomForThisItem = plan.bom.flat;
        }

        // Hanya komponen (Level > 0) dan filter INJEKSI-BB
        const componentsOnly = bomForThisItem.filter(b => b.Level > 0 && !isINJECTIONDepartment(b.Departemen));

        for (const bomItem of componentsOnly) {
          // Hitung akumulasi qty dengan mempertimbangkan parent
          const accumulatedQty = calculateAccumulatedQtyForCommit(bomItem.ItemID, bomForThisItem);
          const needed = accumulatedQty * combinedItem.QTY;
          
          const availableStock =
            plan.stock?.find((s) => s.itemid === bomItem.ItemID)?.stockAkhir || 0;
          const usedQty = needed;
          const stockAfter = availableStock - usedQty;

          console.log(`Commit: ${bomItem.ItemID} - Base Qty: ${bomItem.Qty}, Accumulated: ${accumulatedQty}, PO Qty: ${combinedItem.QTY}, Total Needed: ${needed}`);

          materialUsage.push({
            itemId: bomItem.ItemID,
            itemName: bomItem.ItemName,
            qtyPerUnit: bomItem.Qty,
            totalNeeded: needed,
            stockBefore: availableStock,
            stockAfter: stockAfter,
            qtyUsed: usedQty,
            departemen: bomItem.Departemen,
            level: bomItem.Level,
          });
        }
      }
    } else {
      // PO Biasa
      const componentsOnly = plan.bom.flat.filter(b => b.Level > 0 && !isINJECTIONDepartment(b.Departemen));

      for (const bomItem of componentsOnly) {
        // Hitung akumulasi qty dengan mempertimbangkan parent
        const accumulatedQty = calculateAccumulatedQtyForCommit(bomItem.ItemID, plan.bom.flat);
        const needed = accumulatedQty * plan.order.QTY;
        
        const availableStock =
          plan.stock?.find((s) => s.itemid === bomItem.ItemID)?.stockAkhir || 0;
        const usedQty = needed;
        const stockAfter = availableStock - usedQty;

        console.log(`Commit: ${bomItem.ItemID} - Base Qty: ${bomItem.Qty}, Accumulated: ${accumulatedQty}, PO Qty: ${plan.order.QTY}, Total Needed: ${needed}`);

        materialUsage.push({
          itemId: bomItem.ItemID,
          itemName: bomItem.ItemName,
          qtyPerUnit: bomItem.Qty,
          totalNeeded: needed,
          stockBefore: availableStock,
          stockAfter: stockAfter,
          qtyUsed: usedQty,
          departemen: bomItem.Departemen,
          level: bomItem.Level,
        });
      }
    }

    const materialsWithShortage = materialUsage.filter(
      (m) => m.stockBefore < m.qtyUsed,
    ).length;

    if (materialsWithShortage > 0) {
      const shortageMaterials = materialUsage
        .filter((m) => m.stockBefore < m.qtyUsed)
        .map(
          (m) =>
            `• ${m.itemId}: Butuh ${m.qtyUsed}, Stok ${m.stockBefore} (Kurang ${
              m.qtyUsed - m.stockBefore
            })`,
        )
        .join("\n");

      const userConfirmed = confirm(
        `⚠️ PERHATIAN: Ada ${materialsWithShortage} material dengan stok tidak cukup:\n\n${shortageMaterials}\n\nApakah Anda yakin tetap ingin commit PO? Stok akan dicatat sebagai minus.`,
      );

      if (!userConfirmed) {
        setCommitting(null);
        return;
      }
    }

    const response = await fetch("/api/ppic/commit-po", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        noSPK: plan.order.No_SPK,
        kodeBarang: plan.order.Kode_Barang,
        namaPO: plan.order.Nama_PO,
        qty: plan.order.QTY,
        userID: "system",
        materialUsage: materialUsage,
        isCombinedPO:
          plan.order.combinedItems && plan.order.combinedItems.length > 1,
        combinedItems: plan.order.combinedItems,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Unknown error from server");
    }

    const newCommittedPO: CommittedPO = {
      CommitID: result.CommitID,
      noSPK: plan.order.No_SPK,
      kodeBarang: plan.order.Kode_Barang,
      namaPO: plan.order.Nama_PO,
      qty: plan.order.QTY,
      tanggalCommit: new Date().toISOString(),
      userID: "system",
      status: "COMMITTED",
      totalMaterials: materialUsage.length,
      totalQtyReserved: materialUsage.reduce(
        (sum, item) => sum + item.qtyUsed,
        0,
      ),
    };

    setCommittedPOs((prev) => [...prev, newCommittedPO]);

    setOrders((prev) =>
      prev.map((item) =>
        item.order.No_SPK === plan.order.No_SPK
          ? {
              ...item,
              committed: true,
              CommitID: result.CommitID,
              selected: false,
            }
          : item,
      ),
    );

    setTimeout(() => {
      forceRefreshUI();
      alert(
        `✅ PO berhasil di-commit!\nCommit ID: ${result.CommitID}\n${materialUsage.length} material di-reserve\nTotal Reserved Qty: ${materialUsage.reduce((sum, item) => sum + item.qtyUsed, 0)}`,
      );
    }, 100);
  } catch (error: any) {
    console.error(`❌ Gagal commit PO ${plan.order.No_SPK}:`, error);
    alert(`❌ Gagal commit PO: ${error.message || "Unknown error"}`);
  } finally {
    setCommitting(null);
  }
};
  const uncommitPO = async (index: number): Promise<void> => {
    const globalIndex = (currentPage - 1) * itemsPerPage + index;
    const plan = filteredOrders[globalIndex];

    if (
      !confirm(
        `Apakah Anda yakin ingin uncommit PO ${plan.order.No_SPK}? Stok akan dikembalikan.`,
      )
    ) {
      return;
    }

    setCommitting(plan.order.No_SPK);

    try {
      const response = await fetch("/api/ppic/uncommit-po", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noSPK: plan.order.No_SPK,
          userID: "system",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Unknown error from server");
      }

      setOrders((prev) =>
        prev.map((item) =>
          item.order.No_SPK === plan.order.No_SPK
            ? {
                ...item,
                committed: false,
                CommitID: undefined,
                selected: false,
              }
            : item,
        ),
      );

      setCommittedPOs((prev) =>
        prev.filter(
          (po) =>
            !(po.noSPK === plan.order.No_SPK && po.status === "COMMITTED"),
        ),
      );

      setTimeout(() => {
        forceRefreshUI();
        alert("✅ PO berhasil di-uncommit! Stok telah dikembalikan.");
      }, 100);
    } catch (error: any) {
      console.error(`❌ Gagal uncommit PO ${plan.order.No_SPK}:`, error);
      alert(`❌ Gagal uncommit PO: ${error.message || "Unknown error"}`);

      setOrders((prev) =>
        prev.map((item) =>
          item.order.No_SPK === plan.order.No_SPK
            ? {
                ...item,
                committed: true,
              }
            : item,
        ),
      );
    } finally {
      setCommitting(null);
    }
  };

  const resetCommittedPOs = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin mereset SEMUA PO yang sudah di-commit? Tindakan ini akan mengembalikan semua stok yang di-reserve.",
      )
    ) {
      return;
    }

    try {
      const committedPOsToReset = committedPOs.filter(
        (po) => po.status === "COMMITTED",
      );

      for (const po of committedPOsToReset) {
        const response = await fetch("/api/ppic/uncommit-po", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            noSPK: po.noSPK,
            userID: "current_user",
          }),
        });

        const result = await response.json();
        if (!result.success) {
          console.error(`Gagal uncommit PO ${po.noSPK}:`, result.error);
        }
      }

      setOrders((prev) =>
        prev.map((order) => ({
          ...order,
          committed: false,
          CommitID: undefined,
          selected: false,
        })),
      );

      setCommittedPOs((prev) => prev.filter((po) => po.status !== "COMMITTED"));

      await loadCommittedPOs();

      alert(`Berhasil reset ${committedPOsToReset.length} PO yang di-commit!`);
    } catch (error) {
      console.error("Gagal reset committed POs:", error);
      alert("Gagal reset committed POs. Silakan coba lagi.");
    }
  };

  const loadBomWithStock = async (
    index: number,
    kodeBarang: string,
    orderDate: string,
  ) => {
    try {
      setOrders((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, loading: true, error: undefined } : item,
        ),
      );

      const allKodeBarang = getAllKodeBarang(kodeBarang);

      const combinedBoms: {
        [kodeBarang: string]: { flat: BomItem[]; tree: BomItem[] };
      } = {};
      const failedBoms: string[] = [];
      let allItemIds: string[] = [];

      for (const kb of allKodeBarang) {
        try {
          const bomResponse = await axios.get(
            `/api/bom/ppic?itemid=${encodeURIComponent(kb)}`,
            { timeout: 10000 },
          );

          if (bomResponse.data && bomResponse.data.flat) {
            const treeStructure = buildTreeStructure(bomResponse.data.flat);
            combinedBoms[kb] = {
              flat: bomResponse.data.flat,
              tree: treeStructure,
            };

            const itemIds = bomResponse.data.flat.map(
              (item: BomItem) => item.ItemID,
            );
            allItemIds = [...allItemIds, ...itemIds];
          } else {
            throw new Error("Data BOM tidak valid");
          }
        } catch (err) {
          console.error(`Gagal load BOM untuk ${kb}:`, err);
          failedBoms.push(kb);
        }
      }

      if (Object.keys(combinedBoms).length === 0) {
        throw new Error(
          `Gagal memuat BOM untuk semua kode barang: ${allKodeBarang.join(
            ", ",
          )}`,
        );
      }

      allItemIds = Array.from(new Set(allItemIds));

      let stockData: StockItem[] = [];
      try {
        stockData = await fetchStockForItemsWithCommitment(
          allItemIds,
          orderDate,
        );
      } catch (stockError) {
        console.error(`Gagal mengambil stok:`, stockError);
        stockData = allItemIds.map((id) => ({
          itemid: id,
          itemname: id,
          stockAkhir: 0,
          committedQty: 0,
          reservedQty: 0,
        }));
      }

      const finalBom = combineBoms(combinedBoms);

      setOrders((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                bom: finalBom,
                stock: stockData,
                loading: false,
                expanded: true,
                viewMode: "table",
                stockLastUpdated: new Date().toISOString(),
                error:
                  failedBoms.length > 0
                    ? `Beberapa BOM gagal dimuat: ${failedBoms.join(", ")}`
                    : undefined,
              }
            : item,
        ),
      );
    } catch (err: unknown) {
      console.error(`Error untuk ${kodeBarang}:`, err);
      setOrders((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                loading: false,
                error:
                  err instanceof Error
                    ? `Gagal memuat data: ${err.message}`
                    : "Gagal memuat data: Unknown error",
              }
            : item,
        ),
      );
    }
  };

  const toggleOrder = async (
    index: number,
    kodeBarang: string,
    orderDate: string,
  ) => {
    const globalIndex = (currentPage - 1) * itemsPerPage + index;
    const order = filteredOrders[globalIndex];

    if (order.expanded) {
      setOrders((prev) =>
        prev.map((item, i) =>
          i === globalIndex ? { ...item, expanded: false } : item,
        ),
      );
    } else {
      if (!order.bom && !order.loading) {
        await loadBomWithStock(globalIndex, kodeBarang, orderDate);
      } else {
        if (order.bom && order.stock) {
          await refreshStockForPlan(index);
        }

        setOrders((prev) =>
          prev.map((item, i) =>
            i === globalIndex ? { ...item, expanded: true } : item,
          ),
        );
      }
    }
  };

  const toggleSelection = async (index: number) => {
    const globalIndex = (currentPage - 1) * itemsPerPage + index;
    const order = filteredOrders[globalIndex];
    const newSelected = !order.selected;

    if (newSelected && !order.bom && !order.loadingBom && !order.committed) {
      setOrders((prev) =>
        prev.map((item, i) =>
          i === globalIndex ? { ...item, loadingBom: true } : item,
        ),
      );

      try {
        const allKodeBarang = getAllKodeBarang(order.order.Kode_Barang);
        const combinedBoms: {
          [kodeBarang: string]: { flat: BomItem[]; tree: BomItem[] };
        } = {};
        let allItemIds: string[] = [];

        for (const kb of allKodeBarang) {
          try {
            const bomResponse = await axios.get(
              `/api/bom/ppic?itemid=${encodeURIComponent(kb)}`,
            );
            const treeStructure = buildTreeStructure(bomResponse.data.flat);
            combinedBoms[kb] = {
              flat: bomResponse.data.flat,
              tree: treeStructure,
            };

            const itemIds = bomResponse.data.flat.map(
              (item: BomItem) => item.ItemID,
            );
            allItemIds = [...allItemIds, ...itemIds];
          } catch (err) {
            console.error(`Gagal load BOM untuk ${kb}:`, err);
          }
        }

        allItemIds = Array.from(new Set(allItemIds));

        const stockData = await fetchStockForItemsWithCommitment(
          allItemIds,
          order.order.Tanggal_Order,
        );

        const finalBom = combineBoms(combinedBoms);

        setOrders((prev) =>
          prev.map((item, i) =>
            i === globalIndex
              ? {
                  ...item,
                  bom: finalBom,
                  stock: stockData,
                  selected: newSelected,
                  loadingBom: false,
                  viewMode: "table",
                  stockLastUpdated: new Date().toISOString(),
                }
              : item,
          ),
        );
      } catch (err: unknown) {
        console.error(`Error loading BOM:`, err);
        setOrders((prev) =>
          prev.map((item, i) =>
            i === globalIndex
              ? {
                  ...item,
                  selected: newSelected,
                  loadingBom: false,
                  error:
                    err instanceof Error
                      ? `Gagal load BOM: ${err.message}`
                      : "Gagal load BOM: Unknown error",
                }
              : item,
          ),
        );
      }
    } else {
      setOrders((prev) =>
        prev.map((item, i) =>
          i === globalIndex ? { ...item, selected: newSelected } : item,
        ),
      );
    }
  };

  const toggleViewMode = (index: number) => {
    const globalIndex = (currentPage - 1) * itemsPerPage + index;
    setOrders((prev) =>
      prev.map((item, i) =>
        i === globalIndex
          ? {
              ...item,
              viewMode: item.viewMode === "table" ? "tree" : "table",
            }
          : item,
      ),
    );
  };

  const toggleSelectAll = () => {
    const allSelected = paginatedOrders.every(
      (order) => order.selected && !order.committed,
    );
    const newSelected = !allSelected;

    setOrders((prev) =>
      prev.map((order, index) => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        if (index >= startIndex && index < endIndex && !order.committed) {
          return { ...order, selected: newSelected };
        }
        return order;
      }),
    );
  };

  const toggleSelectAllGlobal = () => {
    const allSelected = filteredOrders.every(
      (order) => order.selected && !order.committed,
    );
    const newSelected = !allSelected;

    setOrders((prev) =>
      prev.map((order) =>
        !order.committed ? { ...order, selected: newSelected } : order,
      ),
    );
  };

  const calculateMaterialNeedsForExport = (
    bom: BomItem[],
    productionQty: number,
    stock: StockItem[] = [],
  ) => {
    if (!bom) return { totalNeeded: 0, totalShortage: 0, items: [] };

    const componentsOnly = filterOnlyComponents(bom).filter((item) => {
      return !isINJECTIONDepartment(item.Departemen);
    });

    let totalNeeded = 0;
    let totalShortage = 0;
    const items = componentsOnly.map((item) => {
      const needed = item.Qty * productionQty;
      const availableStock = stock.find((s) => s.itemid === item.ItemID)?.stockAkhir || 0;
      const shortage = Math.max(0, needed - availableStock);

      totalNeeded += needed;
      totalShortage += shortage;

      return {
        ...item,
        needed,
        availableStock,
        shortage,
      };
    });

    return { totalNeeded, totalShortage, items };
  };

  const calculateMaterialNeedsForCombinedPOForExport = (
    bom: { flat: BomItem[]; tree: BomItem[]; combinedBoms?: any },
    productionOrders: ProductionOrder[],
    stock: StockItem[] = [],
  ) => {
    if (!bom || !productionOrders || productionOrders.length === 0) {
      return { totalNeeded: 0, totalShortage: 0, items: [] };
    }

    const materialMap = new Map<
      string,
      {
        item: BomItem;
        totalNeeded: number;
      }
    >();

    productionOrders.forEach((po) => {
      let bomForThisItem: BomItem[] = [];

      if (bom.combinedBoms && bom.combinedBoms[po.Kode_Barang]) {
        bomForThisItem = bom.combinedBoms[po.Kode_Barang].flat;
      } else {
        bomForThisItem = bom.flat;
      }

      const componentsOnly = filterOnlyComponents(bomForThisItem).filter(
        (item) => {
          return !isINJECTIONDepartment(item.Departemen);
        },
      );

      componentsOnly.forEach((item) => {
        const neededForThisPO = item.Qty * po.QTY;
        const existing = materialMap.get(item.ItemID);

        if (existing) {
          existing.totalNeeded += neededForThisPO;
        } else {
          materialMap.set(item.ItemID, {
            item: item,
            totalNeeded: neededForThisPO,
          });
        }
      });
    });

    let totalNeeded = 0;
    let totalShortage = 0;
    const items = Array.from(materialMap.values()).map((material) => {
      const availableStock = stock.find((s) => s.itemid === material.item.ItemID)?.stockAkhir || 0;
      const shortage = Math.max(0, material.totalNeeded - availableStock);

      totalNeeded += material.totalNeeded;
      totalShortage += shortage;

      return {
        ...material.item,
        needed: material.totalNeeded,
        availableStock,
        shortage,
      };
    });

    return { totalNeeded, totalShortage, items };
  };

  const previewExport = async (): Promise<void> => {
    try {
      setExportLoading(true);

      const selectedOrders = filteredOrders.filter(
        (order) => order.selected && !order.committed,
      );

      if (selectedOrders.length === 0) {
        alert("Tidak ada PO yang dipilih untuk di-export! 没有选择要导出的PO!");
        return;
      }

      setExportProgress({
        visible: true,
        current: 5,
        total: 100,
        message: "Mempersiapkan data untuk preview...",
      });

      const today = new Date().toISOString().split("T")[0];

      let totalItems = 0;
      let sufficientItems = 0;
      let problemItemsCount = 0;
      let itemsWithVariantCount = 0;
      let totalStockAvailable = 0;
      let INJECTIONItemsRemoved = 0;

      const stockSummary: any[] = [];

      for (const order of selectedOrders) {
        if (order.bom && order.stock) {
          let materialNeeds;

          if (order.order.combinedItems && order.order.combinedItems.length > 1) {
            materialNeeds = calculateMaterialNeedsForCombinedPOForExport(
              order.bom,
              order.order.combinedItems,
              order.stock,
            );
          } else {
            materialNeeds = calculateMaterialNeedsForExport(
              order.bom.flat,
              order.order.QTY,
              order.stock,
            );
          }

          materialNeeds.items.forEach((item: any) => {
            if (isINJECTIONDepartment(item.Departemen)) {
              INJECTIONItemsRemoved++;
              return;
            }

            const hasVariant = itemsWithVariants.includes(item.ItemID);
            const stockAvailable = item.availableStock;
            const remainingStock = stockAvailable - item.needed;
            const status = remainingStock >= 0 ? "CUKUP 充足" : "KURANG 不足";

            stockSummary.push({
              "Kode Item 物料代码": item.ItemID,
              "Nama Item 物料名称": item.ItemName,
              "Departemen 部门": item.Departemen || "-",
              "Sum of Total 总需求 (PO)": item.needed,
              "Stock Available 可用库存": stockAvailable,
              "Remaining Stock 剩余库存": remainingStock,
              "Status 状态": status,
              "Warning 警告": hasVariant ? "⚠️ ADA VARIANT 有变体" : "",
              "INJEKSI-BB Filter 注塑过滤": "DISERTAKAN 已包含",
            });

            totalItems++;
            if (status === "CUKUP 充足") sufficientItems++;
            if (remainingStock < 0) problemItemsCount++;
            if (hasVariant) itemsWithVariantCount++;
            totalStockAvailable += stockAvailable;
          });
        }
      }

      const problemItems = stockSummary.filter(
        (item) => item["Remaining Stock 剩余库存"] < 0,
      );

      const previewData: ExportPreviewData = {
        stockSummary,
        selectedPOData: selectedOrders.map((order) => ({
          "No SPK 生产订单号": order.order.No_SPK,
          "Nama PO 生产订单名称": order.order.Nama_PO,
          "QTY 数量": order.order.QTY,
        })),
        problemItems: problemItems.map((item) => ({
          ...item,
          "Kekurangan 短缺": Math.abs(item["Remaining Stock 剩余库存"]),
        })),
        pengeluaranSummary: [],
        variantItems: stockSummary.filter((item) => item["Warning 警告"]),
        today,
        totalItems,
        sufficientItems,
        problemItemsCount,
        itemsWithVariantCount,
        totalPengeluaran: 0,
        itemsWithPengeluaran: 0,
        totalStockAvailable,
        selectedOrdersCount: selectedOrders.length,
      };

      const previewDataWithINJECTIONInfo = {
        ...previewData,
        INJECTIONItemsRemoved,
        filterNote: `⚠️ Filter INJEKSI-BB: ${INJECTIONItemsRemoved} item dengan departemen 'INJEKSI-BB' tidak ditampilkan\n⚠️ 注塑过滤: ${INJECTIONItemsRemoved}个注塑部门项目不显示`,
      };

      setExportPreview({
        isOpen: true,
        data: previewDataWithINJECTIONInfo as any,
      });
    } catch (error) {
      console.error("❌ [PREVIEW] Error dalam preview:", error);
      alert("Gagal memuat preview. Silakan coba lagi. 加载预览失败，请重试");
    } finally {
      setExportLoading(false);
      setExportProgress({ visible: false, current: 0, total: 0, message: "" });
    }
  };

  const calculateAccumulatedQty = (
    bomItem: BomItem,
    bomStructure: BomItem[],
    parentMultiplier: number = 1
  ): number => {
    if (bomItem.Level === 0) return 1;
    
    const baseQty = bomItem.Qty || 0;
    
    if (bomItem.Level > 1 && bomItem.ParentItemID) {
      const parentItem = bomStructure.find(item => item.ItemID === bomItem.ParentItemID);
      if (parentItem) {
        const parentMultiplierRecursive = calculateAccumulatedQty(parentItem, bomStructure);
        return baseQty * parentMultiplierRecursive;
      }
    }
    
    return baseQty * parentMultiplier;
  };

  const buildBomHierarchy = (flatBom: BomItem[]): BomItem[] => {
    if (!flatBom || flatBom.length === 0) return [];
    
    const itemMap = new Map<string, BomItem & { children?: BomItem[] }>();
    const rootItems: (BomItem & { children?: BomItem[] })[] = [];

    flatBom.forEach(item => {
      itemMap.set(item.ItemID, { ...item, children: [] });
    });

    flatBom.forEach(item => {
      const treeItem = itemMap.get(item.ItemID)!;
      
      if (!item.ParentItemID || item.ParentItemID === item.ItemID || !itemMap.has(item.ParentItemID)) {
        rootItems.push(treeItem);
      } else {
        const parent = itemMap.get(item.ParentItemID);
        if (parent && parent.children) {
          parent.children.push(treeItem);
        }
      }
    });

    return rootItems;
  };

  const calculateLevelBasedNeeds = (
    bomItems: BomItem[],
    productionQty: number,
    stock: StockItem[] = []
  ): { items: any[]; totalNeeded: number; totalShortage: number } => {
    if (!bomItems || bomItems.length === 0) {
      return { items: [], totalNeeded: 0, totalShortage: 0 };
    }

    const bomHierarchy = buildBomHierarchy(bomItems);
    
    const calculateNeedsRecursive = (
      nodes: BomItem[],
      parentMultiplier: number = 1,
      levelPath: string[] = []
    ): any[] => {
      let items: any[] = [];

      nodes.forEach(node => {
        const accumulatedQtyPerUnit = calculateAccumulatedQty(node, bomItems, parentMultiplier);
        const totalNeeded = accumulatedQtyPerUnit * productionQty;
        const stockItem = stock.find(s => s.itemid === node.ItemID);
        const availableStock = stockItem?.stockAkhir || 0;
        const physicalStock = stockItem?.physicalStock || 0;
        const shortage = Math.max(0, totalNeeded - availableStock);
        
        items.push({
          ...node,
          Level: node.Level || 0,
          BaseQtyPerUnit: node.Qty || 0,
          AccumulatedQtyPerUnit: accumulatedQtyPerUnit,
          TotalNeeded: totalNeeded,
          AvailableStock: availableStock,
          PhysicalStock: physicalStock,
          Shortage: shortage,
          ParentItemID: node.ParentItemID || null,
          LevelPath: [...levelPath, node.ItemID]
        });

        if ((node as any).children && (node as any).children.length > 0) {
          const childItems = calculateNeedsRecursive(
            (node as any).children,
            accumulatedQtyPerUnit,
            [...levelPath, node.ItemID]
          );
          items = [...items, ...childItems];
        }
      });

      return items;
    };

    const allItems = calculateNeedsRecursive(bomHierarchy, 1);
    const componentItems = allItems.filter(item => item.Level > 0);
    const totalNeeded = componentItems.reduce((sum, item) => sum + item.TotalNeeded, 0);
    const totalShortage = componentItems.reduce((sum, item) => sum + item.Shortage, 0);

    return {
      items: componentItems,
      totalNeeded,
      totalShortage
    };
  };

const exportSelectedToExcel = async (): Promise<void> => {
  try {
    setExportLoading(true);
    setExportProgress({
      visible: true,
      current: 0,
      total: 100,
      message: "Memulai proses export...",
    });

    // Ambil data committedPOs dan stockReservations dari state
    const currentCommittedPOs = committedPOs;
    const currentStockReservations = stockReservations;

    const selectedOrders = filteredOrders.filter(
      (order) => order.selected && !order.committed
    );

    if (selectedOrders.length === 0) {
      alert("Tidak ada PO yang dipilih untuk di-export!");
      return;
    }

    const wb = XLSX.utils.book_new();

    // ==================== SHEET 1: PO ====================
    const poData: any[] = [];
    
    selectedOrders.forEach((order) => {
      const isCombined = order.order.combinedItems && order.order.combinedItems.length > 1;
      
      if (isCombined) {
        order.order.combinedItems!.forEach((item) => {
          poData.push({
            "No SPK": order.order.No_SPK,
            "Tanggal": order.order.Tanggal_Order,
            "Nama PO": item.Nama_PO,
            "Kode Barang Jadi": item.Kode_Barang,
            "QTY PO": item.QTY
          });
        });
      } else {
        poData.push({
          "No SPK": order.order.No_SPK,
          "Tanggal": order.order.Tanggal_Order,
          "Nama PO": order.order.Nama_PO,
          "Kode Barang Jadi": order.order.Kode_Barang,
          "QTY PO": order.order.QTY
        });
      }
    });

    const ws1 = XLSX.utils.json_to_sheet(poData);
    XLSX.utils.book_append_sheet(wb, ws1, "PO");

    // ==================== FUNGSI UNTUK MENGHITUNG TOTAL KEBUTUHAN BOM BERTINGKAT ====================
    
    const findParent = (itemId: string, flatBom: BomItem[]): BomItem | undefined => {
      const item = flatBom.find(b => b.ItemID === itemId);
      if (item && item.ParentItemID) {
        return flatBom.find(b => b.ItemID === item.ParentItemID);
      }
      return undefined;
    };

    const calculateAccumulatedQty = (item: BomItem, flatBom: BomItem[]): number => {
      let qty = item.Qty;
      let currentItem = item;
      
      while (currentItem.Level > 1 && currentItem.ParentItemID) {
        const parent = flatBom.find(b => b.ItemID === currentItem.ParentItemID);
        if (parent) {
          qty = qty * parent.Qty;
          currentItem = parent;
        } else {
          break;
        }
      }
      
      return qty;
    };

    // ==================== SHEET 2: BOM ====================
    const bomData: any[] = [];
    let totalINJECTIONRemoved = 0;

    for (const order of selectedOrders) {
      if (!order.bom) continue;

      const isCombined = order.order.combinedItems && order.order.combinedItems.length > 1;
      
      if (isCombined) {
        for (const item of order.order.combinedItems!) {
          let bomFlat: BomItem[] = [];
          if (order.bom?.combinedBoms && order.bom.combinedBoms[item.Kode_Barang]) {
            bomFlat = order.bom.combinedBoms[item.Kode_Barang].flat;
          } else {
            bomFlat = order.bom?.flat || [];
          }

          const filteredBom = bomFlat.filter(b => !isINJECTIONDepartment(b.Departemen));
          const removedCount = bomFlat.length - filteredBom.length;
          totalINJECTIONRemoved += removedCount;

          // Header
          bomData.push({
            "No SPK": order.order.No_SPK,
            "Kode Barang Jadi": item.Kode_Barang,
            "Nama Barang Jadi": item.Nama_PO,
            "QTY PO": item.QTY,
            "Level": "HEADER",
            "Kode Komponen": "",
            "Nama Komponen": "",
            "Qty per Unit (BOM)": "",
            "Accumulated Qty": "",
            "Total Kebutuhan": "",
            "Stok": "",
            "Status": ""
          });

          const sortedBom = [...filteredBom].sort((a, b) => a.Level - b.Level);
          
          for (const b of sortedBom.filter(b => b.Level > 0)) {
            const stockItem = order.stock?.find(s => s.itemid === b.ItemID);
            const accumulatedQty = calculateAccumulatedQty(b, filteredBom);
            const totalNeeded = accumulatedQty * item.QTY;
            const stock = stockItem?.stockAkhir || 0;
            const shortage = totalNeeded > stock;
            
            const parent = findParent(b.ItemID, filteredBom);
            const parentInfo = parent ? ` (dari ${parent.ItemID} x ${parent.Qty})` : "";

            bomData.push({
              "No SPK": "",
              "Kode Barang Jadi": "",
              "Nama Barang Jadi": "",
              "QTY PO": "",
              "Level": b.Level,
              "Kode Komponen": b.ItemID,
              "Nama Komponen": b.ItemName,
              "Qty per Unit (BOM)": b.Qty,
              "Accumulated Qty": accumulatedQty,
              "Total Kebutuhan": totalNeeded,
              "Stok": stock,
              "Status": shortage ? "KURANG" : "CUKUP",
              "Keterangan": b.Level === 1 ? "Langsung dari produk jadi" : `Perhitungan: ${b.Qty} x ${parent?.Qty || 1}${parentInfo}`
            });
          }

          bomData.push({});
        }
      } else {
        const filteredBom = order.bom.flat.filter(b => !isINJECTIONDepartment(b.Departemen));
        const removedCount = order.bom.flat.length - filteredBom.length;
        totalINJECTIONRemoved += removedCount;

        bomData.push({
          "No SPK": order.order.No_SPK,
          "Kode Barang Jadi": order.order.Kode_Barang,
          "Nama Barang Jadi": order.order.Nama_PO,
          "QTY PO": order.order.QTY,
          "Level": "HEADER",
          "Kode Komponen": "",
          "Nama Komponen": "",
          "Qty per Unit (BOM)": "",
          "Accumulated Qty": "",
          "Total Kebutuhan": "",
          "Stok": "",
          "Status": ""
        });

        const sortedBom = [...filteredBom].sort((a, b) => a.Level - b.Level);
        
        for (const b of sortedBom.filter(b => b.Level > 0)) {
          const stockItem = order.stock?.find(s => s.itemid === b.ItemID);
          const accumulatedQty = calculateAccumulatedQty(b, filteredBom);
          const totalNeeded = accumulatedQty * order.order.QTY;
          const stock = stockItem?.stockAkhir || 0;
          const shortage = totalNeeded > stock;
          
          const parent = findParent(b.ItemID, filteredBom);
          const parentInfo = parent ? ` (dari ${parent.ItemID} x ${parent.Qty})` : "";

          bomData.push({
            "No SPK": "",
            "Kode Barang Jadi": "",
            "Nama Barang Jadi": "",
            "QTY PO": "",
            "Level": b.Level,
            "Kode Komponen": b.ItemID,
            "Nama Komponen": b.ItemName,
            "Qty per Unit (BOM)": b.Qty,
            "Accumulated Qty": accumulatedQty,
            "Total Kebutuhan": totalNeeded,
            "Stok": stock,
            "Status": shortage ? "KURANG" : "CUKUP",
            "Keterangan": b.Level === 1 ? "Langsung dari produk jadi" : `Perhitungan: ${b.Qty} x ${parent?.Qty || 1}${parentInfo}`
          });
        }

        bomData.push({});
      }
    }

    const ws2 = XLSX.utils.json_to_sheet(bomData);
    XLSX.utils.book_append_sheet(wb, ws2, "BOM");
// ==================== SHEET 3: TOTAL KEBUTUHAN MATERIAL ====================
const materialMap = new Map();

// Langsung gunakan data dari stockReservations untuk informasi reserved
const reservationsByItem = new Map<string, { totalQty: number; spkList: Set<string>; itemName: string }>();

for (const reservation of stockReservations) {
  if (reservation.status !== "RESERVED") continue;
  if (reservation.reservedQty <= 0) continue;
  
  const noSPK = reservation.noSPK;
  if (!noSPK) continue;
  
  const itemId = reservation.itemID;
  const itemName = reservation.itemName || itemId;
  
  if (!reservationsByItem.has(itemId)) {
    reservationsByItem.set(itemId, {
      totalQty: 0,
      spkList: new Set(),
      itemName: itemName
    });
  }
  
  const itemData = reservationsByItem.get(itemId)!;
  itemData.totalQty += reservation.reservedQty;
  itemData.spkList.add(noSPK);
}

// Proses setiap order untuk menghitung kebutuhan
for (const order of selectedOrders) {
  if (!order.bom) continue;

  const isCombined = order.order.combinedItems && order.order.combinedItems.length > 1;
  
  if (isCombined) {
    for (const item of order.order.combinedItems!) {
      let bomFlat: BomItem[] = [];
      if (order.bom?.combinedBoms && order.bom.combinedBoms[item.Kode_Barang]) {
        bomFlat = order.bom.combinedBoms[item.Kode_Barang].flat;
      } else {
        bomFlat = order.bom?.flat || [];
      }

      const filteredBom = bomFlat.filter(b => !isINJECTIONDepartment(b.Departemen));
      
      for (const b of filteredBom.filter(b => b.Level > 0)) {
        const key = b.ItemID;
        const totalNeeded = b.Qty * item.QTY;
        const stockItem = order.stock?.find(s => s.itemid === b.ItemID);
        
        // Ambil data dari stockItem (sudah termasuk perhitungan stok akhir)
        const stockAkhir = stockItem?.stockAkhir || 0;
        const stockWincp = stockItem?.physicalStock || 0;
        
        // Ambil data reservasi (PO lain yang sudah reserve)
        const reservedData = reservationsByItem.get(b.ItemID);
        let reservedQty = 0;
        let reservedByText = "-";
        
        if (reservedData) {
          reservedQty = reservedData.totalQty;
          reservedByText = Array.from(reservedData.spkList).map(spk => `• ${spk}`).join("\n");
        }
        
        // Kekurangan = jika total kebutuhan > stok akhir (stok akhir sudah dikurangi reserved)
        const kekurangan = Math.max(0, totalNeeded - stockAkhir);
        
        if (materialMap.has(key)) {
          const existing = materialMap.get(key);
          existing.totalNeeded += totalNeeded;
        } else {
          materialMap.set(key, {
            kode: b.ItemID,
            nama: b.ItemName,
            departemen: b.Departemen || "-",
            totalNeeded: totalNeeded,
            stockAkhir: stockAkhir,
            stockWincp: stockWincp,
            reserved: reservedQty,
            reservedBy: reservedByText,
            kekurangan: kekurangan
          });
        }
      }
    }
  } else {
    const filteredBom = order.bom.flat.filter(b => !isINJECTIONDepartment(b.Departemen));
    
    for (const b of filteredBom.filter(b => b.Level > 0)) {
      const key = b.ItemID;
      const totalNeeded = b.Qty * order.order.QTY;
      const stockItem = order.stock?.find(s => s.itemid === b.ItemID);
      
      // Ambil data dari stockItem (sudah termasuk perhitungan stok akhir)
      const stockAkhir = stockItem?.stockAkhir || 0;
      const stockWincp = stockItem?.physicalStock || 0;
      
      // Ambil data reservasi (PO lain yang sudah reserve)
      const reservedData = reservationsByItem.get(b.ItemID);
      let reservedQty = 0;
      let reservedByText = "-";
      
      if (reservedData) {
        reservedQty = reservedData.totalQty;
        reservedByText = Array.from(reservedData.spkList).map(spk => `• ${spk}`).join("\n");
      }
      
      // Kekurangan = jika total kebutuhan > stok akhir (stok akhir sudah dikurangi reserved)
      const kekurangan = Math.max(0, totalNeeded - stockAkhir);
      
      if (materialMap.has(key)) {
        const existing = materialMap.get(key);
        existing.totalNeeded += totalNeeded;
      } else {
        materialMap.set(key, {
          kode: b.ItemID,
          nama: b.ItemName,
          departemen: b.Departemen || "-",
          totalNeeded: totalNeeded,
          stockAkhir: stockAkhir,
          stockWincp: stockWincp,
          reserved: reservedQty,
          reservedBy: reservedByText,
          kekurangan: kekurangan
        });
      }
    }
  }
}

// Tambahkan item yang di-reserve tapi tidak ada di BOM
for (const [itemId, data] of reservationsByItem) {
  if (!materialMap.has(itemId)) {
    materialMap.set(itemId, {
      kode: itemId,
      nama: data.itemName,
      departemen: "RESERVED ONLY",
      totalNeeded: 0,
      stockAkhir: 0,
      stockWincp: 0,
      reserved: data.totalQty,
      reservedBy: Array.from(data.spkList).map(spk => `• ${spk}`).join("\n"),
      kekurangan: 0
    });
  }
}

const materialData: any[] = [];
for (const [_, value] of materialMap) {
  materialData.push({
    "Kode Material": value.kode,
    "Nama Material": value.nama,
    "Departemen": value.departemen,
    "Total Kebutuhan": value.totalNeeded,
    "Stok Akhir": value.stockAkhir,
    "Stok Wincp (Real)": value.stockWincp,
    "Reserved (Qty)": value.reserved,
    "Reserved Oleh SPK": value.reservedBy,
    "Kekurangan": value.kekurangan,
    "Status": value.kekurangan > 0 ? "KURANG" : "CUKUP"
  });
}

// Sort by kode
materialData.sort((a, b) => a["Kode Material"].localeCompare(b["Kode Material"]));

const ws3 = XLSX.utils.json_to_sheet(materialData);

// Set column widths
const colWidths3 = [
  { wch: 15 }, // Kode Material
  { wch: 40 }, // Nama Material
  { wch: 20 }, // Departemen
  { wch: 15 }, // Total Kebutuhan
  { wch: 15 }, // Stok Akhir
  { wch: 15 }, // Stok Wincp (Real)
  { wch: 15 }, // Reserved (Qty)
  { wch: 50 }, // Reserved Oleh SPK
  { wch: 15 }, // Kekurangan
  { wch: 15 }, // Status
];
ws3["!cols"] = colWidths3;

XLSX.utils.book_append_sheet(wb, ws3, "Total Kebutuhan Material");
const timestamp = new Date().toISOString().split("T")[0];
const filename = `Production_Plan_${timestamp}_${selectedOrders.length}PO.xlsx`;

XLSX.writeFile(wb, filename);

setExportProgress({ visible: false, current: 0, total: 0, message: "" });

const materialDenganReserved = materialData.filter(m => m["Reserved (Qty)"] > 0).length;
alert(`✅ Export berhasil!\nFile: ${filename}\n\n` +
      `📦 Total PO: ${selectedOrders.length}\n` +
      `🔢 Total Material: ${materialData.length}\n` +
      `📌 Material dengan Reserved: ${materialDenganReserved}`); 

  } catch (error) {
    console.error("Error export:", error);
    alert("Gagal mengekspor data");
    setExportProgress({ visible: false, current: 0, total: 0, message: "" });
  } finally {
    setExportLoading(false);
  }
};
  const OrderRow = ({
    plan,
    index,
  }: {
    plan: ProductionPlan;
    index: number;
  }) => {
    const isCombinedPO =
      plan.order.combinedItems && plan.order.combinedItems.length > 1;
    const combinedCount = plan.order.combinedItems?.length || 1;

    const materialNeeds = useMemo(() => {
      if (!plan.bom || !plan.stock) return null;

      if (isCombinedPO && plan.order.combinedItems) {
        return calculateMaterialNeedsForCombinedPO(
          plan.bom,
          plan.order.combinedItems,
          plan.stock,
        );
      } else {
        return calculateMaterialNeeds(
          plan.bom.flat,
          plan.order.QTY,
          plan.stock,
        );
      }
    }, [
      plan.bom,
      plan.stock,
      isCombinedPO,
      plan.order.combinedItems,
      plan.order.QTY,
    ]);

    const hasShortage = (materialNeeds?.totalShortage ?? 0) > 0;
    const isStokUpdated = plan.stockLastUpdated;

    return (
      <>
        <TableRow
          className={
            plan.expanded ? "bg-blue-50" :
            plan.committed ? "bg-green-50" :
            isCombinedPO ? "bg-purple-50" :
            isStokUpdated ? "bg-green-50/30" :
            ""
          }
        >
          <TableCell>
            <div className="flex items-center justify-center">
              <Checkbox
                checked={plan.selected}
                onCheckedChange={() => toggleSelection(index)}
                disabled={plan.loadingBom || plan.committed}
              />
              {plan.loadingBom && (
                <RefreshCw className="ml-2 h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
          </TableCell>
          <TableCell>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                toggleOrder(
                  index,
                  plan.order.Kode_Barang,
                  plan.order.Tanggal_Order,
                )
              }
              disabled={plan.loading}
              className="h-8 w-8 p-0"
            >
              {plan.loading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : plan.expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {isCombinedPO && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                  {combinedCount}
                </Badge>
              )}
            </Button>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <span className="font-medium">{plan.order.No_SPK}</span>
              {isCombinedPO && (
                <Badge variant="secondary" className="text-xs">
                  {combinedCount} PO
                </Badge>
              )}
              {plan.CommitID && (
                <Badge variant="outline" className="text-xs">
                  ID: {plan.CommitID}
                </Badge>
              )}
              {isStokUpdated && (
                <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
                  ✅ Stok Terbaru
                </Badge>
              )}
            </div>
          </TableCell>
          <TableCell>{plan.order.Tanggal_Order}</TableCell>
          <TableCell>
            <div>
              {plan.order.Nama_PO}
              {isCombinedPO && plan.order.combinedItems && (
                <div className="text-xs text-muted-foreground mt-1">
                  {plan.order.combinedItems.slice(0, 2).map((item, idx) => (
                    <div key={idx}>
                      • {item.Nama_PO} (QTY: {item.QTY})
                    </div>
                  ))}
                  {plan.order.combinedItems.length > 2 && (
                    <div>
                      • ... dan {plan.order.combinedItems.length - 2} lainnya
                    </div>
                  )}
                </div>
              )}
            </div>
          </TableCell>
          <TableCell className="font-mono text-sm">
            {plan.order.Kode_Barang}
          </TableCell>
          <TableCell className="text-right font-bold">
  {isCombinedPO ? (
    <div>
      <span className="text-purple-600">Gabungan</span>
      <div className="text-xs text-muted-foreground mt-1">
        {plan.order.combinedItems?.map((item, idx) => (
          <div key={idx}>
            {item.Kode_Barang}: {item.QTY?.toLocaleString() ?? '0'}
          </div>
        ))}
      </div>
    </div>
  ) : (
    plan.order.QTY?.toLocaleString() ?? '0'
  )}
</TableCell>
          <TableCell>
            {plan.committed ? (
              <div className="flex flex-col items-center gap-1">
                <Badge className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Committed
                </Badge>
                {plan.CommitID && (
                  <div className="text-xs text-muted-foreground">
                    ID: {plan.CommitID}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => uncommitPO(index)}
                  className="h-6 text-xs text-red-600 hover:text-red-800"
                >
                  Uncommit
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={() => commitPO(index)}
                  disabled={committing === plan.order.No_SPK || !plan.bom}
                  size="sm"
                  className="gap-1"
                >
                  {committing === plan.order.No_SPK ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Committing...
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      Commit PO
                    </>
                  )}
                </Button>

                {materialNeeds && (
                  <div className="text-xs text-center">
                    <div>{materialNeeds.items.length} materials</div>
                    <div
                      className={`font-bold ${
                        hasShortage ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {materialNeeds.items.filter((i) => i.shortage > 0).length}{" "}
                      kurang
                    </div>
                  </div>
                )}
              </div>
            )}
          </TableCell>
          <TableCell>
            {materialNeeds ? (
              <div className="flex flex-col items-center">
                <Badge
                  variant={hasShortage ? "destructive" : "default"}
                  className="gap-1"
                >
                  {hasShortage ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  {hasShortage
                    ? `Kurang ${materialNeeds.totalShortage.toLocaleString() ?? '0'}`
                    : "Stok Cukup"}
                </Badge>
                <span className="text-xs text-muted-foreground mt-1">
                  {isStokUpdated ? "✅ Stok Terbaru" : "🔄 Perlu Refresh"}
                </span>
              </div>
            ) : plan.bom ? (
              <span className="text-muted-foreground">-</span>
            ) : (
              <span className="text-muted-foreground">Belum load BOM</span>
            )}
          </TableCell>
        </TableRow>

        {plan.expanded && plan.bom && plan.stock && (
          <TableRow>
            <TableCell colSpan={9} className="bg-muted/50 p-0">
              <div className="p-4 space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Detail BOM - {plan.order.Kode_Barang}
                          {plan.committed && (
                            <Badge className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Committed
                              {plan.CommitID && ` (ID: ${plan.CommitID})`}
                            </Badge>
                          )}
                          {isCombinedPO && (
                            <Badge variant="secondary" className="gap-1">
                              <Package className="h-3 w-3" />
                              {combinedCount} PO Digabung
                            </Badge>
                          )}
                          {plan.stockLastUpdated && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              ✅ Stok Terbaru
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          SPK: {plan.order.No_SPK} | PO: {plan.order.Nama_PO} |
                          {isCombinedPO ? (
                            <span> Qty per Item sesuai PO asli</span>
                          ) : (
                            <span> Qty: {plan.order.QTY.toLocaleString() ?? '0'} unit</span>
                          )}{" "}
                          | Stok per: {plan.order.Tanggal_Order}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => refreshStockForPlan(index)}
                          disabled={plan.loading}
                          size="sm"
                          variant="outline"
                          className="gap-1"
                        >
                          {plan.loading ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          Refresh Stok
                        </Button>

                        {!plan.committed && (
                          <Button
                            onClick={() => commitPO(index)}
                            disabled={committing === plan.order.No_SPK}
                            size="sm"
                            className="gap-1"
                          >
                            {committing === plan.order.No_SPK ? (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Committing...
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3" />
                                Commit PO
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          onClick={() => toggleViewMode(index)}
                          size="sm"
                          variant={plan.viewMode === "table" ? "default" : "outline"}
                          className="gap-1"
                        >
                          <TableIcon className="h-3 w-3" />
                          Table
                        </Button>
                        <Button
                          onClick={() => toggleViewMode(index)}
                          size="sm"
                          variant={plan.viewMode === "tree" ? "default" : "outline"}
                          className="gap-1"
                        >
                          <TreePine className="h-3 w-3" />
                          Tree
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-sm font-medium text-muted-foreground">
                            Total Item
                          </div>
                          <div className="text-2xl font-bold">
                            {materialNeeds?.items.length || 0}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-sm font-medium text-muted-foreground">
                            Stok Cukup
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            {materialNeeds?.items.filter((i) => i.shortage === 0)
                              .length || 0}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-sm font-medium text-muted-foreground">
                            Stok Kurang
                          </div>
                          <div className="text-2xl font-bold text-red-600">
                            {materialNeeds?.items.filter((i) => i.shortage > 0)
                              .length || 0}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-sm font-medium text-muted-foreground">
                            Total Kekurangan
                          </div>
                          <div className="text-2xl font-bold text-red-600">
                            {materialNeeds?.totalShortage.toLocaleString() ??'0'}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {plan.viewMode === "table" ? (
                      <BomTableView
                        bom={plan.bom.flat}
                        productionQty={plan.order.QTY}
                        stock={plan.stock}
                        orderDate={plan.order.Tanggal_Order}
                        stockLastUpdated={plan.stockLastUpdated}
                        isCombinedPO={isCombinedPO}
                        combinedItems={plan.order.combinedItems}
                        combinedBoms={plan.bom.combinedBoms}
                      />
                    ) : (
                      <SimpleBomTree
                        treeData={plan.bom.tree}
                        productionQty={plan.order.QTY}
                        stock={plan.stock}
                        orderDate={plan.order.Tanggal_Order}
                        isCombinedPO={isCombinedPO}
                        combinedItems={plan.order.combinedItems}
                        combinedBoms={plan.bom.combinedBoms}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </TableCell>
          </TableRow>
        )}
      </>
    );
  };

  // ==================== FUNGSI PAGINATION ====================

  const PaginationComponent = () => {
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(
      currentPage * itemsPerPage,
      filteredOrders.length,
    );

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;

      let startPage = Math.max(
        1,
        currentPage - Math.floor(maxVisiblePages / 2),
      );
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      return pages;
    };

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
        <div className="text-sm text-muted-foreground">
          Menampilkan {startIndex}-{endIndex} dari {filteredOrders.length} data
          {searchQuery && (
            <span className="text-primary ml-2">
              (Hasil pencarian untuk {searchQuery})
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="itemsPerPage" className="text-sm">
              Items per page:
            </Label>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => goToPage(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {getPageNumbers().map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => goToPage(page)}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => goToPage(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    );
  };

  // ==================== USE EFFECT ====================

  useEffect(() => {
    refreshAllData();
  }, []);

  useEffect(() => {
    if (committedPOs.length > 0) {
      syncCommitStatus();
    }
  }, [committedPOs, syncCommitStatus]);

  const combinedStats = useMemo(() => {
    const totalOriginalOrders = filteredOrders.reduce((total, order) => {
      return total + (order.order.combinedItems?.length || 1);
    }, 0);

    const combinedCount = filteredOrders.filter(
      (order) =>
        order.order.combinedItems && order.order.combinedItems.length > 1,
    ).length;

    return {
      totalOriginalOrders,
      combinedCount,
      saving: totalOriginalOrders - filteredOrders.length,
    };
  }, [filteredOrders]);

  // ==================== FUNGSI EXPORT SETELAH PREVIEW ====================
  const handleConfirmExport = () => {
    setExportPreview({ isOpen: false, data: null });
    exportSelectedToExcel();
  };

  // ==================== EXPORT PROGRESS COMPONENT ====================
  const ExportProgress: React.FC<{
    visible: boolean;
    current: number;
    total: number;
    message: string;
  }> = ({ visible, current, total, message }) => {
    if (!visible) return null;

    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
      <Dialog open={visible}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Sedang Mengekspor Data...
            </DialogTitle>
            <DialogDescription>
              Exporting Data... 正在导出数据...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            <Progress value={percentage} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress: {current}/{total}</span>
              <span>{percentage}%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Harap tunggu, proses export sedang berjalan...
              <br />
              Jangan tutup halaman ini selama proses berlangsung
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // ==================== RENDER COMPONENT ====================

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Factory className="h-8 w-8" />
              Production Planning 生产计划
            </h1>
            <p className="text-muted-foreground">
              Kelola rencana produksi 管理生产计划
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={refreshAllData}
              disabled={loading}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={previewExport} disabled={exportLoading}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Export
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportSelectedToExcel} disabled={exportLoading}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export to Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <ExportProgress
          visible={exportProgress.visible}
          current={exportProgress.current}
          total={exportProgress.total}
          message={exportProgress.message}
        />

        <ExportPreviewModal
          previewData={exportPreview.data}
          isOpen={exportPreview.isOpen}
          onClose={() => setExportPreview({ isOpen: false, data: null })}
          onConfirmExport={handleConfirmExport}
          exportLoading={exportLoading}
        />

        <CommittedPOsPanel
          committedPOs={committedPOs}
          stockReservations={stockReservations}
          onRefresh={loadCommittedPOs}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Pencarian PO 搜索PO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Cari berdasarkan No SPK, Nama PO, atau Kode Barang..."
                    className="w-full"
                  />
                </div>
                {searchQuery && (
                  <Button variant="outline" onClick={clearSearch}>
                    Clear
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                * Pencarian akan mencari di semua field: No SPK, Nama PO, dan Kode Barang
              </p>
            </div>
          </CardContent>
        </Card>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Kontrol Commit PO (Database)</AlertTitle>
          <AlertDescription>
            • Commit PO akan menyimpan data ke database dan reserve stok
            • Stok yang di-reserve tidak bisa digunakan oleh PO lain
            • Uncommit akan mengembalikan stok yang di-reserve
          </AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>PO Gabungan</AlertTitle>
          <AlertDescription>
            • PO Gabungan artinya SPKnya Sama tapi Itemnya berbeda.
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Kontrol Selection & Refresh Stok
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={toggleSelectAll}>
                  Select Page
                </Button>
                <Button onClick={toggleSelectAllGlobal}>
                  Select All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <strong>
                {
                  filteredOrders.filter((p) => p.selected && !p.committed)
                    .length
                }
              </strong>{" "}
              dari 来自{" "}
              <strong>
                {filteredOrders.filter((p) => !p.committed).length}
              </strong>{" "}
              PO terpilih 选择的PO
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filter Berdasarkan Tanggal 基于日期筛选
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Tanggal Mulai 开始日期</Label>
                  <Input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={dateFilter.startDate}
                    onChange={handleDateFilterChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Tanggal Akhir 结束日期</Label>
                  <Input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={dateFilter.endDate}
                    onChange={handleDateFilterChange}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={applyDateFilter} disabled={loading}>
                  {loading ? "Memuat..." : "Terapkan Filter"}
                </Button>
                <Button variant="outline" onClick={resetDateFilter}>
                  Reset Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">
                Total Order 总订单
              </div>
              <div className="text-2xl font-bold">{filteredOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">
                Terpilih 已选择
              </div>
              <div className="text-2xl font-bold text-primary">
                {
                  filteredOrders.filter((p) => p.selected && !p.committed)
                    .length
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">
                Sudah Load BOM 已加载BOM
              </div>
              <div className="text-2xl font-bold">
                {filteredOrders.filter((p) => p.bom).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">
                Committed 已提交
              </div>
              <div className="text-2xl font-bold text-green-600">
                {filteredOrders.filter((p) => p.committed).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">
                Bisa Di-commit 可提交
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {filteredOrders.filter((p) => p.bom && !p.committed).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">
                PO Digabung 合并PO
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {combinedStats.combinedCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">
                Stok Real-time 实时库存
              </div>
              <div className="text-2xl font-bold text-green-600">
                {filteredOrders.filter((p) => p.stockLastUpdated).length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <div className="text-lg font-bold">Memuat data produksi...</div>
              <div className="text-muted-foreground">Harap tunggu sebentar</div>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && filteredOrders.length > 0 && (
        <>
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Pilih</TableHead>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>No SPK 生产订单号</TableHead>
                    <TableHead>Tanggal 日期</TableHead>
                    <TableHead>Nama PO 生产订单名称</TableHead>
                    <TableHead>Kode Barang 物料代码</TableHead>
                    <TableHead className="text-right">QTY 数量</TableHead>
                    <TableHead className="text-center">Commit 提交</TableHead>
                    <TableHead className="text-center">Status Stok 库存状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((plan, index) => (
                    <OrderRow key={index} plan={plan} index={index} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <PaginationComponent />
        </>
      )}

      {!loading && filteredOrders.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
              <Package className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-bold text-gray-700">
                {searchQuery
                  ? "Tidak ada data produksi yang sesuai dengan pencarian"
                  : "Tidak ada data produksi"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? `Tidak ditemukan PO dengan kata kunci "${searchQuery}"`
                  : dateFilter.startDate || dateFilter.endDate
                    ? "Tidak ada data sesuai filter tanggal yang dipilih"
                    : "Data order produksi tidak ditemukan"}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={clearSearch}>
                  Tampilkan Semua PO
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}