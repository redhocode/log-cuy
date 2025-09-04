"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useEffect, useRef } from "react";
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

const StockPergudang: React.FC = () => {
  const [data, setData] = useState<StockItem[]>([]);
  const [filteredData, setFilteredData] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterOption, setFilterOption] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0] // default hari ini
  );

  const debounceTimeout = useRef<any>(null);
  const periodeR = "201905";

  // fungsi hitung stockAkhir
  const getStockAkhirPerItem = (data: any[]) => {
    const stockAkhirMap: { [key: string]: number } = {};
    const uniqueItemsMap: { [key: string]: any } = {};

    data.forEach((item) => {
      const { itemid, totalkgs } = item;
      const total = parseFloat(totalkgs) || 0;

      if (stockAkhirMap[itemid]) {
        stockAkhirMap[itemid] += total;
      } else {
        stockAkhirMap[itemid] = total;
      }

      if (!uniqueItemsMap[itemid]) {
        uniqueItemsMap[itemid] = item;
      }
    });

    return Object.values(uniqueItemsMap).map((item) => ({
      ...item,
      stockAkhir: Math.round(stockAkhirMap[item.itemid] || 0),
    }));
  };

  // filter sesuai combo box
  const applyFilter = (data: StockItem[], option: string) => {
    if (option === "utama") {
      return data.filter((item) => itemGudangUtama.includes(item.itemid));
    } else if (option === "injeksi") {
      return data.filter((item) => itemGudangInjeksi.includes(item.itemid));
    }
    return data; // default semua
  };

  // fetch data dari API → SELALU ambil semua item (%)
  useEffect(() => {
    const fetchData = async () => {
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
          setFilteredData(applyFilter(result.data, filterOption));
        } else {
          setError("System Busy, Please reload");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate]);

  // kalau filterOption berubah → filter ulang data
  useEffect(() => {
    setFilteredData(applyFilter(data, filterOption));
  }, [filterOption, data]);

  // hitung stock akhir dari data terfilter
  const dataWithStockAkhir = getStockAkhirPerItem(filteredData).filter(
    (item) => item.stockAkhir >= 0 // buang data minus
  );

  // handle search
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      const filtered = applyFilter(data, filterOption).filter(
        (item) =>
          item.itemid.toLowerCase().includes(query.toLowerCase()) ||
          item.itemname.toLowerCase().includes(query.toLowerCase()) ||
          item.kategori.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredData(filtered);
    }, 300);
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
          </SelectContent>
        </Select>
      </div>

      {/* Input tanggal */}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-medium">Pilih Tanggal:</label>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-[200px]"
        />
      </div>

      {/* Search box */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-[300px]"
        />
      </div>

      {/* Table */}
      <DataTable columns={columns(() => {})} data={dataWithStockAkhir} />
    </div>
  );
};

export default StockPergudang;
