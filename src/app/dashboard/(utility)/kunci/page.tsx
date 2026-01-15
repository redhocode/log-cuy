"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Loader2, RefreshCw, Check, X } from "lucide-react";
import { toast } from "sonner";

/* =======================
   TYPES
======================= */
interface KunciData {
  name: string;
  LockDate: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

/* =======================
   COMPONENT
======================= */
export default function KunciPage() {
  const [data, setData] = useState<KunciData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editLoading, setEditLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");

  /* =======================
     FETCH DATA (FIXED)
  ======================= */
  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);

      const res = await fetch("/api/kunci", { cache: "no-store" });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = (await res.json()) as ApiResponse<KunciData[]>;

      if (!json.success || !Array.isArray(json.data)) {
        throw new Error(json.error || "Invalid API response");
      }

      setData(json.data);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to load data";
      console.error(error);
      toast.error(message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* =======================
     FILTER
  ======================= */
  const filteredData = useMemo(() => {
    return data.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  /* =======================
     HELPERS
  ======================= */
  const formatDate = (date: string | null): string => {
    if (!date) return "-";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "Invalid Date";

    return parsed.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const toggleExpand = (item: KunciData): void => {
    if (expandedRow === item.name) {
      setExpandedRow(null);
      setEditDate("");
    } else {
      setExpandedRow(item.name);
      setEditDate(item.LockDate ?? "");
    }
  };

  /* =======================
     UPDATE (FIXED)
  ======================= */
  const handleUpdate = async (name: string): Promise<void> => {
    try {
      setEditLoading(name);

      const res = await fetch("/api/kunci", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          LockDate: editDate || null,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = (await res.json()) as ApiResponse<KunciData>;

      if (!json.success) {
        throw new Error(json.error || "Update failed");
      }

      setData((prev) =>
        prev.map((item) =>
          item.name === name ? { ...item, LockDate: editDate || null } : item
        )
      );

      toast.success(json.message || "Data updated");
      setExpandedRow(null);
      setEditDate("");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update data";
      console.error(error);
      toast.error(message);
    } finally {
      setEditLoading(null);
    }
  };

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="container mx-auto py-8 px-4 h-auto">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Manajemen Kunci Form</h1>
        <Button onClick={fetchData} variant="outline" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <Input
        placeholder="Cari nama form..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Form</TableHead>
            <TableHead>Tanggal Kunci</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredData.map((item) => (
            <Fragment key={item.name}>
              <TableRow>
                <TableCell>{item.name}</TableCell>
                <TableCell>{formatDate(item.LockDate)}</TableCell>
                <TableCell>
                  <Badge variant={item.LockDate ? "default" : "secondary"}>
                    {item.LockDate ? "Terkunci" : "Terbuka"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleExpand(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>

              {expandedRow === item.name && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                      />
                      <Button
                        onClick={() => handleUpdate(item.name)}
                        disabled={editLoading === item.name}
                      >
                        {editLoading === item.name ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => toggleExpand(item)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
