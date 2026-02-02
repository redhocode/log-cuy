/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/production-plan/page.tsx
"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Button } from "../ui/button";
import { itemsWithVariants } from "./itemsWithVariants";
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            📊 Preview Export Data - 导出数据预览
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-blue-600 font-bold text-sm">
                Total Items 总项目数
              </div>
              <div className="text-2xl font-bold">{previewData.totalItems}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-green-600 font-bold text-sm">
                Stock Cukup 库存充足
              </div>
              <div className="text-2xl font-bold">
                {previewData.sufficientItems}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-red-600 font-bold text-sm">
                Problem Items 问题项目
              </div>
              <div className="text-2xl font-bold">
                {previewData.problemItemsCount}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-yellow-600 font-bold text-sm">
                Items dengan Variant 有变体项目
              </div>
              <div className="text-2xl font-bold">
                {previewData.itemsWithVariantCount}
              </div>
            </div>
          </div>

          {/* Stock Summary Table */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3 bg-gray-100 p-3 rounded">
              Stock Summary 库存汇总 ({previewData.stockSummary.length} items)
            </h3>
            <div className="overflow-x-auto max-h-96 border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-200 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Kode Item 物料代码</th>
                    <th className="px-3 py-2 text-left">Nama Item 物料名称</th>
                    <th className="px-3 py-2 text-right">
                      Sum of Total 总需求
                    </th>
                    <th className="px-3 py-2 text-right">
                      Stock Available 可用库存
                    </th>
                    <th className="px-3 py-2 text-right">
                      Remaining Stock 剩余库存
                    </th>
                    <th className="px-3 py-2 text-center">Status 状态</th>
                    <th className="px-3 py-2 text-center">Warning 警告</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.stockSummary.slice(0, 50).map((item, idx) => (
                    <tr
                      key={idx}
                      className={`border-b ${
                        item["Remaining Stock 剩余库存"] < 0
                          ? "bg-red-50"
                          : item["Warning 警告"]
                          ? "bg-yellow-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-3 py-2 font-mono text-xs">
                        {item["Kode Item 物料代码"]}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {item["Nama Item 物料名称"]}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {item["Sum of Total 总需求 (PO)"]?.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {item["Stock Available 可用库存"]?.toLocaleString()}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-mono text-xs font-bold ${
                          item["Remaining Stock 剩余库存"] < 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {item["Remaining Stock 剩余库存"]?.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            item["Status 状态"] === "CUKUP 充足"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item["Status 状态"]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-yellow-600 text-xs">
                        {item["Warning 警告"] || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.stockSummary.length > 50 && (
                <div className="bg-gray-100 p-2 text-center text-sm text-gray-600">
                  Menampilkan 50 dari {previewData.stockSummary.length} items.
                  显示前50条，共{previewData.stockSummary.length}个项目
                </div>
              )}
            </div>
          </div>

          {/* Problem Items */}
          {previewData.problemItems.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3 bg-red-100 p-3 rounded text-red-800">
                ⚠️ Problem Items 问题项目 ({previewData.problemItems.length}{" "}
                items)
              </h3>
              <div className="overflow-x-auto max-h-64 border border-red-200 rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-red-100">
                    <tr>
                      <th className="px-3 py-2 text-left">
                        Kode Item 物料代码
                      </th>
                      <th className="px-3 py-2 text-left">
                        Nama Item 物料名称
                      </th>
                      <th className="px-3 py-2 text-right">Kekurangan 短缺</th>
                      <th className="px-3 py-2 text-right">
                        Stock Available 可用库存
                      </th>
                      <th className="px-3 py-2 text-center">Warning 警告</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.problemItems.slice(0, 20).map((item, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-red-200 bg-red-50"
                      >
                        <td className="px-3 py-2 font-mono text-xs">
                          {item["Kode Item 物料代码"]}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {item["Nama Item 物料名称"]}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs text-red-600 font-bold">
                          {item["Kekurangan 短缺"]?.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs">
                          {item["Stock Available 可用库存"]?.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-center text-yellow-600 text-xs">
                          {item["Warning 警告"] || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.problemItems.length > 20 && (
                  <div className="bg-red-100 p-2 text-center text-sm text-red-700">
                    Menampilkan 20 dari {previewData.problemItems.length}{" "}
                    problem items. 显示前20条，共
                    {previewData.problemItems.length}个问题项目
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Export Information */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-bold mb-2">📋 Informasi Export 导出信息</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Tanggal Data 数据日期:</span>
                <div>{previewData.today}</div>
              </div>
              <div>
                <span className="font-medium">PO Terpilih 选择的PO:</span>
                <div>{previewData.selectedOrdersCount}</div>
              </div>
              <div>
                <span className="font-medium">
                  Total Stock Available 总可用库存:
                </span>
                <div>{previewData.totalStockAvailable.toLocaleString()}</div>
              </div>
              <div>
                <span className="font-medium">Total Pengeluaran 总支出:</span>
                <div>{previewData.totalPengeluaran.toLocaleString()}</div>
              </div>
              <div>
                <span className="font-medium">
                  Items dengan Pengeluaran 有支出项目:
                </span>
                <div>{previewData.itemsWithPengeluaran}</div>
              </div>
              <div>
                <span className="font-medium">Periode R 期间R:</span>
                <div>201905</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 p-4 flex justify-between items-center border-t">
          <div className="text-sm text-gray-600">
            Data akan diexport ke file Excel dengan{" "}
            {previewData.stockSummary.length} items
            <br />
            数据将导出到Excel文件，包含{previewData.stockSummary.length}个项目
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={exportLoading}
            >
              Batal 取消
            </Button>
            <Button
              onClick={onConfirmExport}
              disabled={exportLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {exportLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Exporting... 导出中...
                </>
              ) : (
                "✅ Export to Excel 导出到Excel"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
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
    // Filter out items with "INJEKSI-BB" in department name
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

    console.log(`📡 Fetching stock for: ${itemId}`);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`❌ HTTP error for ${itemId}: ${response.status}`);
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
    console.log(`📊 RAW API Response for ${itemId}:`, result);

    if (!result.success) {
      console.warn(`❌ API not successful for ${itemId}`);
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
        // ⭐ PERBAIKAN PENTING: Gunakan field yang benar dari API
        const stockAkhir = parseFloat(itemData.SaldoAkhir) || 0;
        const committedQty = parseFloat(itemData.TotalCommitted) || 0;
        const reservedQty = parseFloat(itemData.TotalReserved) || 0;

        // ⭐ PERBAIKAN: Stock Real = SaldoAkhir (karena ini data real dari sistem)
        // Jangan gunakan SaldoAkhirFisik jika tidak reliable
        const physicalStock = stockAkhir; // Gunakan stockAkhir sebagai stock real

        console.log(`📦 Stock details for ${itemId}:`, {
          stockAkhir,
          committedQty,
          reservedQty,
          physicalStock,
          rawData: itemData, // Log raw data untuk debugging
        });

        return {
          itemid: itemData.KodeBarang,
          itemname: itemData.NamaBarang || itemData.KodeBarang,
          stockAkhir: stockAkhir,
          physicalStock: physicalStock, // ⭐ SEKARANG SAMA DENGAN stockAkhir
          committedQty: committedQty,
          reservedQty: reservedQty,
        };
      } else {
        console.warn(`❌ Item data not found in response for: ${itemId}`);
      }
    } else {
      console.warn(`❌ No data array in response for: ${itemId}`);
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
    console.error(`❌ Error fetching stock for ${itemId}:`, err);
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

  console.log(
    `🔄 Mengambil data stock untuk ${uniqueItemIds.length} item unik`
  );

  for (let i = 0; i < uniqueItemIds.length; i++) {
    const itemId = uniqueItemIds[i];

    try {
      const stockItem = await fetchStockForItem(itemId, orderDate);
      if (stockItem) {
        stockData.push(stockItem);

        // Debug log untuk reservedQty
        if (stockItem.reservedQty !== undefined) {
          console.log(`🔍 ReservedQty for ${itemId}:`, stockItem.reservedQty);
        } else {
          console.warn(`⚠️ reservedQty undefined for ${itemId}`);
        }
      }
    } catch (err) {
      console.error(`❌ Error untuk item ${itemId}:`, err);
      // Fallback untuk error dengan nilai eksplisit
      stockData.push({
        itemid: itemId,
        itemname: itemId,
        stockAkhir: 0,
        physicalStock: 0,
        committedQty: 0,
        reservedQty: 0,
      });
    }

    // Delay antara request
    if (i < uniqueItemIds.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.log(`✅ Data stock berhasil diambil: ${stockData.length} item`);

  // Log semua item dengan reservedQty untuk debugging
  stockData.forEach((item) => {
    console.log(`📊 Final - ${item.itemid}: reservedQty = ${item.reservedQty}`);
  });

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
      <div className="border border-gray-300 rounded-lg bg-white">
        <div className="bg-gray-800 text-white px-4 py-3 rounded-t-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div className="w-8 flex-shrink-0"></div>
              <div className="flex-1 font-bold">
                Struktur BOM (Tree View) BOM结构(树状视图)
              </div>
            </div>
            <div className="text-xs text-gray-300">
              Stok per tanggal: {orderDate} 库存日期: {orderDate}
            </div>
          </div>
        </div>
        <div className="p-8 text-center text-gray-500">
          <div className="text-4xl mb-2">🌳</div>
          <div className="font-bold mb-2">
            Tree View Tidak Tersedia 树状视图不可用
          </div>
          <div className="text-sm">
            Struktur tree BOM tidak dapat ditampilkan.
            <br />
            无法显示BOM树状结构。
            <br />
            Silakan gunakan Table View untuk melihat daftar komponen.
            <br />
            请使用表格视图查看组件列表。
          </div>
        </div>
      </div>
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
      <div className="border border-gray-300 rounded-lg bg-white">
        <div className="bg-gray-800 text-white px-4 py-3 rounded-t-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div className="w-8 flex-shrink-0"></div>
              <div className="flex-1 font-bold">
                Struktur BOM (Tree View) - PO Gabungan BOM结构(树状视图) -
                合并PO
              </div>
            </div>
            <div className="text-xs text-gray-300">
              Stok per tanggal: {orderDate} 库存日期: {orderDate}
            </div>
          </div>
          <div className="flex items-center text-sm mt-2">
            <div className="w-8 flex-shrink-0"></div>
            <div className="flex-1 font-bold"></div>
            <div className="flex items-center gap-4 mr-4">
              <div className="text-right font-bold">Per Unit 每单位</div>
              <div className="text-right font-bold">Butuh 需求</div>
              <div className="text-right font-bold">Stok 库存</div>
              <div className="text-right font-bold">Status 状态</div>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {combinedItems.map((combinedItem, itemIndex) => {
            // PERBAIKAN PENTING: Gunakan BOM spesifik untuk item ini
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

              // PERBAIKAN PENTING: Gunakan QTY dari item individual, bukan dari PO utama
              const needed = node.Qty * itemQty;
              const availableStock = getStock(node.ItemID);
              const shortage = Math.max(0, needed - availableStock);

              // Hanya tampilkan info PO untuk item utama (Level 0)
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
                        <button
                          onClick={() =>
                            toggleNode(
                              `${node.ItemID}-${
                                combinedItem.Kode_Barang
                              }-${itemIndex}${
                                parentItemId ? `-${parentItemId}` : ""
                              }`
                            )
                          }
                          className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm"
                        >
                          {isExpanded ? "−" : "+"}
                        </button>
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
                                Dept: {node.Departemen} 部门: {node.Departemen}
                              </span>
                            )}
                            {node.NamaJenis && (
                              <span className="mr-3">
                                Jenis: {node.NamaJenis} 类型: {node.NamaJenis}
                              </span>
                            )}
                            <span>
                              Level: {node.Level} 层级: {node.Level}
                            </span>
                          </div>

                          {/* Info PO Individual - hanya tampilkan untuk item utama */}
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
                              Per Unit 每单位
                            </div>
                            <div className="font-mono text-sm font-bold">
                              {node.Qty}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">
                              Butuh 需求
                            </div>
                            <div className="font-mono text-sm font-bold text-red-600">
                              {needed.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">
                              Stok 库存
                            </div>
                            <div className="font-mono text-sm font-bold text-green-600">
                              {availableStock.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">
                              Status 状态
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

        <div className="bg-gray-100 px-4 py-2 rounded-b-lg border-t border-gray-300">
          <div className="flex justify-between items-center text-xs text-gray-600">
            <span>
              Total PO: {combinedItems.length} 总PO数: {combinedItems.length}
            </span>
            <span>
              Expanded: {expandedNodes.size} nodes 展开: {expandedNodes.size}{" "}
              节点
            </span>
            <div className="flex gap-4">
              <button
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
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Expand All 全部展开
              </button>
              <button
                onClick={() => setExpandedNodes(new Set())}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Collapse All 全部折叠
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TAMPILAN NORMAL (NON-COMBINED PO)
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
              <button
                onClick={() => toggleNode(node.ItemID)}
                className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm"
              >
                {isExpanded ? "−" : "+"}
              </button>
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
                      Dept: {node.Departemen} 部门: {node.Departemen}
                    </span>
                  )}
                  {node.NamaJenis && (
                    <span className="mr-3">
                      Jenis: {node.NamaJenis} 类型: {node.NamaJenis}
                    </span>
                  )}
                  <span>
                    Level: {node.Level} 层级: {node.Level}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 mr-4">
                <div className="text-right">
                  <div className="text-xs text-gray-500">Per Unit 每单位</div>
                  <div className="font-mono text-sm font-bold">{node.Qty}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Butuh 需求</div>
                  <div className="font-mono text-sm font-bold text-red-600">
                    {needed.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Stok 库存</div>
                  <div className="font-mono text-sm font-bold text-green-600">
                    {availableStock.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Status 状态</div>
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
    <div className="border border-gray-300 rounded-lg bg-white">
      <div className="bg-gray-800 text-white px-4 py-3 rounded-t-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <div className="w-8 flex-shrink-0"></div>
            <div className="flex-1 font-bold">
              Struktur BOM (Tree View) BOM结构(树状视图)
            </div>
          </div>
          <div className="text-xs text-gray-300">
            Stok per tanggal: {orderDate} 库存日期: {orderDate}
          </div>
        </div>
        <div className="flex items-center text-sm mt-2">
          <div className="w-8 flex-shrink-0"></div>
          <div className="flex-1 font-bold"></div>
          <div className="flex items-center gap-4 mr-4">
            <div className="text-right font-bold">Per Unit 每单位</div>
            <div className="text-right font-bold">Butuh 需求</div>
            <div className="text-right font-bold">Stok 库存</div>
            <div className="text-right font-bold">Status 状态</div>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {treeData.map((node, index) => (
          <TreeNode key={`${node.ItemID}-${index}`} node={node} depth={0} />
        ))}
      </div>

      <div className="bg-gray-100 px-4 py-2 rounded-b-lg border-t border-gray-300">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>
            Total Nodes: {treeData.length} 总节点数: {treeData.length}
          </span>
          <span>
            Expanded: {expandedNodes.size} nodes 展开: {expandedNodes.size} 节点
          </span>
          <div className="flex gap-4">
            <button
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
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Expand All 全部展开
            </button>
            <button
              onClick={() => setExpandedNodes(new Set())}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Collapse All 全部折叠
            </button>
          </div>
        </div>
      </div>
    </div>
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
  // PERBAIKAN: Untuk PO gabungan, gabungkan material needs dari semua item
  const materialNeeds = useMemo(() => {
    if (isCombinedPO && combinedItems && combinedBoms) {
      // Hitung kebutuhan material untuk setiap item PO gabungan
      const allMaterialNeeds: any[] = [];

      combinedItems.forEach((combinedItem) => {
        const itemBom = combinedBoms[combinedItem.Kode_Barang];
        if (itemBom && itemBom.flat) {
          const componentsOnly = filterOnlyComponents(itemBom.flat);
          const itemNeeds = calculateMaterialNeeds(
            componentsOnly,
            combinedItem.QTY, // Gunakan QTY individual
            stock
          );

          // Tambahkan informasi PO ke setiap item
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

      // Gabungkan item yang sama dari berbagai PO
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
      // Untuk PO biasa
      const componentsOnly = filterOnlyComponents(bom);
      return calculateMaterialNeeds(componentsOnly, productionQty, stock);
    }
  }, [bom, productionQty, stock, isCombinedPO, combinedItems, combinedBoms]);

  return (
    <div className="border border-gray-300 rounded-lg bg-white">
      <div className="bg-gray-100 px-4 py-3 border-b border-gray-300 flex justify-between items-center">
        <div>
          <h4 className="font-bold">
            Daftar Komponen (Table View) 组件列表(表格视图)
          </h4>
          <p className="text-xs text-gray-600 mt-1">
            *Hanya menampilkan komponen (Level 1+), tidak termasuk barang
            jadinya (Level 0)
            <br />
            仅显示组件(级别1+)，不包括成品(级别0)
            {isCombinedPO && (
              <>
                <br />
                *PO Gabungan: QTY per item sesuai dengan PO aslinya
                <br />
                合并PO: 每个项目的数量符合原始PO
              </>
            )}
          </p>
          {stockLastUpdated && (
            <p className="text-xs text-green-600 mt-1">
              Stok diperbarui:{" "}
              {new Date(stockLastUpdated).toLocaleString("id-ID")}
              <br />
              库存更新: {new Date(stockLastUpdated).toLocaleString("zh-CN")}
            </p>
          )}
        </div>
        <span className="text-sm text-gray-600">
          Stok per tanggal: {orderDate} 库存日期: {orderDate}
        </span>
      </div>
      <div className="max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-200 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left">Kode Item 物料代码</th>
              <th className="px-4 py-2 text-left">Nama Item 物料名称</th>
              <th className="px-4 py-2 text-left">Departemen 部门</th>
              <th className="px-4 py-2 text-left">Jenis 类型</th>
              {isCombinedPO && (
                <th className="px-4 py-2 text-left">Sumber PO PO来源</th>
              )}
              <th className="px-4 py-2 text-right">Per Unit 每单位</th>
              <th className="px-4 py-2 text-right">Butuh 需求</th>
              <th className="px-4 py-2 text-right">Stok Tersedia 可用库存</th>
              <th className="px-4 py-2 text-right">Status 状态</th>
            </tr>
          </thead>
          <tbody>
            {materialNeeds.items.map((item: any, idx: number) => (
              <tr
                key={idx}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <td className="px-4 py-2 text-sm font-mono">{item.ItemID}</td>
                <td className="px-4 py-2 text-sm">{item.ItemName}</td>
                <td className="px-4 py-2 text-sm">{item.Departemen || "-"}</td>
                <td className="px-4 py-2 text-sm">{item.NamaJenis || "-"}</td>

                {/* Kolom tambahan untuk PO Gabungan */}
                {isCombinedPO && (
                  <td className="px-4 py-2 text-sm">
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
                  </td>
                )}

                <td className="px-4 py-2 text-sm text-right">{item.Qty}</td>
                <td className="px-4 py-2 text-sm text-right font-mono text-red-600">
                  {item.needed.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-sm text-right font-mono text-green-600">
                  {item.availableStock.toLocaleString()}
                </td>
                <td
                  className={`px-4 py-2 text-sm text-right font-mono font-bold ${
                    item.shortage > 0
                      ? "text-red-600 bg-red-50"
                      : "text-green-600"
                  }`}
                >
                  {item.shortage > 0
                    ? `-${item.shortage.toLocaleString()}`
                    : "Cukup 充足"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-100 px-4 py-2 border-t border-gray-300 text-xs text-gray-600">
        Total: {materialNeeds.items.length} komponen 总组件数:{" "}
        {materialNeeds.items.length} | Butuh:{" "}
        {materialNeeds.totalNeeded.toLocaleString()} 总需求:{" "}
        {materialNeeds.totalNeeded.toLocaleString()} | Kekurangan:{" "}
        <span className="font-bold text-red-600">
          {materialNeeds.totalShortage.toLocaleString()} 总短缺:{" "}
          {materialNeeds.totalShortage.toLocaleString()}
        </span>
        {isCombinedPO && (
          <span className="ml-4 text-purple-600">
            | PO Gabungan: {combinedItems?.length || 0} items 合并PO项目
          </span>
        )}
      </div>
    </div>
  );
};

const CommittedPOsPanel: React.FC<{
  committedPOs: CommittedPO[];
  stockReservations: StockReservation[];
  onRefresh: () => void;
}> = ({ committedPOs, stockReservations, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [showUnique, setShowUnique] = useState(true);

  // State untuk drawer detail commit
  const [commitDetailDrawer, setCommitDetailDrawer] = useState({
    open: false,
    spk: "",
    commits: [] as CommittedPO[],
  });

  // Fungsi untuk membuka drawer detail commit
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

  // Filter data berdasarkan toggle
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
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg text-blue-800">
          📋 History PO yang Sudah Di-commit
          {showUnique && " (Unique by No SPK)"}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUnique(!showUnique)}
            className={`px-3 py-2 rounded-lg font-medium ${
              showUnique
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-gray-700"
            }`}
          >
            {showUnique ? "Show All 显示全部" : "Show Unique 显示去重"}
          </button>

          <button
            onClick={onRefresh}
            className="bg-blue-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-600 flex items-center gap-2"
          >
            🔄 Refresh 刷新
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600"
          >
            {expanded ? "Sembunyikan 隐藏" : "Tampilkan 显示"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-sm text-gray-600">
                {showUnique ? "Unique PO 唯一PO数" : "Total PO 总PO数"}
              </div>
              <div className="text-xl font-bold">{displayedPOs.length}</div>
              <div className="text-xs text-gray-500 mt-1">
                {showUnique
                  ? `(from ${committedPOs.length} records 来自${committedPOs.length}条记录)`
                  : "(all records 所有记录)"}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-sm text-gray-600">
                Active Reservations 有效预留
              </div>
              <div className="text-xl font-bold text-green-600">
                {activeReservations.length}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-sm text-gray-600">
                Total Qty Reserved 总预留数量
              </div>
              <div className="text-xl font-bold text-orange-600">
                {totalReservedQty.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-sm text-gray-600">
                Items Reserved 预留物料数
              </div>
              <div className="text-xl font-bold text-purple-600">
                {
                  Array.from(new Set(activeReservations.map((r) => r.itemID)))
                    .length
                }
              </div>
            </div>
          </div>

          {/* Info tentang mode tampilan */}
          <div
            className={`p-3 rounded-lg border ${
              showUnique
                ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            <div className="flex items-center text-sm">
              <span className="mr-2">ℹ️</span>
              <span>
                {showUnique
                  ? `Menampilkan ${displayedPOs.length} data unik (berdasarkan No SPK) dari total ${committedPOs.length} records. Hanya commit terbaru untuk setiap SPK yang ditampilkan.`
                  : `Menampilkan semua ${displayedPOs.length} records commit.`}
              </span>
            </div>
            <div className="flex items-center text-sm mt-1">
              <span className="mr-2">ℹ️</span>
              <span>
                {showUnique
                  ? `显示${displayedPOs.length}条唯一数据(基于生产订单号)，共${committedPOs.length}条记录。每个SPK只显示最新的提交。`
                  : `显示所有${displayedPOs.length}条提交记录。`}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">Commit ID 提交ID</th>
                  <th className="px-4 py-2 text-left">No SPK 生产订单号</th>
                  <th className="px-4 py-2 text-left">PO 生产订单</th>
                  <th className="px-4 py-2 text-right">Qty 数量</th>
                  <th className="px-4 py-2 text-left">Tanggal 日期</th>
                  <th className="px-4 py-2 text-center">Status 状态</th>
                  <th className="px-4 py-2 text-right">Materials 物料</th>
                  <th className="px-4 py-2 text-center">Aksi 操作</th>
                </tr>
              </thead>
              <tbody>
                {displayedPOs.map((po) => (
                  <tr
                    key={po.CommitID}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-4 py-2 font-mono text-xs">
                      {po.CommitID}
                    </td>
                    <td className="px-4 py-2 font-medium">{po.noSPK}</td>
                    <td className="px-4 py-2">
                      <div className="font-medium">{po.namaPO}</div>
                      <div className="text-xs text-gray-500">
                        {po.kodeBarang}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right font-bold">
                      {po.qty.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {new Date(po.tanggalCommit).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          po.status === "COMMITTED"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div>{po.totalMaterials} items 物料数</div>
                      <div className="text-xs text-gray-500">
                        {po.totalQtyReserved.toLocaleString()} qty 数量
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Button
                        variant="outline"
                        onClick={() => openCommitDetailDrawer(po.noSPK)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        title={`Lihat semua commit untuk SPK ini (${
                          committedPOs.filter((p) => p.noSPK === po.noSPK)
                            .length
                        } records)`}
                      >
                        Lihat Semua 查看全部
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {displayedPOs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Tidak ada PO yang di-commit 没有已提交的PO
            </div>
          )}
        </div>
      )}

      {/* Drawer untuk Detail Commit per SPK */}
      <Drawer
        open={commitDetailDrawer.open}
        onOpenChange={(open) =>
          setCommitDetailDrawer((prev) => ({ ...prev, open }))
        }
      >
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <span className="text-lg">📋 Detail Commit untuk SPK</span>
              <span className="font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">
                {commitDetailDrawer.spk}
              </span>
            </DrawerTitle>
            <DrawerDescription>
              Menampilkan semua history commit untuk SPK ini. Total:{" "}
              {commitDetailDrawer.commits.length} records
              <br />
              显示此生产订单号的所有提交历史。总计:{" "}
              {commitDetailDrawer.commits.length} 条记录
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4 overflow-y-auto">
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {commitDetailDrawer.commits.map((commit, index) => (
                <div
                  key={commit.CommitID}
                  className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-blue-500 text-white px-2 py-1 rounded">
                        Commit ID: {commit.CommitID}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          commit.status === "COMMITTED"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {commit.status}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Tanggal 日期:</span>
                      <div className="font-medium">
                        {new Date(commit.tanggalCommit).toLocaleDateString(
                          "id-ID"
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Qty 数量:</span>
                      <div className="font-medium text-right">
                        {commit.qty.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Materials 物料:</span>
                      <div className="font-medium">
                        {commit.totalMaterials} items
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">
                        Qty Reserved 预留数量:
                      </span>
                      <div className="font-medium text-right">
                        {commit.totalQtyReserved.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    <div>Kode Barang 物料代码: {commit.kodeBarang}</div>
                    <div>User ID: {commit.userID}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            {commitDetailDrawer.commits.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-2">
                  📊 Summary 总结
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Total Records 总记录:</span>
                    <div className="font-bold">
                      {commitDetailDrawer.commits.length}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-600">
                      Active Commits 活跃提交:
                    </span>
                    <div className="font-bold text-green-600">
                      {
                        commitDetailDrawer.commits.filter(
                          (c) => c.status === "COMMITTED"
                        ).length
                      }
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-600">
                      Latest Commit 最新提交:
                    </span>
                    <div className="font-bold">
                      {commitDetailDrawer.commits[0]?.CommitID}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-600">Total Qty 总数量:</span>
                    <div className="font-bold">
                      {commitDetailDrawer.commits
                        .reduce((sum, c) => sum + c.qty, 0)
                        .toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Tutup 关闭</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
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

  // State untuk preview export
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

  // FUNGSI: Ambil semua kode barang dari PO gabungan
  const getAllKodeBarang = (kodeBarang: string): string[] => {
    if (kodeBarang.includes(" | ")) {
      return kodeBarang.split(" | ");
    }
    return [kodeBarang];
  };

  // ==================== FUNGSI UTAMA YANG DIPERBAIKI ====================

  // FUNGSI: Gabungkan PO dengan No_SPK yang sama - FIXED VERSION
  const combineDuplicatePOs = (
    orders: ProductionOrder[],
  ): ProductionOrder[] => {
    const poMap = new Map<string, ProductionOrder>();

    orders.forEach((order) => {
      const existingPO = poMap.get(order.No_SPK);

      if (existingPO) {
        // Jika PO sudah ada, tambahkan ke combinedItems
        if (!existingPO.combinedItems) {
          existingPO.combinedItems = [
            {
              ...existingPO,
              isCombined: false,
            },
          ];
        }

        // Tambahkan PO baru ke combinedItems
        existingPO.combinedItems.push({
          ...order,
          isCombined: true,
        });

        // PERBAIKAN: Jangan ubah QTY utama, biarkan sesuai dengan item pertama
        existingPO.QTY = existingPO.QTY; // Tetap pertahankan QTY asli item pertama

        // Gabungkan nama PO dan kode barang
        if (existingPO.Nama_PO !== order.Nama_PO) {
          existingPO.Nama_PO = `${existingPO.Nama_PO} | ${order.Nama_PO}`;
        }

        if (existingPO.Kode_Barang !== order.Kode_Barang) {
          existingPO.Kode_Barang = `${existingPO.Kode_Barang} | ${order.Kode_Barang}`;
        }

        // Gunakan tanggal terbaru
        if (
          new Date(order.Tanggal_Order) > new Date(existingPO.Tanggal_Order)
        ) {
          existingPO.Tanggal_Order = order.Tanggal_Order;
        }
      } else {
        // PO baru, inisialisasi dengan combinedItems
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

  // FUNGSI: Gabungkan BOM dari multiple kode barang
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
    console.log("🔄 Syncing commit status...");

    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        // Cari commit yang aktif untuk SPK ini
        const committedPO = committedPOs.find(
          (po) => po.noSPK === order.order.No_SPK && po.status === "COMMITTED",
        );

        const shouldBeCommitted = !!committedPO;
        const currentCommitID = order.CommitID;
        const newCommitID = committedPO?.CommitID;

        // Jika status berbeda, update
        if (
          order.committed !== shouldBeCommitted ||
          currentCommitID !== newCommitID
        ) {
          console.log(`📝 Updating commit status for ${order.order.No_SPK}:`, {
            from: { committed: order.committed, CommitID: currentCommitID },
            to: { committed: shouldBeCommitted, CommitID: newCommitID },
          });

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
  }, [committedPOs]); // Hanya depend on committedPOs
  const loadCommittedPOs = async (): Promise<void> => {
    try {
      console.log("📡 Loading committed POs...");

      const response = await fetch("/api/ppic/committed-pos", {
        cache: "no-store", // Pastikan tidak cache di production
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const newCommittedPOs = result.data.committedPOs || [];
        const newReservations = result.data.reservations || [];

        console.log(`✅ Loaded ${newCommittedPOs.length} committed POs`);

        // Update state sekaligus
        setCommittedPOs(newCommittedPOs);
        setStockReservations(newReservations);

        // Sinkronkan status setelah data selesai di-load
        setTimeout(() => {
          syncCommitStatus();
        }, 100);
      } else {
        console.error("❌ API response not successful:", result);
      }
    } catch (error) {
      console.error("❌ Error loading committed POs:", error);
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

      // Gabungkan PO dengan No_SPK yang sama
      const combinedOrders = combineDuplicatePOs(response.data);

      // Buat production plans
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

  // FUNGSI: Refresh stok untuk satu PO
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

  // Fungsi untuk refresh data reservedQty
  const refreshReservedQtyData = useCallback(async () => {
    try {
      console.log("🔄 Force refreshing reservedQty data...");

      // Ambil semua item IDs dari semua orders yang memiliki BOM
      const allItemIds: string[] = [];
      orders.forEach((order) => {
        if (order.bom && order.stock) {
          order.bom.flat.forEach((item) => {
            allItemIds.push(item.ItemID);
          });
        }
      });

      const uniqueItemIds = Array.from(new Set(allItemIds));
      console.log(`📋 Refreshing ${uniqueItemIds.length} unique items`);

      // Refresh data stock untuk semua item
      const refreshedStock = await fetchStockForItemsWithCommitment(
        uniqueItemIds,
        new Date().toISOString().split("T")[0],
      );

      // Update orders dengan data stock yang baru
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

      console.log("✅ ReservedQty data refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing reservedQty data:", error);
    }
  }, [orders]);

  // FUNGSI: Commit PO dengan mengambil semua kebutuhan material (termasuk yang minus)
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

      if (plan.order.combinedItems && plan.order.combinedItems.length > 1) {
        // PO GABUNGAN
        for (const combinedItem of plan.order.combinedItems) {
          let bomForThisItem: BomItem[] = [];
          if (
            plan.bom.combinedBoms &&
            plan.bom.combinedBoms[combinedItem.Kode_Barang]
          ) {
            bomForThisItem =
              plan.bom.combinedBoms[combinedItem.Kode_Barang].flat;
          } else {
            bomForThisItem = plan.bom.flat;
          }

          const componentsOnly = filterOnlyComponents(bomForThisItem);

          componentsOnly.forEach((bomItem) => {
            if (bomItem.Level > 0) {
              const needed = bomItem.Qty * combinedItem.QTY;
              const availableStock =
                plan.stock?.find((s) => s.itemid === bomItem.ItemID)
                  ?.stockAkhir || 0;
              const usedQty = needed;
              const stockAfter = availableStock - usedQty;

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
          });
        }
      } else {
        // PO BIASA
        plan.bom.flat.forEach((bomItem) => {
          if (bomItem.Level > 0) {
            const needed = bomItem.Qty * plan.order.QTY;
            const availableStock =
              plan.stock?.find((s) => s.itemid === bomItem.ItemID)
                ?.stockAkhir || 0;
            const usedQty = needed;
            const stockAfter = availableStock - usedQty;

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
        });
      }

      // Konfirmasi jika ada stok minus
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

      // Kirim ke API
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
          userID: "system", // Gunakan user ID yang sesuai
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

      // Update state secara ATOMIC
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

      // Update semua state dalam satu batch untuk menghindari race condition
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

      // Force refresh UI
      setTimeout(() => {
        forceRefreshUI();
        alert(
          `✅ PO berhasil di-commit!\nCommit ID: ${result.CommitID}\n${materialUsage.length} material di-reserve`,
        );
      }, 100);
    } catch (error: any) {
      console.error(`❌ Gagal commit PO ${plan.order.No_SPK}:`, error);
      alert(`❌ Gagal commit PO: ${error.message || "Unknown error"}`);
    } finally {
      setCommitting(null);
    }
  };

  // FUNGSI: Uncommit PO dari database
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

      // Update state secara ATOMIC
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

      // Force refresh UI
      setTimeout(() => {
        forceRefreshUI();
        alert("✅ PO berhasil di-uncommit! Stok telah dikembalikan.");
      }, 100);
    } catch (error: any) {
      console.error(`❌ Gagal uncommit PO ${plan.order.No_SPK}:`, error);
      alert(`❌ Gagal uncommit PO: ${error.message || "Unknown error"}`);

      // Rollback state jika gagal
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
  // FUNGSI: Reset semua committed PO
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

  // Load BOM dan stok untuk PO gabungan
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

      // Load BOM untuk setiap kode barang
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

      // Jika semua BOM gagal, throw error
      if (Object.keys(combinedBoms).length === 0) {
        throw new Error(
          `Gagal memuat BOM untuk semua kode barang: ${allKodeBarang.join(
            ", ",
          )}`,
        );
      }

      // Hapus duplikat item IDs
      allItemIds = Array.from(new Set(allItemIds));

      // Ambil stok untuk semua item
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

      // Gabungkan semua BOM
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
        // AUTO-REFRESH STOK SAAT BUKA DETAIL
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

    console.log(
      `📊 [PREVIEW] Memulai preview ${selectedOrders.length} PO terpilih`,
    );

const isINJECTIONDepartment = (departemen?: string): boolean => {
  if (!departemen) return false;
  const deptString = String(departemen).trim().toLowerCase().replace(/\s+/g, '');
  return deptString.includes("INJEKSI-BB") || deptString.includes("INJEKSIBB");
};
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

    // Kumpulkan data dari semua PO yang dipilih, FILTER INJEKSI-BB
    for (const order of selectedOrders) {
      if (order.bom && order.stock) {
        // Gunakan fungsi perhitungan untuk export yang sudah memfilter INJEKSI-BB
        let materialNeeds;

        if (order.order.combinedItems && order.order.combinedItems.length > 1) {
          // PO Gabungan
          materialNeeds = calculateMaterialNeedsForCombinedPOForExport(
            order.bom,
            order.order.combinedItems,
            order.stock,
          );
        } else {
          // PO Biasa
          materialNeeds = calculateMaterialNeedsForExport(
            order.bom.flat,
            order.order.QTY,
            order.stock,
          );
        }

        materialNeeds.items.forEach((item: any) => {
          // Double check filter INJEKSI-BB
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

    // Tambahkan info INJEKSI-BB di preview
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
  // ==================== FUNGSI PERHITUNGAN MATERIAL UNTUK EXPORT (TANPA INJEKSI-BB) ====================

  // Perhitungan material needs untuk single PO (tanpa INJEKSI-BB)
  const calculateMaterialNeedsForExport = (
    bom: BomItem[],
    productionQty: number,
    stock: StockItem[] = [],
  ) => {
    if (!bom) return { totalNeeded: 0, totalShortage: 0, items: [] };

    // Filter hanya komponen (Level > 0) dan bukan INJEKSI-BB
    const componentsOnly = filterOnlyComponents(bom).filter((item) => {
      const dept = item.Departemen?.toLowerCase() || "";
      return !dept.includes("INJEKSI-BB");
    });

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

  // Perhitungan material needs untuk PO gabungan (tanpa INJEKSI-BB)
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

    // Hitung kebutuhan untuk setiap PO dalam gabungan
    productionOrders.forEach((po) => {
      let bomForThisItem: BomItem[] = [];

      if (bom.combinedBoms && bom.combinedBoms[po.Kode_Barang]) {
        bomForThisItem = bom.combinedBoms[po.Kode_Barang].flat;
      } else {
        bomForThisItem = bom.flat;
      }

      // Filter hanya komponen (Level > 0) dan bukan INJEKSI-BB
      const componentsOnly = filterOnlyComponents(bomForThisItem).filter(
        (item) => {
          const dept = item.Departemen?.toLowerCase() || "";
          return !dept.includes("INJEKSI-BB");
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
  // ==================== FUNGSI EXPORT SETELAH PREVIEW ====================
  const handleConfirmExport = () => {
    setExportPreview({ isOpen: false, data: null });
    // Panggil fungsi export yang asli
    exportSelectedToExcel();
  };

  // ==================== FUNGSI EXPORT YANG DIPERBAIKI ====================
  const ExportProgress: React.FC<{
    visible: boolean;
    current: number;
    total: number;
    message: string;
  }> = ({ visible, current, total, message }) => {
    if (!visible) return null;

    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(0,0,0,0.9)",
          color: "white",
          padding: "25px",
          borderRadius: "10px",
          zIndex: 10000,
          textAlign: "center",
          minWidth: "350px",
          border: "2px solid #4CAF50",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}
        >
          🚀 Sedang Mengekspor Data...
        </div>
        <div style={{ fontSize: "14px", marginBottom: "15px" }}>
          Exporting Data... 正在导出数据...
        </div>

        {message && (
          <div
            style={{
              fontSize: "12px",
              color: "#4CAF50",
              marginBottom: "10px",
              fontWeight: "bold",
            }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            width: "100%",
            background: "#333",
            borderRadius: "10px",
            marginTop: "15px",
            height: "25px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              background: "linear-gradient(90deg, #4CAF50, #45a049)",
              height: "100%",
              borderRadius: "10px",
              transition: "width 0.5s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {percentage}%
          </div>
        </div>

        <div
          style={{
            marginTop: "10px",
            fontSize: "12px",
            color: "#ccc",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            Progress: {current}/{total}
          </span>
          <span>
            进度: {current}/{total}
          </span>
        </div>

        <div
          style={{
            marginTop: "15px",
            fontSize: "11px",
            color: "#999",
            lineHeight: "1.4",
          }}
        >
          Harap tunggu, proses export sedang berjalan...
          <br />
          Jangan tutup halaman ini selama proses berlangsung
          <br />
          请稍候，导出过程正在进行中...
          <br />
          过程中请勿关闭此页面
        </div>
      </div>
    );
  };

// ==================== FUNGSI BANTU UNTUK PERHITUNGAN LEVEL ====================

// FUNGSI: Hitung Qty terakumulasi untuk setiap level berdasarkan struktur BOM
const calculateAccumulatedQty = (
  bomItem: BomItem,
  bomStructure: BomItem[],
  parentMultiplier: number = 1
): number => {
  // Jika level 0 (produk akhir), qty selalu 1
  if (bomItem.Level === 0) return 1;
  
  // Qty dasar dari item ini
  const baseQty = bomItem.Qty || 0;
  
  // Cari parent item untuk menghitung multiplier
  if (bomItem.Level > 1 && bomItem.ParentItemID) {
    const parentItem = bomStructure.find(item => item.ItemID === bomItem.ParentItemID);
    if (parentItem) {
      // Hitung multiplier rekursif
      const parentMultiplierRecursive = calculateAccumulatedQty(parentItem, bomStructure);
      return baseQty * parentMultiplierRecursive;
    }
  }
  
  // Untuk level 1, langsung kalikan dengan multiplier dari parent (produk akhir)
  return baseQty * parentMultiplier;
};

// FUNGSI: Build struktur BOM dengan parent-child relationship
const buildBomHierarchy = (flatBom: BomItem[]): BomItem[] => {
  if (!flatBom || flatBom.length === 0) return [];
  
  const itemMap = new Map<string, BomItem & { children?: BomItem[] }>();
  const rootItems: (BomItem & { children?: BomItem[] })[] = [];

  // Clone semua item dan tambahkan children property
  flatBom.forEach(item => {
    itemMap.set(item.ItemID, { ...item, children: [] });
  });

  // Bangun hierarki
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

// FUNGSI: Hitung total kebutuhan dengan memperhitungkan level
const calculateLevelBasedNeeds = (
  bomItems: BomItem[],
  productionQty: number,
  stock: StockItem[] = []
): { items: any[]; totalNeeded: number; totalShortage: number } => {
  if (!bomItems || bomItems.length === 0) {
    return { items: [], totalNeeded: 0, totalShortage: 0 };
  }

  // Bangun hierarki BOM
  const bomHierarchy = buildBomHierarchy(bomItems);
  
  // Hitung kebutuhan untuk setiap item dengan multiplier level
  const calculateNeedsRecursive = (
    nodes: BomItem[],
    parentMultiplier: number = 1,
    levelPath: string[] = []
  ): any[] => {
    let items: any[] = [];

    nodes.forEach(node => {
      // Hitung Qty per unit yang sudah dikalikan dengan parent
      const accumulatedQtyPerUnit = calculateAccumulatedQty(node, bomItems, parentMultiplier);
      
      // Total kebutuhan = accumulatedQtyPerUnit * productionQty
      const totalNeeded = accumulatedQtyPerUnit * productionQty;
      
      // Cari stok
      const stockItem = stock.find(s => s.itemid === node.ItemID);
      const availableStock = stockItem?.stockAkhir || 0;
      const shortage = Math.max(0, totalNeeded - availableStock);
      
      items.push({
        ...node,
        Level: node.Level || 0,
        BaseQtyPerUnit: node.Qty || 0, // Qty asli dari BOM
        AccumulatedQtyPerUnit: accumulatedQtyPerUnit, // Qty setelah dikalikan parent
        TotalNeeded: totalNeeded,
        AvailableStock: availableStock,
        Shortage: shortage,
        ParentItemID: node.ParentItemID || null,
        LevelPath: [...levelPath, node.ItemID]
      });

      // Proses children jika ada
      if ((node as any).children && (node as any).children.length > 0) {
        const childItems = calculateNeedsRecursive(
          (node as any).children,
          accumulatedQtyPerUnit, // Multiplier untuk children = accumulatedQtyPerUnit dari parent
          [...levelPath, node.ItemID]
        );
        items = [...items, ...childItems];
      }
    });

    return items;
  };

  const allItems = calculateNeedsRecursive(bomHierarchy, 1);
  
  // Filter hanya komponen (Level > 0)
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

    const selectedOrders = filteredOrders.filter(
      (order) => order.selected && !order.committed
    );

    if (selectedOrders.length === 0) {
      alert("Tidak ada PO yang dipilih untuk di-export! 没有选择要导出的PO!");
      return;
    }

    const wb = XLSX.utils.book_new();

    // ==================== FUNGSI BANTU UNTUK EXPORT ====================
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

    // ==================== WORKSHEET 1: DETAIL PO ====================
    const selectedPOData = selectedOrders.flatMap((order) => {
      const isCombinedPO = order.order.combinedItems && order.order.combinedItems.length > 1;

      if (isCombinedPO) {
        const totalCombinedQty = order.order.combinedItems!.reduce(
          (sum, item) => sum + item.QTY, 0
        );
        
        return order.order.combinedItems!.map((item, idx) => ({
          "No SPK 生产订单号": order.order.No_SPK,
          "Tanggal 日期": order.order.Tanggal_Order,
          "Nama PO 生产订单名称": item.Nama_PO,
          "Kode Barang 物料代码": item.Kode_Barang,
          "QTY per Item 每项数量": item.QTY,
          "QTY Total Gabungan 合并总数量": totalCombinedQty,
          "Jenis 类型": "Bagian PO Gabungan 合并PO部分",
          "Urutan 顺序": idx + 1,
          "Total Items dalam PO 总数": order.order.combinedItems!.length,
          "Catatan 备注": `Gabungan ${order.order.combinedItems!.length} item PO (Total QTY: ${totalCombinedQty})`,
        }));
      } else {
        return [
          {
            "No SPK 生产订单号": order.order.No_SPK,
            "Tanggal 日期": order.order.Tanggal_Order,
            "Nama PO 生产订单名称": order.order.Nama_PO,
            "Kode Barang 物料代码": order.order.Kode_Barang,
            "QTY per Item 每项数量": order.order.QTY,
            "QTY Total Gabungan 合并总数量": order.order.QTY,
            "Jenis 类型": "PO Biasa 普通PO",
            "Urutan 顺序": 1,
            "Total Items dalam PO 总数": 1,
          },
        ];
      }
    });

    const ws1 = XLSX.utils.json_to_sheet(selectedPOData);
    XLSX.utils.book_append_sheet(wb, ws1, "Detail PO PO详情");

    // ==================== WORKSHEET 2: FULL BOM STRUCTURE DENGAN PERHITUNGAN LEVEL ====================
    const fullBomData: any[] = [];
    let totalINJECTIONItemsRemoved = 0;

    // Map untuk menyimpan hierarki BOM per item
    const bomHierarchyMap = new Map<string, BomItem[]>();

    for (const order of selectedOrders) {
      // PERBAIKAN: Tambahkan pengecekan untuk order.bom
      if (!order.bom || !order.stock) {
        console.warn(`⚠️ Order ${order.order.No_SPK} tidak memiliki BOM atau stock, dilewati`);
        continue;
      }

      const isCombinedPO = order.order.combinedItems && order.order.combinedItems.length > 1;

      if (isCombinedPO) {
        for (const combinedItem of order.order.combinedItems!) {
          let bomForThisItem: BomItem[] = [];
          
          // PERBAIKAN: Gunakan optional chaining dan nullish coalescing
          if (order.bom.combinedBoms && order.bom.combinedBoms[combinedItem.Kode_Barang]) {
            bomForThisItem = order.bom.combinedBoms[combinedItem.Kode_Barang].flat;
          } else {
            bomForThisItem = order.bom.flat || [];
          }

          // PERBAIKAN: Skip jika bomForThisItem kosong
          if (!bomForThisItem || bomForThisItem.length === 0) {
            console.warn(`⚠️ Tidak ada BOM untuk item ${combinedItem.Kode_Barang}, dilewati`);
            continue;
          }

          // Bangun hierarki BOM untuk item ini
          bomHierarchyMap.set(combinedItem.Kode_Barang, bomForThisItem);

          // Hitung kebutuhan dengan perhitungan level yang benar
          const levelBasedNeeds = calculateLevelBasedNeeds(
            bomForThisItem,
            combinedItem.QTY,
            order.stock
          );

          levelBasedNeeds.items.forEach((item: any) => {
            // Filter INJEKSI-BB
            if (isINJECTIONDepartment(item.Departemen)) {
              totalINJECTIONItemsRemoved++;
              return;
            }

            // Cari parent item untuk informasi tambahan
            const parentItem = item.ParentItemID 
              ? bomForThisItem.find(bom => bom.ItemID === item.ParentItemID)
              : null;

            fullBomData.push({
              "No SPK 生产订单号": order.order.No_SPK,
              "Sumber PO 来源PO": combinedItem.Kode_Barang,
              "Nama Sumber PO 来源PO名称": combinedItem.Nama_PO,
              "Level 层级": item.Level,
              "Parent Item ID 父项ID": item.ParentItemID || "-",
              "Nama Parent 父项名称": parentItem?.ItemName || "-",
              "Kode Item 物料代码": item.ItemID,
              "Nama Item 物料名称": item.ItemName,
              "Departemen 部门": item.Departemen || "-",
              "Jenis 类别": item.NamaJenis || "-",
              "Base Qty Per Unit 基础每单位数量": item.BaseQtyPerUnit || item.Qty,
              "Accumulated Qty Per Unit 累计每单位数量": item.AccumulatedQtyPerUnit,
              "Multiplier Calculation 乘数计算": 
                item.Level === 0 ? "1 (Produk Akhir 成品)" :
                item.Level === 1 ? `${item.BaseQtyPerUnit} × 1 (Parent: ${combinedItem.Kode_Barang})` :
                `${item.BaseQtyPerUnit} × (Parent Multiplier)`,
              "QTY PO 订单数量": combinedItem.QTY,
              "Total Butuh 总需求": item.TotalNeeded,
              "Stok Tersedia 可用库存": item.AvailableStock,
              "Kekurangan 短缺": item.Shortage,
              "Status 状态": item.Shortage > 0 ? "KURANG 不足" : "CUKUP 充足",
              "Level Path 层级路径": item.LevelPath?.join(" → ") || item.ItemID,
              "INJEKSI-BB Filter 注塑过滤": "DISERTAKAN 已包含",
            });
          });
        }
      } else {
        // PERBAIKAN: Tambahkan pengecekan untuk order.bom.flat
        const bomForThisItem = order.bom.flat || [];
        
        if (bomForThisItem.length === 0) {
          console.warn(`⚠️ Tidak ada BOM untuk PO ${order.order.No_SPK}, dilewati`);
          continue;
        }

        // Bangun hierarki BOM untuk PO biasa
        bomHierarchyMap.set(order.order.Kode_Barang, bomForThisItem);

        // Hitung kebutuhan dengan perhitungan level yang benar
        const levelBasedNeeds = calculateLevelBasedNeeds(
          bomForThisItem,
          order.order.QTY,
          order.stock
        );

        levelBasedNeeds.items.forEach((item: any) => {
          // Filter INJEKSI-BB
          if (isINJECTIONDepartment(item.Departemen)) {
            totalINJECTIONItemsRemoved++;
            return;
          }

          // Cari parent item untuk informasi tambahan
          const parentItem = item.ParentItemID 
            ? bomForThisItem.find(bom => bom.ItemID === item.ParentItemID)
            : null;

          fullBomData.push({
            "No SPK 生产订单号": order.order.No_SPK,
            "Sumber PO 来源PO": order.order.Kode_Barang,
            "Nama Sumber PO 来源PO名称": order.order.Nama_PO,
            "Level 层级": item.Level,
            "Parent Item ID 父项ID": item.ParentItemID || "-",
            "Nama Parent 父项名称": parentItem?.ItemName || "-",
            "Kode Item 物料代码": item.ItemID,
            "Nama Item 物料名称": item.ItemName,
            "Departemen 部门": item.Departemen || "-",
            "Jenis 类别": item.NamaJenis || "-",
            "Base Qty Per Unit 基础每单位数量": item.BaseQtyPerUnit || item.Qty,
            "Accumulated Qty Per Unit 累计每单位数量": item.AccumulatedQtyPerUnit,
            "Multiplier Calculation 乘数计算": 
              item.Level === 0 ? "1 (Produk Akhir 成品)" :
              item.Level === 1 ? `${item.BaseQtyPerUnit} × 1 (Parent: ${order.order.Kode_Barang})` :
              `${item.BaseQtyPerUnit} × (Parent Multiplier)`,
            "QTY PO 订单数量": order.order.QTY,
            "Total Butuh 总需求": item.TotalNeeded,
            "Stok Tersedia 可用库存": item.AvailableStock,
            "Kekurangan 短缺": item.Shortage,
            "Status 状态": item.Shortage > 0 ? "KURANG 不足" : "CUKUP 充足",
            "Level Path 层级路径": item.LevelPath?.join(" → ") || item.ItemID,
            "INJEKSI-BB Filter 注塑过滤": "DISERTAKAN 已包含",
          });
        });
      }
    }

    const ws2 = XLSX.utils.json_to_sheet(fullBomData);
    XLSX.utils.book_append_sheet(wb, ws2, "Full BOM Structure BOM完整结构");

    // ==================== WORKSHEET 3: MATERIAL SUMMARY DENGAN PERHITUNGAN LEVEL ====================
    const materialSummaryData: any[] = [];
    const materialMap = new Map<string, any>();

    // Proses semua item dari fullBomData untuk summary
    fullBomData.forEach((item) => {
      if (isINJECTIONDepartment(item["Departemen 部门"])) {
        return;
      }

      const itemKey = item["Kode Item 物料代码"];
      const existing = materialMap.get(itemKey);

      if (existing) {
        existing["Total Butuh 总需求"] += item["Total Butuh 总需求"];
        existing["Jumlah PO Menggunakan 使用PO数"] += 1;
        
        // Tambahkan sumber PO jika belum ada
        const poSource = `${item["No SPK 生产订单号"]} - ${item["Sumber PO 来源PO"]}`;
        if (!existing["Sumber PO List 来源PO列表"].includes(poSource)) {
          existing["Sumber PO List 来源PO列表"].push(poSource);
        }

        // Update contoh perhitungan multiplier
        if (item["Level 层级"] > 1) {
          existing["Contoh Perhitungan Level 层级计算示例"] = 
            `Level ${item["Level 层级"]}: ${item["Base Qty Per Unit 基础每单位数量"]} × Parent Multiplier = ${item["Accumulated Qty Per Unit 累计每单位数量"]}`;
        }
      } else {
        materialMap.set(itemKey, {
          "Kode Item 物料代码": item["Kode Item 物料代码"],
          "Nama Item 物料名称": item["Nama Item 物料名称"],
          "Departemen 部门": item["Departemen 部门"],
          "Level 层级": item["Level 层级"],
          "Base Qty Per Unit 基础每单位数量": item["Base Qty Per Unit 基础每单位数量"],
          "Accumulated Qty Per Unit 累计每单位数量": item["Accumulated Qty Per Unit 累计每单位数量"],
          "Contoh Perhitungan 计算示例": item["Multiplier Calculation 乘数计算"],
          "Total Butuh 总需求": item["Total Butuh 总需求"],
          "Stok Tersedia 可用库存": item["Stok Tersedia 可用库存"],
          "Kekurangan 短缺": item["Kekurangan 短缺"],
          "Status 状态": item["Status 状态"],
          "Jumlah PO Menggunakan 使用PO数": 1,
          "Sumber PO List 来源PO列表": [`${item["No SPK 生产订单号"]} - ${item["Sumber PO 来源PO"]}`],
        });
      }
    });

    // Konversi map ke array dan format untuk export
    materialMap.forEach((value) => {
      materialSummaryData.push({
        ...value,
        "Sumber PO List 来源PO列表": value["Sumber PO List 来源PO列表"].join(", "),
        "Perhitungan Akhir 最终计算": 
          value["Level 层级"] === 1 
            ? `${value["Base Qty Per Unit 基础每单位数量"]} × QTY PO = ${value["Total Butuh 总需求"]}`
            : `${value["Accumulated Qty Per Unit 累计每单位数量"]} × QTY PO = ${value["Total Butuh 总需求"]}`,
      });
    });

    const ws3 = XLSX.utils.json_to_sheet(materialSummaryData);
    XLSX.utils.book_append_sheet(wb, ws3, "Material Summary 物料汇总");

    // ==================== WORKSHEET 4: LEVEL BREAKDOWN DETAIL ====================
    const levelBreakdownData: any[] = [];

    // Analisis per level untuk memahami struktur perkalian
    const levelAnalysis = new Map<number, { count: number; examples: string[] }>();

    fullBomData.forEach((item) => {
      if (isINJECTIONDepartment(item["Departemen 部门"])) return;

      const level = item["Level 层级"];
      const existing = levelAnalysis.get(level) || { count: 0, examples: [] };
      
      existing.count++;
      if (existing.examples.length < 3) {
        existing.examples.push(
          `${item["Kode Item 物料代码"]}: ${item["Multiplier Calculation 乘数计算"]}`
        );
      }
      
      levelAnalysis.set(level, existing);

      // Tambahkan detail breakdown
      if (item["Level 层级"] > 0) {
        levelBreakdownData.push({
          "Level 层级": item["Level 层级"],
          "Kode Item 物料代码": item["Kode Item 物料代码"],
          "Nama Item 物料名称": item["Nama Item 物料名称"],
          "Base Qty 基础数量": item["Base Qty Per Unit 基础每单位数量"],
          "Accumulated Qty 累计数量": item["Accumulated Qty Per Unit 累计每单位数量"],
          "Multiplier Factor 乘数因子": 
            item["Level 层级"] === 1 
              ? "1 (Langsung dari produk akhir 直接从成品)"
              : `Parent Accumulated Qty (${item["Accumulated Qty Per Unit 累计每单位数量"]} ÷ ${item["Base Qty Per Unit 基础每单位数量"]})`,
          "Perhitungan 计算": 
            item["Level 层级"] === 1 
              ? `${item["Base Qty Per Unit 基础每单位数量"]} × 1 = ${item["Accumulated Qty Per Unit 累计每单位数量"]}`
              : `${item["Base Qty Per Unit 基础每单位数量"]} × Parent Qty = ${item["Accumulated Qty Per Unit 累计每单位数量"]}`,
          "Total Butuh 总需求": item["Total Butuh 总需求"],
          "Contoh 示例": item["Multiplier Calculation 乘数计算"],
        });
      }
    });

    const ws4 = XLSX.utils.json_to_sheet(levelBreakdownData);
    XLSX.utils.book_append_sheet(wb, ws4, "Level Breakdown 层级细分");

    // ==================== WORKSHEET 5: EXPORT SUMMARY DENGAN INFO LEVEL ====================
    const exportSummaryData = [
      {
        "Parameter 参数": "Total PO Diexport 总导出PO数",
        "Nilai 值": selectedOrders.length,
      },
      {
        "Parameter 参数": "Total Item PO 总PO项目数",
        "Nilai 值": selectedPOData.length,
      },
      {
        "Parameter 参数": "Total BOM Items 总BOM项目数",
        "Nilai 值": fullBomData.length,
      },
      {
        "Parameter 参数": "PO tanpa BOM 无BOM的PO",
        "Nilai 值": selectedOrders.filter(o => !o.bom).length,
      },
      {
        "Parameter 参数": "INJEKSI-BB Items Dihapus 注塑项目删除数",
        "Nilai 值": totalINJECTIONItemsRemoved,
      },
      {
        "Parameter 参数": "Level Distribution 层级分布",
        "Nilai 值": Array.from(levelAnalysis.entries())
          .map(([level, data]) => `Level ${level}: ${data.count} items`)
          .join("; "),
      },
      {
        "Parameter 参数": "Perhitungan Level 2+ 二级以上计算",
        "Nilai 值": "✓ Qty Level 2 = Base Qty × Parent Accumulated Qty 二级数量 = 基础数量 × 父项累计数量",
      },
      {
        "Parameter 参数": "Contoh Perhitungan 计算示例",
        "Nilai 值": levelAnalysis.get(2)?.examples[0] || "Tidak ada Level 2 items 无二级项目",
      },
      {
        "Parameter 参数": "Tanggal Export 导出日期",
        "Nilai 值": new Date().toLocaleDateString("id-ID"),
      },
    ];

    const ws5 = XLSX.utils.json_to_sheet(exportSummaryData);
    XLSX.utils.book_append_sheet(wb, ws5, "Export Summary 导出总结");

    // Generate filename
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `Production_Export_Level_Calculation_${timestamp}_${selectedOrders.length}.xlsx`;

    // Generate Excel file
    XLSX.writeFile(wb, filename);

    setTimeout(() => {
      setExportProgress({
        visible: false,
        current: 0,
        total: 0,
        message: "",
      });

      // Tampilkan contoh perhitungan dalam alert
      const level2Example = fullBomData.find(item => item["Level 层级"] === 2);
      const exampleMsg = level2Example 
        ? `\n\n📊 Contoh Perhitungan Level 2 二级计算示例:\n` +
          `Item: ${level2Example["Kode Item 物料代码"]}\n` +
          `Base Qty: ${level2Example["Base Qty Per Unit 基础每单位数量"]}\n` +
          `Parent Multiplier: ${level2Example["Accumulated Qty Per Unit 累计每单位数量"] / level2Example["Base Qty Per Unit 基础每单位数量"]}\n` +
          `Accumulated Qty: ${level2Example["Accumulated Qty Per Unit 累计每单位数量"]}\n` +
          `Total Butuh: ${level2Example["Total Butuh 总需求"]}`
        : "";

      alert(
        `✅ Export berhasil! (Dengan perhitungan Level)\nFile: ${filename}\n\n` +
          `Total PO: ${selectedOrders.length}\n` +
          `PO tanpa BOM: ${selectedOrders.filter(o => !o.bom).length}\n` +
          `Total BOM Items: ${fullBomData.length}\n` +
          `INJEKSI-BB Items Dihapus: ${totalINJECTIONItemsRemoved}\n` +
          `Material Summary Items: ${materialSummaryData.length}\n` +
          exampleMsg
      );
    }, 1000);
  } catch (error) {
    console.error("❌ [EXPORT] Error dalam export:", error);
    alert("Gagal mengekspor data. Silakan coba lagi. 导出失败，请重试");
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

    // PERBAIKAN: Hitung material needs dengan mempertimbangkan PO gabungan
    const materialNeeds = useMemo(() => {
      if (!plan.bom || !plan.stock) return null;

      if (isCombinedPO && plan.order.combinedItems) {
        // Untuk PO gabungan, hitung per item dan gabungkan
        return calculateMaterialNeedsForCombinedPO(
          plan.bom,
          plan.order.combinedItems, // Kirim semua item gabungan
          plan.stock,
        );
      } else {
        // Untuk PO biasa
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
        <tr
          className={`border-b ${
            plan.expanded ? "bg-blue-50" : "bg-white"
          } hover:bg-gray-50 ${plan.committed ? "bg-green-50" : ""} ${
            isCombinedPO ? "bg-purple-50 border-l-4 border-l-purple-500" : ""
          } ${isStokUpdated ? "border-r-4 border-r-green-500" : ""}`}
        >
          <td className="px-4 py-3 text-center">
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={plan.selected}
                onChange={() => toggleSelection(index)}
                disabled={plan.loadingBom || plan.committed}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              {plan.loadingBom && (
                <div className="ml-2 w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          </td>
          <td className="px-4 py-3 text-center">
            <button
              onClick={() =>
                toggleOrder(
                  index,
                  plan.order.Kode_Barang,
                  plan.order.Tanggal_Order,
                )
              }
              disabled={plan.loading}
              className={`w-8 h-8 rounded-full font-bold text-white ${
                plan.expanded ? "bg-red-500" : "bg-green-500"
              } hover:opacity-80 disabled:opacity-50 relative`}
            >
              {plan.loading ? "⋯" : plan.expanded ? "−" : "+"}
              {isCombinedPO && (
                <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {combinedCount}
                </span>
              )}
            </button>
          </td>
          <td className="px-4 py-3 font-mono text-sm">
            <div className="flex items-center gap-2">
              {plan.order.No_SPK}
              {isCombinedPO && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                  {combinedCount} PO Digabung 合并PO
                </span>
              )}
              {plan.CommitID && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  ID: {plan.CommitID}
                </span>
              )}
              {isStokUpdated && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  ✅ Stok Terbaru 最新库存
                </span>
              )}
            </div>
          </td>
          <td className="px-4 py-3 text-sm">{plan.order.Tanggal_Order}</td>
          <td className="px-4 py-3 text-sm">
            <div>
              {plan.order.Nama_PO}
              {isCombinedPO && plan.order.combinedItems && (
                <div className="text-xs text-gray-500 mt-1">
                  {plan.order.combinedItems.slice(0, 2).map((item, idx) => (
                    <div key={idx}>
                      • {item.Nama_PO} (QTY: {item.QTY})
                    </div>
                  ))}
                  {plan.order.combinedItems.length > 2 && (
                    <div>
                      • ... dan {plan.order.combinedItems.length - 2} lainnya
                      及其他
                    </div>
                  )}
                </div>
              )}
            </div>
          </td>
          <td className="px-4 py-3 font-mono text-sm">
            {plan.order.Kode_Barang}
            {isCombinedPO && plan.order.combinedItems && (
              <div className="text-xs text-gray-500 mt-1">
                Kode 代码:{" "}
                {plan.order.combinedItems
                  .map((item) => item.Kode_Barang)
                  .join(" | ")}
              </div>
            )}
          </td>
          {/* PERBAIKAN: Tampilkan QTY sesuai tipe PO */}
          <td className="px-4 py-3 text-right font-bold">
            <div>
              {isCombinedPO ? (
                <>
                  <span className="text-purple-600">Gabungan 合并</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {plan.order.combinedItems?.map((item, idx) => (
                      <div key={idx}>
                        {item.Kode_Barang}: {item.QTY.toLocaleString()}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                plan.order.QTY.toLocaleString()
              )}
            </div>
          </td>

          <td className="px-4 py-3 text-center">
            {plan.committed ? (
              <div className="flex flex-col items-center gap-1">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                  ✓ Committed 已提交
                </span>
                {plan.CommitID && (
                  <div className="text-xs text-gray-500">
                    ID: {plan.CommitID}
                  </div>
                )}
                <Button
                  onClick={() => uncommitPO(index)}
                  className="text-xs text-red-600 hover:text-red-800"
                  variant="outline"
                >
                  Uncommit 取消提交
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => commitPO(index)}
                  disabled={committing === plan.order.No_SPK || !plan.bom}
                  className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1"
                >
                  {committing === plan.order.No_SPK ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Committing... 提交中...
                    </>
                  ) : (
                    "Commit PO 提交PO"
                  )}
                </button>

                {/* Tampilkan info material */}
                {materialNeeds && (
                  <div className="text-xs text-gray-600 text-center">
                    <div>{materialNeeds.items.length} materials 物料</div>
                    <div
                      className={`font-bold ${
                        hasShortage ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {materialNeeds.items.filter((i) => i.shortage > 0).length}{" "}
                      kurang 不足
                    </div>
                  </div>
                )}
              </div>
            )}
          </td>
          <td
            className={`px-4 py-3 text-center font-bold ${
              hasShortage ? "text-red-600 bg-red-50" : "text-green-600"
            }`}
          >
            {materialNeeds ? (
              <div className="flex flex-col items-center">
                <span
                  className={hasShortage ? "text-red-600" : "text-green-600"}
                >
                  {hasShortage
                    ? `Kurang ${materialNeeds.totalShortage.toLocaleString()} 短缺`
                    : "Stok Cukup 库存充足"}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {isStokUpdated
                    ? "✅ Stok Terbaru 最新库存"
                    : "🔄 Perlu Refresh 需要刷新"}
                </span>
              </div>
            ) : plan.bom ? (
              <span className="text-gray-500">-</span>
            ) : (
              <span className="text-gray-400">Belum load BOM 未加载BOM</span>
            )}
          </td>
        </tr>

        {plan.expanded && plan.bom && plan.stock && (
          <tr>
            <td colSpan={9} className="bg-gray-50 p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-300">
                  <div>
                    <h4 className="font-bold text-lg">
                      📊 Detail BOM - {plan.order.Kode_Barang}
                      {plan.committed && (
                        <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                          ✓ Committed 已提交{" "}
                          {plan.CommitID && `(ID: ${plan.CommitID})`}
                        </span>
                      )}
                      {isCombinedPO && (
                        <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                          {combinedCount} PO Digabung 合并PO
                        </span>
                      )}
                      {plan.stockLastUpdated && (
                        <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                          ✅ Stok Terbaru 最新库存
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600">
                      SPK: {plan.order.No_SPK} | PO: {plan.order.Nama_PO} |
                      {isCombinedPO ? (
                        <span>
                          {" "}
                          Qty per Item sesuai PO asli 根据原始PO的项目数量
                          <span className="text-purple-600 font-medium">
                            {" "}
                            ({combinedCount} PO Gabungan 合并PO)
                          </span>
                        </span>
                      ) : (
                        <span>
                          {" "}
                          Qty: {plan.order.QTY.toLocaleString()} unit 单位
                        </span>
                      )}{" "}
                      | Stok per 库存日期: {plan.order.Tanggal_Order}
                      {plan.stockLastUpdated && (
                        <span className="text-green-600 font-medium">
                          {" "}
                          | Stok diperbarui 库存更新:{" "}
                          {new Date(plan.stockLastUpdated).toLocaleString(
                            "id-ID",
                          )}
                        </span>
                      )}
                    </p>

                    {/* Tampilkan detail QTY per item untuk PO gabungan */}
                    {isCombinedPO && plan.order.combinedItems && (
                      <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                        <p className="text-xs text-purple-700 font-medium">
                          Detail QTY per Item 每个项目数量详情:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                          {plan.order.combinedItems.map((item, idx) => (
                            <div key={idx} className="text-xs text-purple-600">
                              • {item.Kode_Barang}: {item.QTY} unit
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs text-blue-700">
                        <strong>Info Stok Real-time 实时库存信息:</strong> Stok
                        yang ditampilkan adalah data terbaru. Perubahan stok
                        karena produksi atau pembelian akan langsung terlihat
                        saat refresh.
                        <br />
                        显示的库存是最新数据。由于生产或采购引起的库存变化在刷新时会立即显示。
                      </p>
                    </div>

                    {plan.error && (
                      <p className="text-sm text-red-600 mt-1">
                        ⚠️ {plan.error}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => refreshStockForPlan(index)}
                      disabled={plan.loading}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                    >
                      {plan.loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Loading... 加载中...
                        </>
                      ) : (
                        "🔄 Refresh Stok 刷新库存"
                      )}
                    </button>

                    {!plan.committed && (
                      <button
                        onClick={() => commitPO(index)}
                        disabled={committing === plan.order.No_SPK}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
                      >
                        {committing === plan.order.No_SPK ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Committing... 提交中...
                          </>
                        ) : (
                          "🔒 Commit PO 提交PO"
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => toggleViewMode(index)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        plan.viewMode === "table"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      Table View 表格视图
                    </button>
                    <button
                      onClick={() => toggleViewMode(index)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        plan.viewMode === "tree"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      Tree View 树状视图
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="font-bold text-blue-600">
                      Total Item 总项目数
                    </div>
                    <div className="text-2xl font-bold">
                      {materialNeeds?.items.length || 0}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="font-bold text-green-600">
                      Stok Cukup 库存充足
                    </div>
                    <div className="text-2xl font-bold">
                      {materialNeeds?.items.filter((i) => i.shortage === 0)
                        .length || 0}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="font-bold text-red-600">
                      Stok Kurang 库存不足
                    </div>
                    <div className="text-2xl font-bold">
                      {materialNeeds?.items.filter((i) => i.shortage > 0)
                        .length || 0}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="font-bold text-yellow-600">
                      Total Kekurangan 总短缺
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {materialNeeds?.totalShortage.toLocaleString() || 0}
                    </div>
                  </div>
                </div>

                {/* Tampilkan detail per item untuk PO Gabungan */}
                {isCombinedPO && plan.order.combinedItems && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h5 className="font-bold text-purple-800 mb-3">
                      📊 Perhitungan per Item PO Gabungan 合并PO分项计算:
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {plan.order.combinedItems.map((item, idx) => {
                        const itemMaterialNeeds =
                          plan.bom && plan.stock
                            ? calculateMaterialNeedsForCombinedPO(
                                plan.bom,
                                [item],
                                plan.stock,
                              )
                            : null;

                        return (
                          <div
                            key={idx}
                            className="bg-white p-3 rounded border"
                          >
                            <div className="font-bold text-purple-700">
                              {item.Kode_Barang}
                            </div>
                            <div className="text-sm text-gray-600">
                              {item.Nama_PO}
                            </div>
                            <div className="text-sm font-medium mt-1">
                              QTY: {item.QTY.toLocaleString()} unit 单位
                            </div>
                            {itemMaterialNeeds && (
                              <div className="text-xs mt-2">
                                <div className="flex justify-between">
                                  <span>Total Kebutuhan 总需求:</span>
                                  <span className="font-bold">
                                    {itemMaterialNeeds.totalNeeded.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Kekurangan 短缺:</span>
                                  <span
                                    className={`font-bold ${
                                      itemMaterialNeeds.totalShortage > 0
                                        ? "text-red-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    {itemMaterialNeeds.totalShortage.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
              </div>
            </td>
          </tr>
        )}
      </>
    );
  };

  // ==================== FUNGSI PAGINATION ====================

  const Pagination = () => {
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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm text-gray-600">
          Menampilkan {startIndex}-{endIndex} dari {filteredOrders.length} data
          显示 {startIndex}-{endIndex} 条，共 {filteredOrders.length} 条数据
          {searchQuery && (
            <span className="text-blue-600 ml-2">
              (Hasil pencarian untuk {searchQuery} 搜索结果)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-gray-600">
              Items per page 每页项目数:
            </span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>

          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Previous 上一页
          </button>

          <div className="flex gap-1">
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`w-8 h-8 rounded text-sm ${
                  currentPage === page
                    ? "bg-blue-500 text-white"
                    : "border border-gray-300 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Next 下一页
          </button>
        </div>
      </div>
    );
  };

  // ==================== USE EFFECT ====================

  // useEffect(() => {
  //   refreshAllData();
  // }, [refreshAllData]);

  // // Sinkronkan setiap kali committedPOs berubah
  // useEffect(() => {
  //   if (committedPOs.length > 0 || orders.length > 0) {
  //     syncCommitStatus();
  //   }
  // }, [committedPOs, orders.length, syncCommitStatus]);
  // Ganti useEffect yang ada dengan ini:
  useEffect(() => {
    refreshAllData();
  }, []); // Empty dependency array, hanya dijalankan sekali saat mount

  useEffect(() => {
    if (committedPOs.length > 0) {
      syncCommitStatus();
    }
  }, [committedPOs, syncCommitStatus]); // Hanya jalankan saat committedPOs berubah
  // Statistik untuk penggabungan PO
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                🏭 Production Planning 生产计划
              </h1>
              <p className="text-gray-600">
                Kelola rencana produksi 管理生产计划
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={refreshAllData}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50"
              >
                {loading
                  ? "Memuat... 加载中..."
                  : "🔄 Refresh Semua Data 刷新所有数据"}
              </button>

              {/* Tombol Export */}
              <div className="flex gap-2">
                <ExportProgress
                  visible={exportProgress.visible}
                  current={exportProgress.current}
                  total={exportProgress.total}
                  message={exportProgress.message}
                />

                {/* Tombol Preview Export */}
                <button
                  onClick={previewExport}
                  disabled={exportLoading}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {exportLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Loading... 加载中...
                    </>
                  ) : (
                    "👁️ Preview Export 预览导出"
                  )}
                </button>

                {/* Tombol Export Langsung */}
                <button
                  onClick={exportSelectedToExcel}
                  disabled={exportLoading}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {exportLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Exporting... 导出中...
                    </>
                  ) : (
                    "✅ Export to Excel 导出到Excel"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Modal Preview Export */}
          <ExportPreviewModal
            previewData={exportPreview.data}
            isOpen={exportPreview.isOpen}
            onClose={() => setExportPreview({ isOpen: false, data: null })}
            onConfirmExport={handleConfirmExport}
            exportLoading={exportLoading}
          />

          {/* Panel Committed POs */}
          <CommittedPOsPanel
            committedPOs={committedPOs}
            stockReservations={stockReservations}
            onRefresh={loadCommittedPOs}
          />

          {/* Pencarian PO */}
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 mb-6">
            <h3 className="font-bold text-lg text-indigo-800 mb-4">
              🔍 Pencarian PO 搜索PO
            </h3>
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cari berdasarkan No SPK, Nama PO, atau Kode Barang
                  根据生产订单号、PO名称或物料代码搜索
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Masukkan kata kunci pencarian... 输入搜索关键词..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600"
                    >
                      Clear 清除
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  * Pencarian akan mencari di semua field: No SPK, Nama PO, dan
                  Kode Barang
                  <br />* 搜索将在所有字段中进行：生产订单号、PO名称和物料代码
                </p>
              </div>
            </div>
          </div>

          {/* Kontrol Commit PO */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-orange-800">
                  🔒 Kontrol Commit PO (Database) PO提交控制(数据库)
                </h3>
                <p className="text-orange-700 text-sm">
                  • Commit PO akan menyimpan data ke database dan reserve stok
                  提交PO将保存数据到数据库并预留库存
                  <br />
                  • Stok yang di-reserve tidak bisa digunakan oleh PO lain
                  预留库存不能被其他PO使用
                  <br />
                  • Data commit tersimpan permanen dan bisa dilacak
                  提交数据永久保存并可追踪
                  <br />• Uncommit akan mengembalikan stok yang di-reserve
                  取消提交将退回预留库存
                </p>
              </div>
              <div className="flex gap-4 items-center">
                <div className="text-sm text-orange-800">
                  <strong>
                    {
                      committedPOs.filter((po) => po.status === "COMMITTED")
                        .length
                    }
                  </strong>{" "}
                  PO aktif di-commit 活跃提交PO
                </div>
                <button
                  onClick={resetCommittedPOs}
                  disabled={
                    committedPOs.filter((po) => po.status === "COMMITTED")
                      .length === 0
                  }
                  className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
                >
                  Reset All Commit 重置所有提交
                </button>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-yellow-800">
                  🎯 Kontrol Selection & Refresh Stok 选择控制和库存刷新
                </h3>
                <p className="text-yellow-700 text-sm">
                  • Centang PO yang ingin dilihat detail BOM-nya
                  勾选要查看BOM详情的PO
                  <br />
                  • Stok diperbarui otomatis saat buka detail atau manual
                  refresh 打开详情或手动刷新时自动更新库存
                  <br />• Data stok real-time dari database tanpa API tambahan
                  来自数据库的实时库存数据，无需额外API
                </p>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex gap-2">
                  <button
                    onClick={toggleSelectAll}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600"
                  >
                    Select Page 选择当前页
                  </button>
                  <button
                    onClick={toggleSelectAllGlobal}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600"
                  >
                    Select All 全选
                  </button>
                </div>
                <div className="text-sm text-yellow-800">
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
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
            <h3 className="font-bold text-lg mb-4">
              🔍 Filter Berdasarkan Tanggal 基于日期筛选
            </h3>
            <div className="flex gap-4 items-end flex-wrap">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai 开始日期
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={dateFilter.startDate}
                  onChange={handleDateFilterChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Akhir 结束日期
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={dateFilter.endDate}
                  onChange={handleDateFilterChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={applyDateFilter}
                  disabled={loading}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? "Memuat... 加载中..." : "Terapkan Filter 应用筛选"}
                </button>
                <button
                  onClick={resetDateFilter}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600"
                >
                  Reset Filter 重置筛选
                </button>
              </div>
              <div className="text-sm text-gray-600">
                Menampilkan 显示: {filteredOrders.length} PO
                {dateFilter.startDate && ` dari ${dateFilter.startDate} 从`}
                {dateFilter.endDate && ` sampai ${dateFilter.endDate} 到`}
                {searchQuery && (
                  <span className="text-blue-600">
                    {" "}
                    (Hasil pencarian 搜索结果)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-blue-600 font-bold">Total Order 总订单</div>
              <div className="text-2xl font-bold">{filteredOrders.length}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-green-600 font-bold">Terpilih 已选择</div>
              <div className="text-2xl font-bold">
                {
                  filteredOrders.filter((p) => p.selected && !p.committed)
                    .length
                }
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-yellow-600 font-bold">
                Sudah Load BOM 已加载BOM
              </div>
              <div className="text-2xl font-bold">
                {filteredOrders.filter((p) => p.bom).length}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-orange-600 font-bold">Committed 已提交</div>
              <div className="text-2xl font-bold">
                {filteredOrders.filter((p) => p.committed).length}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-red-600 font-bold">
                Bisa Di-commit 可提交
              </div>
              <div className="text-2xl font-bold">
                {filteredOrders.filter((p) => p.bom && !p.committed).length}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-purple-600 font-bold">
                PO Digabung 合并PO
              </div>
              <div className="text-2xl font-bold">
                {combinedStats.combinedCount}
              </div>
              <div className="text-xs text-purple-600">
                {combinedStats.saving} data dihemat 节省数据
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-green-600 font-bold">
                Stok Real-time 实时库存
              </div>
              <div className="text-2xl font-bold">
                {filteredOrders.filter((p) => p.stockLastUpdated).length}
              </div>
              <div className="text-xs text-green-600">
                PO dengan stok terbaru 有最新库存的PO
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-lg font-bold mb-2">
              Memuat data produksi... 加载生产数据中...
            </div>
            <div className="text-gray-600">Harap tunggu sebentar 请稍候</div>
          </div>
        )}

        {!loading && filteredOrders.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse">
                  <thead className="bg-gray-800 text-white">
                    <tr>
                      <th className="px-4 py-3 text-center w-12">Pilih 选择</th>
                      <th className="px-4 py-3 text-center w-12">#</th>
                      <th className="px-4 py-3 text-left">No SPK 生产订单号</th>
                      <th className="px-4 py-3 text-left">Tanggal 日期</th>
                      <th className="px-4 py-3 text-left">
                        Nama PO 生产订单名称
                      </th>
                      <th className="px-4 py-3 text-left">
                        Kode Barang 物料代码
                      </th>
                      <th className="px-4 py-3 text-right">QTY 数量</th>
                      <th className="px-4 py-3 text-center">Commit 提交</th>
                      <th className="px-4 py-3 text-center">
                        Status Stok 库存状态
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((plan, index) => (
                      <OrderRow key={index} plan={plan} index={index} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination />
          </>
        )}

        {!loading && filteredOrders.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              {searchQuery
                ? "Tidak ada data produksi yang sesuai dengan pencarian 没有符合搜索条件的生产数据"
                : "Tidak ada data produksi 没有生产数据"}
            </h3>
            <p className="text-gray-500">
              {searchQuery
                ? `Tidak ditemukan PO dengan kata kunci "${searchQuery}" 未找到包含关键词"${searchQuery}"的PO`
                : dateFilter.startDate || dateFilter.endDate
                  ? "Tidak ada data sesuai filter tanggal yang dipilih 没有符合所选日期筛选条件的数据"
                  : "Data order produksi tidak ditemukan 未找到生产订单数据"}
            </p>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600"
              >
                Tampilkan Semua PO 显示所有PO
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
