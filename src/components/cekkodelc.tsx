/* eslint-disable @typescript-eslint/no-unused-vars */
// components/cekkodelc.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

interface Item {
  ItemID: string;
  ItemName: string;
  ItemNameBuy: string;
  warna: string;
  Mark: string;
  KodeJenis: string;
  SatuanKecil: string;
  Spec: string;
  NamaJenis: string;
  UserName: string;
  UserDateTime: string;
  BaseItemID: string;
  IsLC: number;
}

interface FinishedGood {
  FinishedGoodID: string;
  FinishedGoodName: string;
  FinishedGoodBuyName: string;
  Unit: string;
  KodeJenis: string;
  JenisBarang: string;
  QuantityUsed: number;
  TransID: number;
  CreatedDate: string;
}

interface ItemPair {
  baseItemId: string;
  lcItem: Item | null;
  nonLcItem: Item | null;
  itemName: string;
  warna: string;
  satuan: string;
  jenis: string;
  bomComparison?: BomComparisonResult;
}

interface BomComparisonResult {
  hasLcBom: boolean;
  hasNonLcBom: boolean;
  commonBom: FinishedGood[];
  lcOnlyBom: FinishedGood[];
  nonLcOnlyBom: FinishedGood[];
  totalCommon: number;
  totalLcOnly: number;
  totalNonLcOnly: number;
  bomMatch: boolean;
}

interface BomTreeData {
  TransID: number;
  ItemidHD: string;
  itemnamehd: string;
  ItemID: string;
  ItemName: string;
  BahanQty: number;
  Departemen: string;
  KodeJenis: string;
}

// New interface for finished goods filter
interface FinishedGoodsFilter {
  finishedGoodId: string;
  finishedGoodName: string;
  itemIds: string[];
  itemNames: string[];
  totalUsage: number;
}

export default function CekKodeLC() {
  const [allItemPairs, setAllItemPairs] = useState<ItemPair[]>([]);
  const [filteredItemPairs, setFilteredItemPairs] = useState<ItemPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [bomData, setBomData] = useState<{ [key: string]: FinishedGood[] }>({});
  const [bomLoading, setBomLoading] = useState<{ [key: string]: boolean }>({});
  const [selectedItemForBom, setSelectedItemForBom] = useState<string | null>(
    null
  );
  const [bomComparisonLoading, setBomComparisonLoading] = useState<{
    [key: string]: boolean;
  }>({});

  const [exportLoading, setExportLoading] = useState(false);
  const [showOnlyMatchingBom, setShowOnlyMatchingBom] = useState(false);

  // New state for finished goods filter
  const [showFinishedGoodsFilter, setShowFinishedGoodsFilter] = useState(false);
  const [selectedFinishedGood, setSelectedFinishedGood] = useState<string>("");
  const [finishedGoodsFilterData, setFinishedGoodsFilterData] = useState<
    FinishedGoodsFilter[]
  >([]);
  const [finishedGoodsLoading, setFinishedGoodsLoading] = useState(false);

  const containsRJ = useCallback((item: Item | null): boolean => {
    if (!item) return false;
    return (
      item.ItemID.toUpperCase().endsWith("RJ") ||
      item.ItemID.toUpperCase().includes("-RJ") ||
      item.ItemID.toUpperCase().includes("_RJ")
    );
  }, []);

  const pairContainsRJ = useCallback(
    (pair: ItemPair): boolean => {
      return containsRJ(pair.lcItem) || containsRJ(pair.nonLcItem);
    },
    [containsRJ]
  );

  const compareBom = useCallback(
    (
      lcBom: FinishedGood[] = [],
      nonLcBom: FinishedGood[] = []
    ): BomComparisonResult => {
      const lcBomIds = new Set(lcBom.map((item) => item.FinishedGoodID));
      const nonLcBomIds = new Set(nonLcBom.map((item) => item.FinishedGoodID));

      const commonBom = lcBom.filter((lcItem) =>
        nonLcBom.some(
          (nonLcItem) => nonLcItem.FinishedGoodID === lcItem.FinishedGoodID
        )
      );

      const lcOnlyBom = lcBom.filter(
        (item) => !nonLcBomIds.has(item.FinishedGoodID)
      );
      const nonLcOnlyBom = nonLcBom.filter(
        (item) => !lcBomIds.has(item.FinishedGoodID)
      );

      return {
        hasLcBom: lcBom.length > 0,
        hasNonLcBom: nonLcBom.length > 0,
        commonBom,
        lcOnlyBom,
        nonLcOnlyBom,
        totalCommon: commonBom.length,
        totalLcOnly: lcOnlyBom.length,
        totalNonLcOnly: nonLcOnlyBom.length,
        bomMatch:
          lcBom.length === nonLcBom.length && commonBom.length === lcBom.length,
      };
    },
    []
  );

  const fetchBomData = useCallback(
    async (itemId: string): Promise<FinishedGood[]> => {
      if (bomData[itemId]) {
        return bomData[itemId];
      }

      setBomLoading((prev) => ({ ...prev, [itemId]: true }));

      try {
        const response = await axios.get<FinishedGood[]>(
          `/api/bom/v2?itemId=${encodeURIComponent(itemId)}`
        );
        const data = response.data || [];
        setBomData((prev) => ({ ...prev, [itemId]: data }));
        return data;
      } catch (err) {
        console.error(`Error fetching BOM v2 for ${itemId}:`, err);
        setBomData((prev) => ({ ...prev, [itemId]: [] }));
        return [];
      } finally {
        setBomLoading((prev) => ({ ...prev, [itemId]: false }));
      }
    },
    [bomData]
  );

  const compareBomForPair = useCallback(
    async (pair: ItemPair): Promise<BomComparisonResult> => {
      const [lcBom, nonLcBom] = await Promise.all([
        pair.lcItem ? fetchBomData(pair.lcItem.ItemID) : Promise.resolve([]),
        pair.nonLcItem
          ? fetchBomData(pair.nonLcItem.ItemID)
          : Promise.resolve([]),
      ]);

      return compareBom(lcBom, nonLcBom);
    },
    [fetchBomData, compareBom]
  );

  // New function to load finished goods filter data
  const loadFinishedGoodsFilterData = useCallback(async () => {
    setFinishedGoodsLoading(true);
    try {
      // Collect all unique finished goods from bomData
      const allFinishedGoods: Map<string, FinishedGoodsFilter> = new Map();

      Object.entries(bomData).forEach(([itemId, finishedGoods]) => {
        const item = allItemPairs.find(
          (pair) =>
            pair.lcItem?.ItemID === itemId || pair.nonLcItem?.ItemID === itemId
        );

        finishedGoods.forEach((fg) => {
          if (!allFinishedGoods.has(fg.FinishedGoodID)) {
            allFinishedGoods.set(fg.FinishedGoodID, {
              finishedGoodId: fg.FinishedGoodID,
              finishedGoodName: fg.FinishedGoodName,
              itemIds: [itemId],
              itemNames: [item?.itemName || itemId],
              totalUsage: fg.QuantityUsed,
            });
          } else {
            const existing = allFinishedGoods.get(fg.FinishedGoodID)!;
            if (!existing.itemIds.includes(itemId)) {
              existing.itemIds.push(itemId);
              existing.itemNames.push(item?.itemName || itemId);
              existing.totalUsage += fg.QuantityUsed;
            }
          }
        });
      });

      const result = Array.from(allFinishedGoods.values()).sort((a, b) =>
        a.finishedGoodId.localeCompare(b.finishedGoodId)
      );

      setFinishedGoodsFilterData(result);
    } catch (error) {
      console.error("Error loading finished goods filter data:", error);
    } finally {
      setFinishedGoodsLoading(false);
    }
  }, [bomData, allItemPairs]);

  const fetchData = useCallback(
    async (searchQuery: string = "") => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get<Item[]>(`/api/master/items`, {
          params: { search: searchQuery },
        });

        const pairedItems = pairLcAndNonLcItems(response.data);

        const filteredItems = pairedItems.filter(
          (pair) => pair.lcItem !== null && !pairContainsRJ(pair)
        );

        setAllItemPairs(filteredItems);
        setFilteredItemPairs(filteredItems);
        setCurrentPage(1);
      } catch (err) {
        setError(axios.isAxiosError(err) ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [pairContainsRJ]
  );

  const pairLcAndNonLcItems = (items: Item[]): ItemPair[] => {
    const pairsMap = new Map<string, ItemPair>();

    items.forEach((item) => {
      const baseId = item.BaseItemID;

      if (!pairsMap.has(baseId)) {
        pairsMap.set(baseId, {
          baseItemId: baseId,
          lcItem: null,
          nonLcItem: null,
          itemName: item.ItemName,
          warna: item.warna,
          satuan: item.SatuanKecil,
          jenis: item.NamaJenis,
        });
      }

      const pair = pairsMap.get(baseId)!;

      if (item.IsLC) {
        pair.lcItem = item;
      } else {
        pair.nonLcItem = item;
      }

      pair.itemName = item.ItemName;
      pair.warna = item.warna;
      pair.satuan = item.SatuanKecil;
      pair.jenis = item.NamaJenis;
    });

    return Array.from(pairsMap.values());
  };

  const exportToExcel = useCallback(async () => {
    try {
      setExportLoading(true);

      const exportData = filteredItemPairs.map((pair) => ({
        "Kode Dasar": pair.baseItemId,
        "Kode LC": pair.lcItem?.ItemID || "-",
        "Kode Non-LC": pair.nonLcItem?.ItemID || "-",
        "Nama Barang": pair.itemName,
        Warna: pair.warna || "-",
        Jenis: pair.jenis,
        Satuan: pair.satuan,
        "Status Item": pair.lcItem && pair.nonLcItem ? "Lengkap" : "Hanya LC",
        "Status BOM": pair.bomComparison
          ? pair.bomComparison.bomMatch
            ? "Sama Persis"
            : pair.bomComparison.totalCommon > 0
            ? "Ada Kesamaan"
            : "Berbeda"
          : "Belum Dicek",
        "BOM Sama": pair.bomComparison?.totalCommon || 0,
        "BOM Hanya LC": pair.bomComparison?.totalLcOnly || 0,
        "BOM Hanya Non-LC": pair.bomComparison?.totalNonLcOnly || 0,
        "Memiliki BOM LC": pair.bomComparison?.hasLcBom ? "Ya" : "Tidak",
        "Memiliki BOM Non-LC": pair.bomComparison?.hasNonLcBom ? "Ya" : "Tidak",
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      XLSX.utils.book_append_sheet(wb, ws, "Data Barang LC dengan BOM");

      const fileName = `Data_Barang_LC_BOM_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error saat mengexport data ke Excel");
    } finally {
      setExportLoading(false);
    }
  }, [filteredItemPairs]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      if (term.trim()) {
        const filtered = allItemPairs.filter(
          (pair) =>
            pair.baseItemId.toLowerCase().includes(term.toLowerCase()) ||
            pair.itemName.toLowerCase().includes(term.toLowerCase()) ||
            pair.lcItem?.ItemID.toLowerCase().includes(term.toLowerCase()) ||
            pair.nonLcItem?.ItemID.toLowerCase().includes(term.toLowerCase())
        );
        setFilteredItemPairs(filtered);
      } else {
        setFilteredItemPairs(allItemPairs);
      }
      setCurrentPage(1);
    }, 300);

    setSearchTimeout(timeout);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setFilteredItemPairs(allItemPairs);
    setCurrentPage(1);
  };

  // Filter items based on selected finished good
  const filteredByFinishedGood = useMemo(() => {
    if (!selectedFinishedGood) return allItemPairs;

    return allItemPairs.filter((pair) => {
      const lcBom = pair.lcItem ? bomData[pair.lcItem.ItemID] : [];
      const nonLcBom = pair.nonLcItem ? bomData[pair.nonLcItem.ItemID] : [];

      const hasInLcBom = lcBom?.some(
        (fg) => fg.FinishedGoodID === selectedFinishedGood
      );
      const hasInNonLcBom = nonLcBom?.some(
        (fg) => fg.FinishedGoodID === selectedFinishedGood
      );

      return hasInLcBom || hasInNonLcBom;
    });
  }, [selectedFinishedGood, allItemPairs, bomData]);

  useEffect(() => {
    let filtered = selectedFinishedGood ? filteredByFinishedGood : allItemPairs;

    if (showOnlyMatchingBom) {
      filtered = filtered.filter(
        (pair) => pair.bomComparison && pair.bomComparison.totalCommon > 0
      );
    }

    setFilteredItemPairs(filtered);
    setCurrentPage(1);
  }, [
    showOnlyMatchingBom,
    allItemPairs,
    selectedFinishedGood,
    filteredByFinishedGood,
  ]);

  const totalItems = filteredItemPairs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredItemPairs.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Load finished goods filter data when bomData changes
  useEffect(() => {
    if (showFinishedGoodsFilter && Object.keys(bomData).length > 0) {
      loadFinishedGoodsFilterData();
    }
  }, [showFinishedGoodsFilter, bomData, loadFinishedGoodsFilterData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedFinishedGoodInfo = finishedGoodsFilterData.find(
    (fg) => fg.finishedGoodId === selectedFinishedGood
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-2"></div>
          <div className="text-lg">Memuat data master...</div>
          <div className="text-sm text-gray-500 mt-2">
            Harap tunggu sebentar
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <div className="flex justify-between items-center">
          <span>Error: {error}</span>
          <button
            onClick={() => fetchData()}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Daftar Barang LC dengan Perbandingan BOM
        </h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded">
            Total: {totalItems} barang
          </div>
          <button
            onClick={exportToExcel}
            disabled={exportLoading || filteredItemPairs.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {exportLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Export Excel</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Cari berdasarkan kode barang, nama barang, atau kode dasar..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showOnlyMatchingBom}
              onChange={(e) => setShowOnlyMatchingBom(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Hanya tampilkan item dengan BOM yang sama
            </span>
          </label>

          <button
            onClick={() => setShowFinishedGoodsFilter(!showFinishedGoodsFilter)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              showFinishedGoodsFilter
                ? "bg-purple-600 text-white"
                : "bg-purple-100 text-purple-800 hover:bg-purple-200"
            }`}
          >
            {showFinishedGoodsFilter
              ? "✕ Tutup Filter"
              : "🔍 Filter Barang Jadi"}
          </button>

          {selectedFinishedGood && (
            <button
              onClick={() => setSelectedFinishedGood("")}
              className="px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm hover:bg-red-200 transition-colors"
            >
              Hapus Filter Barang Jadi
            </button>
          )}
        </div>

        {/* Finished Goods Filter Panel */}
        {showFinishedGoodsFilter && (
          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-3">
              Filter Berdasarkan Barang Jadi
            </h3>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Barang Jadi:
                </label>
                <select
                  value={selectedFinishedGood}
                  onChange={(e) => setSelectedFinishedGood(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={finishedGoodsLoading}
                >
                  <option value="">-- Pilih Barang Jadi --</option>
                  {finishedGoodsFilterData.map((fg) => (
                    <option key={fg.finishedGoodId} value={fg.finishedGoodId}>
                      {fg.finishedGoodId} - {fg.finishedGoodName} (
                      {fg.itemIds.length} item)
                    </option>
                  ))}
                </select>
                {finishedGoodsLoading && (
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                    <span className="text-sm text-gray-500">
                      Memuat data barang jadi...
                    </span>
                  </div>
                )}
              </div>

              {selectedFinishedGoodInfo && (
                <div className="flex-1 bg-purple-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">
                    Informasi Barang Jadi:
                  </h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <strong>Kode:</strong>{" "}
                      {selectedFinishedGoodInfo.finishedGoodId}
                    </div>
                    <div>
                      <strong>Nama:</strong>{" "}
                      {selectedFinishedGoodInfo.finishedGoodName}
                    </div>
                    <div>
                      <strong>Jumlah Item LC:</strong>{" "}
                      {selectedFinishedGoodInfo.itemIds.length}
                    </div>
                    <div>
                      <strong>Total Usage:</strong>{" "}
                      {selectedFinishedGoodInfo.totalUsage}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 text-xs text-gray-500">
              <p>
                <strong>Catatan:</strong> Filter ini menampilkan barang LC yang
                digunakan oleh barang jadi tertentu. Data hanya tersedia untuk
                barang yang sudah dimuat data BOM-nya.
              </p>
            </div>
          </div>
        )}

        {/* Selected Filter Info */}
        {selectedFinishedGood && selectedFinishedGoodInfo && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-blue-800">
                  Filter Aktif: Barang Jadi{" "}
                  {selectedFinishedGoodInfo.finishedGoodId}
                </span>
                <span className="text-sm text-blue-600 ml-2">
                  - {selectedFinishedGoodInfo.finishedGoodName}
                </span>
                <div className="text-xs text-blue-600 mt-1">
                  Menampilkan {filteredItemPairs.length} item yang digunakan
                  oleh barang jadi ini
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-gray-800">
            {allItemPairs.length}
          </div>
          <div className="text-gray-600">Total Barang LC</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow border border-purple-200">
          <div className="text-2xl font-bold text-purple-800">
            {
              allItemPairs.filter((pair) => {
                if (pair.bomComparison) {
                  return pair.bomComparison.totalCommon > 0;
                }
                return false;
              }).length
            }
          </div>
          <div className="text-purple-600">BOM Sama</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
          <div className="text-2xl font-bold text-blue-800">
            {finishedGoodsFilterData.length}
          </div>
          <div className="text-blue-600">Barang Jadi Terdeteksi</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-2xl font-bold text-green-800">
            {Object.keys(bomData).length}
          </div>
          <div className="text-green-600">Item dengan BOM</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          Menampilkan {Math.min(startIndex + 1, totalItems)}-
          {Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems}{" "}
          barang
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode Dasar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode LC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode Non-LC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Barang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Perbandingan BOM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status BOM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((pair, index) => (
                <TableRow
                  key={pair.baseItemId}
                  pair={pair}
                  index={index}
                  bomData={bomData}
                  bomLoading={bomLoading}
                  bomComparisonLoading={bomComparisonLoading}
                  onShowBom={fetchBomData}
                  onCompareBom={compareBomForPair}
                  selectedItemForBom={selectedItemForBom}
                  setSelectedItemForBom={setSelectedItemForBom}
                  selectedFinishedGood={selectedFinishedGood}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {filteredItemPairs.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🔍</div>
          <div>Tidak ada data yang ditemukan</div>
          <div className="text-sm mt-2">
            {showOnlyMatchingBom
              ? "Tidak ada barang dengan BOM yang sama antara versi LC dan Non-LC"
              : selectedFinishedGood
              ? `Tidak ada barang LC yang digunakan oleh barang jadi ${selectedFinishedGood}`
              : "Tidak ada barang dengan kode LC (non-RJ) yang sesuai dengan kriteria pencarian"}
          </div>
          {(searchTerm || selectedFinishedGood) && (
            <button
              onClick={() => {
                clearSearch();
                setSelectedFinishedGood("");
              }}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Tampilkan Semua Barang
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TableRow({
  pair,
  index,
  bomData,
  bomLoading,
  bomComparisonLoading,
  onShowBom,
  onCompareBom,
  selectedItemForBom,
  setSelectedItemForBom,
  selectedFinishedGood,
}: {
  pair: ItemPair;
  index: number;
  bomData: { [key: string]: FinishedGood[] };
  bomLoading: { [key: string]: boolean };
  bomComparisonLoading: { [key: string]: boolean };
  onShowBom: (itemId: string) => Promise<FinishedGood[]>;
  onCompareBom: (pair: ItemPair) => Promise<BomComparisonResult>;
  selectedItemForBom: string | null;
  setSelectedItemForBom: (itemId: string | null) => void;
  selectedFinishedGood?: string;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [localBomComparison, setLocalBomComparison] =
    useState<BomComparisonResult | null>(null);


  const handleShowBom = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedItemForBom === itemId) {
      setSelectedItemForBom(null);
    } else {
      setSelectedItemForBom(itemId);
      await onShowBom(itemId);
    }
  };

  const handleCompareBom = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!pair.bomComparison && !localBomComparison) {
      const comparison = await onCompareBom(pair);
      setLocalBomComparison(comparison);
    }
  };

  const hasBomData = (itemId: string) => {
    return bomData[itemId] && bomData[itemId].length > 0;
  };

  // Check if this item is used by the selected finished good
  const isUsedBySelectedFinishedGood = useMemo(() => {
    if (!selectedFinishedGood) return false;

    const lcBom = pair.lcItem ? bomData[pair.lcItem.ItemID] : [];
    const nonLcBom = pair.nonLcItem ? bomData[pair.nonLcItem.ItemID] : [];

    return (
      lcBom?.some((fg) => fg.FinishedGoodID === selectedFinishedGood) ||
      nonLcBom?.some((fg) => fg.FinishedGoodID === selectedFinishedGood)
    );
  }, [selectedFinishedGood, pair, bomData]);

  const getBomStatus = () => {
    const comparison = pair.bomComparison || localBomComparison;

    if (!comparison) {
      return {
        color: "bg-gray-100 text-gray-800",
        text: "Klik untuk Bandingkan",
      };
    }

    if (comparison.bomMatch) {
      return { color: "bg-green-100 text-green-800", text: "Sama Persis" };
    }

    if (comparison.totalCommon > 0) {
      return { color: "bg-blue-100 text-blue-800", text: "Ada Kesamaan" };
    }

    return { color: "bg-red-100 text-red-800", text: "Berbeda" };
  };

  const bomStatus = getBomStatus();
  const comparison = pair.bomComparison || localBomComparison;

  return (
    <>
      <tr
        className={`hover:bg-gray-50 cursor-pointer ${
          index % 2 === 0 ? "bg-white" : "bg-gray-50"
        } ${
          isUsedBySelectedFinishedGood
            ? "bg-yellow-50 border-l-4 border-yellow-400"
            : ""
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">
            {pair.baseItemId}
            {isUsedBySelectedFinishedGood && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                ✓ Digunakan
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {pair.lcItem && (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {pair.lcItem.ItemID}
              </span>
              {hasBomData(pair.lcItem.ItemID) && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                  title="Memiliki barang jadi"
                >
                  ✓
                </span>
              )}
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {pair.nonLcItem ? (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {pair.nonLcItem.ItemID}
              </span>
              {hasBomData(pair.nonLcItem.ItemID) && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                  title="Memiliki barang jadi"
                >
                  ✓
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400">-</span>
          )}
        </td>
        <td className="px-6 py-4">
          <div
            className="text-sm text-gray-900 max-w-xs truncate"
            title={pair.itemName}
          >
            {pair.itemName}
          </div>
        </td>
        <td className="px-6 py-4">
          {bomComparisonLoading[pair.baseItemId] ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-xs text-gray-500">Membandingkan...</span>
            </div>
          ) : comparison ? (
            <div className="space-y-1">
              <div className="flex items-center space-x-4 text-xs">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  Sama: {comparison.totalCommon}
                </span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  LC Only: {comparison.totalLcOnly}
                </span>
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                  Non-LC Only: {comparison.totalNonLcOnly}
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={handleCompareBom}
              className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
            >
              Bandingkan BOM
            </button>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bomStatus.color}`}
          >
            {bomStatus.text}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
            >
              {showDetails ? "Sembunyikan" : "Detail"}
            </button>
            {pair.lcItem && (
              <button
                onClick={(e) => handleShowBom(pair.lcItem!.ItemID, e)}
                className={`text-xs px-3 py-1 rounded transition-colors ${
                  selectedItemForBom === pair.lcItem.ItemID
                    ? "bg-blue-500 text-white"
                    : hasBomData(pair.lcItem.ItemID)
                    ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                BOM LC
              </button>
            )}
            {pair.nonLcItem && (
              <button
                onClick={(e) => handleShowBom(pair.nonLcItem!.ItemID, e)}
                className={`text-xs px-3 py-1 rounded transition-colors ${
                  selectedItemForBom === pair.nonLcItem.ItemID
                    ? "bg-green-500 text-white"
                    : hasBomData(pair.nonLcItem.ItemID)
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                BOM Non-LC
              </button>
            )}
          </div>
        </td>
      </tr>

      {showDetails && (
        <tr className="bg-blue-50">
          <td colSpan={7} className="px-6 py-4">
            <ItemDetails
              pair={pair}
              bomData={bomData}
              comparison={comparison}
              selectedFinishedGood={selectedFinishedGood}
            />
          </td>
        </tr>
      )}

      {selectedItemForBom &&
        (selectedItemForBom === pair.lcItem?.ItemID ||
          selectedItemForBom === pair.nonLcItem?.ItemID) && (
          <tr className="bg-yellow-50">
            <td colSpan={7} className="px-6 py-4">
              <BomDetails
                itemId={selectedItemForBom}
                bomData={bomData[selectedItemForBom] || []}
                loading={bomLoading[selectedItemForBom]}
                selectedFinishedGood={selectedFinishedGood}
              />
            </td>
          </tr>
        )}
    </>
  );
}

function ItemDetails({
  pair,
  bomData,
  comparison,
  selectedFinishedGood,
}: {
  pair: ItemPair;
  bomData: { [key: string]: FinishedGood[] };
  comparison: BomComparisonResult | null;
  selectedFinishedGood?: string;
}) {
  // Check which finished goods use this item
  const getFinishedGoodsUsingThisItem = useMemo(() => {
    const allFinishedGoods: FinishedGood[] = [];

    if (pair.lcItem && bomData[pair.lcItem.ItemID]) {
      allFinishedGoods.push(...bomData[pair.lcItem.ItemID]);
    }

    if (pair.nonLcItem && bomData[pair.nonLcItem.ItemID]) {
      allFinishedGoods.push(...bomData[pair.nonLcItem.ItemID]);
    }

    // Remove duplicates by FinishedGoodID
    const uniqueFinishedGoods = allFinishedGoods.filter(
      (fg, index, self) =>
        index === self.findIndex((f) => f.FinishedGoodID === fg.FinishedGoodID)
    );

    return uniqueFinishedGoods;
  }, [pair, bomData]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Barang LC
          </h3>
          {pair.lcItem ? (
            <div className="space-y-1 text-sm">
              <DetailItem label="Kode" value={pair.lcItem.ItemID} />
              <DetailItem label="Nama Beli" value={pair.lcItem.ItemNameBuy} />
              <DetailItem label="Spesifikasi" value={pair.lcItem.Spec} />
              <DetailItem
                label="Jumlah BOM"
                value={
                  bomData[pair.lcItem.ItemID]
                    ? `${bomData[pair.lcItem.ItemID].length}`
                    : "0"
                }
              />
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Tidak ada data</div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Barang Non-LC
          </h3>
          {pair.nonLcItem ? (
            <div className="space-y-1 text-sm">
              <DetailItem label="Kode" value={pair.nonLcItem.ItemID} />
              <DetailItem
                label="Nama Beli"
                value={pair.nonLcItem.ItemNameBuy}
              />
              <DetailItem label="Spesifikasi" value={pair.nonLcItem.Spec} />
              <DetailItem
                label="Jumlah BOM"
                value={
                  bomData[pair.nonLcItem.ItemID]
                    ? `${bomData[pair.nonLcItem.ItemID].length}`
                    : "0"
                }
              />
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Tidak ada data</div>
          )}
        </div>
      </div>

      {/* Barang Jadi yang Menggunakan Item Ini */}
      {getFinishedGoodsUsingThisItem.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-orange-200">
          <h3 className="text-lg font-semibold text-orange-800 mb-2">
            Barang Jadi yang Menggunakan Item Ini
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {getFinishedGoodsUsingThisItem.map((fg) => (
              <div
                key={fg.FinishedGoodID}
                className={`p-2 rounded text-sm ${
                  fg.FinishedGoodID === selectedFinishedGood
                    ? "bg-orange-100 border-2 border-orange-400"
                    : "bg-gray-100"
                }`}
              >
                <div className="font-medium">{fg.FinishedGoodID}</div>
                <div className="text-xs truncate">{fg.FinishedGoodName}</div>
                <div className="text-xs text-gray-500">
                  Qty: {fg.QuantityUsed} | {fg.Unit}
                </div>
                {fg.FinishedGoodID === selectedFinishedGood && (
                  <div className="text-xs text-orange-600 font-semibold">
                    ✓ Sedang difilter
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {comparison && (
        <div className="bg-white p-4 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">
            Perbandingan BOM
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-800">
                {comparison.totalCommon}
              </div>
              <div className="text-sm text-green-600">BOM Sama</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-800">
                {comparison.totalLcOnly}
              </div>
              <div className="text-sm text-blue-600">Hanya di LC</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-xl font-bold text-orange-800">
                {comparison.totalNonLcOnly}
              </div>
              <div className="text-sm text-orange-600">Hanya di Non-LC</div>
            </div>
          </div>

          {comparison.commonBom.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                Barang Jadi yang Sama:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {comparison.commonBom.slice(0, 6).map((item) => (
                  <div
                    key={item.FinishedGoodID}
                    className="bg-green-100 p-2 rounded text-sm"
                  >
                    <div className="font-medium">{item.FinishedGoodID}</div>
                    <div className="text-xs truncate">
                      {item.FinishedGoodName}
                    </div>
                  </div>
                ))}
                {comparison.commonBom.length > 6 && (
                  <div className="bg-green-100 p-2 rounded text-sm text-center">
                    +{comparison.commonBom.length - 6} lainnya
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  if (!value || value === "-") return null;

  return (
    <div className="flex">
      <span className="font-medium text-gray-700 w-32 flex-shrink-0">
        {label}:
      </span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

function BomDetails({
  itemId,
  bomData,
  loading,
  selectedFinishedGood,
}: {
  itemId: string;
  bomData: FinishedGood[];
  loading: boolean;
  selectedFinishedGood?: string;
}) {
  const [expandedItems, setExpandedItems] = useState<{
    [key: string]: boolean;
  }>({});
  const [bomTreeData, setBomTreeData] = useState<{
    [key: string]: BomTreeData[];
  }>({});
  const [bomTreeLoading, setBomTreeLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [error, setError] = useState<{ [key: string]: string }>({});

  const toggleExpand = async (finishedGoodId: string) => {
    const isExpanded = expandedItems[finishedGoodId];

    if (isExpanded) {
      setExpandedItems((prev) => ({ ...prev, [finishedGoodId]: false }));
      return;
    }

    if (!bomTreeData[finishedGoodId]) {
      setBomTreeLoading((prev) => ({ ...prev, [finishedGoodId]: true }));
      setError((prev) => ({ ...prev, [finishedGoodId]: "" }));

      try {
        const response = await axios.get<BomTreeData[]>(
          `/api/bom?itemid=${encodeURIComponent(finishedGoodId)}`
        );
        setBomTreeData((prev) => ({
          ...prev,
          [finishedGoodId]: response.data || [],
        }));
      } catch (err) {
        console.error(`Error fetching BOM tree for ${finishedGoodId}:`, err);
        const errorMessage = axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : "Unknown error";
        setError((prev) => ({ ...prev, [finishedGoodId]: errorMessage }));
        setBomTreeData((prev) => ({ ...prev, [finishedGoodId]: [] }));
      } finally {
        setBomTreeLoading((prev) => ({ ...prev, [finishedGoodId]: false }));
      }
    }

    setExpandedItems((prev) => ({ ...prev, [finishedGoodId]: true }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
        <span className="text-sm text-gray-600">Memuat data BOM...</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-yellow-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
        <h3 className="text-lg font-semibold text-yellow-800 flex items-center">
          <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
          Barang Jadi yang Menggunakan: {itemId}
        </h3>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Barang Jadi
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            Total: {bomData.length} barang
          </span>
        </div>
      </div>

      {bomData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Kode Barang Jadi
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Nama Barang Jadi
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Quantity
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Satuan
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Jenis
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bomData.map((finishedGood, index) => (
                <BomTreeRow
                  key={`${finishedGood.TransID}-${index}`}
                  finishedGood={finishedGood}
                  isExpanded={!!expandedItems[finishedGood.FinishedGoodID]}
                  bomTreeData={bomTreeData[finishedGood.FinishedGoodID] || []}
                  bomTreeLoading={!!bomTreeLoading[finishedGood.FinishedGoodID]}
                  error={error[finishedGood.FinishedGoodID]}
                  onToggleExpand={() =>
                    toggleExpand(finishedGood.FinishedGoodID)
                  }
                  isHighlighted={
                    finishedGood.FinishedGoodID === selectedFinishedGood
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <div className="text-2xl mb-2">🏭</div>
          <div>Tidak ada barang jadi yang menggunakan material ini</div>
          <div className="text-sm mt-1">
            Material <strong>{itemId}</strong> tidak digunakan dalam produksi
            barang jadi
          </div>
        </div>
      )}
    </div>
  );
}

function BomTreeRow({
  finishedGood,
  isExpanded,
  bomTreeData,
  bomTreeLoading,
  error,
  onToggleExpand,
  isHighlighted = false,
}: {
  finishedGood: FinishedGood;
  isExpanded: boolean;
  bomTreeData: BomTreeData[];
  bomTreeLoading: boolean;
  error?: string;
  onToggleExpand: () => void;
  isHighlighted?: boolean;
}) {
  return (
    <>
      <tr
        className={`hover:bg-gray-50 ${
          isHighlighted ? "bg-yellow-50 border-l-4 border-yellow-400" : ""
        }`}
      >
        <td className="px-4 py-2 whitespace-nowrap">
          <button
            onClick={onToggleExpand}
            className={`w-6 h-6 flex items-center justify-center rounded border ${
              bomTreeData.length > 0 || bomTreeLoading
                ? "bg-blue-100 text-blue-600 border-blue-300 hover:bg-blue-200"
                : "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
            }`}
            disabled={bomTreeLoading}
            title={bomTreeLoading ? "Loading..." : "Lihat BOM Tree"}
          >
            {bomTreeLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            ) : (
              <svg
                className={`w-3 h-3 transition-transform ${
                  isExpanded ? "rotate-90" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        </td>
        <td className="px-4 py-2 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm bg-blue-100 px-2 py-1 rounded">
              {finishedGood.FinishedGoodID}
            </span>
            {isHighlighted && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                Filter
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-2">
          <div title={finishedGood.FinishedGoodName}>
            {finishedGood.FinishedGoodName}
          </div>
        </td>
        <td className="px-4 py-2 whitespace-nowrap">
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
            {finishedGood.QuantityUsed}
          </span>
        </td>
        <td className="px-4 py-2 whitespace-nowrap">{finishedGood.Unit}</td>
        <td className="px-4 py-2 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            <span>{finishedGood.JenisBarang}</span>
            {finishedGood.KodeJenis === "K02" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                K02
              </span>
            )}

            {finishedGood.KodeJenis === "K16" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                K16
              </span>
            )}

            {finishedGood.KodeJenis === "K17" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                K17
              </span>
            )}
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-blue-50">
          <td colSpan={6} className="px-4 py-3">
            <div className="ml-6 border-l-2 border-blue-200 pl-4">
              <BomTreeContent
                bomTreeData={bomTreeData}
                loading={bomTreeLoading}
                error={error}
                finishedGoodId={finishedGood.FinishedGoodID}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function BomTreeContent({
  bomTreeData,
  loading,
  error,
  finishedGoodId,
}: {
  bomTreeData: BomTreeData[];
  loading: boolean;
  error?: string;
  finishedGoodId: string;
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
        <span className="text-sm text-gray-600">Memuat BOM tree...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        <div className="text-lg mb-1">❌</div>
        <div>Error loading BOM tree</div>
        <div className="text-sm mt-1">{error}</div>
      </div>
    );
  }

  if (bomTreeData.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <div className="text-lg mb-1">📦</div>
        <div>Tidak ada data BOM tree</div>
        <div className="text-sm">
          Barang jadi ini tidak memiliki komponen dalam BOM
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h4 className="font-semibold text-gray-800 flex items-center">
          <svg
            className="w-4 h-4 mr-2 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
          BOM Tree - {finishedGoodId}
        </h4>
        <div className="text-xs text-gray-600 mt-1">
          Menampilkan {bomTreeData.length} komponen dalam Bill of Materials
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Kode Komponen
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Nama Komponen
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Quantity
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Departemen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bomTreeData.map((item, index) => (
              <tr key={`${item.TransID}-${index}`} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {item.ItemID}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div title={item.ItemName} className="max-w-xs truncate">
                    {item.ItemName}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                    {item.BahanQty}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {item.Departemen || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
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

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Halaman <span className="font-medium">{currentPage}</span> dari{" "}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav
            className="isolate inline-flex -space-x-px rounded-md shadow-sm"
            aria-label="Pagination"
          >
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                  currentPage === page
                    ? "z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
