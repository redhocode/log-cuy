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
  Completed?: boolean;      
  FinishedDate?: string;
}

interface BomItem {
  ItemID: string;
  ItemName: string;
  ItemName2: string;
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
  itemName2: string;
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
  bomData?: any[];  
  totalINJECTIONRemoved?: number;  
}

interface ExportData {
  stockSummary: any[];
  departmentSummary: any[];
  productionOrders: any[];
}

// ==================== FUNGSI BANTU UNIVERSAL ====================

// 🔥 NORMALISASI ITEM ID - SOLUSI UNIVERSAL UNTUK SEMUA MATERIAL
const normalizeItemId = (id: string): string => {
  if (!id) return '';
  return id.trim().toUpperCase();
};

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

// ==================== FUNGSI BANTU ====================

// FUNGSI: Filter hanya komponen (bukan barang jadinya) - DIPERBAIKI dengan konversi ke Number
const filterOnlyComponents = (bomItems: BomItem[]): BomItem[] => {
  return bomItems.filter((item) => Number(item.Level) > 0);
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
    itemMap.set(normalizeItemId(item.ItemID), treeItem);
  });

  flatBom.forEach((item) => {
    const normalizedId = normalizeItemId(item.ItemID);
    const treeItem = itemMap.get(normalizedId)!;
    const parentId = item.ParentItemID ? normalizeItemId(item.ParentItemID) : null;

    if (
      !parentId ||
      parentId === normalizedId ||
      !itemMap.has(parentId)
    ) {
      rootItems.push(treeItem);
    } else {
      const parent = itemMap.get(parentId);
      if (parent && parent.children) {
        parent.children.push(treeItem);
      }
    }
  });

  return rootItems;
};

// ==================== FUNGSI PERHITUNGAN MATERIAL ====================

// Perhitungan material needs untuk single PO - DIPERBAIKI dengan normalisasi
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
    // 🔥 Normalisasi saat mencari stock
    const normalizedItemId = normalizeItemId(item.ItemID);
    const stockItem = stock.find((s) => normalizeItemId(s.itemid) === normalizedItemId);
    const availableStock = stockItem?.stockAkhir || 0;
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

// FUNGSI: Perhitungan material needs untuk PO gabungan - DIPERBAIKI dengan normalisasi
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

  productionOrders.forEach((po) => {
    let bomForThisItem: BomItem[] = [];

    if (bom.combinedBoms && bom.combinedBoms[po.Kode_Barang]) {
      bomForThisItem = bom.combinedBoms[po.Kode_Barang].flat;
    } else {
      bomForThisItem = bom.flat;
    }

    const componentsOnly = filterOnlyComponents(bomForThisItem);

    componentsOnly.forEach((item) => {
      const neededForThisPO = item.Qty * po.QTY;
      const normalizedId = normalizeItemId(item.ItemID);
      const existing = materialMap.get(normalizedId);

      if (existing) {
        existing.totalNeeded += neededForThisPO;
      } else {
        materialMap.set(normalizedId, {
          item: item,
          totalNeeded: neededForThisPO,
        });
      }
    });
  });

  let totalNeeded = 0;
  let totalShortage = 0;
  const items = Array.from(materialMap.values()).map((material) => {
    const normalizedId = normalizeItemId(material.item.ItemID);
    const stockItem = stock.find((s) => normalizeItemId(s.itemid) === normalizedId);
    const availableStock = stockItem?.stockAkhir || 0;
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

// ==================== FUNGSI AMBIL STOK DENGAN API YANG BENAR ====================

// FUNGSI: Ambil stok untuk SATU item - VERSI FLEXIBLE
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

    console.log(`📡 [${itemId}] Calling API...`);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`[${itemId}] API returned ${response.status}`);
      return {
        itemid: normalizeItemId(itemId),
        itemname: itemId,
        stockAkhir: 0,
        physicalStock: 0,
        committedQty: 0,
        reservedQty: 0,
      };
    }

    const result = await response.json();
    
    console.log(`📡 [${itemId}] Response:`, result);

    // Handle berbagai kemungkinan response structure
    let dataArray = null;
    
    if (Array.isArray(result)) {
      dataArray = result;
    } else if (result.data && Array.isArray(result.data)) {
      dataArray = result.data;
    } else if (result.stockData && Array.isArray(result.stockData)) {
      dataArray = result.stockData;
    }
    
    if (dataArray && dataArray.length > 0) {
      const itemData = dataArray[0];
      
      let stockValue = 0;
      let physicalValue = 0;
      
      // Prioritas: SaldoAkhirFisik
      if (typeof itemData.SaldoAkhirFisik === 'number') {
        physicalValue = itemData.SaldoAkhirFisik;
        stockValue = physicalValue;
      } else if (typeof itemData.SaldoAkhir === 'number') {
        stockValue = Math.max(0, itemData.SaldoAkhir);
        physicalValue = stockValue;
      } else if (typeof itemData.totalkgs === 'number') {
        stockValue = itemData.totalkgs;
        physicalValue = stockValue;
      }
      
      stockValue = Math.max(0, stockValue);
      physicalValue = Math.max(0, physicalValue);
      
      console.log(`📊 [${itemId}] Stock = ${stockValue} (Fisik: ${physicalValue})`);
      
      return {
        itemid: normalizeItemId(itemData.KodeBarang || itemData.itemid || itemData.ItemID || itemId),
        itemname: itemData.NamaBarang || itemData.itemname || itemData.ItemName || itemId,
        stockAkhir: stockValue,
        physicalStock: physicalValue,
        committedQty: itemData.TotalCommitted || 0,
        reservedQty: itemData.TotalReserved || 0,
      };
    }

    console.log(`📊 [${itemId}] No data found, stock = 0`);
    return {
      itemid: normalizeItemId(itemId),
      itemname: itemId,
      stockAkhir: 0,
      physicalStock: 0,
      committedQty: 0,
      reservedQty: 0,
    };
  } catch (err: unknown) {
    console.error(`Error fetching stock for ${itemId}:`, err);
    return {
      itemid: normalizeItemId(itemId),
      itemname: itemId,
      stockAkhir: 0,
      physicalStock: 0,
      committedQty: 0,
      reservedQty: 0,
    };
  }
};

// FUNGSI: Ambil stock untuk banyak item - DIPERBAIKI dengan normalisasi
const fetchStockForItemsWithCommitment = async (
  itemIds: string[],
  orderDate: string
): Promise<StockItem[]> => {
  if (!itemIds || itemIds.length === 0) return [];
  
  const stockData: StockItem[] = [];
  const delay = 100;

  // 🔥 NORMALISASI semua item IDs
  const uniqueItemIds = Array.from(new Set(itemIds))
    .filter((id) => id && id.trim() !== "")
    .map(id => normalizeItemId(id));

  console.log(`📦 Fetching stock for ${uniqueItemIds.length} unique items...`);
  console.log(`📦 Item IDs to fetch (normalized):`, uniqueItemIds);

  for (let i = 0; i < uniqueItemIds.length; i++) {
    const itemId = uniqueItemIds[i];

    try {
      const stockItem = await fetchStockForItem(itemId, orderDate);
      if (stockItem) {
        // 🔥 Normalisasi juga itemid dari response
        stockItem.itemid = normalizeItemId(stockItem.itemid);
        stockData.push(stockItem);
      }
    } catch (err) {
      console.error(`Error fetching stock for ${itemId}:`, err);
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

  console.log(`✅ Fetched stock for ${stockData.length} items`);
  return stockData;
};

// ==================== KOMPONEN BOM TREE ====================
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
            Struktur BOM (Tree View)
          </CardTitle>
          <CardDescription>
            Stok per tanggal: {orderDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-2">🌳</div>
          <div className="font-bold mb-2">Tree View Tidak Tersedia</div>
          <div className="text-sm text-muted-foreground">
            Silakan gunakan Table View untuk melihat daftar komponen.
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
    const normalizedId = normalizeItemId(itemId);
    const stockItem = stock.find((s) => normalizeItemId(s.itemid) === normalizedId);
    return stockItem ? stockItem.stockAkhir : 0;
  };

  if (isCombinedPO && combinedItems && combinedItems.length > 0 && combinedBoms) {
    return (
      <Card>
        <CardHeader className="bg-muted">
          <CardTitle className="text-lg flex items-center gap-2">
            <TreePine className="h-5 w-5" />
            Struktur BOM (Tree View) - PO Gabungan
          </CardTitle>
          <CardDescription>
            Stok per tanggal: {orderDate}
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
                        QTY: {combinedItem.QTY} unit
                      </div>
                    </div>
                    <div className="p-4 text-center text-gray-500">
                      BOM tidak tersedia untuk item ini
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
                  `${normalizeItemId(node.ItemID)}-${combinedItem.Kode_Barang}-${itemIndex}${
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
                                `${normalizeItemId(node.ItemID)}-${
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
                                {needed.toLocaleString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">
                                Stok
                              </div>
                              <div className="font-mono text-sm font-bold text-green-600">
                                {availableStock.toLocaleString()}
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
                                  ? `-${shortage.toLocaleString()}`
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
                            key={`${normalizeItemId(child.ItemID)}-${combinedItem.Kode_Barang}-${itemIndex}-${index}`}
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
                      QTY: {combinedItem.QTY} unit
                    </div>
                  </div>
                  {itemBom.tree.map((node, index) => (
                    <TreeNode
                      key={`${normalizeItemId(node.ItemID)}-${combinedItem.Kode_Barang}-${itemIndex}-${index}`}
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
            Total PO: {combinedItems.length}
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
                        const nodeId = `${normalizeItemId(node.ItemID)}-${
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
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedNodes(new Set())}
            >
              Collapse All
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
    const isExpanded = expandedNodes.has(normalizeItemId(node.ItemID));

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
                onClick={() => toggleNode(normalizeItemId(node.ItemID))}
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
                    {needed.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Stok</div>
                  <div className="font-mono text-sm font-bold text-green-600">
                    {availableStock.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Status</div>
                  <div
                    className={`font-mono text-sm font-bold ${
                      shortage > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {shortage > 0 ? `-${shortage.toLocaleString()}` : "✓"}
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
                key={`${normalizeItemId(child.ItemID)}-${index}`}
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
          Struktur BOM (Tree View)
        </CardTitle>
        <CardDescription>
          Stok per tanggal: {orderDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {treeData.map((node, index) => (
            <TreeNode key={`${normalizeItemId(node.ItemID)}-${index}`} node={node} depth={0} />
          ))}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 flex justify-between">
        <div className="text-xs text-muted-foreground">
          Total Nodes: {treeData.length}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allNodeIds = new Set<string>();
              const collectAllIds = (nodes: BomItem[]) => {
                nodes.forEach((node) => {
                  allNodeIds.add(normalizeItemId(node.ItemID));
                  if (node.children) collectAllIds(node.children);
                });
              };
              collectAllIds(treeData);
              setExpandedNodes(allNodeIds);
            }}
          >
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedNodes(new Set())}
          >
            Collapse All
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

// ==================== KOMPONEN BOM TABLE VIEW ====================
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
        const normalizedId = normalizeItemId(item.ItemID);
        const existing = materialMap.get(normalizedId);
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
          materialMap.set(normalizedId, {
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
          Daftar Komponen (Table View)
        </CardTitle>
        <CardDescription>
          *Hanya menampilkan komponen (Level 1+), tidak termasuk barang jadinya (Level 0)
          {isCombinedPO && " | PO Gabungan: QTY per item sesuai dengan PO aslinya"}
        </CardDescription>
        {stockLastUpdated && (
          <Alert className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Stok Terbaru</AlertTitle>
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
                <TableHead>Kode Item</TableHead>
                <TableHead>Nama Item</TableHead>
                <TableHead>Departemen</TableHead>
                <TableHead>Jenis</TableHead>
                {isCombinedPO && <TableHead>Sumber PO</TableHead>}
                <TableHead className="text-right">Per Unit</TableHead>
                <TableHead className="text-right">Butuh</TableHead>
                <TableHead className="text-right">Stok Tersedia</TableHead>
                <TableHead className="text-right">Status</TableHead>
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
                    {item.needed.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono text-green-600">
                    {item.availableStock.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={item.shortage > 0 ? "destructive" : "default"}
                      className="font-mono"
                    >
                      {item.shortage > 0
                        ? `-${item.shortage.toLocaleString()}`
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
          {materialNeeds.totalNeeded.toLocaleString()} | Kekurangan:{" "}
          <span className="font-bold text-red-600">
            {materialNeeds.totalShortage.toLocaleString()}
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
  onUncommit?: (noSPK: string) => void;
}> = ({ committedPOs, stockReservations, onRefresh, onUncommit }) => {
  const [expanded, setExpanded] = useState(true);
  const [showUnique, setShowUnique] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [uncommitting, setUncommitting] = useState<string | null>(null);

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

  const filteredPOs = useMemo(() => {
    let filtered = committedPOs;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (po) =>
          po.noSPK.toLowerCase().includes(term) ||
          po.namaPO.toLowerCase().includes(term) ||
          po.kodeBarang.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((po) => po.status === statusFilter);
    }

    return filtered;
  }, [committedPOs, searchTerm, statusFilter]);

  const displayedPOs = useMemo(() => {
    if (showUnique) {
      const poMap = new Map<string, CommittedPO>();

      filteredPOs.forEach((po) => {
        const existingPO = poMap.get(po.noSPK);
        if (!existingPO || po.CommitID > existingPO.CommitID) {
          poMap.set(po.noSPK, po);
        }
      });

      return Array.from(poMap.values()).sort((a, b) => b.CommitID - a.CommitID);
    } else {
      return filteredPOs.sort((a, b) => b.CommitID - a.CommitID);
    }
  }, [filteredPOs, showUnique]);

  const totalPages = Math.ceil(displayedPOs.length / itemsPerPage);
  const paginatedPOs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return displayedPOs.slice(startIndex, endIndex);
  }, [displayedPOs, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, showUnique]);

  const handleUncommit = async (noSPK: string) => {
    if (!confirm(`Apakah Anda yakin ingin uncommit PO ${noSPK}? Stok akan dikembalikan.`)) {
      return;
    }

    setUncommitting(noSPK);

    try {
      const response = await fetch("/api/ppic/uncommit-po", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noSPK: noSPK,
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

      alert(`✅ PO ${noSPK} berhasil di-uncommit! Stok telah dikembalikan.`);
      onRefresh();
    } catch (error: any) {
      console.error(`❌ Gagal uncommit PO ${noSPK}:`, error);
      alert(`❌ Gagal uncommit PO: ${error.message || "Unknown error"}`);
    } finally {
      setUncommitting(null);
    }
  };

  const activeReservations = stockReservations.filter(
    (r) => r.status === "RESERVED"
  );

  const totalReservedQty = activeReservations.reduce(
    (sum, r) => sum + r.reservedQty,
    0
  );

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, displayedPOs.length);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            History PO yang Sudah Di-commit
            {showUnique && " (Unique by No SPK)"}
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={showUnique ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowUnique(!showUnique);
                setCurrentPage(1);
              }}
            >
              {showUnique ? "Show Unique" : "Show All"}
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
                    {totalReservedQty.toLocaleString()}
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

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Cari berdasarkan No SPK, Nama PO, atau Kode Barang..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent >
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="COMMITTED">Committed</SelectItem>
                    <SelectItem value="UNCOMMITTED">Uncommitted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                >
                  Clear
                </Button>
              )}
            </div>

            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Info Mode Tampilan</AlertTitle>
              <AlertDescription>
                {showUnique
                  ? `Menampilkan ${displayedPOs.length} data unik (berdasarkan No SPK) dari total ${filteredPOs.length} records.`
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
                  {paginatedPOs.length === 0 ? (
                    <TableRow>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        Tidak ada data PO yang di-commit
                      </td>
                    </TableRow>
                  ) : (
                    paginatedPOs.map((po, index) => (
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
                          {po.qty.toLocaleString()}
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
                            {po.totalQtyReserved.toLocaleString()} qty
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCommitDetailDrawer(po.noSPK)}
                              className="gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              Detail
                            </Button>
                            {po.status === "COMMITTED" && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleUncommit(po.noSPK)}
                                disabled={uncommitting === po.noSPK}
                                className="gap-1"
                              >
                                {uncommitting === po.noSPK ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                                Uncommit
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {displayedPOs.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  Menampilkan {startIndex}-{endIndex} dari {displayedPOs.length} data
                  {searchTerm && (
                    <span className="text-primary ml-2">
                      (Hasil pencarian untuk "{searchTerm}")
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
            )}
          </CardContent>
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
                        {commit.qty.toLocaleString()}
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
                        {commit.totalQtyReserved.toLocaleString()}
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
                    <div>Total Qty: {commitDetailDrawer.commits.reduce((sum, c) => sum + c.qty, 0).toLocaleString()}</div>
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

  // ==================== FUNGSI UTAMA ====================

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
        const normalizedId = normalizeItemId(item.ItemID);
        const existingItem = itemMap.get(normalizedId);
        if (existingItem) {
          existingItem.Qty += item.Qty;
        } else {
          const newItem = { ...item };
          itemMap.set(normalizedId, newItem);
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

        await fetchOrders(dateFilter.startDate, dateFilter.endDate);
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
      
      const activeOrders = response.data.filter(order => !order.Completed);
      
      const combinedOrders = combineDuplicatePOs(activeOrders);

      const committedSPKs = new Set(
        committedPOs
          .filter(po => po.status === "COMMITTED")
          .map(po => po.noSPK)
      );

      const filteredOrdersData = combinedOrders.filter(order => !committedSPKs.has(order.No_SPK));

      const productionPlans: ProductionPlan[] = filteredOrdersData.map((order) => {
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

        const allItemIds: string[] = [];
        
        // 🔥 Ambil SEMUA item dari flat BOM
        if (plan.bom.flat) {
          plan.bom.flat.forEach((item: BomItem) => {
            if (item.ItemID) {
              allItemIds.push(normalizeItemId(item.ItemID));
            }
          });
        }
        
        // 🔥 Ambil SEMUA item dari combined BOMs
        if (plan.bom.combinedBoms) {
          Object.values(plan.bom.combinedBoms).forEach((bom: any) => {
            if (bom.flat) {
              bom.flat.forEach((item: BomItem) => {
                if (item.ItemID) {
                  allItemIds.push(normalizeItemId(item.ItemID));
                }
              });
            }
          });
        }

        const uniqueItemIds = Array.from(new Set(allItemIds));
        console.log(`📦 Refresh stock for ${uniqueItemIds.length} items`);

        const updatedStock = await fetchStockForItemsWithCommitment(
          uniqueItemIds,
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
      let isCombined = plan.order.combinedItems && plan.order.combinedItems.length > 1;
      
      let materialNeeds;
      if (isCombined && plan.order.combinedItems) {
        materialNeeds = calculateMaterialNeedsForCombinedPO(
          plan.bom,
          plan.order.combinedItems,
          plan.stock
        );
      } else {
        materialNeeds = calculateMaterialNeeds(
          plan.bom.flat,
          plan.order.QTY,
          plan.stock
        );
      }

      for (const item of materialNeeds.items) {
        if (item.shortage > 0) {
          throw new Error(`Stok tidak cukup untuk item ${item.ItemID} (butuh ${item.needed}, tersedia ${item.availableStock})`);
        }
        
        materialUsage.push({
          itemId: item.ItemID,
          itemName: item.ItemName,
          itemName2: item.ItemName2 || "",
          qtyPerUnit: item.Qty,
          totalNeeded: item.needed,
          stockBefore: item.availableStock,
          stockAfter: item.availableStock - item.needed,
          qtyUsed: item.needed,
          departemen: item.Departemen,
          level: Number(item.Level)
        });
      }

      const commitResponse = await fetch("/api/ppic/commit-po", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noSPK: plan.order.No_SPK,
          kodeBarang: plan.order.Kode_Barang,
          namaPO: plan.order.Nama_PO,
          qty: plan.order.QTY,
          userID: "current_user",
          materialUsage: materialUsage,
          orderDate: plan.order.Tanggal_Order
        }),
      });

      if (!commitResponse.ok) {
        throw new Error(`HTTP ${commitResponse.status}`);
      }

      const commitResult = await commitResponse.json();

      if (!commitResult.success) {
        throw new Error(commitResult.error || "Commit failed");
      }

      await refreshAllData();
      
      setTimeout(() => {
        forceRefreshUI();
        alert(`✅ PO berhasil di-commit!\nCommit ID: ${commitResult.CommitID}`);
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

      await refreshAllData();

      setTimeout(() => {
        forceRefreshUI();
        alert("✅ PO berhasil di-uncommit! Stok telah dikembalikan.");
      }, 100);
    } catch (error: any) {
      console.error(`❌ Gagal uncommit PO ${plan.order.No_SPK}:`, error);
      alert(`❌ Gagal uncommit PO: ${error.message || "Unknown error"}`);
    } finally {
      setCommitting(null);
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
          console.log(`📦 Loading BOM untuk ${kb}...`);
          
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

            // 🔥 KRITIS: Ambil SEMUA ItemID tanpa filter apapun!
            const allItemIdsFromBom = bomResponse.data.flat.map((item: BomItem) => 
              normalizeItemId(item.ItemID)
            );
            allItemIds = [...allItemIds, ...allItemIdsFromBom];
            
            console.log(`📦 BOM untuk ${kb}: total ${allItemIdsFromBom.length} items`);
            
          } else {
            throw new Error("Data BOM tidak valid");
          }
        } catch (err) {
          console.error(`❌ Gagal load BOM untuk ${kb}:`, err);
          failedBoms.push(kb);
        }
      }

      if (Object.keys(combinedBoms).length === 0) {
        throw new Error(
          `Gagal memuat BOM untuk semua kode barang: ${allKodeBarang.join(", ")}`,
        );
      }

      // Hapus duplikasi
      allItemIds = Array.from(new Set(allItemIds));
      console.log(`📦 TOTAL unique items to fetch stock: ${allItemIds.length}`);

      let stockData: StockItem[] = [];
      try {
        stockData = await fetchStockForItemsWithCommitment(allItemIds, orderDate);
        console.log(`✅ Stock loaded: ${stockData.length} items`);
      } catch (stockError) {
        console.error(`❌ Gagal mengambil stok:`, stockError);
        stockData = allItemIds.map((id) => ({
          itemid: id,
          itemname: id,
          stockAkhir: 0,
          physicalStock: 0,
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
      console.error(`❌ Error loadBomWithStock untuk ${kodeBarang}:`, err);
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

            // 🔥 Ambil SEMUA item, tanpa filter Level
            const itemIds = bomResponse.data.flat.map((item: BomItem) => 
              normalizeItemId(item.ItemID)
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

  // ==================== FUNGSI EXPORT ====================

  const findParent = (itemId: string, flatBom: BomItem[]): BomItem | undefined => {
  const item = flatBom.find(b => normalizeItemId(b.ItemID) === normalizeItemId(itemId));
  if (item && item.ParentItemID) {
    const parentId = normalizeItemId(item.ParentItemID);
    return flatBom.find(b => normalizeItemId(b.ItemID) === parentId);
  }
  return undefined;
};

  const calculateAccumulatedQty = (item: BomItem, flatBom: BomItem[]): number => {
    let qty = item.Qty || 0;
    let currentItem = item;
    let depth = 0;
    
    while (Number(currentItem.Level) > 1 && currentItem.ParentItemID && depth < 10) {
      const parent = flatBom.find(b => normalizeItemId(b.ItemID) === normalizeItemId(currentItem.ParentItemID!));
      if (parent) {
        qty = qty * (parent.Qty || 0);
        currentItem = parent;
        depth++;
      } else {
        break;
      }
    }
    
    return qty;
  };

  const fetchMasterDataForItems = async (itemIds: string[]): Promise<Map<string, any>> => {
    const masterDataMap = new Map<string, any>();
    const uniqueItemIds = Array.from(new Set(itemIds));
    
    for (const itemId of uniqueItemIds) {
      try {
        const response = await axios.get(`/api/master?check=true&itemId=${encodeURIComponent(itemId)}`);
        
        if (response.data.success && response.data.exists && response.data.data) {
          const masterItem = response.data.data;
          masterDataMap.set(normalizeItemId(itemId), {
            spec: masterItem.Spec || "-",
            warna: masterItem.warna || "-",
            bahan: masterItem.bahan || "-"
          });
        } else {
          masterDataMap.set(normalizeItemId(itemId), {
            spec: "-",
            warna: "-",
            bahan: "-"
          });
        }
      } catch (error) {
        console.error(`Error fetching master data for ${itemId}:`, error);
        masterDataMap.set(normalizeItemId(itemId), {
          spec: "-",
          warna: "-",
          bahan: "-"
        });
      }
    }
    
    return masterDataMap;
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

      // 🔥 ========== FORCE REFRESH STOCK UNTUK SELECTED ORDERS ==========
      setExportProgress({ visible: true, current: 5, total: 100, message: "Menyegarkan data stok terbaru..." });
      
      // Ambil semua selected orders yang belum di-commit
      const selectedOrdersBefore = filteredOrders.filter(
        (order) => order.selected && !order.committed
      );
      
      if (selectedOrdersBefore.length === 0) {
        alert("Tidak ada PO yang dipilih untuk di-export!");
        setExportLoading(false);
        setExportProgress({ visible: false, current: 0, total: 0, message: "" });
        return;
      }
      
      // Kumpulkan semua material IDs dari selected orders
      const allMaterialIds: string[] = [];
      for (const order of selectedOrdersBefore) {
        if (order.bom && order.bom.flat) {
          order.bom.flat.forEach((item: BomItem) => {
            if (item.ItemID) {
              allMaterialIds.push(normalizeItemId(item.ItemID));
            }
          });
        }
        if (order.bom && order.bom.combinedBoms) {
          Object.values(order.bom.combinedBoms).forEach((bom: any) => {
            if (bom.flat) {
              bom.flat.forEach((item: BomItem) => {
                if (item.ItemID) {
                  allMaterialIds.push(normalizeItemId(item.ItemID));
                }
              });
            }
          });
        }
      }
      
      const uniqueMaterialIds = Array.from(new Set(allMaterialIds));
      console.log(`📦 Total unique materials untuk refresh: ${uniqueMaterialIds.length}`);
      
      // Fetch stock untuk semua material sekaligus
      setExportProgress({ visible: true, current: 10, total: 100, message: `Mengambil stok untuk ${uniqueMaterialIds.length} material...` });
      
      const orderDate = selectedOrdersBefore[0]?.order.Tanggal_Order || new Date().toISOString().split("T")[0];
      const freshStockData = await fetchStockForItemsWithCommitment(uniqueMaterialIds, orderDate);
      
      console.log(`✅ Fresh stock data: ${freshStockData.length} items`);
      
      // Update stock di setiap selected order
      for (const order of selectedOrdersBefore) {
        const orderIndex = filteredOrders.findIndex(o => o.order.No_SPK === order.order.No_SPK);
        if (orderIndex !== -1) {
          // Gabungkan stock lama dengan yang baru
          const updatedStock = [...(order.stock || [])];
          
          for (const freshStock of freshStockData) {
            const normalizedFreshId = normalizeItemId(freshStock.itemid);
            const existingIndex = updatedStock.findIndex(s => normalizeItemId(s.itemid) === normalizedFreshId);
            if (existingIndex !== -1) {
              updatedStock[existingIndex] = freshStock;
            } else {
              updatedStock.push(freshStock);
            }
          }
          
          // Update state orders
          setOrders(prev => prev.map((item, idx) => 
            idx === orderIndex 
              ? { ...item, stock: updatedStock, stockLastUpdated: new Date().toISOString() }
              : item
          ));
          
          // Update order object langsung untuk export
          order.stock = updatedStock;
          order.stockLastUpdated = new Date().toISOString();
        }
      }
      
      // Tunggu sebentar agar state terupdate
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Gunakan selectedOrders yang sudah dipastikan stocknya benar
      const finalSelectedOrders = filteredOrders.filter(
        (order) => order.selected && !order.committed
      );
      
      const wb = await generateExportWorkbook(finalSelectedOrders, committedPOs, stockReservations, setExportProgress);
      
      if (wb) {
        const timestamp = new Date().toISOString().split("T")[0];
        const filename = `Production_Plan_${timestamp}_${finalSelectedOrders.length}PO.xlsx`;
        XLSX.writeFile(wb, filename);
        
        setExportProgress({ visible: false, current: 0, total: 0, message: "" });
        alert(`✅ Export berhasil!\nFile: ${filename}\n\n📦 Total PO: ${finalSelectedOrders.length}`);
      }
      
      setExportLoading(false);
    } catch (error) {
      console.error("Error export:", error);
      alert("Gagal mengekspor data: " + (error instanceof Error ? error.message : "Unknown error"));
      setExportProgress({ visible: false, current: 0, total: 0, message: "" });
      setExportLoading(false);
    }
  };

const generateExportWorkbook = async (
  selectedOrders: ProductionPlan[],
  currentCommittedPOs: CommittedPO[],
  currentStockReservations: StockReservation[],
  setExportProgress: React.Dispatch<React.SetStateAction<{ visible: boolean; current: number; total: number; message: string }>>
): Promise<XLSX.WorkBook | null> => {
  const wb = XLSX.utils.book_new();

  // ==================== 🔥 AMBIL MASTER DATA (SPEC, WARNA, BAHAN) ====================
  setExportProgress({ visible: true, current: 5, total: 100, message: "Mengambil data master (spec, warna, bahan)..." });
  
  // Kumpulkan semua item IDs dari selected orders
  const allItemIdsForMaster: string[] = [];
  for (const order of selectedOrders) {
    if (order.bom && order.bom.flat) {
      order.bom.flat.forEach((item: BomItem) => {
        if (item.ItemID && Number(item.Level) > 0) {
          allItemIdsForMaster.push(normalizeItemId(item.ItemID));
        }
      });
    }
    if (order.bom && order.bom.combinedBoms) {
      Object.values(order.bom.combinedBoms).forEach((bom: any) => {
        if (bom.flat) {
          bom.flat.forEach((item: BomItem) => {
            if (item.ItemID && Number(item.Level) > 0) {
              allItemIdsForMaster.push(normalizeItemId(item.ItemID));
            }
          });
        }
      });
    }
  }
  
  const uniqueMasterIds = Array.from(new Set(allItemIdsForMaster));
  console.log(`📦 Fetching master data for ${uniqueMasterIds.length} items...`);
  
  const masterDataMap = await fetchMasterDataForItems(uniqueMasterIds);
  console.log(`✅ Master data loaded: ${masterDataMap.size} items`);

  // ==================== SHEET 1: PO ====================
  setExportProgress({ visible: true, current: 10, total: 100, message: "Membuat sheet PO..." });
  
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
  ws1["!cols"] = [{ wch: 15 }, { wch: 12 }, { wch: 40 }, { wch: 15 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws1, "PO");

  // ==================== SHEET 2: BOM ====================
  setExportProgress({ visible: true, current: 30, total: 100, message: "Membuat sheet BOM..." });
  
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
        const removedCount = bomFlat.filter(b => Number(b.Level) > 0 && isINJECTIONDepartment(b.Departemen)).length;
        totalINJECTIONRemoved += removedCount;

        bomData.push({
          "No SPK": order.order.No_SPK,
          "Kode Barang Jadi": item.Kode_Barang,
          "Nama Barang Jadi": item.Nama_PO,
          "QTY PO": item.QTY,
          "Level": "HEADER",
          "Kode Komponen": "",
          "Nama Komponen": "",
          "Nama Komponen China": "",
          "Qty per Unit (BOM)": "",
          "Accumulated Qty": "",
          "Total Kebutuhan": "",
          "Stok": "",
          "Status": ""
        });

        const sortedBom = [...filteredBom].sort((a, b) => Number(a.Level) - Number(b.Level));
        
        for (const b of sortedBom.filter(b => Number(b.Level) > 0)) {
          const normalizedItemId = normalizeItemId(b.ItemID);
          const stockItem = order.stock?.find(s => normalizeItemId(s.itemid) === normalizedItemId);
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
            "Nama Komponen China": b.ItemName2 || "",
            "Qty per Unit (BOM)": b.Qty,
            "Accumulated Qty": accumulatedQty,
            "Total Kebutuhan": totalNeeded,
            "Stok": stock,
            "Status": shortage ? "KURANG" : "CUKUP",
            "Keterangan": Number(b.Level) === 1 ? "Langsung dari produk jadi" : `Perhitungan: ${b.Qty} x ${parent?.Qty || 1}${parentInfo}`
          });
        }

        bomData.push({});
      }
    } else {
      const filteredBom = order.bom.flat.filter(b => !isINJECTIONDepartment(b.Departemen));
      const removedCount = order.bom.flat.filter(b => Number(b.Level) > 0 && isINJECTIONDepartment(b.Departemen)).length;
      totalINJECTIONRemoved += removedCount;

      bomData.push({
        "No SPK": order.order.No_SPK,
        "Kode Barang Jadi": order.order.Kode_Barang,
        "Nama Barang Jadi": order.order.Nama_PO,
        "QTY PO": order.order.QTY,
        "Level": "HEADER",
        "Kode Komponen": "",
        "Nama Komponen": "",
        "Nama Komponen China": "",
        "Qty per Unit (BOM)": "",
        "Accumulated Qty": "",
        "Total Kebutuhan": "",
        "Stok": "",
        "Status": ""
      });

      const sortedBom = [...filteredBom].sort((a, b) => Number(a.Level) - Number(b.Level));
      
      for (const b of sortedBom.filter(b => Number(b.Level) > 0)) {
        const normalizedItemId = normalizeItemId(b.ItemID);
        const stockItem = order.stock?.find(s => normalizeItemId(s.itemid) === normalizedItemId);
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
          "Nama Komponen China": b.ItemName2 || "",
          "Qty per Unit (BOM)": b.Qty,
          "Accumulated Qty": accumulatedQty,
          "Total Kebutuhan": totalNeeded,
          "Stok": stock,
          "Status": shortage ? "KURANG" : "CUKUP",
          "Keterangan": Number(b.Level) === 1 ? "Langsung dari produk jadi" : `Perhitungan: ${b.Qty} x ${parent?.Qty || 1}${parentInfo}`
        });
      }

      bomData.push({});
    }
  }

  bomData.push({});
  bomData.push({
    "No SPK": "INFORMASI",
    "Kode Barang Jadi": "",
    "Nama Barang Jadi": "",
    "QTY PO": "",
    "Level": "",
    "Kode Komponen": "",
    "Nama Komponen": `* Komponen dengan departemen INJECTION tidak ditampilkan (${totalINJECTIONRemoved} item dihapus)`,
    "Nama Komponen China": "",
    "Qty per Unit (BOM)": "",
    "Accumulated Qty": "",
    "Total Kebutuhan": "",
    "Stok": "",
    "Status": ""
  });

  const ws2 = XLSX.utils.json_to_sheet(bomData);
  ws2['!cols'] = [
    { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 8 },
    { wch: 15 }, { wch: 35 }, { wch: 35 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 40 }
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "BOM");

  // ==================== SHEET 3: TOTAL KEBUTUHAN MATERIAL ====================
  setExportProgress({ visible: true, current: 60, total: 100, message: "Menghitung kebutuhan material..." });
  
  const materialMap = new Map<string, any>();
  const reservationsByItem = new Map<string, { totalQty: number; spkList: Set<string>; itemName: string }>();

  // Kumpulkan reservasi
  for (const reservation of currentStockReservations) {
    if (reservation.status !== "RESERVED") continue;
    if (reservation.reservedQty <= 0) continue;
    
    const noSPK = reservation.noSPK;
    if (!noSPK) continue;
    
    const itemId = normalizeItemId(reservation.itemID);
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

  // ==================== PERHITUNGAN MATERIAL ====================
  for (const order of selectedOrders) {
    if (!order.bom || !order.stock) continue;
    
    const isCombined = order.order.combinedItems && order.order.combinedItems.length > 1;
    
    let materialNeeds;
    if (isCombined && order.order.combinedItems) {
      materialNeeds = calculateMaterialNeedsForCombinedPO(
        order.bom,
        order.order.combinedItems,
        order.stock
      );
    } else {
      materialNeeds = calculateMaterialNeeds(
        order.bom.flat,
        order.order.QTY,
        order.stock
      );
    }
    
    console.log(`Order ${order.order.No_SPK}: ${materialNeeds.items.length} materials`);
    
    for (const item of materialNeeds.items) {
      // Filter INJECTION
      if (isINJECTIONDepartment(item.Departemen)) continue;
      
      const key = normalizeItemId(item.ItemID);
      
      // DEBUG khusus untuk 03I095
      if (key === '03I095') {
        console.log(`🎯 03I095 DITEMUKAN! needed=${item.needed}, stock=${item.availableStock}`);
      }
      
      // 🔥 AMBIL MASTER DATA UNTUK MATERIAL INI
      const masterInfo = masterDataMap.get(key) || { spec: "-", warna: "-", bahan: "-" };
      
      // Ambil reserved data
      const reservedData = reservationsByItem.get(key);
      let reservedQty = 0;
      let reservedByText = "-";
      if (reservedData) {
        reservedQty = reservedData.totalQty;
        reservedByText = Array.from(reservedData.spkList).map(spk => `• ${spk}`).join("\n");
      }
      
      // Hitung total dibutuhkan (termasuk reserved dari PO lain)
      const totalDibutuhkan = item.needed + reservedQty;
      const sisaStok = item.availableStock - totalDibutuhkan;
      
      if (materialMap.has(key)) {
        const existing = materialMap.get(key);
        existing.totalNeeded += item.needed;
        existing.totalDibutuhkan = existing.totalNeeded + existing.reserved;
        existing.sisaStok = existing.stockAkhir - existing.totalDibutuhkan;
        existing.sourcePOs.push({
          noSPK: order.order.No_SPK,
          kodeBarang: isCombined && order.order.combinedItems?.[0] ? order.order.combinedItems[0].Kode_Barang : order.order.Kode_Barang,
          namaBarang: order.order.Nama_PO,
          qtyPO: order.order.QTY
        });
      } else {
        // 🔥 SEKARANG SPEC, WARNA, BAHAN DIAMBIL DARI MASTER DATA
        materialMap.set(key, {
          kode: item.ItemID,
          nama: item.ItemName,
          nama_china: item.ItemName2 || "-",
          spec: masterInfo.spec,
          warna: masterInfo.warna,
          bahan: masterInfo.bahan,
          departemen: item.Departemen || "UNKNOWN",
          totalNeeded: item.needed,
          stockWincp: item.availableStock,
          reserved: reservedQty,
          stockAkhir: item.availableStock,
          stokValid: item.availableStock,
          totalDibutuhkan: totalDibutuhkan,
          sisaStok: sisaStok,
          reservedBy: reservedByText,
          sourcePOs: [{
            noSPK: order.order.No_SPK,
            kodeBarang: isCombined && order.order.combinedItems?.[0] ? order.order.combinedItems[0].Kode_Barang : order.order.Kode_Barang,
            namaBarang: order.order.Nama_PO,
            qtyPO: order.order.QTY
          }]
        });
      }
    }
  }

  // Debug: Cek apakah 03I095 ada di materialMap
  console.log(`🔍 03I095 ada di materialMap? ${materialMap.has('03I095')}`);
  if (materialMap.has('03I095')) {
    console.log(`📊 Data 03I095:`, materialMap.get('03I095'));
  }

  // Hapus item dengan departemen RESERVED ONLY
  for (const [key, value] of materialMap) {
    if (value.departemen === "RESERVED ONLY") {
      materialMap.delete(key);
    }
  }

  // Mapping material ke PO
  const materialToPOs = new Map<string, Array<{ noSPK: string; kodeBarang: string; namaBarang: string; qtyPO: number }>>();
  
  for (const [key, value] of materialMap) {
    if (value.sourcePOs) {
      materialToPOs.set(key, value.sourcePOs);
    }
  }

  // Buat materialDataRows
  const materialDataRows: any[][] = [];
  
  const headers = [
    "Barang Jadi",
    "QTY PO Dipesan",
    "Kode Material",
    "Nama Material",
    "Nama China",
    "Spesifikasi",
    "Warna",
    "Bahan",
    "Departemen",
    "Total Kebutuhan",
    "Reserved (Qty PO Lain)",
    "Total Dibutuhkan",
    "Stok Wincp (Real)",
    "Stok Akhir",
    "Sisa Stok",
    "Reserved Oleh SPK",
    "Status"
  ];

  for (const [itemId, value] of materialMap) {
    const poList = materialToPOs.get(itemId) || [];
    const uniquePOs = Array.from(new Map(poList.map(po => [po.noSPK, po])).values());
    
    const barangJadiList = uniquePOs.map(po => `${po.kodeBarang}`).join('\n');
    const qtyPOList = uniquePOs.map(po => po.qtyPO.toLocaleString()).join('\n');
    
    let status = "";
    if (value.sisaStok > 0) {
      status = "KELEBIHAN";
    } else if (value.sisaStok < 0) {
      status = "KURANG";
    } else {
      status = "CUKUP";
    }
    
    materialDataRows.push([
      barangJadiList,
      qtyPOList,
      value.kode,
      value.nama,
      value.nama_china,
      value.spec,
      value.warna,
      value.bahan,
      value.departemen,
      value.totalNeeded,
      value.reserved,
      value.totalDibutuhkan,
      value.stockWincp,
      value.stockAkhir,
      value.sisaStok,
      value.reservedBy,
      status
    ]);
  }

  // Urutkan berdasarkan Kode Material
  materialDataRows.sort((a, b) => a[2].localeCompare(b[2]));

  // Kelompokkan berdasarkan departemen
  const materialsByDept = new Map<string, any[][]>();
  for (const row of materialDataRows) {
    const dept = row[8] || "UNKNOWN";
    if (!materialsByDept.has(dept)) {
      materialsByDept.set(dept, []);
    }
    materialsByDept.get(dept)!.push(row);
  }

  const sortedDepartments = Array.from(materialsByDept.keys()).sort();

  const deptColWidths = [
    { wch: 50 }, { wch: 20 }, { wch: 15 }, { wch: 40 }, { wch: 35 },
    { wch: 30 }, { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 50 }, { wch: 15 }
  ];

  // Buat sheet per departemen
  for (const dept of sortedDepartments) {
    const deptMaterials = materialsByDept.get(dept) || [];
    
    const totalNeeded = deptMaterials.reduce((sum, row) => sum + (row[9] || 0), 0);
    const totalSisa = deptMaterials.reduce((sum, row) => sum + (row[14] || 0), 0);
    
    const wsData = [
      [`LAPORAN KEBUTUHAN MATERIAL - DEPARTEMEN ${dept.toUpperCase()}`],
      [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`],
      [],
      ["DETAIL MATERIAL"],
      headers,
      ...deptMaterials
    ];
    
    wsData.push([]);
    wsData.push([`Total Keseluruhan: ${deptMaterials.length} material, Total Kebutuhan: ${totalNeeded.toLocaleString()}, Total Sisa Stok: ${totalSisa.toLocaleString()}`]);
    
    const wsDept = XLSX.utils.aoa_to_sheet(wsData);
    wsDept["!cols"] = deptColWidths;
    
    if (!wsDept["!merges"]) wsDept["!merges"] = [];
    wsDept["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } });
    wsDept["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } });
    
    let sheetName = dept.toUpperCase().replace(/[\\/*?:\[\]]/g, "");
    if (sheetName.length > 31) sheetName = sheetName.substring(0, 31);
    
    XLSX.utils.book_append_sheet(wb, wsDept, sheetName);
  }

  // Sheet rekap per departemen
  setExportProgress({ visible: true, current: 90, total: 100, message: "Membuat sheet rekap..." });
  
  const allDeptSummary: any[] = [
    ["REKAP KEBUTUHAN MATERIAL PER DEPARTEMEN"],
    [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`],
    [],
    ["Departemen", "Jumlah Material", "Total Kebutuhan", "Total Sisa Stok", "Status"]
  ];

  for (const dept of sortedDepartments) {
    const deptMaterials = materialsByDept.get(dept) || [];
    const totalNeeded = deptMaterials.reduce((sum, row) => sum + (row[9] || 0), 0);
    const totalSisa = deptMaterials.reduce((sum, row) => sum + (row[14] || 0), 0);
    const status = totalSisa > 0 ? "KELEBIHAN" : (totalSisa < 0 ? "KEKURANGAN" : "CUKUP");
    
    allDeptSummary.push([dept, deptMaterials.length, totalNeeded.toLocaleString(), totalSisa.toLocaleString(), status]);
  }

  const totalAllMaterials = materialDataRows.length;
  const totalAllNeeded = materialDataRows.reduce((sum, row) => sum + (row[9] || 0), 0);
  const totalAllSisa = materialDataRows.reduce((sum, row) => sum + (row[14] || 0), 0);

  allDeptSummary.push([]);
  allDeptSummary.push([
    "TOTAL KESELURUHAN",
    totalAllMaterials,
    totalAllNeeded.toLocaleString(),
    totalAllSisa.toLocaleString(),
    totalAllSisa > 0 ? "KELEBIHAN" : (totalAllSisa < 0 ? "KEKURANGAN" : "CUKUP")
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet(allDeptSummary);
  wsSummary["!cols"] = [
    { wch: 25 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 20 }
  ];

  if (!wsSummary["!merges"]) wsSummary["!merges"] = [];
  wsSummary["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } });
  wsSummary["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 4 } });

  XLSX.utils.book_append_sheet(wb, wsSummary, "REKAP_PER_DEPARTEMEN");

  setExportProgress({ visible: true, current: 100, total: 100, message: "Selesai!" });
  
  return wb;
};
  // ==================== KOMPONEN ORDER ROW ====================
  
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
                  {combinedCount} Item
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
                    ? `Kurang ${materialNeeds.totalShortage.toLocaleString()}`
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
                            <span> Qty: {plan.order.QTY.toLocaleString()} unit</span>
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
                            {materialNeeds?.totalShortage.toLocaleString() ?? '0'}
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

  // ==================== KOMPONEN PAGINATION ====================

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
              (Hasil pencarian untuk "{searchQuery}")
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

  // ==================== KOMPONEN EXPORT PROGRESS ====================
  
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

  // ==================== USE EFFECT ====================
  
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await loadCommittedPOs();
        await fetchOrders(dateFilter.startDate, dateFilter.endDate);
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);

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

            <Button
              onClick={exportSelectedToExcel}
              disabled={exportLoading || loading}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <ExportProgress
          visible={exportProgress.visible}
          current={exportProgress.current}
          total={exportProgress.total}
          message={exportProgress.message}
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

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Kontrol Commit PO (Database)</AlertTitle>
          <AlertDescription>
            • Commit PO akan menyimpan data ke database dan reserve stok
            • Stok yang di-reserve tidak bisa digunakan oleh PO lain
            • Uncommit akan mengembalikan stok yang di-reserve
          </AlertDescription>
        </Alert>
        
        <Alert>
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