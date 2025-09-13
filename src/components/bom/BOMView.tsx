/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface BomData {
  TransID: number;
  itemidHD: string;
  itemnamehd: string;
  ItemID: string;
  ItemName: string;
  BahanQty: number;
}

export default function BOMView() {
  const [itemid, setItemid] = useState("");
  const [data, setData] = useState<BomData[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [suggestions, setSuggestions] = useState<BomData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const pageSize = 10;

  async function fetchBOM(searchItem?: string) {
    setLoading(true);
    try {
      const res = await axios.get(`/api/bom`, {
        params: { itemid: searchItem || "%" },
      });
      setData(res.data);
      setPage(1);
    } catch (err) {
      console.error("Gagal ambil BOM:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  // Suggestion: hanya ambil sebagian data buat dropdown
  async function fetchSuggestions(keyword: string) {
    if (keyword.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await axios.get(`/api/bom`, {
        params: { itemid: `%${keyword}%` },
      });
      setSuggestions(res.data.slice(0, 8)); // batasi max 8 hasil
    } catch (err) {
      console.error("Gagal ambil suggestion:", err);
    }
  }

  useEffect(() => {
    fetchBOM(); // default load semua BOM
  }, []);

  // Group by header
  const grouped = data.reduce((acc: any, row) => {
    if (!acc[row.itemidHD]) {
      acc[row.itemidHD] = {
        headerName: row.itemnamehd,
        children: [],
      };
    }
    acc[row.itemidHD].children.push(row);
    return acc;
  }, {});

  // Pagination
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pagedData = Object.entries(grouped).slice(start, end);
  const totalPages = Math.ceil(Object.keys(grouped).length / pageSize);

  return (
    <div className="p-6 space-y-4 relative">
      {/* Pencarian */}
      <div className="flex gap-2 relative w-full max-w-md">
        <Input
          placeholder="Cari ItemID atau Nama..."
          value={itemid}
          onChange={(e) => {
            const val = e.target.value;
            setItemid(val);
            setShowSuggestions(true);
            fetchSuggestions(val);
          }}
        />
        <Button onClick={() => fetchBOM(itemid)} disabled={loading}>
          {loading ? "Mencari..." : "Cari"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setItemid("");
            fetchBOM();
            setSuggestions([]);
            setShowSuggestions(false);
          }}
        >
          Reset
        </Button>

        {/* Dropdown Suggestion */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-12 left-0 w-full bg-white border rounded-md shadow-md z-10 max-h-60 overflow-y-auto">
            {suggestions.map((s) => (
              <div
                key={s.TransID}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setItemid(s.ItemID);
                  fetchBOM(s.ItemID);
                  setShowSuggestions(false);
                }}
              >
                {s.ItemID} - {s.ItemName}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hasil */}
      {loading && <p>Sedang memuat...</p>}
      {!loading && data.length === 0 && (
        <p className="text-gray-500">Data BOM tidak ditemukan.</p>
      )}

      {pagedData.map(([hd, group]: any) => (
        <Card key={hd} className="shadow-md">
          <CardContent>
            <button
              className="w-full text-left font-bold text-lg flex justify-between items-center"
              onClick={() =>
                setExpanded((prev) => ({ ...prev, [hd]: !prev[hd] }))
              }
            >
              {hd} - {group.headerName}
              <span>{expanded[hd] ? "▾" : "▸"}</span>
            </button>

            {expanded[hd] && (
              <ul className="ml-6 mt-2 border-l pl-4 space-y-1">
                {group.children.map((row: BomData) => (
                  <li key={row.TransID} className="flex justify-between">
                    <span>
                      🌿 {row.ItemID} - {row.ItemName}
                    </span>
                    <span className="text-sm text-gray-600">
                      Qty: {row.BahanQty}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-4">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </Button>
          <span className="px-2 py-1">
            Halaman {page} dari {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
