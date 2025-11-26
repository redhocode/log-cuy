"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { DataTable } from "../data-table";
import { columns } from "./columns";
import Loading from "@/app/loading";
import { Input } from "../ui/input";
import { itemGudangInjeksi } from "./iteminjeksi";
import { itemGudangUtama } from "./itemUtama";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StockItem {
  itemid: string;
  itemname: string;
  stockAkhir: number;
  kategori: string;
  totalkgs: string;
}

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { itemImport } from "./itemImport";

const StockPergudang: React.FC = () => {
  const [data, setData] = useState<StockItem[]>([]);
  const [filteredData, setFilteredData] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterOption, setFilterOption] = useState<string>("all");
  const [qtyFilter, setQtyFilter] = useState<string>("all");

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [cacheData, setCacheData] = useState<{ [key: string]: StockItem[] }>(
    {}
  );

  const debounceTimeout = useRef<any>(null);
  const periodeR = "201905";

  // Hitung stock akhir per item
  const getStockAkhirPerItem = (data: any[]) => {
    const stockAkhirMap: { [key: string]: number } = {};
    const uniqueItemsMap: { [key: string]: any } = {};

    data.forEach((item) => {
      const { itemid, totalkgs } = item;
      const total = parseFloat(totalkgs) || 0;

      stockAkhirMap[itemid] = (stockAkhirMap[itemid] || 0) + total;

      if (!uniqueItemsMap[itemid]) {
        uniqueItemsMap[itemid] = item;
      }
    });

    return Object.values(uniqueItemsMap).map((item) => ({
      ...item,
      stockAkhir: Math.round(stockAkhirMap[item.itemid] || 0),
    }));
  };

  // FILTER UTAMA
  const applyFilter = useCallback(
    (rawData: StockItem[]) => {
      let result = [...rawData];

      // Filter Gudang
      if (filterOption === "utama") {
        result = result.filter((item) => itemGudangUtama.includes(item.itemid));
      } else if (filterOption === "injeksi") {
        result = result.filter((item) =>
          itemGudangInjeksi.includes(item.itemid)
        );
      } else if (filterOption === "import") {
        result = result.filter((item) => itemImport.includes(item.itemid));
      }

      // Hitung stockAkhir setelah gudang difilter
      result = getStockAkhirPerItem(result);

      // Filter Qty
      if (qtyFilter === "zero") {
        result = result.filter((item) => item.stockAkhir === 0);
      } else if (qtyFilter === "more") {
        result = result.filter((item) => item.stockAkhir > 0);
      }

      // Filter Search
      if (searchQuery.trim() !== "") {
        result = result.filter(
          (item) =>
            item.itemid.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.itemname.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.kategori.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      return result;
    },
    [filterOption, qtyFilter, searchQuery]
  );

  // Fetch Data
  const fetchData = useCallback(async () => {
    if (cacheData[selectedDate]) {
      setData(cacheData[selectedDate]);
      setFilteredData(applyFilter(cacheData[selectedDate]));
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/stock?periodeR=${periodeR}&loc=%&item=%&tgl=${selectedDate}&company=0&tipestock=0&jenisbarang=0&kategori=%&minus=0`
      );

      if (!response.ok) {
        setError("System Busy, Please reload");
        return;
      }

      const result = await response.json();

      if (result.data) {
        setData(result.data);
        setFilteredData(applyFilter(result.data));

        setCacheData((prev) => ({
          ...prev,
          [selectedDate]: result.data,
        }));
      } else {
        setError("System Busy, Please reload");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, applyFilter, cacheData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Trigger filtering ulang saat filter berubah
  useEffect(() => {
    setFilteredData(applyFilter(data));
  }, [filterOption, qtyFilter, searchQuery, data, applyFilter]);

  // EXPORT
  // EXPORT
  // EXPORT
  const handleExport = () => {
    const exportData = filteredData.map((item) => ({
      ItemID: item.itemid,
      ItemName: item.itemname,
      Kategori: item.kategori,
      StockAkhir: item.stockAkhir,
    }));

    // 1. Buat worksheet kosong
    const ws = XLSX.utils.aoa_to_sheet([]);

    // 2. Header + tanggal export
    const header = [
      ["LAPORAN STOCK PER GUDANG"],
      [`Tanggal Export: ${new Date().toLocaleString()}`],
      [`Tanggal Data: ${selectedDate}`],
      [], // baris kosong
    ];

    XLSX.utils.sheet_add_aoa(ws, header, { origin: "A1" });

    // 3. Tambahkan data JSON mulai dari baris ke-5 (A5)
    XLSX.utils.sheet_add_json(ws, exportData, {
      origin: "A5",
      skipHeader: false, // tampilkan header kolom otomatis
    });

    // Auto column width
    const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    ws["!cols"] = colWidths;

    // 4. Build workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock");

    const gudang =
      filterOption === "utama"
        ? "Gudang_Utama"
        : filterOption === "injeksi"
        ? "Gudang_Injeksi"
        : filterOption === "import"
        ? "Item_Import"
        : "Semua_Gudang";

    const fileName = `Laporan_Stock_${gudang}_${selectedDate}.xlsx`;

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      fileName
    );
  };

  if (loading) return <Loading />;

  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Laporan Stock</h1>

      {/* Filter gudang */}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-medium">Pilih Gudang:</label>
        <Select value={filterOption} onValueChange={setFilterOption}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Pilih Gudang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="utama">Gudang Utama</SelectItem>
            <SelectItem value="injeksi">Gudang Injeksi</SelectItem>
            <SelectItem value="import">Item Import</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filter Qty */}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-medium">Filter Qty:</label>
        <Select value={qtyFilter} onValueChange={setQtyFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter Qty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="zero">Qty = 0</SelectItem>
            <SelectItem value="more">Qty {">"} 0</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tanggal */}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-medium">Pilih Tanggal:</label>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-[200px]"
        />
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[300px]"
        />
      </div>

      {/* Export */}
      <div className="mb-4">
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Export ke Excel
        </button>
      </div>

      {/* Table */}
      <DataTable columns={columns(() => {})} data={filteredData} />
    </div>
  );
};

export default StockPergudang;
