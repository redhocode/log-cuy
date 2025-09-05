/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
  MoveDate: string | Date;
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
}

export default function KartuStockPage() {
  const [data, setData] = useState<KartuStockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [gudangFilter, setGudangFilter] = useState("Gudang Utama");
  const [saldoAwalKegiatanS, setSaldoAwalKegiatanS] = useState<number | null>(
    null
  );
  const [saldoAwalSistem, setSaldoAwalSistem] = useState(0);

  const [saldoSemuaGudang, setSaldoSemuaGudang] = useState<
    { gudang: string; saldo: number }[]
  >([]);
  const [form, setForm] = useState<FormState>({
    tgl1: "2025-07-01",
    tgl2: "2025-07-31",
    item: "",
    itemid: "",
    kategori: "",
  });

  // fitur search input item
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string }[]
  >([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "itemid") return;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "item") {
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
      setForm((prev) => ({ ...prev, itemid: "" }));
    }
  };

  const handleSelectItem = (item: { id: string; name: string }) => {
    setForm((prev) => ({
      ...prev,
      itemid: item.id,
      item: item.name,
    }));
    setSearchResults([]);
  };

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get("/api/master");
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

 const fetchData = async () => {
   setLoading(true);
   setError("");

   if (!form.itemid) {
     setError("Mohon pilih item terlebih dahulu");
     setLoading(false);
     return;
   }

   try {
     const tgl2Next = new Date(form.tgl2);
     tgl2Next.setDate(tgl2Next.getDate() + 1);

     const adjustedForm = {
       ...form,
       tgl2: tgl2Next.toISOString().slice(0, 10),
     };

     const params = new URLSearchParams(
       adjustedForm as unknown as Record<string, string>
     ).toString();

     const res = await axios.get<KartuStockData[]>(`/api/kartustock?${params}`);

     // filter transaksi sesuai gudang + item
     const transaksi = res.data.filter(
       (row) =>
         row.LocName?.trim().toLowerCase() === gudangFilter.toLowerCase() &&
         row.ItemID.toUpperCase() === form.itemid.toUpperCase()
     );

     // -----------------------------
     // ✅ Ambil saldo awal dari API
     // -----------------------------
     let saldoAwalDariAPI = 0;
     try {
       const saldoRes = await axios.get("/api/master/saldo");
       const allSaldo = saldoRes.data as {
         ItemID: string;
         Gudang: string;
         Bulan: number;
         Tahun: number;
         Saldo: number;
       }[];

       const tgl1Date = new Date(form.tgl1);
       const bulan = tgl1Date.getMonth() + 1;
       const tahun = tgl1Date.getFullYear();

       const saldoItem = allSaldo.filter(
         (s) =>
           s.ItemID.toUpperCase() === form.itemid.toUpperCase() &&
           s.Bulan === bulan &&
           s.Tahun === tahun
       );

       const found = saldoItem.find(
         (s) => s.Gudang.toLowerCase() === gudangFilter.toLowerCase()
       );

       if (found) {
         saldoAwalDariAPI = found.Saldo;
         setSaldoAwalSistem(found.Saldo);
       } else {
         setSaldoAwalSistem(0);
       }

       setSaldoSemuaGudang(
         saldoItem.map((s) => ({ gudang: s.Gudang, saldo: s.Saldo }))
       );
     } catch (err) {
       console.warn("Gagal fetch saldo awal dari /api/master/saldo:", err);
       setSaldoAwalSistem(0);
       setSaldoSemuaGudang([]);
     }

     // -----------------------------
     // ✅ Kalau tidak ada transaksi
     // -----------------------------
     if (transaksi.length === 0) {
       const saldoAwalRow: KartuStockData = {
         Item: form.item,
         Loc: "",
         Jumlah: 0,
         Tanggal: form.tgl1,
         MoveDate: new Date(form.tgl1),
         LocName: gudangFilter,
         ItemID: form.itemid,
         KgI: saldoAwalDariAPI, // pakai dari API
         KgO: 0,
         Saldo: saldoAwalDariAPI, // pakai dari API
         Kegiatan: "S",
         Keterangan: `Saldo Awal (${saldoAwalDariAPI})`,
         NoMemo: "-",
       };
       setData([saldoAwalRow]);
       setLoading(false);
       return;
     }

     // -----------------------------
     // ✅ Kalau transaksi ada
     // -----------------------------
     const kegiatanSItem = res.data.find(
       (row) =>
         row.Kegiatan?.trim().toUpperCase() === "S" &&
         row.ItemID?.toUpperCase() === form.itemid?.toUpperCase()
     );
     setSaldoAwalKegiatanS(kegiatanSItem ? kegiatanSItem.KgI : null);

     const hasSaldoAwal = transaksi.some((row) => row.Kegiatan === "S");
     let finalData = transaksi;

     if (!hasSaldoAwal && transaksi.length > 0) {
       const ref = transaksi[0];
       const saldoAwalRow: KartuStockData = {
         Item: ref.Item || "",
         Loc: ref.Loc || "",
         Jumlah: 0,
         Tanggal: form.tgl1,
         MoveDate: new Date(form.tgl1),
         LocName: ref.LocName || "",
         ItemID: ref.ItemID || "",
         KgI: saldoAwalDariAPI,
         KgO: 0,
         Saldo: saldoAwalDariAPI,
         Kegiatan: "S",
         Keterangan: "Saldo Awal",
         NoMemo: "Auto",
       };
       finalData = [saldoAwalRow, ...transaksi];
     }

     setData(finalData);
   } catch (err) {
     console.error(err);
     setError("Gagal mengambil data");
   } finally {
     setLoading(false);
   }
 };

  const exportToExcel = () => {
    if (data.length === 0) return;

    let saldo = 0;
    const formattedData = data.map((row) => {
      saldo += row.KgI - row.KgO;

      return {
        Tanggal: new Date(row.MoveDate).toLocaleDateString("id-ID"),
        ItemID: row.ItemID,
        Gudang: row.LocName,
        Kegiatan: row.NoMemo,
        Keterangan: row.Keterangan,
        "IN ": Math.round(row.KgI),
        "OUT ": Math.round(row.KgO),
        "Saldo ": Math.round(saldo),
      };
    });

    const totalIn = data.reduce((sum, row) => sum + row.KgI, 0);
    const totalOut = data.reduce((sum, row) => sum + row.KgO, 0);
    const totalSaldo = totalIn - totalOut;

    const totalRow = {
      Tanggal: "",
      ItemID: "",
      Gudang: "",
      Kegiatan: "",
      Keterangan: "TOTAL",
      "IN ": Math.round(totalIn),
      "OUT ": Math.round(totalOut),
      "Saldo ": Math.round(totalSaldo),
    };

    const exportData = [
      {
        Tanggal: `Kartu Stok ${form.itemid}`,
        ItemID: "",
        Gudang: "",
        Kegiatan: "",
        Keterangan: "",
        "IN ": "",
        "OUT ": "",
        "Saldo ": "",
      },
      {
        Tanggal: `Periode: ${form.tgl1} s/d ${form.tgl2}`,
        ItemID: "",
        Gudang: "",
        Kegiatan: "",
        Keterangan: "",
        "IN ": "",
        "OUT ": "",
        "Saldo ": "",
      },
      {}, // kosong
      ...formattedData,
      {}, // kosong
      totalRow,
    ];

    const worksheet = XLSX.utils.json_to_sheet(exportData, {
      skipHeader: false,
    });

    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 12 },
      { wch: 18 },
      { wch: 14 },
      { wch: 30 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Kartu Stok");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `Kartu_Stok_${form.itemid}_${form.tgl1}_sd_${form.tgl2}.xlsx`);
  };
  // hitung total dari semua gudang
  const totalSaldoGudang = saldoSemuaGudang.reduce(
    (sum, g) => sum + (g.saldo || 0),
    0
  );

  return (
    <div className="p-6 max-w-screen-xl pb-4 mb-4">
      <h1 className="text-2xl font-bold mb-4">
        Cek Koreksi Kartu Stok mutasi barang
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative">
        <Input
          type="date"
          name="tgl1"
          disabled
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
            <SelectItem value="Gudang Plating">Gudang Plating</SelectItem>
            <SelectItem value="Gudang Molding">Gudang Molding</SelectItem>
            <SelectItem value="Gudang Assembly">Gudang Assembly</SelectItem>
            <SelectItem value="Gudang Lokal">Gudang Lokal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={fetchData}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        disabled={loading}
      >
        {loading ? "Mengambil data..." : "Tampilkan Data"}
      </Button>
      <Button
        onClick={exportToExcel}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full mt-2"
        disabled={data.length === 0}
      >
        Export ke Excel
      </Button>

      {data.length > 0 && (
        <div className="my-4 bg-yellow-50 border border-yellow-300 p-4 rounded text-sm">
          <p className="mb-1">
            <strong>Saldo Awal (Sistem, {gudangFilter}):</strong>{" "}
            {Math.round(saldoAwalSistem)}
          </p>

          <p className="mb-1">
            <strong>Saldo Keseluruhan :</strong>{" "}
            {saldoAwalKegiatanS !== null && saldoAwalKegiatanS !== undefined
              ? Math.round(saldoAwalKegiatanS)
              : "Tidak ada"}
          </p>

          {saldoSemuaGudang.length >= 0 ? (
            <div className="mt-2">
              <strong>Saldo item di semua gudang:</strong>
              <ul className="list-disc list-inside">
                {saldoSemuaGudang.map((g, idx) => (
                  <li key={idx}>
                    {g.gudang}:{" "}
                    {g.saldo !== null && g.saldo !== undefined
                      ? Math.round(g.saldo)
                      : "Tidak ada"}
                  </li>
                ))}
              </ul>

              {/* Hitung total semua gudang */}
              {(() => {
                const totalSaldoGudang = saldoSemuaGudang.reduce(
                  (sum, g) => sum + (g.saldo || 0),
                  0
                );

                return (
                  <>
                    <p className="mt-2 font-semibold">
                      Total semua gudang: {Math.round(totalSaldoGudang)}
                    </p>

                    <p
                      className={`mt-1 ${
                        saldoAwalKegiatanS !== null &&
                        Math.round(totalSaldoGudang) !==
                          Math.round(saldoAwalKegiatanS)
                          ? "text-red-600 font-bold"
                          : "text-green-600 font-semibold"
                      }`}
                    >
                      {saldoAwalKegiatanS !== null
                        ? Math.round(totalSaldoGudang) ===
                          Math.round(saldoAwalKegiatanS)
                          ? "✔️ Sama dengan Saldo Semua"
                          : `⚠️ Berbeda dengan Saldo Semua (${Math.round(
                              saldoAwalKegiatanS
                            )})`
                        : "Saldo Semua belum tersedia"}
                    </p>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="mt-2 text-gray-500 italic">
              Tidak ada data dari semua gudang
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {data.length > 0 && (
        <div className="overflow-x-auto mt-6 mb-4">
          <table className="w-full border border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Tanggal</th>
                <th className="border p-2">Item ID</th>
                <th className="border p-2">Gudang</th>
                <th className="border p-2">Kegiatan</th>
                <th className="border p-2">Keterangan</th>
                <th className="border p-2">IN</th>
                <th className="border p-2">OUT</th>
                <th className="border p-2">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let saldo = 0;
                const bulanDitandai: { [key: string]: boolean } = {};

                // 🔑 bulan & tahun awal pencarian
                const tgl1Date = new Date(form.tgl1);
                const bulanAwal = tgl1Date.getMonth();
                const tahunAwal = tgl1Date.getFullYear();

                return data.map((row, idx) => {
                  saldo += row.KgI - row.KgO;
                  const isSaldoAwal = row.Kegiatan === "S";
                  const moveDate = new Date(row.MoveDate);

                  // baris terakhir di tanggal yang sama
                  const nextRow = data[idx + 1];
                  const isLastInDateGroup =
                    !nextRow ||
                    new Date(nextRow.MoveDate).getDate() !==
                      moveDate.getDate() ||
                    new Date(nextRow.MoveDate).getMonth() !==
                      moveDate.getMonth() ||
                    new Date(nextRow.MoveDate).getFullYear() !==
                      moveDate.getFullYear();

                  // kunci bulan-tahun
                  const keyBulan = `${moveDate.getMonth()}-${moveDate.getFullYear()}`;

                  // apakah sudah pernah ditandai bulan ini?
                  const belumDitandai = !bulanDitandai[keyBulan];

                  // ✅ hanya tandai kalau bukan bulan pertama
                  const bukanBulanPertama =
                    moveDate.getMonth() !== bulanAwal ||
                    moveDate.getFullYear() !== tahunAwal;

                  // tentukan highlight
                  const highlightRow =
                    isLastInDateGroup &&
                    belumDitandai &&
                    !isSaldoAwal &&
                    bukanBulanPertama;

                  let extraNote = "";
                  if (highlightRow) {
                    bulanDitandai[keyBulan] = true; // tandai supaya tidak dobel
                    const bulanTeks = moveDate.toLocaleString("id-ID", {
                      month: "long",
                    });
                    const tahunTeks = moveDate.getFullYear();
                    extraNote = ` (Saldo Awal ${bulanTeks} ${tahunTeks})`;
                  }

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-gray-100 
          ${isSaldoAwal ? "bg-green-200 font-semibold" : ""} 
          ${highlightRow ? "bg-yellow-100" : ""} 
          ${
            !isSaldoAwal && !highlightRow
              ? idx % 2 === 0
                ? "bg-white"
                : "bg-gray-50"
              : ""
          }`}
                    >
                      <td className="border p-2">
                        {typeof row.MoveDate === "string"
                          ? row.MoveDate.substring(0, 10)
                              .split("-")
                              .reverse()
                              .join("/")
                          : new Date(row.MoveDate).toLocaleDateString("id-ID")}
                      </td>

                      <td className="border p-2">{row.ItemID}</td>
                      <td className="border p-2">{row.LocName}</td>
                      <td className="border p-2 text-center">{row.NoMemo}</td>
                      <td className="border p-2">
                        {row.Keterangan}
                        {extraNote && (
                          <span className="text-blue-600 font-medium">
                            {extraNote}
                          </span>
                        )}
                      </td>
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
