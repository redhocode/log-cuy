// app/cek-stok-qrcode/page.tsx
"use client";

import { useState } from "react";
import QrScanner from "@/components/qrscanner";

export default function CekStokQrCodePage() {
  const [itemName, setItemName] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [stock, setStock] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (scannedItemName: string) => {
    setLoading(true);
    setItemName(scannedItemName);
    setItemId(null);
    setStock(null);

    try {
      // 1. Ambil data barang & cari berdasarkan ItemName
      const res = await fetch("/api/master");
      const items = await res.json();

      interface Item {
        ItemID: string;
        ItemName: string;
        // Add other properties if needed
      }

      const match = (items as Item[]).find(
        (item: Item) =>
          item.ItemName?.trim().toUpperCase() ===
          scannedItemName.trim().toUpperCase()
      );

      if (!match) {
        alert("❌ Item tidak ditemukan.");
        return;
      }

      setItemId(match.ItemID);

      // 2. Fetch stok
      const stokRes = await fetch(
        `/api/stock?item=${match.ItemID}&tgl=2023-12-31&loc=%&company=0&tipestock=0&jenisbarang=9&kategori=BAHAN BAKU&minus=0`
      );
      const stokJson = await stokRes.json();
      const stockAkhir = stokJson.stockAkhir?.totalKgs || 0;
      setStock(Math.round(stockAkhir));
    } catch (error) {
      console.error("❌ Gagal cek stok:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Cek Stok via QR Code</h1>

      <QrScanner onScan={handleScan} />

      {itemName && (
        <div className="mt-6 p-4 border rounded shadow bg-white">
          <p>
            <strong>📦 Item Name:</strong> {itemName}
          </p>
          {itemId && (
            <p>
              <strong>🔑 Item ID:</strong> {itemId}
            </p>
          )}
          {loading ? (
            <p className="text-blue-500 mt-2">🔄 Mengambil stok...</p>
          ) : stock !== null ? (
            <p className="text-green-600 mt-2">
              ✅ <strong>Stok:</strong> {stock.toLocaleString("id-ID")} Kg
            </p>
          ) : (
            <p className="text-red-500 mt-2">❌ Gagal mendapatkan stok</p>
          )}
        </div>
      )}
    </div>
  );
}
