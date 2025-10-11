// app/production-plan/page.tsx
"use client";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ==================== TIPE DATA ====================
interface ProductionOrder {
  No_SPK: string;
  Tanggal_Order: string;
  Nama_PO: string;
  Kode_Barang: string;
  QTY: number;
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
}

interface ProductionPlan {
  order: ProductionOrder;
  bom?: {
    flat: BomItem[];
    tree: BomItem[];
  };
  expanded: boolean;
  loading: boolean;
  selected: boolean;
  loadingBom: boolean;
  stock?: StockItem[];
  error?: string;
  viewMode: "table" | "tree";
}

// ==================== TIPE DATA UNTUK EXPORT ====================
interface MaterialRequirement {
  itemId: string;
  itemName: string;
  totalNeeded: number;
  availableStock: number;
  shortage: number;
  status: string;
  poList: string[];
  poDetails: {
    poId: string;
    poName: string;
    needed: number;
    productionQty: number;
  }[];
}

// ==================== KOMPONEN BOM TREE ====================
const SimpleBomTree: React.FC<{
  treeData: BomItem[];
  productionQty: number;
  stock: StockItem[];
  orderDate: string;
}> = ({ treeData, productionQty, stock, orderDate }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

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
                    <span className="mr-3">Dept: {node.Departemen}</span>
                  )}
                  {node.NamaJenis && (
                    <span className="mr-3">Jenis: {node.NamaJenis}</span>
                  )}
                  <span>Level: {node.Level}</span>
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
            <div className="flex-1 font-bold">Struktur BOM (Tree View)</div>
          </div>
          <div className="text-xs text-gray-300">
            Stok per tanggal: {orderDate}
          </div>
        </div>
        <div className="flex items-center text-sm mt-2">
          <div className="w-8 flex-shrink-0"></div>
          <div className="flex-1 font-bold"></div>
          <div className="flex items-center gap-4 mr-4">
            <div className="text-right font-bold">Per Unit</div>
            <div className="text-right font-bold">Butuh</div>
            <div className="text-right font-bold">Stok</div>
            <div className="text-right font-bold">Status</div>
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
          <span>Total Nodes: {treeData.length}</span>
          <span>Expanded: {expandedNodes.size} nodes</span>
          <div className="flex gap-4">
            <button
              onClick={() => {
                const firstLevelIds = treeData.map((node) => node.ItemID);
                setExpandedNodes(new Set(firstLevelIds));
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Expand All
            </button>
            <button
              onClick={() => setExpandedNodes(new Set())}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProductionPlanPage() {
  const [orders, setOrders] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  // State untuk filter tanggal
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });

  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ==================== FUNGSI PAGINATION ====================

  // Hitung data untuk pagination
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return orders.slice(startIndex, endIndex);
  }, [orders, currentPage, itemsPerPage]);

  // Hitung total halaman
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  // Fungsi untuk ganti halaman
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Fungsi untuk ganti items per page
  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset ke halaman pertama saat mengubah items per page
  };

  // ==================== FUNGSI UTAMA ====================

  // FUNGSI: Ambil stok untuk SATU item berdasarkan stored procedure
  const fetchStockForItem = async (
    itemId: string,
    orderDate: string
  ): Promise<StockItem | null> => {
    try {
      console.log(`🔍 [fetchStockForItem] Mengambil stok untuk: ${itemId}`);
      console.log(`📅 [fetchStockForItem] Tanggal: ${orderDate}`);

      if (!itemId) {
        console.log("⚠️ [fetchStockForItem] Item ID tidak diberikan");
        return null;
      }

      if (!orderDate) {
        orderDate = new Date().toISOString().split("T")[0];
      }

      // PERBAIKAN: Gunakan parameter SESUAI stored procedure
      const apiUrl = `/api/stock/ppic?tgl1=${orderDate}&tgl2=${orderDate}&loc=%25&periodeR=201905&kategori=%25&itemid=${encodeURIComponent(
        itemId
      )}`;

      console.log("📡 [fetchStockForItem] API URL:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ [fetchStockForItem] Response error:",
          response.status,
          errorText
        );
        throw new Error(`Gagal mengambil data stok: ${response.status}`);
      }

      const result = await response.json();
      console.log(`📦 [fetchStockForItem] Response untuk ${itemId}:`, result);

      if (!result.success) {
        throw new Error(result.error || "Gagal mengambil data stok");
      }

      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        // Cari item yang sesuai dengan itemId yang diminta
        interface StockApiItem {
          KodeBarang: string;
          NamaBarang?: string;
          SaldoAkhir: string | number;
        }
        const itemData = result.data.find(
          (item: StockApiItem) => item.KodeBarang === itemId
        );
        if (itemData) {
          const stockAkhir = parseFloat(itemData.SaldoAkhir) || 0;
          console.log(
            `✅ [fetchStockForItem] ${itemId}: SaldoAkhir = ${stockAkhir}`
          );

          return {
            itemid: itemData.KodeBarang,
            itemname: itemData.NamaBarang || itemData.KodeBarang,
            stockAkhir: stockAkhir,
          };
        } else {
          console.warn(
            `⚠️ [fetchStockForItem] Item ${itemId} tidak ditemukan dalam response`
          );
          return {
            itemid: itemId,
            itemname: itemId,
            stockAkhir: 0,
          };
        }
      } else {
        console.warn(
          `⚠️ [fetchStockForItem] Data tidak ditemukan untuk ${itemId}`
        );
        return {
          itemid: itemId,
          itemname: itemId,
          stockAkhir: 0,
        };
      }
    } catch (err: unknown) {
      console.error(`❌ [fetchStockForItem] Error untuk ${itemId}:`, err);
      return {
        itemid: itemId,
        itemname: itemId,
        stockAkhir: 0,
      };
    }
  };

  // FUNGSI: Ambil stok untuk multiple items (satu per satu)
  const fetchStockForItems = async (
    itemIds: string[],
    orderDate: string
  ): Promise<StockItem[]> => {
    console.log(
      `🔍 [fetchStockForItems] Mengambil stok untuk ${itemIds.length} items`
    );

    const stockData: StockItem[] = [];

    for (const itemId of itemIds) {
      const stockItem = await fetchStockForItem(itemId, orderDate);
      if (stockItem) {
        stockData.push(stockItem);
      }

      // Delay kecil untuk tidak membebani server
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`✅ [fetchStockForItems] Selesai: ${stockData.length} items`);

    // Log hasil stok
    stockData.forEach((item) => {
      console.log(`📊 ${item.itemid}: ${item.stockAkhir}`);
    });

    return stockData;
  };

  // Load BOM dan stok
  const loadBomWithStock = async (
    index: number,
    kodeBarang: string,
    orderDate: string
  ) => {
    try {
      setOrders((prev) =>
        prev.map((item, i) => (i === index ? { ...item, loading: true } : item))
      );

      console.log(`📦 [loadBomWithStock] Loading BOM untuk ${kodeBarang}`);

      // Ambil data BOM
      const bomResponse = await axios.get(
        `/api/bom/ppic?itemid=${encodeURIComponent(kodeBarang)}`
      );

      console.log(`✅ [loadBomWithStock] BOM diterima:`, bomResponse.data);

      // Ambil semua item IDs dari BOM
      const itemIds = bomResponse.data.flat.map((item: BomItem) => item.ItemID);
      console.log(`📋 [loadBomWithStock] Item IDs dari BOM:`, itemIds);

      // Ambil stok untuk semua items satu per satu
      const stockData = await fetchStockForItems(itemIds, orderDate);

      setOrders((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                bom: bomResponse.data,
                stock: stockData,
                loading: false,
                expanded: true,
                viewMode: "table", // Default view mode
              }
            : item
        )
      );

      console.log(`✅ [loadBomWithStock] Selesai untuk ${kodeBarang}`);
    } catch (err: unknown) {
      console.error(`❌ [loadBomWithStock] Error untuk ${kodeBarang}:`, err);
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
            : item
        )
      );
    }
  };

  // Load BOM untuk PO yang dipilih (untuk export)
  const loadBomForSelectedOrders = async (selectedOrders: ProductionPlan[]) => {
    const ordersWithBom = [...selectedOrders];

    for (let i = 0; i < ordersWithBom.length; i++) {
      const order = ordersWithBom[i];
      if (!order.bom && !order.loading) {
        try {
          console.log(
            `📦 Loading BOM untuk export: ${order.order.Kode_Barang}`
          );

          const bomResponse = await axios.get(
            `/api/bom/ppic?itemid=${encodeURIComponent(
              order.order.Kode_Barang
            )}`
          );

          const itemIds = bomResponse.data.flat.map(
            (item: BomItem) => item.ItemID
          );
          const stockData = await fetchStockForItems(
            itemIds,
            order.order.Tanggal_Order
          );

          ordersWithBom[i] = {
            ...order,
            bom: bomResponse.data,
            stock: stockData,
          };

          // Delay untuk tidak membebani server
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (err) {
          console.error(
            `❌ Gagal load BOM untuk ${order.order.Kode_Barang}:`,
            err
          );
        }
      }
    }

    return ordersWithBom;
  };

  // Perhitungan material needs untuk single PO
  const calculateMaterialNeeds = (
    bom: BomItem[],
    productionQty: number,
    stock: StockItem[] = []
  ) => {
    if (!bom) return { totalNeeded: 0, totalShortage: 0, items: [] };

    let totalNeeded = 0;
    let totalShortage = 0;
    const items = bom.map((item) => {
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

  // ==================== FUNGSI EXPORT TO EXCEL ====================

  const exportToExcel = async () => {
    try {
      setExportLoading(true);

      // Ambil semua PO yang dipilih (dari semua halaman)
      const selectedPlans = orders.filter((plan) => plan.selected);

      if (selectedPlans.length === 0) {
        alert("Pilih minimal satu PO untuk di-export!");
        return;
      }

      console.log(`📊 Mengexport ${selectedPlans.length} PO ke Excel`);

      // Load BOM untuk PO yang dipilih tapi belum load BOM
      const plansWithBom = await loadBomForSelectedOrders(selectedPlans);

      // Filter hanya yang berhasil load BOM
      const validPlans = plansWithBom.filter((plan) => plan.bom);

      if (validPlans.length === 0) {
        alert(
          "Tidak ada PO yang berhasil load BOM. Pastikan PO sudah expand dan BOM berhasil di-load."
        );
        return;
      }

      console.log(`✅ ${validPlans.length} PO berhasil load BOM`);

      // Kumpulkan semua kebutuhan material dari semua PO yang dipilih
      const materialRequirements = new Map<string, MaterialRequirement>();

      validPlans.forEach((plan) => {
        if (plan.bom?.flat && plan.stock) {
          plan.bom.flat.forEach((bomItem) => {
            const needed = bomItem.Qty * plan.order.QTY;
            const availableStock =
              plan.stock?.find((s) => s.itemid === bomItem.ItemID)
                ?.stockAkhir || 0;

            if (materialRequirements.has(bomItem.ItemID)) {
              // Jika item sudah ada, tambahkan kebutuhan
              const existing = materialRequirements.get(bomItem.ItemID)!;
              existing.totalNeeded += needed;
              existing.poList.push(plan.order.No_SPK);
              existing.poDetails.push({
                poId: plan.order.No_SPK,
                poName: plan.order.Nama_PO,
                needed: needed,
                productionQty: plan.order.QTY,
              });
            } else {
              // Jika item baru, buat entry baru
              materialRequirements.set(bomItem.ItemID, {
                itemId: bomItem.ItemID,
                itemName: bomItem.ItemName,
                totalNeeded: needed,
                availableStock: availableStock,
                shortage: Math.max(0, needed - availableStock),
                status: needed > availableStock ? "KURANG" : "CUKUP",
                poList: [plan.order.No_SPK],
                poDetails: [
                  {
                    poId: plan.order.No_SPK,
                    poName: plan.order.Nama_PO,
                    needed: needed,
                    productionQty: plan.order.QTY,
                  },
                ],
              });
            }
          });
        }
      });

      // Update shortage dan status untuk semua item
      materialRequirements.forEach((requirement) => {
        requirement.shortage = Math.max(
          0,
          requirement.totalNeeded - requirement.availableStock
        );
        requirement.status = requirement.shortage > 0 ? "KURANG" : "CUKUP";
      });

      // Konversi ke array untuk Excel
      const requirementsArray = Array.from(materialRequirements.values());

      // Urutkan berdasarkan shortage terbesar
      requirementsArray.sort((a, b) => b.shortage - a.shortage);

      // Siapkan data untuk Excel
      const excelData = requirementsArray.map((req, index) => ({
        No: index + 1,
        "Kode Item": req.itemId,
        "Nama Item": req.itemName,
        "Total Kebutuhan": req.totalNeeded,
        "Stok Tersedia": req.availableStock,
        Kekurangan: req.shortage,
        Status: req.status,
        "Jumlah PO": req.poList.length,
        "List PO": req.poList.join(", "),
        Keterangan:
          req.shortage > 0 ? `BUTUH ${req.shortage} UNIT` : "STOK CUKUP",
      }));

      // Buat worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const columnWidths = [
        { wch: 5 }, // No
        { wch: 15 }, // Kode Item
        { wch: 40 }, // Nama Item
        { wch: 15 }, // Total Kebutuhan
        { wch: 15 }, // Stok Tersedia
        { wch: 12 }, // Kekurangan
        { wch: 10 }, // Status
        { wch: 10 }, // Jumlah PO
        { wch: 30 }, // List PO
        { wch: 20 }, // Keterangan
      ];
      worksheet["!cols"] = columnWidths;

      // Buat workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Kebutuhan Material Terakumulasi"
      );

      // Sheet detail per PO
      interface DetailDataRow {
        "No SPK": string;
        Tanggal: string;
        "Nama PO": string;
        "Kode Barang": string;
        "QTY PO": number;
        "Kode Item": string;
        "Nama Item": string;
        "Qty Per Unit": number;
        Kebutuhan: number;
        "Stok Tersedia": number;
        Kekurangan: number;
        Status: string;
      }
      const detailData: DetailDataRow[] = [];
      validPlans.forEach((plan) => {
        if (plan.bom?.flat) {
          plan.bom.flat.forEach((bomItem) => {
            const needed = bomItem.Qty * plan.order.QTY;
            const availableStock =
              plan.stock?.find((s) => s.itemid === bomItem.ItemID)
                ?.stockAkhir || 0;
            const shortage = Math.max(0, needed - availableStock);

            detailData.push({
              "No SPK": plan.order.No_SPK,
              Tanggal: plan.order.Tanggal_Order,
              "Nama PO": plan.order.Nama_PO,
              "Kode Barang": plan.order.Kode_Barang,
              "QTY PO": plan.order.QTY,
              "Kode Item": bomItem.ItemID,
              "Nama Item": bomItem.ItemName,
              "Qty Per Unit": bomItem.Qty,
              Kebutuhan: needed,
              "Stok Tersedia": availableStock,
              Kekurangan: shortage,
              Status: shortage > 0 ? "KURANG" : "CUKUP",
            });
          });
        }
      });

      const detailWorksheet = XLSX.utils.json_to_sheet(detailData);
      const detailColumnWidths = [
        { wch: 12 }, // No SPK
        { wch: 12 }, // Tanggal
        { wch: 20 }, // Nama PO
        { wch: 15 }, // Kode Barang
        { wch: 8 }, // QTY PO
        { wch: 15 }, // Kode Item
        { wch: 30 }, // Nama Item
        { wch: 12 }, // Qty Per Unit
        { wch: 12 }, // Kebutuhan
        { wch: 15 }, // Stok Tersedia
        { wch: 12 }, // Kekurangan
        { wch: 10 }, // Status
      ];
      detailWorksheet["!cols"] = detailColumnWidths;
      XLSX.utils.book_append_sheet(workbook, detailWorksheet, "Detail Per PO");

      // Sheet summary PO
      const summaryData = validPlans.map((plan, index) => ({
        No: index + 1,
        "No SPK": plan.order.No_SPK,
        Tanggal: plan.order.Tanggal_Order,
        "Nama PO": plan.order.Nama_PO,
        "Kode Barang": plan.order.Kode_Barang,
        "QTY PO": plan.order.QTY,
        Status: plan.bom ? "BOM Loaded" : "No BOM",
      }));

      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Summary PO");

      // Export file
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const dataBlob = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });

      const fileName = `Laporan_Kebutuhan_Material_${validPlans.length}_PO_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      saveAs(dataBlob, fileName);
      console.log(`✅ Export berhasil: ${fileName}`);
    } catch (error) {
      console.error("❌ Error dalam export:", error);
      alert("Terjadi error saat mengexport data. Silakan coba lagi.");
    } finally {
      setExportLoading(false);
    }
  };

  // ==================== FUNGSI EVENT HANDLER ====================

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

      console.log("📡 [fetchOrders] Mengambil data orders:", url);
      const response = await axios.get<ProductionOrder[]>(url);

      const productionPlans: ProductionPlan[] = response.data.map((order) => ({
        order: { ...order, QTY: order.QTY || 0 },
        expanded: false,
        loading: false,
        selected: false,
        loadingBom: false,
        viewMode: "table", // Default view mode
      }));

      setOrders(productionPlans);
      setCurrentPage(1); // Reset ke halaman pertama saat data baru dimuat
      console.log(
        `✅ [fetchOrders] Data orders berhasil diambil: ${productionPlans.length} orders`
      );
    } catch (err: unknown) {
      console.error("❌ [fetchOrders] Error mengambil data SPK:", err);
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
    console.log("🔍 [applyDateFilter] Menerapkan filter:", dateFilter);
    fetchOrders(dateFilter.startDate, dateFilter.endDate);
  };

  const resetDateFilter = () => {
    console.log("🔄 [resetDateFilter] Reset filter");
    setDateFilter({ startDate: "", endDate: "" });
    fetchOrders();
  };

  const toggleOrder = (
    index: number,
    kodeBarang: string,
    orderDate: string
  ) => {
    const globalIndex = (currentPage - 1) * itemsPerPage + index;
    const order = orders[globalIndex];

    if (order.expanded) {
      setOrders((prev) =>
        prev.map((item, i) =>
          i === globalIndex ? { ...item, expanded: false } : item
        )
      );
    } else {
      if (!order.bom && !order.loading) {
        console.log(`▶️ [toggleOrder] Expand dan load BOM untuk ${kodeBarang}`);
        loadBomWithStock(globalIndex, kodeBarang, orderDate);
      } else {
        console.log(`▶️ [toggleOrder] Expand existing BOM untuk ${kodeBarang}`);
        setOrders((prev) =>
          prev.map((item, i) =>
            i === globalIndex ? { ...item, expanded: true } : item
          )
        );
      }
    }
  };

  const toggleSelection = async (index: number) => {
    const globalIndex = (currentPage - 1) * itemsPerPage + index;
    const order = orders[globalIndex];
    const newSelected = !order.selected;

    console.log(
      `✓ [toggleSelection] Toggle selection untuk ${order.order.Kode_Barang}: ${newSelected}`
    );

    if (newSelected && !order.bom && !order.loadingBom) {
      setOrders((prev) =>
        prev.map((item, i) =>
          i === globalIndex ? { ...item, loadingBom: true } : item
        )
      );

      try {
        const bomResponse = await axios.get(
          `/api/bom/ppic?itemid=${encodeURIComponent(order.order.Kode_Barang)}`
        );

        const itemIds = bomResponse.data.flat.map(
          (item: BomItem) => item.ItemID
        );
        const stockData = await fetchStockForItems(
          itemIds,
          order.order.Tanggal_Order
        );

        setOrders((prev) =>
          prev.map((item, i) =>
            i === globalIndex
              ? {
                  ...item,
                  bom: bomResponse.data,
                  stock: stockData,
                  selected: newSelected,
                  loadingBom: false,
                  viewMode: "table",
                }
              : item
          )
        );
      } catch (err: unknown) {
        console.error(`❌ [toggleSelection] Error loading BOM:`, err);
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
              : item
          )
        );
      }
    } else {
      setOrders((prev) =>
        prev.map((item, i) =>
          i === globalIndex ? { ...item, selected: newSelected } : item
        )
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
          : item
      )
    );
  };

  const toggleSelectAll = () => {
    const allSelected = paginatedOrders.every((order) => order.selected);
    const newSelected = !allSelected;

    console.log(
      `✓ [toggleSelectAll] Select all di halaman ${currentPage}: ${newSelected}`
    );

    setOrders((prev) =>
      prev.map((order, index) => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        if (index >= startIndex && index < endIndex) {
          return { ...order, selected: newSelected };
        }
        return order;
      })
    );
  };

  const toggleSelectAllGlobal = () => {
    const allSelected = orders.every((order) => order.selected);
    const newSelected = !allSelected;

    console.log(`✓ [toggleSelectAllGlobal] Select all global: ${newSelected}`);

    setOrders((prev) =>
      prev.map((order) => ({ ...order, selected: newSelected }))
    );
  };

  // ==================== KOMPONEN BOM TABLE VIEW ====================

  const BomTableView: React.FC<{
    bom: BomItem[];
    productionQty: number;
    stock: StockItem[];
    orderDate: string;
  }> = ({ bom, productionQty, stock, orderDate }) => {
    const materialNeeds = calculateMaterialNeeds(bom, productionQty, stock);

    return (
      <div className="border border-gray-300 rounded-lg bg-white">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-300 flex justify-between items-center">
          <h4 className="font-bold">Daftar Bahan (Table View)</h4>
          <span className="text-sm text-gray-600">
            Stok per tanggal: {orderDate}
          </span>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-200 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left">Kode Item</th>
                <th className="px-4 py-2 text-left">Nama Item</th>
                <th className="px-4 py-2 text-left">Departemen</th>
                <th className="px-4 py-2 text-left">Jenis</th>
                <th className="px-4 py-2 text-right">Per Unit</th>
                <th className="px-4 py-2 text-right">Butuh</th>
                <th className="px-4 py-2 text-right">Stok Tersedia</th>
                <th className="px-4 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {materialNeeds.items.map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-4 py-2 text-sm font-mono">{item.ItemID}</td>
                  <td className="px-4 py-2 text-sm">{item.ItemName}</td>
                  <td className="px-4 py-2 text-sm">
                    {item.Departemen || "-"}
                  </td>
                  <td className="px-4 py-2 text-sm">{item.NamaJenis || "-"}</td>
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
                      : "Cukup"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-100 px-4 py-2 border-t border-gray-300 text-xs text-gray-600">
          Total: {bom.length} items | Butuh:{" "}
          {materialNeeds.totalNeeded.toLocaleString()} | Kekurangan:{" "}
          <span className="font-bold text-red-600">
            {materialNeeds.totalShortage.toLocaleString()}
          </span>
        </div>
      </div>
    );
  };

  // ==================== KOMPONEN ORDER ROW ====================

  const OrderRow = ({
    plan,
    index,
  }: {
    plan: ProductionPlan;
    index: number;
  }) => {
    const materialNeeds =
      plan.bom && plan.stock
        ? calculateMaterialNeeds(plan.bom.flat, plan.order.QTY, plan.stock)
        : null;
    const hasShortage = (materialNeeds?.totalShortage ?? 0) > 0;

    return (
      <>
        <tr
          className={`border-b ${
            plan.expanded ? "bg-blue-50" : "bg-white"
          } hover:bg-gray-50`}
        >
          <td className="px-4 py-3 text-center">
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={plan.selected}
                onChange={() => toggleSelection(index)}
                disabled={plan.loadingBom}
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
                  plan.order.Tanggal_Order
                )
              }
              disabled={plan.loading}
              className={`w-8 h-8 rounded-full font-bold text-white ${
                plan.expanded ? "bg-red-500" : "bg-green-500"
              } hover:opacity-80 disabled:opacity-50`}
            >
              {plan.loading ? "⋯" : plan.expanded ? "−" : "+"}
            </button>
          </td>

          <td className="px-4 py-3 font-mono text-sm">{plan.order.No_SPK}</td>
          <td className="px-4 py-3 text-sm">{plan.order.Tanggal_Order}</td>
          <td className="px-4 py-3 text-sm">{plan.order.Nama_PO}</td>
          <td className="px-4 py-3 font-mono text-sm">
            {plan.order.Kode_Barang}
          </td>
          <td className="px-4 py-3 text-right font-bold">
            {plan.order.QTY.toLocaleString()}
          </td>
          <td
            className={`px-4 py-3 text-center font-bold ${
              hasShortage ? "text-red-600 bg-red-50" : "text-green-600"
            }`}
          >
            {materialNeeds ? (
              hasShortage ? (
                `Kurang ${materialNeeds.totalShortage.toLocaleString()}`
              ) : (
                "Stok Cukup"
              )
            ) : plan.bom ? (
              <span className="text-gray-500">-</span>
            ) : (
              <span className="text-gray-400">Belum load BOM</span>
            )}
          </td>
        </tr>

        {plan.expanded && plan.bom && plan.stock && (
          <tr>
            <td colSpan={8} className="bg-gray-50 p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-300">
                  <div>
                    <h4 className="font-bold text-lg">
                      📊 Detail BOM - {plan.order.Kode_Barang}
                    </h4>
                    <p className="text-sm text-gray-600">
                      SPK: {plan.order.No_SPK} | PO: {plan.order.Nama_PO} | Qty:{" "}
                      {plan.order.QTY.toLocaleString()} unit | Stok per:{" "}
                      {plan.order.Tanggal_Order}
                    </p>
                    {plan.error && (
                      <p className="text-sm text-red-600 mt-1">
                        ⚠️ {plan.error}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleViewMode(index)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        plan.viewMode === "table"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      Table View
                    </button>
                    <button
                      onClick={() => toggleViewMode(index)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        plan.viewMode === "tree"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      Tree View
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="font-bold text-blue-600">Total Item</div>
                    <div className="text-2xl font-bold">
                      {plan.bom.flat.length}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="font-bold text-green-600">Stok Cukup</div>
                    <div className="text-2xl font-bold">
                      {
                        materialNeeds?.items.filter((i) => i.shortage === 0)
                          .length
                      }
                    </div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="font-bold text-red-600">Stok Kurang</div>
                    <div className="text-2xl font-bold">
                      {
                        materialNeeds?.items.filter((i) => i.shortage > 0)
                          .length
                      }
                    </div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="font-bold text-yellow-600">
                      Total Kekurangan
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {materialNeeds?.totalShortage.toLocaleString()}
                    </div>
                  </div>
                </div>

                {plan.viewMode === "table" ? (
                  <BomTableView
                    bom={plan.bom.flat}
                    productionQty={plan.order.QTY}
                    stock={plan.stock}
                    orderDate={plan.order.Tanggal_Order}
                  />
                ) : (
                  <SimpleBomTree
                    treeData={plan.bom.tree}
                    productionQty={plan.order.QTY}
                    stock={plan.stock}
                    orderDate={plan.order.Tanggal_Order}
                  />
                )}
              </div>
            </td>
          </tr>
        )}
      </>
    );
  };

  // ==================== KOMPONEN PAGINATION ====================

  const Pagination = () => {
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, orders.length);

    // Generate page numbers to show
    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;

      let startPage = Math.max(
        1,
        currentPage - Math.floor(maxVisiblePages / 2)
      );
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      // Adjust start page if we're near the end
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
          Menampilkan {startIndex}-{endIndex} dari {orders.length} data
        </div>

        <div className="flex items-center gap-2">
          {/* Items per page selector */}
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-gray-600">Items per page:</span>
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

          {/* Previous button */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Previous
          </button>

          {/* Page numbers */}
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

          {/* Next button */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // ==================== USE EFFECT ====================

  useEffect(() => {
    fetchOrders();
  }, []);

  // ==================== RENDER COMPONENT ====================

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                🏭 Production Planning
              </h1>
              <p className="text-gray-600">
                Kelola rencana produksi dan kebutuhan material dengan BOM Tree
                View
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => fetchOrders()}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? "Memuat..." : "📋 Refresh Data"}
              </button>
              <button
                onClick={exportToExcel}
                disabled={
                  exportLoading || orders.filter((p) => p.selected).length === 0
                }
                className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
              >
                {exportLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Exporting...
                  </>
                ) : (
                  "📊 Export to Excel"
                )}
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-yellow-800">
                  🎯 Kontrol Selection
                </h3>
                <p className="text-yellow-700 text-sm">
                  Centang PO yang ingin diexport. Export akan mencakup SEMUA PO
                  yang dicentang dari SEMUA halaman. Gunakan tombol Tree/Table
                  View untuk beralih tampilan BOM.
                </p>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex gap-2">
                  <button
                    onClick={toggleSelectAll}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600"
                  >
                    Select Page
                  </button>
                  <button
                    onClick={toggleSelectAllGlobal}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600"
                  >
                    Select All
                  </button>
                </div>
                <div className="text-sm text-yellow-800">
                  <strong>{orders.filter((p) => p.selected).length}</strong>{" "}
                  dari <strong>{orders.length}</strong> PO terpilih
                  {orders.filter((p) => p.selected && p.bom).length > 0 && (
                    <span>
                      {" "}
                      ({orders.filter((p) => p.selected && p.bom).length} sudah
                      load BOM)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
            <h3 className="font-bold text-lg mb-4">
              🔍 Filter Berdasarkan Tanggal
            </h3>
            <div className="flex gap-4 items-end flex-wrap">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai
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
                  Tanggal Akhir
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
                  {loading ? "Memuat..." : "Terapkan Filter"}
                </button>
                <button
                  onClick={resetDateFilter}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600"
                >
                  Reset Filter
                </button>
              </div>
              <div className="text-sm text-gray-600">
                Menampilkan: {orders.length} PO
                {dateFilter.startDate && ` dari ${dateFilter.startDate}`}
                {dateFilter.endDate && ` sampai ${dateFilter.endDate}`}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-blue-600 font-bold">Total Order</div>
              <div className="text-2xl font-bold">{orders.length}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-green-600 font-bold">Terpilih</div>
              <div className="text-2xl font-bold">
                {orders.filter((p) => p.selected).length}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-yellow-600 font-bold">Sudah Load BOM</div>
              <div className="text-2xl font-bold">
                {orders.filter((p) => p.bom).length}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-red-600 font-bold">Siap Export</div>
              <div className="text-2xl font-bold">
                {orders.filter((p) => p.selected && p.bom).length}
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
              Memuat data produksi...
            </div>
            <div className="text-gray-600">Harap tunggu sebentar</div>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">Pilih</th>
                    <th className="px-4 py-3 text-center w-12">#</th>
                    <th className="px-4 py-3 text-left">No SPK</th>
                    <th className="px-4 py-3 text-left">Tanggal</th>
                    <th className="px-4 py-3 text-left">Nama PO</th>
                    <th className="px-4 py-3 text-left">Kode Barang</th>
                    <th className="px-4 py-3 text-right">QTY</th>
                    <th className="px-4 py-3 text-center">Status Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((plan, index) => (
                    <OrderRow key={index} plan={plan} index={index} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            <Pagination />
          </>
        )}

        {!loading && orders.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              Tidak ada data produksi
            </h3>
            <p className="text-gray-500">
              {dateFilter.startDate || dateFilter.endDate
                ? "Tidak ada data sesuai filter tanggal yang dipilih"
                : "Data order produksi tidak ditemukan"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
