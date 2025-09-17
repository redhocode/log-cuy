"use client";
import Loading from "@/app/loading";
import { useEffect, useState } from "react";

interface PORecord {
  orderid: string;
  orderdate: string;
  companyid: string;
  companyname1: string;
  itemid: string;
  itemname: string;
  poprice: number;
  pobags: number;
  pokgs: number;
  moveid: string;
  movedate: string;
  mbags: number;
  mkgs: number;
  transid: string;
  transdate: string;
  nbags: number;
  nkgs: number;
  CompanyInvNo: string;
}

interface KartuStockData {
  ItemID: string;
  locid: string;
  MoveDate: string;
  Kegiatan: string;
  Keterangan: string;
  KgI: number;
  KgO: number;
  NoMemo: string;
  Saldo?: number; // saldo kumulatif
}


export default function MonitoringPOPage() {
  const [data, setData] = useState<PORecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [tgl1, setTgl1] = useState("2025-09-01");
  const [tgl2, setTgl2] = useState("2025-09-30");
  const [filter, setFilter] = useState<"all" | "masuk" | "pembelian">("all");
  const [stockData, setStockData] = useState<Record<string, KartuStockData[]>>(
    {}
  );
  const [stockLoading, setStockLoading] = useState<Record<string, boolean>>({});
const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/monitoring/po-beli?tgl1=${tgl1}&tgl2=${tgl2}`
      );
      const d = await res.json();
      setData(Array.isArray(d) ? d : d.recordset ?? []);
    } catch (err) {
      console.error("Gagal fetch data:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

 const fetchStock = async (item: string, itemid: string) => {
   setStockLoading((prev) => ({ ...prev, [itemid]: true }));
   try {
     const res = await fetch(
       `/api/kartustock?tgl1=${tgl1}&tgl2=${tgl2}&item=${encodeURIComponent(
         item
       )}&itemid=${encodeURIComponent(itemid)}`
     );
     const d = await res.json();
     const records: KartuStockData[] = Array.isArray(d) ? d : d.recordset ?? [];

     // Hitung saldo kumulatif
     let saldo = 0;
     const withSaldo = records.map((r) => {
       saldo += (r.KgI || 0) - (r.KgO || 0);
       return {
         ...r,
         Saldo: saldo, // ✅ tambahkan properti saldo ke record
       };
     });

     setStockData((prev) => ({ ...prev, [itemid]: withSaldo }));
   } catch (err) {
     console.error("Gagal fetch kartu stock:", err);
   } finally {
     setStockLoading((prev) => ({ ...prev, [itemid]: false }));
   }
 };


  useEffect(() => {
    fetchData();
  }, []);

  // Grouping by orderid
  const grouped = data.reduce((acc: Record<string, PORecord[]>, row) => {
    if (!acc[row.orderid]) acc[row.orderid] = [];
    acc[row.orderid].push(row);
    return acc;
  }, {} as Record<string, PORecord[]>);

  // List PO dengan status ada penerimaan / belum
  const poList = Object.entries(grouped)
    .map(([orderId, rows]) => {
      const itemsMap = rows.reduce((m, r) => {
        if (!m[r.itemid]) m[r.itemid] = [];
        m[r.itemid].push(r);
        return m;
      }, {} as Record<string, PORecord[]>);

      const items = Object.entries(itemsMap).map(([itemid, records]) => {
        const totalMbags = records.reduce((s, r) => s + (r.mbags || 0), 0);
        const totalMkgs = records.reduce((s, r) => s + (r.mkgs || 0), 0);
        return {
          itemid,
          records,
          totals: { mbags: totalMbags, mkgs: totalMkgs },
        };
      });

      const adaPenerimaan = items.some(
        (it) => it.totals.mbags > 0 || it.totals.mkgs > 0
      );

      return { orderId, header: rows[0], items, adaPenerimaan };
    })
    .filter((po) => {
      if (filter === "all") return true;
      if (filter === "masuk") return po.adaPenerimaan;
      if (filter === "pembelian") return !po.adaPenerimaan;
      return true;
    })
    .filter((po) => {
  if (!searchTerm.trim()) return true;
  const keyword = searchTerm.toLowerCase();
  const matchOrderId = po.header.orderid.toLowerCase().includes(keyword);
  const matchName = po.header.companyname1.toLowerCase().includes(keyword);
  if (matchOrderId || matchName) return true;
  // Check items
  const matchItem = po.items.some((it) =>
    it.records[0].itemname.toLowerCase().includes(keyword)
  );
  return matchOrderId || matchItem;
});

  // Fetch kartu stok ketika ada PO baru
  useEffect(() => {
    poList.forEach((po) => {
      po.items.forEach((it) => {
        if (!stockData[it.itemid] && !stockLoading[it.itemid]) {
          fetchStock(it.records[0].itemname, it.itemid);
        }
      });
    });
  }, [poList]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4 text-center">
        LAPORAN MONITORING PURCHASE ORDER PER TRANSAKSI
      </h1>

      {/* 🔹 Filter panel */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-sm">Tanggal Awal</label>
          <input
            type="date"
            value={tgl1}
            onChange={(e) => setTgl1(e.target.value)}
            className="border rounded p-1"
          />
        </div>
        <div>
          <label className="block text-sm">Tanggal Akhir</label>
          <input
            type="date"
            value={tgl2}
            onChange={(e) => setTgl2(e.target.value)}
            className="border rounded p-1"
          />
        </div>
        <div>
          <label className="block text-sm">Filter</label>
          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as "all" | "masuk" | "pembelian")
            }
            className="border rounded p-1"
          >
            <option value="all">Semua</option>
            <option value="pembelian">Proses Pembelian</option>
            <option value="masuk">Barang Masuk</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Cari (PO / Barang)</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari PO atau Barang..."
            className="border rounded p-1 w-48"
          />
        </div>

        <button
          onClick={fetchData}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Cari
        </button>
      </div>

      {/* 🔹 Loading */}
      {loading && <Loading />}

      {!loading && poList.length === 0 && (
        <p className="text-center text-gray-500">⚠ Tidak ada data</p>
      )}

      {/* 🔹 Render data */}
      {!loading &&
        poList.map((po) => (
          <div key={po.orderId} className="mb-8 border p-4 rounded-lg shadow">
            <div className="mb-2">
              <p>
                <b># PO :</b> {po.header.orderid}
              </p>
              <p>
                <b>Supplier :</b> {po.header.companyid} {po.header.companyname1}
              </p>
              <p>
                <b>Tanggal :</b>{" "}
                {new Date(po.header.orderdate).toLocaleDateString("id-ID")}
              </p>
            </div>

            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-1">Barang</th>
                  <th className="border p-1">Harga</th>
                  <th className="border p-1">Zak PO</th>
                  <th className="border p-1">Kg PO</th>
                  <th className="border p-1"># Penerimaan</th>
                  <th className="border p-1">Tgl DTM</th>
                  <th className="border p-1"># DTM</th>
                  <th className="border p-1">Zak</th>
                  <th className="border p-1">Kg</th>
                  <th className="border p-1"># Memo</th>
                  <th className="border p-1">Tgl Memo</th>
                  <th className="border p-1">Zak</th>
                  <th className="border p-1">Kg</th>
                  <th className="border p-1">Invoice Supplier</th>
                </tr>
              </thead>
              <tbody>
                {po.items.map((it) => {
                  const parent = it.records[0];
                  const totalBags = it.records.reduce(
                    (s, r) => s + (r.pobags || 0),
                    0
                  );
                  const totalKgs = it.records.reduce(
                    (s, r) => s + (r.pokgs || 0),
                    0
                  );
                  const totalMbags = it.records.reduce(
                    (s, r) => s + (r.mbags || 0),
                    0
                  );
                  const totalMkgs = it.records.reduce(
                    (s, r) => s + (r.mkgs || 0),
                    0
                  );

                  return (
                    <>
                      {/* Parent row */}
                      <tr
                        key={`parent-${po.orderId}-${parent.itemid}`}
                        className="bg-gray-50 font-semibold"
                      >
                        <td className="border p-1">{parent.itemname}</td>
                        <td className="border p-1 text-right">
                          {parent.poprice.toLocaleString("id-ID")}
                        </td>
                        <td className="border p-1 text-right">
                          {totalBags.toLocaleString("id-ID")}
                        </td>
                        <td className="border p-1 text-right">
                          {totalKgs.toLocaleString("id-ID")}
                        </td>
                        <td colSpan={10}></td>
                      </tr>

                      {/* Child rows */}
                      {it.records.map((r, j) => (
                        <tr key={`child-${po.orderId}-${r.moveid}-${j}`}>
                          <td className="border p-1"></td>
                          <td className="border p-1"></td>
                          <td className="border p-1"></td>
                          <td className="border p-1"></td>
                          <td className="border p-1">{r.moveid}</td>
                          <td className="border p-1">
                            {r.movedate
                              ? new Date(r.movedate).toLocaleDateString("id-ID")
                              : "-"}
                          </td>
                          <td className="border p-1">{r.moveid}</td>
                          <td className="border p-1 text-right">{r.mbags}</td>
                          <td className="border p-1 text-right">{r.mkgs}</td>
                          <td className="border p-1">{r.transid}</td>
                          <td className="border p-1">
                            {r.transdate
                              ? new Date(r.transdate).toLocaleDateString(
                                  "id-ID"
                                )
                              : "-"}
                          </td>
                          <td className="border p-1 text-right">{r.nbags}</td>
                          <td className="border p-1 text-right">{r.nkgs}</td>
                          <td className="border p-1">
                            {r.CompanyInvNo || "-"}
                          </td>
                        </tr>
                      ))}

                      {/* Subtotal penerimaan */}
                      <tr className="font-bold bg-gray-100">
                        <td className="border p-1 text-right" colSpan={7}>
                          Subtotal Penerimaan
                        </td>
                        <td className="border p-1 text-right">
                          {totalMbags.toLocaleString("id-ID")}
                        </td>
                        <td className="border p-1 text-right">
                          {totalMkgs.toLocaleString("id-ID")}
                        </td>
                        <td colSpan={5}></td>
                      </tr>

                      {/* Mutasi stok */}
                      {filter === "masuk" && (
                        <>
                          {stockLoading[it.itemid] && (
                            <tr>
                              <td
                                colSpan={14}
                                className="text-center text-blue-600"
                              >
                                ⏳ Loading kartu stok...
                              </td>
                            </tr>
                          )}
                          {stockData[it.itemid] &&
                            stockData[it.itemid].length > 0 &&
                            !stockLoading[it.itemid] && (
                              <>
                                <tr className="bg-blue-100">
                                  <td
                                    colSpan={14}
                                    className="p-2 font-semibold"
                                  >
                                    Kartu Stok ({parent.itemname})
                                  </td>
                                </tr>
                                <tr className="bg-blue-50 font-semibold text-center">
                                  <td className="border p-1">Tanggal</td>
                                  <td className="border p-1">Item ID</td>
                                  <td className="border p-1">Gudang</td>
                                  <td className="border p-1">Kegiatan</td>
                                  <td className="border p-1">No. Memo</td>
                                  <td className="border p-1">Keterangan</td>
                                  <td className="border p-1">IN</td>
                                  <td className="border p-1">OUT</td>
                                  <td className="border p-1">Saldo</td>
                                  <td colSpan={5}></td>
                                </tr>
                                {stockData[it.itemid].map((s, idx) => (
                                  <tr
                                    key={`stok-${it.itemid}-${idx}`}
                                    className={`text-sm text-center ${
                                      s.Kegiatan === "Auto"
                                        ? "bg-green-100 font-semibold"
                                        : ""
                                    }`}
                                  >
                                    <td className="border p-1">
                                      {typeof s.MoveDate === "string"
                                        ? s.MoveDate.substring(0, 10)
                                            .split("-")
                                            .reverse()
                                            .join("/")
                                        : new Date(
                                            s.MoveDate
                                          ).toLocaleDateString("id-ID")}
                                    </td>
                                    <td className="border p-1">{s.ItemID}</td>
                                    <td className="border p-1">{s.locid}</td>
                                    <td className="border p-1">{s.NoMemo}</td>
                                    <td className="border p-1">
                                      {s.Kegiatan || "-"}
                                    </td>
                                    <td className="border p-1">
                                      {s.Keterangan || "-"}
                                    </td>
                                    <td className="border p-1 text-right">
                                      {Math.round(
                                        Number(s.KgI) || 0
                                      ).toLocaleString("id-ID")}
                                    </td>

                                    <td className="border p-1 text-right">
                                      {s.KgO?.toLocaleString("id-ID") || 0}
                                    </td>
                                    <td className="border p-1 text-right">
                                      {Math.round(
                                        Number(s.Saldo) || 0
                                      ).toLocaleString("id-ID")}
                                    </td>
                                    <td colSpan={5}></td>
                                  </tr>
                                ))}

                                {/* Baris Total */}
                                <tr className="bg-green-100 font-semibold text-center">
                                  <td className="border p-1" colSpan={6}>
                                    Total
                                  </td>
                                  <td className="border p-1 text-right">
                                    {Math.round(
                                      stockData[it.itemid].reduce(
                                        (sum, s) => sum + (s.KgI || 0),
                                        0
                                      )
                                    ).toLocaleString("id-ID")}
                                  </td>

                                  <td className="border p-1 text-right">
                                    {stockData[it.itemid]
                                      .reduce((sum, s) => sum + (s.KgO || 0), 0)
                                      .toLocaleString("id-ID")}
                                  </td>
                                  <td className="border p-1 text-right">
                                    {Math.round(
                                      stockData[it.itemid].at(-1)?.Saldo || 0
                                    ).toLocaleString("id-ID")}
                                  </td>

                                  <td colSpan={5}></td>
                                </tr>
                              </>
                            )}
                        </>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}
