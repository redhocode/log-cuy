"use client";

import { useState, FormEvent } from "react";

// Tipe data untuk hasil respons dari API
interface KartuStockData {
  Item: string;
  Loc: string;
  Jumlah: number;
  Tanggal: string;
}

export default function KartuStockPage() {
  // State untuk input form
  const [tgl1, setTgl1] = useState<string>("");
  const [tgl2, setTgl2] = useState<string>("");
  const [loc, setLoc] = useState<string>("%"); // Default to '%' if not provided
  const [kategori, setKategori] = useState<string>("0"); // Default to '0'
  const [itemid, setItemid] = useState<string>("");

  // State untuk menampilkan hasil
  const [data, setData] = useState<KartuStockData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Fungsi untuk mengirimkan form data ke API
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validasi jika ada inputan yang kosong
    if (!tgl1 || !tgl2  || !itemid) {
      setError("Semua field harus diisi.");
      return;
    }

    setLoading(true);
    setError(null); // Reset error

    try {
      // Mengirimkan data ke API route yang sudah kita buat
      const res = await fetch(
        `/api/kartustock?tgl1=${tgl1}&tgl2=${tgl2}&loc=${loc}&kategori=${kategori}&itemid=${itemid}`
      );

      if (!res.ok) {
        throw new Error("Gagal mengambil data");
      }

      const result: KartuStockData[] = await res.json();
      setData(result); // Menampilkan hasil response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message); // Menampilkan error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Kartu Stock Barang</h1>

      {/* Form Input */}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Tanggal 1:</label>
          <input
            type="date"
            value={tgl1}
            onChange={(e) => setTgl1(e.target.value)}
          />
        </div>
        <div>
          <label>Tanggal 2:</label>
          <input
            type="date"
            value={tgl2}
            onChange={(e) => setTgl2(e.target.value)}
          />
        </div>
        <div>
          <label>Lokasi:</label>
          <input
            type="text"
            value={loc}
            onChange={(e) => setLoc(e.target.value || "%")} // Default to '%' if empty
          />
        </div>
        {/* <div>
          <label>Item:</label>
          <input
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
          />
        </div> */}
        {/* Remove Periode input since it's determined by backend */}
        {/* <div>
          <label>Periode:</label>
          <input
            type="text"
            value={periodeR}
            onChange={(e) => setPeriodeR(e.target.value)}
          />
        </div> */}
        <div>
          <label>Kategori:</label>
          <input
            type="text"
            value={kategori}
            onChange={(e) => setKategori(e.target.value || "0")} // Default to '0' if empty
          />
        </div>
        <div>
          <label>Item ID:</label>
          <input
            type="text"
            value={itemid}
            onChange={(e) => setItemid(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Submit"}
        </button>
      </form>

      {/* Menampilkan error jika ada */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Menampilkan hasil data jika ada */}
      {data && data.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Lokasi</th>
              <th>Jumlah</th>
              <th>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {data.map((itemData, index) => (
              <tr key={index}>
                {/* <td>{itemData.Item}</td> */}
                <td>{itemData.Loc}</td>
                <td>{itemData.Jumlah}</td>
                <td>{itemData.Tanggal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
