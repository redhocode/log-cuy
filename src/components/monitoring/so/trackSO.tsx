/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import axios from "axios";

interface SOData {
  orderid: string;
  ordertype: string;
  orderdate: string;
  companyid: string;
  companyname1: string;
  itemid: string;
  itemname: string;
  sobags: number;
  sokgs: number;
  nota: string;
  movedate: string;
  mbags: number;
  mkgs: number;
  spb: string;
  SuratJln: string;
  moveid: string;
  docid?: string;
}

export default function MonitoringSOPage() {
  const [tgl1, setTgl1] = useState("");
  const [tgl2, setTgl2] = useState("");
  const [company, setCompany] = useState("");
  const [data, setData] = useState<SOData[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ hanya filter Nota
  const [filterNota, setFilterNota] = useState(false);

  const fetchData = async () => {
    if (!tgl1 || !tgl2) {
      alert("Tanggal harus diisi!");
      return;
    }

    setLoading(true);
    try {
      const params = {
        tgl1,
        tgl2,
        item: "%",
        company: company || "%",
        tipe: "%",
        kredit: 0,
        jenisTOP: 0,
      };

      const res = await axios.get("/api/monitoring/so", { params });
      setData(res.data);
    } catch (err) {
      console.error("❌ Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filtering di frontend: hanya tampil SO yang belum ada Nota
  const filteredData = data.filter((row) => {
    const notaNumber = row.moveid || row.nota || row.docid;
    if (filterNota && notaNumber) return false;
    return true;
  });

  // 🔑 Group by Item pakai data hasil filter
  const groupedData = filteredData.reduce((acc: any, row) => {
    const key = `${row.itemid} - ${row.itemname}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">LAPORAN MONITORING SALES ORDER</h1>

      {/* Filter tanggal & company */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium">Tanggal Awal</label>
          <input
            type="date"
            className="border rounded p-2 w-full"
            value={tgl1}
            onChange={(e) => setTgl1(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Tanggal Akhir</label>
          <input
            type="date"
            className="border rounded p-2 w-full"
            value={tgl2}
            onChange={(e) => setTgl2(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Company</label>
          <input
            type="text"
            className="border rounded p-2 w-full"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Kode Company"
          />
        </div>
      </div>

      {/* Filter tambahan */}
      <div className="flex gap-6 mb-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filterNota}
            onChange={(e) => setFilterNota(e.target.checked)}
          />
          Belum ada Nota
        </label>
      </div>

      <button
        onClick={fetchData}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Loading..." : "Cari Data"}
      </button>

      {/* Laporan */}
      <div className="mt-6 space-y-8">
        {Object.keys(groupedData).length === 0 ? (
          <p className="text-gray-500">Tidak ada data</p>
        ) : (
          Object.entries(groupedData).map(([itemKey, rows]) => (
            <div key={itemKey} className="border rounded-lg shadow-sm p-4">
              {/* Header Item */}
              <h2 className="font-semibold text-lg mb-2">{itemKey}</h2>
              <p className="text-sm text-gray-600 mb-4">
                Periode: {tgl1} s/d {tgl2}
              </p>

              {/* Group by Customer */}
              {Object.entries(
                (rows as SOData[]).reduce((acc: any, r) => {
                  if (!acc[r.companyname1]) acc[r.companyname1] = [];
                  acc[r.companyname1].push(r);
                  return acc;
                }, {})
              ).map(([customer, custRows]) => (
                <div key={customer} className="mb-6">
                  <p className="font-medium mb-2">Customer: {customer}</p>
                  <table className="w-full border text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border px-2 py-1">#SO</th>
                        <th className="border px-2 py-1">Tgl SO</th>
                        <th className="border px-2 py-1">Zak</th>
                        <th className="border px-2 py-1">Kg</th>
                        <th className="border px-2 py-1">#Nota</th>
                        <th className="border px-2 py-1">Tgl Nota</th>
                        <th className="border px-2 py-1">Zak</th>
                        <th className="border px-2 py-1">Kg</th>
                        <th className="border px-2 py-1">#SJ</th>
                        {/* <th className="border px-2 py-1">SPB</th> */}
                      </tr>
                    </thead>
                    <tbody>
                      {(custRows as SOData[]).map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="border px-2 py-1">{r.orderid}</td>
                          <td className="border px-2 py-1">
                            {new Date(r.orderdate).toLocaleDateString()}
                          </td>
                          <td className="border px-2 py-1">{r.sobags}</td>
                          <td className="border px-2 py-1">{r.sokgs}</td>
                          <td className="border px-2 py-1">{r.moveid}</td>
                          <td className="border px-2 py-1">
                            {r.movedate
                              ? new Date(r.movedate).toLocaleDateString()
                              : ""}
                          </td>
                          <td className="border px-2 py-1">{r.mbags}</td>
                          <td className="border px-2 py-1">{r.mkgs}</td>
                          <td className="border px-2 py-1">{r.SuratJln}</td>
                          {/* <td className="border px-2 py-1">{r.spb}</td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
