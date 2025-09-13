/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import UpdateNoPOButton from "@/components/poButton";
import { useState } from "react";

interface TrackingRow {
  SPK: string;
  tanggal_planning: string;
  Nama_PO: string;
  item_po: string;
  item_bom: string;
  status_produksi: string;
  item_produksi: string | null;
  qty: number | null;
  departemen: string | null;
  tanggal_produksi: string | null;
  qty_po: number | null;
}

export default function TrackingTree() {
  const [data, setData] = useState<TrackingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadData = async () => {
    setLoading(true);
    let url = "/api/monitoring/po";
    const params: string[] = [];
    if (start) params.push(`start=${start}`);
    if (end) params.push(`end=${end}`);
    if (params.length > 0) url += "?" + params.join("&");

    const res = await fetch(url);
    const json = await res.json();
    if (json.success) {
      setData(json.data);
    } else {
      alert("Gagal: " + json.message);
    }
    setLoading(false);
  };

  // 🔍 Filter data sesuai pencarian + status produksi
  const filtered = data.filter((row) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      row.SPK.toLowerCase().includes(q) ||
      row.Nama_PO.toLowerCase().includes(q) ||
      row.item_po.toLowerCase().includes(q) ||
      (row.item_produksi ?? "").toLowerCase().includes(q) ||
      (row.departemen ?? "").toLowerCase().includes(q);

    const matchStatus =
      statusFilter === "ALL" || row.status_produksi === statusFilter;

    return matchSearch && matchStatus;
  });

  // Group by SPK → item_po → hasil produksi unik
  const grouped: any = {};
  filtered.forEach((row) => {
    if (!grouped[row.SPK]) {
      grouped[row.SPK] = {
        info: {
          tanggal_planning: row.tanggal_planning,
          Nama_PO: row.Nama_PO,
        },
        items: {},
      };
    }
    if (!grouped[row.SPK].items[row.item_po]) {
      grouped[row.SPK].items[row.item_po] = [];
    }

    const arr = grouped[row.SPK].items[row.item_po];
    const exists = arr.some(
      (x: TrackingRow) =>
        x.item_produksi === row.item_produksi &&
        x.qty === row.qty &&
        x.departemen === row.departemen &&
        x.tanggal_produksi === row.tanggal_produksi &&
        x.qty_po === row.qty_po
    );
    if (!exists) {
      arr.push(row);
    }
  });

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function mapDept(code: string | null) {
    if (!code) return "-";
    const dict: Record<string, string> = {
      SP: "Spray",
      IN: "Injeksi",
      MO: "Molding",
      AS: "Assembly",
      PL: "Plating",
    };
    return dict[code] || code;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* 🔍 Form Pencarian */}
      <UpdateNoPOButton />
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-white shadow-md rounded-xl p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Tanggal Awal
            </label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 w-48"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Tanggal Akhir
            </label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 w-48"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600">
              🔎 Pencarian
            </label>
            <input
              type="text"
              placeholder="Cari SPK, PO, atau Item..."
              className="border rounded-lg px-3 py-2 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Status Produksi
            </label>
            <select
              className="border rounded-lg px-3 py-2 w-48"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Semua</option>
              <option value="Sudah Produksi">Sudah Produksi</option>
              <option value="Belum Produksi">Belum Produksi</option>
            </select>
          </div>
          <button
            onClick={loadData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            Cari
          </button>
        </div>
      </div>

      {loading && (
        <p className="text-center text-gray-600 text-lg">⏳ Loading...</p>
      )}
      {!loading && filtered.length === 0 && (
        <p className="text-center text-gray-500 text-lg">⚠️ Tidak ada data</p>
      )}

      {/* 📦 Tampilan Card */}
      <div className="max-w-6xl mx-auto space-y-6">
        {Object.entries(grouped).map(([spk, spkData]: any) => (
          <div
            key={spk}
            className="bg-white border rounded-2xl shadow-lg p-6 space-y-4"
          >
            <h2 className="text-xl font-bold text-gray-800">
              📦 SPK: {spk} — {spkData.info.Nama_PO}
              <span className="text-sm text-gray-500 ml-2">
                ({formatDate(spkData.info.tanggal_planning)})
              </span>
            </h2>

            {Object.entries(spkData.items).map(([itemPO, rows]: any) => (
              <div key={itemPO} className="space-y-2">
                <h3 className="font-semibold text-blue-700 text-lg">
                  🛒 Item PO: {itemPO}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border text-sm rounded-lg overflow-hidden">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="border px-3 py-2 text-left">Qty PO</th>
                        <th className="border px-3 py-2 text-left">
                          Item Produksi
                        </th>
                        <th className="border px-3 py-2 text-left">Status</th>
                        <th className="border px-3 py-2 text-right">Qty</th>
                        <th className="border px-3 py-2 text-left">
                          Departemen
                        </th>
                        <th className="border px-3 py-2 text-left">Tanggal Produksi</th>
                     <th className="border px-3 py-2 text-left">Status Pengiriman</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row: TrackingRow, i: number) => (
                        <tr
                          key={i}
                          className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="border px-3 py-2 font-medium">
                            {row.qty_po || "-"}
                          </td>
                          <td className="border px-3 py-2 font-medium">
                            {row.item_produksi || "-"}
                          </td>
                          <td
                            className={
                              "border px-3 py-2 " +
                              (row.status_produksi.includes("Sudah")
                                ? "text-green-600 font-semibold"
                                : "text-red-600 font-semibold")
                            }
                          >
                            {row.status_produksi}
                          </td>
                          <td className="border px-3 py-2 text-right">
                            {row.qty ?? "-"}
                          </td>
                          <td className="border px-3 py-2">
                            {mapDept(row.departemen)}
                          </td>
                          <td className="border px-3 py-2">
                            {formatDate(row.tanggal_produksi)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
