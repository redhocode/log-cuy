/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import UpdateNoPOButton from "@/components/poButton";
import { useState } from "react";

interface TrackingRow {
  SPK: string;
  tanggal_planning: string;
  Nama_PO: string;
  item_po: string;
  status_produksi: string;
  item_produksi: string | null;
  qty: number | null;
  departemen: string | null;
  tanggal_produksi: string | null;
  qty_po: number | null;
  NamaJenis?: string | null;
  // 🔽 tambahan untuk pengiriman
  Nama_PO_Kirim?: string | null;
  tanggal_kirim?: string | null;
  status_kirim?: string | null;
}

interface BomData {
  TransID: number;
  ItemidHD: string;
  itemnamehd: string;
  ItemID: string;
  ItemName: string;
  BahanQty: number;
  Departemen: string;
  NamaJenis: string;
}

export default function TrackingTree() {
  const [data, setData] = useState<TrackingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");

  const [openBOM, setOpenBOM] = useState<Record<string, boolean>>({});
  const [bomData, setBomData] = useState<Record<string, BomData[]>>({});
  const [bomLoading, setBomLoading] = useState<Record<string, boolean>>({});

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

  // filter data
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

    const matchDept = deptFilter === "ALL" || row.departemen === deptFilter;

    return matchSearch && matchStatus && matchDept;
  });

  // group by SPK
  const grouped: any = {};
  filtered.forEach((row) => {
    if (!grouped[row.SPK]) {
      grouped[row.SPK] = {
        info: {
          tanggal_planning: row.tanggal_planning,
          Nama_PO: row.Nama_PO,
        },
        itemsPO: [] as TrackingRow[],
        itemsHasil: [] as TrackingRow[],
        itemsBahan: [] as TrackingRow[],
      };
    }

    const existsPO = grouped[row.SPK].itemsPO.some(
      (x: TrackingRow) => x.item_po === row.item_po && x.qty_po === row.qty_po
    );
    if (!existsPO) {
      grouped[row.SPK].itemsPO.push(row);
    }

    if (row.item_produksi) {
      if (row.NamaJenis === "B") {
        grouped[row.SPK].itemsBahan.push(row);
      } else {
        grouped[row.SPK].itemsHasil.push(row);
      }
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

  const toggleBOM = async (key: string, item_po: string) => {
    if (openBOM[key]) {
      setOpenBOM((prev) => ({ ...prev, [key]: false }));
      return;
    }
    if (!bomData[key]) {
      setBomLoading((prev) => ({ ...prev, [key]: true }));
      try {
        const res = await fetch(`/api/bom?itemid=${item_po}`);
        const json: BomData[] = await res.json();
        setBomData((prev) => ({ ...prev, [key]: json }));
      } catch (err) {
        console.error(err);
        alert("Error ambil BOM");
      }
      setBomLoading((prev) => ({ ...prev, [key]: false }));
    }
    setOpenBOM((prev) => ({ ...prev, [key]: true }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <UpdateNoPOButton />

      {/* filter form */}
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
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 w-48"
            >
              <option value="ALL">Semua</option>
              <option value="Sudah Produksi">Sudah Produksi</option>
              <option value="Belum Produksi">Belum Produksi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">
              Departemen
            </label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 w-48"
            >
              <option value="ALL">Semua</option>
              <option value="SP">Spray</option>
              <option value="IN">Injeksi</option>
              <option value="MO">Molding</option>
              <option value="AS">Assembly</option>
              <option value="PL">Plating</option>
            </select>
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
          <button
            onClick={loadData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            Cari
          </button>
        </div>
      </div>

      {/* hasil */}
      {loading && <p className="text-center">⏳ Loading...</p>}
      {!loading && filtered.length === 0 && (
        <p className="text-center text-gray-500">⚠️ Tidak ada data</p>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {Object.entries(grouped).map(([spk, spkData]: any) => (
          <div key={spk} className="bg-white border rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold">
              📦 SPK: {spk} — {spkData.info.Nama_PO}{" "}
              <span className="text-sm text-gray-500 ml-2">
                ({formatDate(spkData.info.tanggal_planning)})
              </span>
            </h2>

            {/* PO */}
            {spkData.itemsPO.length > 0 && (
              <div>
                <h3 className="font-semibold text-blue-700 mt-3">🛒 Item PO</h3>
                <table className="w-full border text-sm mt-2 rounded-lg overflow-hidden">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="border px-3 py-2 text-left">Item PO</th>
                      <th className="border px-3 py-2 text-left">Qty PO</th>
                      <th className="border px-3 py-2 text-left">BOM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spkData.itemsPO.map((row: TrackingRow, i: number) => {
                      const key = spk + "-" + row.item_po;
                      return (
                        <>
                          <tr
                            key={key}
                            className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                          >
                            <td className="border px-3 py-2">{row.item_po}</td>
                            <td className="border px-3 py-2">{row.qty_po}</td>
                            <td
                              className="border px-3 py-2 text-blue-600 underline cursor-pointer"
                              onClick={() => toggleBOM(key, row.item_po)}
                            >
                              {openBOM[key] ? "▼ Tutup BOM" : "▶ Lihat BOM"}
                            </td>
                          </tr>

                          {openBOM[key] && (
                            <tr className="bg-gray-50">
                              <td colSpan={3} className="border px-3 py-2">
                                {bomLoading[key] ? (
                                  <p className="text-gray-500">
                                    ⏳ Loading BOM...
                                  </p>
                                ) : (
                                  <table className="w-full border text-sm rounded-lg">
                                    <thead className="bg-gray-200">
                                      <tr>
                                        <th className="border px-2 py-1 text-left">
                                          ItemID
                                        </th>
                                        <th className="border px-2 py-1 text-left">
                                          Departemen
                                        </th>
                                        <th className="border px-2 py-1 text-left">
                                          Jenis
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {bomData[key]?.map((b, j) => (
                                        <tr key={j}>
                                          <td className="border px-2 py-1">
                                            {b.ItemID}
                                          </td>
                                          <td className="border px-2 py-1">
                                            {b.Departemen}
                                          </td>
                                          <td className="border px-2 py-1">
                                            {b.NamaJenis}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Produksi */}
            {(spkData.itemsHasil.length > 0 ||
              spkData.itemsBahan.length > 0) && (
              <div className="mt-4">
                <h3 className="font-semibold text-red-700">🏭 Produksi</h3>

                {/* tampilkan bahan kalau ada */}
                {/* tampilkan bahan kalau ada */}
                {spkData.itemsBahan.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold text-gray-600 mb-1">
                      Bahan Produksi:
                    </h4>
                    {(() => {
                      const uniqueBahan = new Map();
                      spkData.itemsBahan.forEach((row: TrackingRow) => {
                        const key = [
                          row.item_produksi,
                          row.qty,
                          row.departemen,
                        ].join("|");
                        if (!uniqueBahan.has(key)) {
                          uniqueBahan.set(key, row);
                        }
                      });
                      const bahanUnik = Array.from(uniqueBahan.values());

                      return (
                        // 🔽 GANTI bagian <ul> ... </ul> dengan <table> ... </table>
                        <table className="w-full border text-sm rounded-lg overflow-hidden">
                          <thead className="bg-yellow-50">
                            <tr>
                              <th className="border px-3 py-2 text-left">
                                Item Bahan
                              </th>
                              <th className="border px-3 py-2 text-right">
                                Qty
                              </th>
                              <th className="border px-3 py-2 text-left">
                                Departemen
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {bahanUnik.map((row: TrackingRow, i: number) => (
                              <tr
                                key={i}
                                className={
                                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }
                              >
                                <td className="border px-3 py-2">
                                  {row.item_produksi}
                                </td>
                                <td className="border px-3 py-2 text-right">
                                  {row.qty ?? "-"}
                                </td>
                                <td className="border px-3 py-2">
                                  {mapDept(row.departemen)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                )}

                {/* tampilkan hasil kalau ada */}
                {spkData.itemsHasil.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 mb-1">
                      Hasil Produksi:
                    </h4>

                    {(() => {
                      // 🔑 buat unique set
                      const unique = new Map();
                      spkData.itemsHasil.forEach((row: TrackingRow) => {
                        const key = [
                          row.item_produksi,
                          row.qty,
                          row.departemen,
                          row.tanggal_produksi,
                        ].join("|");
                        if (!unique.has(key)) {
                          unique.set(key, row);
                        }
                      });
                      const hasilUnik = Array.from(unique.values());

                      return (
                        <table className="w-full border text-sm rounded-lg overflow-hidden">
                          <thead className="bg-green-50">
                            <tr>
                              <th className="border px-3 py-2 text-left">
                                Item Produksi
                              </th>
                              <th className="border px-3 py-2 text-left">
                                Status Produksi
                              </th>
                              <th className="border px-3 py-2 text-right">
                                Qty
                              </th>
                              <th className="border px-3 py-2 text-left">
                                Departemen
                              </th>
                              <th className="border px-3 py-2 text-left">
                                Tanggal Produksi
                              </th>
                              {/* 🔽 kolom baru */}
                              <th className="border px-3 py-2 text-left">
                                Status Kirim
                              </th>
                              <th className="border px-3 py-2 text-left">
                                Tanggal Kirim
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {hasilUnik.map((row: TrackingRow, i: number) => (
                              <tr
                                key={i}
                                className={
                                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }
                              >
                                <td className="border px-3 py-2">
                                  {row.item_produksi}
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

                                {/* 🔽 tambahan kolom kirim */}
                                <td
                                  className={
                                    "border px-3 py-2 " +
                                    (row.status_kirim?.includes("Sudah")
                                      ? "text-green-600 font-semibold"
                                      : "text-red-600 font-semibold")
                                  }
                                >
                                  {row.status_kirim ?? "-"}
                                </td>
                                <td className="border px-3 py-2">
                                  {formatDate(row.tanggal_kirim ?? null)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
