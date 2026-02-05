"use client";
import React, { useEffect, useState, useCallback } from "react";
import { DataTable } from "../data-table";
import { columns as getColumns } from "./columns";
import Loading from "@/app/loading";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Send, Download, Filter, CalendarDays, BarChart3 } from "lucide-react";
import { Badge } from "../ui/badge";
import * as XLSX from "xlsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Separator } from "../ui/separator";

export interface retur {
  PembeliPeneima: string;
  KodeBarang: string;
  NamaBarang: string;
  Jumlah: number;
  JenisDokPabean: string;
  TanggalSuratJalan: string;
  Satuan: string;
  Curr: string;
  NilaiBarang: number;
}

export default function ReturPage() {
  const [data, setData] = useState<retur[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<retur[]>([]);
  const [tgl1, setTgl1] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [tgl2, setTgl2] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isSending, setIsSending] = useState(false);

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
        return { success: true };
      } else {
        console.error("❌ Gagal kirim Telegram");
        return { success: false, error: "Gagal mengirim notifikasi" };
      }
    } catch (error) {
      console.error("🚨 Error kirim Telegram:", error);
      return { success: false, error: "Terjadi kesalahan" };
    }
  };

  // Fungsi untuk format tanggal Indonesia
  const formatTanggal = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fungsi untuk format mata uang
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency || 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Fungsi untuk format angka tanpa mata uang
  // const formatNumber = (amount: number) => {
  //   return new Intl.NumberFormat('id-ID', {
  //     minimumFractionDigits: 0,
  //     maximumFractionDigits: 0
  //   }).format(amount);
  // };

  // Fungsi untuk export ke Excel dengan format yang benar dan total
  const exportToExcel = () => {
    setIsExporting(true);
    try {
      // Hitung total
      const totalJumlah = data.reduce((sum, item) => sum + item.Jumlah, 0);
      const totalNilaiIDR = data
        .filter(item => item.Curr === 'IDR')
        .reduce((sum, item) => sum + (item.NilaiBarang || 0), 0);
      const totalNilaiUSD = data
        .filter(item => item.Curr === 'USD')
        .reduce((sum, item) => sum + (item.NilaiBarang || 0), 0);
      const totalNilaiAll = data.reduce((sum, item) => sum + (item.NilaiBarang || 0), 0);

      // Format data untuk Excel (tambahkan Curr dan NilaiBarang)
      const excelData = data.map((item, index) => ({
        "No": index + 1,
        "Pembeli/Penerima": item.PembeliPeneima,
        "Kode Barang": item.KodeBarang,
        "Nama Barang": item.NamaBarang,
        "Jumlah": item.Jumlah,
        "Satuan": item.Satuan,
        "Jenis Dokumen Pabean": item.JenisDokPabean,
        "Tanggal Surat Jalan": formatTanggal(item.TanggalSuratJalan),
        "Mata Uang": item.Curr || "IDR",
        "Nilai Barang": item.NilaiBarang || 0,
        "Nilai Barang (Format)": formatCurrency(item.NilaiBarang || 0, item.Curr || "IDR")
      }));

      // Buat workbook baru
      const wb = XLSX.utils.book_new();
      
      // Buat array untuk seluruh konten worksheet
      const today = new Date();
      const worksheetData = [
        ["LAPORAN PENGELUARAN BARANG RETUR PEMBELIAN"],
        [`Periode: ${formatTanggal(tgl1)} s/d ${formatTanggal(tgl2)}`],
        [`Tanggal Export: ${today.toLocaleDateString('id-ID')} ${today.toLocaleTimeString('id-ID')}`],
        [`Jumlah Data: ${data.length} item`],
        [], // Baris kosong
        ["No", "Pembeli/Penerima", "Kode Barang", "Nama Barang", "Jumlah", "Satuan", 
         "Jenis Dokumen Pabean", "Tanggal Surat Jalan", "Mata Uang", "Nilai Barang", "Nilai Barang (Format)"],
        ...excelData.map(item => [
          item["No"],
          item["Pembeli/Penerima"],
          item["Kode Barang"],
          item["Nama Barang"],
          item["Jumlah"],
          item["Satuan"],
          item["Jenis Dokumen Pabean"],
          item["Tanggal Surat Jalan"],
          item["Mata Uang"],
          item["Nilai Barang"],
          item["Nilai Barang (Format)"]
        ]),
        [], // Baris kosong sebelum total
        ["TOTAL", "", "", "", totalJumlah, "", "", "", "", totalNilaiAll, formatCurrency(totalNilaiAll, "IDR")],
        [], // Baris kosong
        ["RINCIAN TOTAL NILAI:", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", ""],
        ["Mata Uang", "Jumlah Transaksi", "Total Nilai", "Total Nilai (Format)"],
        ["IDR", 
          data.filter(item => item.Curr === 'IDR').length,
          totalNilaiIDR,
          formatCurrency(totalNilaiIDR, "IDR")
        ],
        ["USD", 
          data.filter(item => item.Curr === 'USD').length,
          totalNilaiUSD,
          formatCurrency(totalNilaiUSD, "USD")
        ],
        ["TOTAL SEMUA", 
          data.length,
          totalNilaiAll,
          formatCurrency(totalNilaiAll, "IDR")
        ]
      ];
      
      // Buat worksheet dari array data
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Atur lebar kolom
      const colWidths = [
        { wch: 5 },    // No
        { wch: 25 },   // Pembeli/Penerima
        { wch: 15 },   // Kode Barang
        { wch: 30 },   // Nama Barang
        { wch: 10 },   // Jumlah
        { wch: 10 },   // Satuan
        { wch: 15 },   // Jenis Dokumen
        { wch: 15 },   // Tanggal
        { wch: 10 },   // Mata Uang
        { wch: 15 },   // Nilai Barang
        { wch: 20 },   // Nilai Barang (Format)
      ];
      ws['!cols'] = colWidths;
      
      // Merge cells untuk header info (baris 1-4, kolom A-K)
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push(
        { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, // Baris 1: Judul
        { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }, // Baris 2: Periode
        { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } }, // Baris 3: Tanggal Export
        { s: { r: 3, c: 0 }, e: { r: 3, c: 10 } }, // Baris 4: Jumlah Data
        // Merge untuk baris total
        { s: { r: worksheetData.length - 9, c: 0 }, e: { r: worksheetData.length - 9, c: 3 } }, // "TOTAL"
        { s: { r: worksheetData.length - 7, c: 0 }, e: { r: worksheetData.length - 7, c: 10 } }, // "RINCIAN TOTAL NILAI:"
        // Merge untuk header rincian
        { s: { r: worksheetData.length - 4, c: 0 }, e: { r: worksheetData.length - 4, c: 1 } }, // "Mata Uang" dan "Jumlah Transaksi"
        { s: { r: worksheetData.length - 4, c: 2 }, e: { r: worksheetData.length - 4, c: 3 } }, // "Total Nilai" dan "Total Nilai (Format)"
        // Merge untuk total semua
        { s: { r: worksheetData.length - 1, c: 0 }, e: { r: worksheetData.length - 1, c: 1 } } // "TOTAL SEMUA"
      );

      // Tambahkan worksheet ke workbook
      XLSX.utils.book_append_sheet(wb, ws, "Pengeluaran Penjualan");

      // Generate nama file
      const fileName = `Laporan_Pengeluaran_${tgl1.replace(/-/g, '')}_sd_${tgl2.replace(/-/g, '')}.xlsx`;

      // Download file
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("❌ Gagal export Excel:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Export data yang dipilih saja dengan total
  const exportSelectedToExcel = () => {
    if (selectedRows.length === 0) return;
    
    setIsExporting(true);
    try {
      // Hitung total untuk data terpilih
      const totalJumlah = selectedRows.reduce((sum, item) => sum + item.Jumlah, 0);
      const totalNilaiIDR = selectedRows
        .filter(item => item.Curr === 'IDR')
        .reduce((sum, item) => sum + (item.NilaiBarang || 0), 0);
      const totalNilaiUSD = selectedRows
        .filter(item => item.Curr === 'USD')
        .reduce((sum, item) => sum + (item.NilaiBarang || 0), 0);
      const totalNilaiAll = selectedRows.reduce((sum, item) => sum + (item.NilaiBarang || 0), 0);

      const excelData = selectedRows.map((item, index) => ({
        "No": index + 1,
        "Pembeli/Penerima": item.PembeliPeneima,
        "Kode Barang": item.KodeBarang,
        "Nama Barang": item.NamaBarang,
        "Jumlah": item.Jumlah,
        "Satuan": item.Satuan,
        "Jenis Dokumen Pabean": item.JenisDokPabean,
        "Tanggal Surat Jalan": formatTanggal(item.TanggalSuratJalan),
        "Mata Uang": item.Curr || "IDR",
        "Nilai Barang": item.NilaiBarang || 0,
        "Nilai Barang (Format)": formatCurrency(item.NilaiBarang || 0, item.Curr || "IDR")
      }));

      // Buat workbook baru
      const wb = XLSX.utils.book_new();
      
      const today = new Date();
      const worksheetData = [
        ["LAPORAN PENGELUARAN BARANG (DATA TERPILIH)"],
        [`Periode: ${formatTanggal(tgl1)} s/d ${formatTanggal(tgl2)}`],
        [`Tanggal Export: ${today.toLocaleDateString('id-ID')} ${today.toLocaleTimeString('id-ID')}`],
        [`Jumlah Data: ${selectedRows.length} item`],
        [], // Baris kosong
        ["No", "Pembeli/Penerima", "Kode Barang", "Nama Barang", "Jumlah", "Satuan", 
         "Jenis Dokumen Pabean", "Tanggal Surat Jalan", "Mata Uang", "Nilai Barang", "Nilai Barang (Format)"],
        ...excelData.map(item => [
          item["No"],
          item["Pembeli/Penerima"],
          item["Kode Barang"],
          item["Nama Barang"],
          item["Jumlah"],
          item["Satuan"],
          item["Jenis Dokumen Pabean"],
          item["Tanggal Surat Jalan"],
          item["Mata Uang"],
          item["Nilai Barang"],
          item["Nilai Barang (Format)"]
        ]),
        [], // Baris kosong sebelum total
        ["TOTAL", "", "", "", totalJumlah, "", "", "", "", totalNilaiAll, formatCurrency(totalNilaiAll, "IDR")],
        [], // Baris kosong
        ["RINCIAN TOTAL NILAI:", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", ""],
        ["Mata Uang", "Jumlah Transaksi", "Total Nilai", "Total Nilai (Format)"],
        ["IDR", 
          selectedRows.filter(item => item.Curr === 'IDR').length,
          totalNilaiIDR,
          formatCurrency(totalNilaiIDR, "IDR")
        ],
        ["USD", 
          selectedRows.filter(item => item.Curr === 'USD').length,
          totalNilaiUSD,
          formatCurrency(totalNilaiUSD, "USD")
        ],
        ["TOTAL SEMUA", 
          selectedRows.length,
          totalNilaiAll,
          formatCurrency(totalNilaiAll, "IDR")
        ]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Atur lebar kolom
      const colWidths = [
        { wch: 5 },
        { wch: 25 },
        { wch: 15 },
        { wch: 30 },
        { wch: 10 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 15 },
        { wch: 20 },
      ];
      ws['!cols'] = colWidths;

      // Merge cells untuk header
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push(
        { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 10 } },
        // Merge untuk baris total
        { s: { r: worksheetData.length - 9, c: 0 }, e: { r: worksheetData.length - 9, c: 3 } }, // "TOTAL"
        { s: { r: worksheetData.length - 7, c: 0 }, e: { r: worksheetData.length - 7, c: 10 } }, // "RINCIAN TOTAL NILAI:"
        // Merge untuk header rincian
        { s: { r: worksheetData.length - 4, c: 0 }, e: { r: worksheetData.length - 4, c: 1 } },
        { s: { r: worksheetData.length - 4, c: 2 }, e: { r: worksheetData.length - 4, c: 3 } },
        // Merge untuk total semua
        { s: { r: worksheetData.length - 1, c: 0 }, e: { r: worksheetData.length - 1, c: 1 } }
      );

      XLSX.utils.book_append_sheet(wb, ws, "Pengeluaran_Terpilih");

      const fileName = `Pengeluaran_Terpilih_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("❌ Gagal export data terpilih:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Export data dalam format yang lebih sederhana dengan total
  const exportToExcelSimple = () => {
    setIsExporting(true);
    try {
      // Hitung total
      const totalJumlah = data.reduce((sum, item) => sum + item.Jumlah, 0);
      const totalNilaiAll = data.reduce((sum, item) => sum + (item.NilaiBarang || 0), 0);

      // Format data untuk Excel
      const excelData = data.map((item, index) => ({
        "No": index + 1,
        "Pembeli/Penerima": item.PembeliPeneima,
        "Kode Barang": item.KodeBarang,
        "Nama Barang": item.NamaBarang,
        "Jumlah": item.Jumlah,
        "Satuan": item.Satuan,
        "Jenis Dokumen Pabean": item.JenisDokPabean,
        "Tanggal Surat Jalan": formatTanggal(item.TanggalSuratJalan),
        "Mata Uang": item.Curr || "IDR",
        "Nilai Barang": item.NilaiBarang || 0,
        "Nilai Barang (Format)": formatCurrency(item.NilaiBarang || 0, item.Curr || "IDR")
      }));

      // Buat worksheet langsung dari data
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Tambahkan baris total di akhir
      const totalRow = {
        "No": "TOTAL",
        "Pembeli/Penerima": "",
        "Kode Barang": "",
        "Nama Barang": "",
        "Jumlah": totalJumlah,
        "Satuan": "",
        "Jenis Dokumen Pabean": "",
        "Tanggal Surat Jalan": "",
        "Mata Uang": "",
        "Nilai Barang": totalNilaiAll,
        "Nilai Barang (Format)": formatCurrency(totalNilaiAll, "IDR")
      };
      
      // Tambahkan baris total ke worksheet
      XLSX.utils.sheet_add_json(ws, [totalRow], { 
        origin: -1, // Tambah di baris terakhir
        skipHeader: true 
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pengeluaran Penjualan");

      // Atur lebar kolom
      const wscols = [
        { wch: 5 },    // No
        { wch: 25 },   // Pembeli/Penerima
        { wch: 15 },   // Kode Barang
        { wch: 30 },   // Nama Barang
        { wch: 10 },   // Jumlah
        { wch: 10 },   // Satuan
        { wch: 15 },   // Jenis Dokumen
        { wch: 15 },   // Tanggal
        { wch: 10 },   // Mata Uang
        { wch: 15 },   // Nilai Barang
        { wch: 20 },   // Nilai Barang (Format)
      ];
      ws['!cols'] = wscols;

      const fileName = `Laporan_Pengeluaran_${tgl1.replace(/-/g, '')}_sd_${tgl2.replace(/-/g, '')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("❌ Gagal export Excel:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const url = new URL("/api/returpembelian", window.location.origin);
    const finalTgl1 = tgl1 || new Date().toISOString().split("T")[0];
    const finalTgl2 = tgl2 || new Date().toISOString().split("T")[0];

    url.searchParams.append("tgl1", finalTgl1);
    url.searchParams.append("tgl2", finalTgl2);

    try {
      const res = await fetch(url.toString());
      const json = await res.json();

      const filtered = json.filter(
        (item: retur) =>
          item.JenisDokPabean === "BC 3.0" || item.JenisDokPabean === "BC 4.1" || item.JenisDokPabean === "BC 2.5" || item.JenisDokPabean === "BC 2.7"  
      );

      setData(filtered);

      // ✅ Kirim otomatis jika hari ini
      const today = new Date().toISOString().split("T")[0];
      if (finalTgl1 === today && finalTgl2 === today && filtered.length > 0) {
        const header = `📦 *Laporan Pengeluaran Retur Hari Ini* (${today})\n\n`;
        const body = filtered
          .map(
            (item: retur, index: number) =>
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
  }, [tgl1, tgl2]);

  const handleSendTelegram = async () => {
    if (data.length === 0) return;
    
    setIsSending(true);
    const header = `📦 *Laporan Pengeluaran Penjualan*\n📅 Tanggal: ${formatTanggal(tgl1)} s/d ${formatTanggal(tgl2)}\n\n`;
    const body = data
      .map(
        (item, index) =>
          `📋 ${index + 1}.\n` +
          `🛒 Barang: ${item.KodeBarang}\n` +
          `🔢 Jumlah: ${item.Jumlah} ${item.Satuan}\n` +
          `📍 Tujuan: ${item.PembeliPeneima}\n` +
          `📅 Tanggal: ${formatTanggal(item.TanggalSuratJalan)}\n`
      )
      .join("\n");

    const result = await sendTelegramMessage(header + body);
    
    if (result.success) {
      console.log("Notifikasi berhasil dikirim");
    }
    
    setIsSending(false);
  };

  const handleSendSelectedTelegram = async () => {
    if (selectedRows.length === 0) return;
    
    setIsSending(true);
    const header = `📦 *Laporan Pengeluaran Penjualan (Terpilih)*\n📅 Tanggal: ${formatTanggal(tgl1)} s/d ${formatTanggal(tgl2)}\n📊 Jumlah: ${selectedRows.length} item\n\n`;
    const body = selectedRows
      .map(
        (item, index) =>
          `📋 ${index + 1}.\n` +
          `🛒 Barang: ${item.KodeBarang}\n` +
          `🔢 Jumlah: ${item.Jumlah} ${item.Satuan}\n` +
          `📍 Tujuan: ${item.PembeliPeneima}\n` +
          `📅 Tanggal: ${formatTanggal(item.TanggalSuratJalan)}\n`
      )
      .join("\n");

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await sendTelegramMessage(header + body);
    setIsSending(false);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Statistik
  const totalJumlah = data.reduce((sum, item) => sum + item.Jumlah, 0);
  const totalNilai = data.reduce((sum, item) => sum + (item.NilaiBarang || 0), 0);
  const totalNilaiIDR = data
    .filter(item => item.Curr === 'IDR')
    .reduce((sum, item) => sum + (item.NilaiBarang || 0), 0);
  const totalNilaiUSD = data
    .filter(item => item.Curr === 'USD')
    .reduce((sum, item) => sum + (item.NilaiBarang || 0), 0);
  const dokumenTypes = data.reduce((acc, item) => {
    acc[item.JenisDokPabean] = (acc[item.JenisDokPabean] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Laporan Pengeluaran Retur</h1>
          <p className="text-muted-foreground">
              Monitor dan kelola data pengeluaran barang dengan dokumen
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="data" className="space-y-4">
        <TabsList>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Data Pengeluaran Retur
          </TabsTrigger>
          <TabsTrigger value="statistik" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Statistik
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter Data</CardTitle>
              <CardDescription>
                Pilih rentang tanggal untuk melihat laporan retur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Tanggal Mulai */}
                <div className="space-y-2">
                  <Label htmlFor="tgl1" className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Tanggal Mulai
                  </Label>
                  <Input
                    type="date"
                    id="tgl1"
                    value={tgl1}
                    onChange={(e) => setTgl1(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Tanggal Selesai */}
                <div className="space-y-2">
                  <Label htmlFor="tgl2" className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Tanggal Selesai
                  </Label>
                  <Input
                    type="date"
                    id="tgl2"
                    value={tgl2}
                    onChange={(e) => setTgl2(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Tombol Filter */}
                <div className="flex items-end">
                  <Button onClick={fetchData} className="w-full">
                    <Filter className="mr-2 h-4 w-4" />
                    Terapkan Filter
                  </Button>
                </div>

                {/* Tombol Kirim */}
                <div className="flex items-end">
                  <Button
                    onClick={handleSendTelegram}
                    className="w-full"
                    disabled={data.length === 0 || isSending}
                  >
                    {isSending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Kirim Notifikasi
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Statistik Ringkas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Data</p>
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold">{data.length}</h3>
                    <Badge variant={data.length > 0 ? "default" : "secondary"}>
                      Barang
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Jumlah</p>
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold">{totalJumlah.toLocaleString()}</h3>
                    <Badge variant="outline">Unit</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Nilai IDR</p>
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold">{formatCurrency(totalNilaiIDR, "IDR")}</h3>
                    <Badge variant="outline">IDR</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Nilai USD</p>
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold">{formatCurrency(totalNilaiUSD, "USD")}</h3>
                    <Badge variant="outline">USD</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabel dan Aksi */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Data Pengeluaran Retur</CardTitle>
                <CardDescription>
                  {data.length} data ditemukan untuk periode {formatTanggal(tgl1)} s/d {formatTanggal(tgl2)}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {selectedRows.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1">
                      {selectedRows.length} baris dipilih
                    </Badge>
                    <Separator orientation="vertical" className="h-6" />
                    <Button
                      onClick={handleSendSelectedTelegram}
                      variant="outline"
                      size="sm"
                      disabled={isSending}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Kirim Terpilih
                    </Button>
                    <Button
                      onClick={exportSelectedToExcel}
                      variant="outline"
                      size="sm"
                      disabled={isExporting || selectedRows.length === 0}
                    >
                      {isExporting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Mengekspor...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Export Terpilih
                        </>
                      )}
                    </Button>
                  </div>
                )}
                <Button
                  onClick={exportToExcel}
                  disabled={data.length === 0 || isExporting}
                  size="sm"
                >
                  {isExporting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Mengekspor...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export Excel
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {data.length === 0 ? (
                <Alert>
                  <AlertTitle>Tidak ada data</AlertTitle>
                  <AlertDescription>
                    Tidak ada data retur untuk periode yang dipilih. Coba ubah rentang tanggal.
                  </AlertDescription>
                </Alert>
              ) : (
                <DataTable 
                  columns={getColumns(setSelectedRows)} 
                  data={data}
                  // className="border rounded-md"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistik" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistik Pengeluaran Penjualan</CardTitle>
              <CardDescription>
                Analisis data retur periode {formatTanggal(tgl1)} s/d {formatTanggal(tgl2)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Ringkasan Data</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span>Total Data</span>
                        <Badge variant="secondary">{data.length} item</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span>Total Jumlah Barang</span>
                        <Badge variant="secondary">{totalJumlah.toLocaleString()} unit</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span>Total Nilai Barang (IDR)</span>
                        <Badge variant="secondary">{formatCurrency(totalNilaiIDR, "IDR")}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span>Total Nilai Barang (USD)</span>
                        <Badge variant="secondary">{formatCurrency(totalNilaiUSD, "USD")}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span>Total Nilai (Semua)</span>
                        <Badge variant="secondary">{formatCurrency(totalNilai, "IDR")}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Jenis Dokumen</h3>
                    <div className="space-y-3">
                      {Object.entries(dokumenTypes).map(([jenis, count]) => (
                        <div key={jenis} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span>{jenis}</span>
                          <Badge variant="default">{count} item</Badge>
                        </div>
                      ))}
                      {Object.keys(dokumenTypes).length === 0 && (
                        <div className="text-center p-4 text-muted-foreground">
                          Tidak ada data dokumen
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Ekspor Data</h3>
                <div className="flex gap-3">
                  <Button
                    onClick={exportToExcel}
                    disabled={data.length === 0}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Semua Data (Format Lengkap)
                  </Button>
                  <Button
                    onClick={exportToExcelSimple}
                    disabled={data.length === 0}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Format Sederhana
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}