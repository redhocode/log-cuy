"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
interface KartuStockData {
  Item: string;
  Loc: string;
  Jumlah: number;
  Tanggal: string;
  MoveDate: Date;
  LocName: string;
  ItemID: string;
  KgI: number;
  KgO: number;
  Saldo: number;
  Kegiatan: string;
  Keterangan: string;
  NoMemo: string;
}

interface FormState {
  tgl1: string;
  tgl2: string;
  item: string;
  itemid: string;
  kategori: string;
  saldoAwalManual?: number | "";
}

export default function KartuStockPage() {
  const [data, setData] = useState<KartuStockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [gudangFilter, setGudangFilter] = useState("Gudang Utama");

  const [form, setForm] = useState<FormState>({
    tgl1: "2025-07-01",
    tgl2: "2025-07-31",
    item: "",
    itemid: "",
    kategori: "",
    saldoAwalManual: "",
  });

  // untuk fitur search input item
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string }[]
  >([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "saldoAwalManual") {
      setForm((prev) => ({
        ...prev,
        [name]: value === "" ? "" : Number(value),
      }));
      return;
    }

    if (name === "itemid") {
      // Jangan pakai ini lagi karena sekarang pake search input
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "item") {
      setSearchTerm(value);
      if (value.trim() === "") {
        setSearchResults([]);
      } else {
        const filtered = items.filter(
          (item) =>
            item.name.toLowerCase().includes(value.toLowerCase()) ||
            item.id.toLowerCase().includes(value.toLowerCase())
        );
        setSearchResults(filtered);
      }
      setForm((prev) => ({ ...prev, itemid: "" })); // reset itemid saat ketik
    }
  };

  // Ketika user pilih item dari dropdown search
  const handleSelectItem = (item: { id: string; name: string }) => {
    setForm((prev) => ({
      ...prev,
      itemid: item.id,
      item: item.name,
    }));
    setSearchTerm(item.name);
    setSearchResults([]);
  };

  // Klik di luar dropdown tutup dropdown search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get("/api/master");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = res.data.map((item: any) => ({
          id: item.ItemID,
          name: item.ItemName,
        }));
        setItems(mapped);
      } catch (err) {
        console.error("Gagal ambil data master item:", err);
      }
    };
    fetchItems();
  }, []);

  // Fetch data seperti semula
  const fetchData = async () => {
    setLoading(true);
    setError("");

    if (!form.itemid) {
      setError("Mohon pilih item terlebih dahulu");
      setLoading(false);
      return;
    }

    try {
      // Adjust tgl2 -> tambah 1 hari
      const tgl2Next = new Date(form.tgl2);
      tgl2Next.setDate(tgl2Next.getDate() + 1);
      const adjustedForm = {
        ...form,
        tgl2: tgl2Next.toISOString().slice(0, 10),
      };

      const params = new URLSearchParams(
        adjustedForm as unknown as Record<string, string>
      ).toString();
      const res = await axios.get<KartuStockData[]>(
        `/api/kartustock?${params}`
      );

      const parseDate = (dateStr: string): Date => {
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day, 12, 0, 0, 0);
      };

      const startDate = parseDate(form.tgl1);
      const endDateInclusive = parseDate(form.tgl2);
      const endDateExclusive = new Date(endDateInclusive);
      endDateExclusive.setDate(endDateExclusive.getDate() + 1);

      const transaksi = res.data.filter((row) => {
        const md = new Date(row.MoveDate);
        return (
          row.Kegiatan !== "S" &&
          row.LocName?.trim().toLowerCase() === gudangFilter.toLowerCase() &&
          row.ItemID.toUpperCase() === form.itemid.toUpperCase() &&
          md >= startDate &&
          md < endDateExclusive
        );
      });

      const tgl1Current = new Date(form.tgl1);
      const prevStart = new Date(
        tgl1Current.getFullYear(),
        tgl1Current.getMonth() - 1,
        1
      );
      const prevEnd = new Date(
        tgl1Current.getFullYear(),
        tgl1Current.getMonth(),
        0
      );

      const prevEndNext = new Date(prevEnd);
      prevEndNext.setDate(prevEnd.getDate() + 1);

      const prevForm = {
        ...form,
        tgl1: prevStart.toISOString().slice(0, 10),
        tgl2: prevEndNext.toISOString().slice(0, 10),
      };
      const prevParams = new URLSearchParams(
        prevForm as Record<string, string>
      ).toString();
      const prevRes = await axios.get<KartuStockData[]>(
        `/api/kartustock?${prevParams}`
      );

      const prevFiltered = prevRes.data.filter(
        (row) =>
          row.LocName?.trim().toLowerCase() === gudangFilter.toLowerCase() &&
          row.ItemID.toUpperCase() === form.itemid.toUpperCase()
      );

      const lastRowPrev = [...prevFiltered]
        .sort(
          (a, b) =>
            new Date(a.MoveDate).getTime() - new Date(b.MoveDate).getTime()
        )
        .pop();

      let saldoAkhirBulanSebelumnya = 0;

      if (typeof form.saldoAwalManual === "number") {
        saldoAkhirBulanSebelumnya = form.saldoAwalManual;
      } else {
        saldoAkhirBulanSebelumnya = lastRowPrev?.Saldo ?? 0;
      }

      let saldoAwalRow: KartuStockData | undefined = undefined;
      if (transaksi.length > 0) {
        const ref = transaksi[0];
        saldoAwalRow = {
          Item: ref.Item || "",
          Loc: ref.Loc || "",
          Jumlah: ref.Jumlah ?? 0,
          Tanggal: form.tgl1.slice(0, 10),
          MoveDate: new Date(form.tgl1),
          LocName: ref.LocName || "",
          ItemID: ref.ItemID || "",
          KgI: saldoAkhirBulanSebelumnya,
          KgO: 0,
          Saldo: saldoAkhirBulanSebelumnya,
          Kegiatan: "S",
          Keterangan:
            typeof form.saldoAwalManual === "number"
              ? "Saldo Awal Manual oleh user"
              : "Saldo Awal Otomatis dari saldo akhir bulan sebelumnya",
          NoMemo: "Auto",
        };
      }

      const finalData = saldoAwalRow ? [saldoAwalRow, ...transaksi] : transaksi;
      setData(finalData);
    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-screen-xl pb-4 mb-4">
      <h1 className="text-2xl font-bold mb-4">
        Cek Koreksi Kartu Stok mutasi barang
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative">
        <Input
          type="date"
          name="tgl1"
          value={form.tgl1}
          onChange={handleChange}
          className="border p-2"
        />
        <Input
          type="date"
          name="tgl2"
          value={form.tgl2}
          onChange={handleChange}
          className="border p-2"
        />

        {/* Pencarian Item */}
        <div className="relative" ref={dropdownRef}>
          <Input
            type="text"
            name="item"
            value={form.item}
            onChange={handleChange}
            placeholder="Cari item berdasarkan ID atau nama"
            className="border p-2 w-full"
            autoComplete="off"
          />
          {searchResults.length > 0 && (
            <ul className="absolute z-10 bg-white border w-full max-h-60 overflow-auto">
              {searchResults.map((item) => (
                <li
                  key={item.id}
                  className="p-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => handleSelectItem(item)}
                >
                  {item.id} - {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Select value={gudangFilter} onValueChange={setGudangFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih Gudang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Gudang Utama">Gudang Utama</SelectItem>
            <SelectItem value="Gudang Injeksi">Gudang Injeksi</SelectItem>
            <SelectItem value="Gudang Jadi">Gudang Plating</SelectItem>
            <SelectItem value="Gudang Plating">Gudang Molding</SelectItem>
          </SelectContent>
        </Select>
        <h1 className="text-pretty text-red-500">
          Masukan Saldo Awal dari laporan Excel
        </h1>
        <Input
          type="text"
          inputMode="numeric"
          name="saldoAwalManual"
          placeholder="Masukkan Saldo Awal dari laporan excel"
          value={form.saldoAwalManual === "" ? "" : form.saldoAwalManual}
          onChange={handleChange}
          className="border p-2"
          min={0}
          step={1}
        />
      </div>

      <Button
        onClick={fetchData}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        disabled={loading}
      >
        {loading ? "Mengambil data..." : "Tampilkan Data"}
      </Button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {data.length > 0 && (
        <div className="overflow-x-auto mt-6">
          <table className="w-full border border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Tanggal</th>
                <th className="border p-2">Item ID</th>
                <th className="border p-2">Gudang</th>
                <th className="border p-2">Kegiatan</th>
                <th className="border p-2">Keterangan</th>
                <th className="border p-2">IN (Kg)</th>
                <th className="border p-2">OUT (Kg)</th>
                <th className="border p-2">Saldo (Kg)</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let saldo = 0;
                return data.map((row, idx) => {
                  saldo += row.KgI - row.KgO;
                  const isSaldoAwal = row.Kegiatan === "S";
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-gray-100 ${
                        isSaldoAwal ? "bg-yellow-100 font-semibold" : ""
                      }`}
                    >
                      <td className="border p-2">
                        {new Date(row.MoveDate).toLocaleDateString("id-ID")}
                      </td>
                      <td className="border p-2">{row.ItemID}</td>
                      <td className="border p-2">{row.LocName}</td>
                      <td className="border p-2 text-center">{row.NoMemo}</td>
                      <td className="border p-2">{row.Keterangan}</td>
                      <td className="border p-2 text-right">
                        {Math.round(row.KgI)}
                      </td>
                      <td className="border p-2 text-right">
                        {Math.round(row.KgO)}
                      </td>
                      <td className="border p-2 text-right font-semibold">
                        {Math.round(saldo)}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
            <tfoot>
              {(() => {
                const totalIn = data.reduce((sum, row) => sum + row.KgI, 0);
                const totalOut = data.reduce((sum, row) => sum + row.KgO, 0);
                const totalSaldo = data.reduce(
                  (sum, row) => sum + (row.KgI - row.KgO),
                  0
                );

                return (
                  <tr className="bg-green-200 font-bold">
                    <td className="border p-2 text-center" colSpan={5}>
                      Total
                    </td>
                    <td className="border p-2 text-right">
                      {Math.round(totalIn)}
                    </td>
                    <td className="border p-2 text-right">
                      {Math.round(totalOut)}
                    </td>
                    <td className="border p-2 text-right">
                      {Math.round(totalSaldo)}
                    </td>
                  </tr>
                );
              })()}
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
