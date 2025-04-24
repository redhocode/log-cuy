"use client";
import React, { useEffect, useState } from "react";
import { DataTable } from "../data-table";
import { columns as getColumns } from "./columns";
import Loading from "@/app/loading";

export interface pengeluaran {
  PembeliPeneima: string;
  KodeBarang: string;
  NamaBarang: string;
  Jumlah: number;
  JenisDokPabean: string;
  TanggalSuratJalan: string;
  Satuan: string;
}

export default function PengeluaranPage() {
  const [data, setData] = useState<pengeluaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<pengeluaran[]>([]);
  const [tgl1, setTgl1] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [tgl2, setTgl2] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Kirim ke Telegram
  const sendTelegramMessage = async (message: string) => {
    try {
      const response = await fetch("/api/notif/exim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      if (data.success) {
        console.log("✅ Telegram terkirim:", message);
      } else {
        console.error("❌ Gagal kirim Telegram");
      }
    } catch (error) {
      console.error("🚨 Error kirim Telegram:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const url = new URL("/api/pengeluaran", window.location.origin);
    const finalTgl1 = tgl1 || new Date().toISOString().split("T")[0];
    const finalTgl2 = tgl2 || new Date().toISOString().split("T")[0];

    url.searchParams.append("tgl1", finalTgl1);
    url.searchParams.append("tgl2", finalTgl2);

    try {
      const res = await fetch(url.toString());
      const json = await res.json();

      const filtered = json.filter(
        (item: pengeluaran) =>
          item.JenisDokPabean === "BC 3.0" || item.JenisDokPabean === "BC 4.1"
      );

      setData(filtered);

      // ✅ Kirim otomatis jika hari ini
      const today = new Date().toISOString().split("T")[0];
      if (finalTgl1 === today && finalTgl2 === today && filtered.length > 0) {
        const header = `📦 *Laporan Pengeluaran Hari Ini* (${today})\n\n`;
        const body = filtered
          .map(
            (item:pengeluaran, index:number) =>
              `📋 ${index + 1}.\n` +
              `🛒 Barang: ${item.KodeBarang}\n` +
              `🔢 Jumlah: ${item.Jumlah} ${item.Satuan}\n` +
              `📍 Tujuan: ${item.PembeliPeneima}\n` +
              `📅 Tanggal: ${item.TanggalSuratJalan}\n`
          )
          .join("\n");

        await sendTelegramMessage(header + body);
      }
    } catch (err) {
      console.error("❌ Gagal fetch data:", err);
    } finally {
      setLoading(false);
    }
  };
const handleSendTelegram = async () => {
  if (data.length === 0) return;

  const header = `📦 *Laporan Pengeluaran*\n📅 Tanggal: ${tgl1} s/d ${tgl2}\n\n`;
  const body = data
    .map(
      (item, index) =>
        `📋 ${index + 1}.\n` +
        `🛒 Barang: ${item.KodeBarang}\n` +
        `🔢 Jumlah: ${item.Jumlah} ${item.Satuan}\n` +
        `📍 Tujuan: ${item.PembeliPeneima}\n` +
        `📅 Tanggal: ${item.TanggalSuratJalan}\n`
    )
    .join("\n");

  await sendTelegramMessage(header + body);
}

  useEffect(() => {
    fetchData();
  }, [tgl1, tgl2]);

  if (loading) return <Loading />;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Laporan Pengeluaran</h1>

      {/* Filter Tanggal */}
      <div className="mb-4 flex gap-4">
        <div>
          <label htmlFor="tgl1" className="block text-sm font-semibold">
            Tanggal Mulai
          </label>
          <input
            type="date"
            id="tgl1"
            value={tgl1}
            onChange={(e) => setTgl1(e.target.value)}
            className="p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="tgl2" className="block text-sm font-semibold">
            Tanggal Selesai
          </label>
          <input
            type="date"
            id="tgl2"
            value={tgl2}
            onChange={(e) => setTgl2(e.target.value)}
            className="p-2 border rounded"
          />
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Filter
        </button>
      </div>
  <button
    onClick={handleSendTelegram}
    className="px-4 py-2 bg-green-600 text-white rounded-md"
    disabled={data.length === 0}
  >
    Kirim Notif Telegram
  </button>

      {/* Tampilkan jumlah data dipilih */}
      {selectedRows.length > 0 && (
        <div className="mb-2 text-sm text-gray-500">
          {selectedRows.length} baris dipilih
        </div>
      )}

      {/* Tabel */}
      <DataTable columns={getColumns(setSelectedRows)} data={data} />
    </div>
  );
}
