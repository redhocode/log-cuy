"use client";
import { useState } from "react";
import { Input } from "./ui/input";

export default function UpdateNoPOButton() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

const handleClick = async () => {
  setLoading(true);
  setMessage("");
  try {
    const res = await fetch("/api/monitoring/tombol", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate }),
    });

    // 🔎 ambil raw response dulu
    const text = await res.text();
    console.log("Raw response dari API:", text);

    let data;
    try {
      data = JSON.parse(text); // coba parse JSON
    } catch {
      data = { success: false, message: "Bukan JSON: " + text };
    }

    setMessage(
      data.success ? "✅ Berhasil update" : "❌ Gagal: " + data.message
    );
  } catch (err) {
    setMessage("❌ Error: " + (err as Error).message);
  }
  setLoading(false);
};

  return (
    <>
      <h1 className="text-red-500">Sebelum Melihat laporan Monitoring PO harap Update data</h1>
    <div className="flex gap-4 mb-4">
      <Input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="border p-2 rounded"
      />
      <Input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="border p-2 rounded"
      />
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-4  bg-blue-600 text-white rounded-md w-full"
      >
        {loading ? "Processing..." : "Update NoPO"}
      </button>
      {message && <p>{message}</p>}
    </div>
        </>
  );
}
