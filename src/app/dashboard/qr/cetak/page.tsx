"use client";

import { useEffect, useState, useRef } from "react";
import GenerateQrCode from "@/components/generateQR";

interface Item {
  ItemID: string | number;
  ItemName: string;
}

const ITEMS_PER_PAGE = 24;

export default function CetakQrPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paperSize, setPaperSize] = useState("A4");
  const [currentPage, setCurrentPage] = useState(1);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchItems() {
      const res = await fetch("/api/master");
      const data = await res.json();
      setItems(data);
    }

    fetchItems();
  }, []);

  const filteredItems = items.filter(
    (item) =>
      item.ItemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ItemID?.toString().includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const newWin = window.open("", "", "width=800,height=600");
      if (newWin) {
        newWin.document.write(`
          <html>
            <head>
              <title>Cetak QR Code</title>
              <style>
                body {
                  font-family: sans-serif;
                  padding: 10mm;
                }

                .grid {
                  display: grid;
                  ${
                    paperSize === "A4"
                      ? "grid-template-columns: repeat(4, 1fr);"
                      : paperSize === "A5"
                      ? "grid-template-columns: repeat(2, 1fr);"
                      : "grid-template-columns: repeat(3, 1fr);"
                  }
                  gap: 12px;
                }

                .item {
                  text-align: center;
                  font-size: 10px;
                }

                img {
                  display: block;
                  margin: 0 auto;
                }
              </style>
            </head>
            <body>
              <div class="grid">
                ${printContents}
              </div>
              <script>
                window.onload = function () {
                  window.print();
                  window.onafterprint = function () { window.close(); }
                }
              </script>
            </body>
          </html>
        `);
        newWin.document.close();
      }
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🖨️ Cetak QR Code Barang</h1>

      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Cetak QR
        </button>

        <label className="text-sm">
          Ukuran Kertas:
          <select
            value={paperSize}
            onChange={(e) => setPaperSize(e.target.value)}
            className="ml-2 border px-2 py-1 rounded text-sm"
          >
            <option value="A4">A4 (4 kolom)</option>
            <option value="A5">A5 (2 kolom)</option>
            <option value="Label">Label (3 kolom)</option>
          </select>
        </label>

        <input
          type="text"
          placeholder="🔍 Cari Item Name / ID..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // reset ke halaman pertama saat cari
          }}
          className="border border-gray-300 rounded px-3 py-1 text-sm w-full md:w-64"
        />
      </div>

      {/* TAMPILAN CETAK */}
      <div
        ref={printRef}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-4"
      >
        {paginatedItems.map((item) => (
          <div key={item.ItemID} className="item">
            <GenerateQrCode itemName={item.ItemName} size={120} />
            <div className="mt-1 text-xs text-gray-700">{item.ItemID}</div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center mt-6 mb-6">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className={`px-4 py-2 rounded ${
            currentPage === 1
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          ⬅️ Sebelumnya
        </button>

        <span className="text-sm text-gray-600">
          Halaman {currentPage} dari {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className={`px-4 py-2 rounded ${
            currentPage === totalPages
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          Berikutnya ➡️
        </button>
      </div>
    </div>
  );
}
