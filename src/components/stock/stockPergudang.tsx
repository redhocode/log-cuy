/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { DataTable } from "../data-table";
import { columns } from "./columns";
import Loading from "@/app/loading";
import { Input } from "../ui/input";
import { itemGudangInjeksi } from "./iteminjeksi";
import { itemGudangUtama } from "./itemUtama";
import { itemAsalLC } from "./itemAsalLC";
import { itemLC } from "./itemLC";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { itemImport } from "./itemImport";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface StockItem {
  itemid: string;
  itemname: string;
  stockAkhir: number;
  kategori: string;
  totalkgs: number;
}

const StockPergudang: React.FC = () => {
  const [data, setData] = useState<StockItem[]>([]);
  const [filteredData, setFilteredData] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalKgs, setTotalKgs] = useState<number>(0);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterOption, setFilterOption] = useState<string>("all");
  const [qtyFilter, setQtyFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [cacheData, setCacheData] = useState<{
    [key: string]: { data: StockItem[]; totalKgs: number };
  }>({});

  const periodeR = "201905";

  // **FUNGSI NORMALISASI ITEMID YANG LEBIH KETAT**
  const normalizeItemId = useCallback((itemId: string): string => {
    if (!itemId) return "";

    // 1. Hapus semua karakter non-alphanumeric kecuali strip
    let normalized = itemId.replace(/[^a-zA-Z0-9\-]/g, "");

    // 2. Convert to uppercase
    normalized = normalized.toUpperCase();

    return normalized;
  }, []);

  // **FUNGSI UNTUK MENGAMBIL ITEMID DARI BERBAGAI PROPERTI**
  const getItemIdFromObject = useCallback((item: any): string => {
    // Coba semua kemungkinan properti itemid
    const possibleKeys = [
      "itemid",
      "ItemID",
      "ItemNo",
      "itemno",
      "ITEMNO",
      "ItemID",
    ];

    for (const key of possibleKeys) {
      if (item[key] !== undefined && item[key] !== null && item[key] !== "") {
        return String(item[key]);
      }
    }

    return "";
  }, []);

  // **FUNGSI UNTUK MENDAPATKAN NILAI TOTALKGS**
  const getTotalkgsValue = useCallback((item: any): number => {
    // Coba properti totalkgs dengan berbagai case
    const possibleKeys = [
      "totalkgs",
      "TotalKgs",
      "totalKgs",
      "TOTALKGS",
      "kgs",
      "Kgs",
      "KGS",
    ];

    for (const key of possibleKeys) {
      if (item[key] !== undefined && item[key] !== null) {
        const val = Number(item[key]);
        if (!isNaN(val)) return val;
      }
    }

    // Fallback: cari properti apa saja yang berisi angka
    for (const key in item) {
      if (typeof item[key] === "number") {
        return item[key];
      }
    }

    return 0;
  }, []);

  // **FUNGSI GROUPING YANG LEBIH ROBUST**
  const processAndGroupData = useCallback(
    (rawData: any[]): StockItem[] => {
      console.log(`🔄 Processing ${rawData.length} raw records...`);

      const groupedMap = new Map<
        string,
        {
          itemid: string;
          itemname: string;
          totalKgs: number;
          kategori: string;
          count: number;
        }
      >();

      // **DEBUG: Kumpulkan semua item dengan 03S026MBK**
      const debugItems03S026MBK: Array<{
        index: number;
        originalItemid: string;
        normalizedItemid: string;
        totalkgs: number;
        rawItem: any;
      }> = [];

      rawData.forEach((rawItem, index) => {
        // 1. Ambil itemid dari berbagai properti
        const originalItemid = getItemIdFromObject(rawItem);
        const normalizedItemid = normalizeItemId(originalItemid);

        // 2. Debug untuk 03S026MBK
        if (
          normalizedItemid === "03S026MBK" ||
          originalItemid.includes("03S026MBK")
        ) {
          debugItems03S026MBK.push({
            index,
            originalItemid,
            normalizedItemid,
            totalkgs: getTotalkgsValue(rawItem),
            rawItem,
          });
        }

        if (!normalizedItemid) return;

        const totalkgsValue = getTotalkgsValue(rawItem);
        const itemname = rawItem.itemname || rawItem.ItemName || "";
        const kategori = rawItem.kategori || rawItem.Kategori || "";

        if (groupedMap.has(normalizedItemid)) {
          // Item sudah ada, tambahkan totalkgs
          const existing = groupedMap.get(normalizedItemid)!;
          groupedMap.set(normalizedItemid, {
            ...existing,
            totalKgs: existing.totalKgs + totalkgsValue,
            count: existing.count + 1,
          });
        } else {
          // Item baru
          groupedMap.set(normalizedItemid, {
            itemid: originalItemid, // Simpan original untuk display
            itemname,
            totalKgs: totalkgsValue,
            kategori,
            count: 1,
          });
        }
      });

      // **DEBUG: Tampilkan informasi tentang 03S026MBK**
      if (debugItems03S026MBK.length > 0) {
        console.log(
          "🔍 DEBUG 03S026MBK FOUND:",
          debugItems03S026MBK.length,
          "records"
        );
        debugItems03S026MBK.forEach((item, i) => {
          console.log(
            `${i + 1}. Index: ${item.index}, Original: "${
              item.originalItemid
            }", Normalized: "${item.normalizedItemid}", Totalkgs: ${
              item.totalkgs
            }`
          );
          console.log("   Raw item keys:", Object.keys(item.rawItem));
        });
      }

      // Convert Map to Array
      const result = Array.from(groupedMap.values()).map((item) => ({
        itemid: item.itemid,
        itemname: item.itemname,
        stockAkhir: item.totalKgs,
        kategori: item.kategori,
        totalkgs: item.totalKgs,
        _count: item.count, // Untuk debugging
      }));

      console.log(
        `✅ Result: ${result.length} unique items (from ${rawData.length} records)`
      );

      // **DEBUG: Cek apakah ada duplikat dalam hasil**
      const itemIdSet = new Set<string>();
      const duplicates: string[] = [];

      result.forEach((item) => {
        const normalized = normalizeItemId(item.itemid);
        if (itemIdSet.has(normalized)) {
          duplicates.push(normalized);
        } else {
          itemIdSet.add(normalized);
        }
      });

      if (duplicates.length > 0) {
        console.error("❌ MASIH ADA DUPLIKAT SETELAH GROUPING:", duplicates);
      }

      // **DEBUG: Tampilkan item 03S026MBK di hasil akhir**
      const final03S026MBK = result.filter(
        (item) => normalizeItemId(item.itemid) === "03S026MBK"
      );

      if (final03S026MBK.length > 0) {
        console.log("📊 03S026MBK in final result:", final03S026MBK);
        if (final03S026MBK.length > 1) {
          console.error("❌ 03S026MBK MASIH ADA DUPLIKAT DI HASIL AKHIR!");
        }
      }

      return result;
    },
    [getItemIdFromObject, normalizeItemId, getTotalkgsValue]
  );

  // **FILTER FUNGSI**
  const applyFilter = useCallback(
    (data: StockItem[]) => {
      let result = [...data];

      // Normalisasi semua itemid di filter lists
      const normalizeFilterList = (list: string[]) =>
        list.map((id) => normalizeItemId(id));

      const utamaNormalized = normalizeFilterList(itemGudangUtama);
      const injeksiNormalized = normalizeFilterList(itemGudangInjeksi);
      const importNormalized = normalizeFilterList(itemImport);
      const lcNormalized = normalizeFilterList(itemLC);
      const asalLcNormalized = normalizeFilterList(itemAsalLC);

      if (filterOption === "utama") {
        result = result.filter((item) =>
          utamaNormalized.includes(normalizeItemId(item.itemid))
        );
      } else if (filterOption === "injeksi") {
        result = result.filter((item) =>
          injeksiNormalized.includes(normalizeItemId(item.itemid))
        );
      } else if (filterOption === "import") {
        result = result.filter((item) =>
          importNormalized.includes(normalizeItemId(item.itemid))
        );
      } else if (filterOption == "lc"){
        result = result.filter((item)=>
        lcNormalized.includes(normalizeItemId(item.itemid))
        );
      } else if (filterOption == "asallc"){
        result = result.filter((item)=>
        asalLcNormalized.includes(normalizeItemId(item.itemid))
        );
      } 

      if (qtyFilter === "zero") {
        result = result.filter((item) => item.stockAkhir === 0);
      } else if (qtyFilter === "more") {
        result = result.filter((item) => item.stockAkhir > 0);
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(
          (item) =>
            item.itemid.toLowerCase().includes(query) ||
            item.itemname.toLowerCase().includes(query) ||
            item.kategori.toLowerCase().includes(query)
        );
      }

      const newTotalKgs = result.reduce(
        (sum, item) => sum + item.stockAkhir,
        0
      );
      setTotalKgs(newTotalKgs);

      return result;
    },
    [filterOption, qtyFilter, searchQuery, normalizeItemId]
  );

  // **FETCH DATA**
  const fetchData = useCallback(async () => {
    const cacheKey = selectedDate;

    if (cacheData[cacheKey]) {
      setData(cacheData[cacheKey].data);
      setTotalKgs(cacheData[cacheKey].totalKgs);
      setFilteredData(applyFilter(cacheData[cacheKey].data));
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const timestamp = new Date().getTime();
      const response = await fetch(
        `/api/stock?periodeR=${periodeR}&loc=%&item=%&tgl=${selectedDate}&company=0&tipestock=0&jenisbarang=0&kategori=%&minus=0&_=${timestamp}`
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();

      if (!result.data) throw new Error("Data tidak valid dari API");

      console.log("📥 Raw data from API:", result.data.length, "records");

      // **DEBUG: Tampilkan semua item dengan 03S026MBK sebelum processing**
      const raw03S026MBK = result.data.filter((item: any) => {
        const itemid = getItemIdFromObject(item);
        return (
          normalizeItemId(itemid) === "03S026MBK" ||
          itemid.includes("03S026MBK")
        );
      });

      console.log("🔍 Raw items with 03S026MBK:", raw03S026MBK.length);
      raw03S026MBK.forEach((item: any, i: number) => {
        console.log(
          `${i + 1}. ItemID: "${getItemIdFromObject(
            item
          )}", Totalkgs: ${getTotalkgsValue(item)}`
        );
        console.log("   All properties:", Object.keys(item));
      });

      // Process and group data
      const processedData = processAndGroupData(result.data);

      setData(processedData);

      // Hitung total
      const calculatedTotal = processedData.reduce(
        (sum, item) => sum + item.stockAkhir,
        0
      );
      setTotalKgs(calculatedTotal);

      // Simpan ke cache
      setCacheData((prev) => ({
        ...prev,
        [cacheKey]: {
          data: processedData,
          totalKgs: calculatedTotal,
        },
      }));
    } catch (err: any) {
      console.error("❌ Error:", err);
      setError(err.message || "System Busy, Please reload");
    } finally {
      setLoading(false);
    }
  }, [
    selectedDate,
    cacheData,
    getItemIdFromObject,
    normalizeItemId,
    processAndGroupData,
    applyFilter,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (data.length > 0) {
      setFilteredData(applyFilter(data));
    }
  }, [data, filterOption, qtyFilter, searchQuery, applyFilter]);

  useEffect(() => {
    setSelectedRows([]);
  }, [filteredData]);

  // **EFFECT UNTUK DEBUG: Cek duplikat di filteredData**
  useEffect(() => {
    if (filteredData.length > 0) {
      const normalizedIds = filteredData.map((item) =>
        normalizeItemId(item.itemid)
      );
      const uniqueIds = new Set(normalizedIds);

      if (uniqueIds.size !== filteredData.length) {
        console.error("⚠️ ADA DUPLIKAT DI filteredData!");

        // Cari duplikat
        const countMap = new Map<string, number>();
        normalizedIds.forEach((id) => {
          countMap.set(id, (countMap.get(id) || 0) + 1);
        });

        const duplicates = Array.from(countMap.entries())
          .filter(([_, count]) => count > 1)
          .map(([id]) => id);

        console.error("Duplicates:", duplicates);

        // Tampilkan item duplikat
        duplicates.forEach((dupId) => {
          const dupItems = filteredData.filter(
            (item) => normalizeItemId(item.itemid) === dupId
          );
          console.error(`Item ${dupId}:`, dupItems);
        });
      }
    }
  }, [filteredData, normalizeItemId]);

  // **EXPORT FUNCTION**
  const handleExport = () => {
    let dataToExport = filteredData;

    if (selectedRows.length > 0) {
      dataToExport = selectedRows;
    }

    if (dataToExport.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    const exportData = dataToExport.map((item) => ({
      "Item ID": item.itemid,
      "Nama Item": item.itemname,
      Kategori: item.kategori,
      "Total Kgs": item.stockAkhir.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock");

      const gudang =
      filterOption === "utama"
        ? "Gudang_Utama"
        : filterOption === "injeksi"
        ? "Gudang_Injeksi"
        : filterOption === "import"
        ? "Item_Import"
        : filterOption === "lc"        
        ? "Item_LC"                         
        : filterOption === "asallc"   
        ? "Item_Asal_LC"                    
        : "Semua_Gudang";

    const selectionInfo =
      selectedRows.length > 0 ? `_${selectedRows.length}selected` : "";
    const fileName = `Stock_${gudang}_${selectedDate}${selectionInfo}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // **DEVELOPMENT DEBUG PANEL**
  const DebugPanel = useMemo(() => {
    if (process.env.NODE_ENV !== "development") return null;

    const item03S026MBK = filteredData.filter(
      (item) => normalizeItemId(item.itemid) === "03S026MBK"
    );

    return (
      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-bold text-red-700 mb-2">
          🔧 Development Debug Panel
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-1">Data Stats:</h4>
            <p>Total Items: {filteredData.length}</p>
            <p>03S026MBK Items: {item03S026MBK.length}</p>
            {item03S026MBK.length > 1 && (
              <p className="text-red-600 font-bold">
                ⚠️ 03S026MBK HAS DUPLICATES!
              </p>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-1">Actions:</h4>
            <button
              onClick={() => {
                console.log("=== DEBUG DATA ===");
                console.log("All filtered data:", filteredData);
                console.log("03S026MBK items:", item03S026MBK);

                // Cek semua itemid
                const allItemIds = filteredData.map((item) => ({
                  original: item.itemid,
                  normalized: normalizeItemId(item.itemid),
                  totalkgs: item.stockAkhir,
                }));
                console.log("All item IDs:", allItemIds);
              }}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Log to Console
            </button>
          </div>
        </div>

        {item03S026MBK.length > 0 && (
          <div className="mt-3">
            <h4 className="font-medium mb-1">03S026MBK Details:</h4>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(item03S026MBK, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }, [filteredData, normalizeItemId]);

  if (loading) return <Loading />;
  if (error) return <div className="text-red-600 p-4">Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-6">Laporan Stock (Total per Item)</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Kgs</p>
          <p className="text-2xl font-bold">{totalKgs.toFixed(2)} kg</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Jumlah Item</p>
          <p className="text-2xl font-bold">{filteredData.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Tanggal Data</p>
          <p className="text-2xl font-bold">{selectedDate}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Terpilih</p>
          <p className="text-2xl font-bold">{selectedRows.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Gudang</label>
          <Select value={filterOption} onValueChange={setFilterOption}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Gudang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="utama">Gudang Utama</SelectItem>
              <SelectItem value="injeksi">Gudang Injeksi</SelectItem>
              <SelectItem value="import">Item Import</SelectItem>
              <SelectItem value="lc">Kode LC </SelectItem>
              <SelectItem value="asallc">Kode Asal LC</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Filter Qty</label>
          <Select value={qtyFilter} onValueChange={setQtyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter Qty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="zero">Qty = 0</SelectItem>
              <SelectItem value="more">Qty &gt; 0</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tanggal</label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Cari</label>
          <Input
            placeholder="Cari item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          Menampilkan {filteredData.length} item
          {selectedRows.length > 0 && ` | Terpilih: ${selectedRows.length}`}
        </div>
        <div className="flex gap-2">
          {selectedRows.length > 0 && (
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Export Selected ({selectedRows.length})
            </button>
          )}
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Export All
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <DataTable columns={columns(setSelectedRows)} data={filteredData} />
      </div>

      {/* Debug Panel */}
      {/* {DebugPanel} */}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
        <p className="font-medium mb-2">ℹ️ Informasi:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Data sudah di-grouping berdasarkan Item ID</li>
          <li>
            Kolom Total Kgs adalah jumlah dari semua nilai totalkgs untuk item
            yang sama
          </li>
          <li>
            Jika masih ada duplikat, harap buka browser console (F12) untuk
            debugging
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StockPergudang;
