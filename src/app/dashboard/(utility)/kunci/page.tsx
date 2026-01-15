/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Edit,
  Loader2,
  RefreshCw,
  Search,
  Check,
  X,
   ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

interface KunciData {
  name: string;
  LockDate: string | null;
}

export default function KunciPage() {
  const [data, setData] = useState<KunciData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editLoading, setEditLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [currentEditName, setCurrentEditName] = useState("");

  // Fetch data dari API
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/kunci");
      if (!response.ok) throw new Error("Gagal mengambil data");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  // Load data saat komponen mount
  useEffect(() => {
    fetchData();
  }, []);

  // Filter data berdasarkan search
  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  // Format tanggal untuk display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Toggle expand row
  const toggleExpand = (item: KunciData) => {
    if (expandedRow === item.name) {
      setExpandedRow(null);
      setEditDate("");
      setCurrentEditName("");
    } else {
      setExpandedRow(item.name);
      setEditDate(item.LockDate || "");
      setCurrentEditName(item.name);
    }
  };

  // Handle update
  const handleUpdate = async (name: string) => {
    try {
      setEditLoading(name);

      const response = await fetch("/api/kunci", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          LockDate: editDate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal mengupdate data");
      }

      // Update data lokal
      setData((prevData) =>
        prevData.map((item) =>
          item.name === name ? { ...item, LockDate: editDate } : item
        )
      );

      toast.success("Data berhasil diupdate");
      setExpandedRow(null);
      setEditDate("");
      setCurrentEditName("");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setEditLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Manajemen Kunci Form
            </h1>
            <p className="text-muted-foreground mt-2">
              Kelola tanggal penguncian untuk setiap form
            </p>
          </div>
          <Button
            onClick={fetchData}
            variant="outline"
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh Data</span>
          </Button>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama form..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats Card */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{data.length}</div>
                <div className="text-sm text-muted-foreground">Total Form</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {data.filter((d) => d.LockDate).length}
                </div>
                <div className="text-sm text-muted-foreground">Terkunci</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {data.filter((d) => !d.LockDate).length}
                </div>
                <div className="text-sm text-muted-foreground">Terbuka</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Data */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Nama Form</TableHead>
              <TableHead>Tanggal Kunci</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Memuat data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {search
                      ? `Tidak ada hasil untuk "${search}"`
                      : "Tidak ada data tersedia"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <>
                  {/* Baris Data Utama */}
                  <TableRow
                    key={item.name}
                    className={`
                      hover:bg-muted/50 
                      ${expandedRow === item.name ? "bg-muted/30" : ""}
                      transition-colors
                    `}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="flex-1">{item.name}</div>
                        {expandedRow === item.name && (
                          <ChevronUp className="h-4 w-4 ml-2 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(item.LockDate)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={item.LockDate ? "default" : "secondary"}
                        className={`
                          ${
                            item.LockDate
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          }
                        `}
                      >
                        {item.LockDate ? "Terkunci" : "Terbuka"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(item)}
                        className="h-8 w-8 p-0"
                      >
                        {expandedRow === item.name ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <Edit className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Row untuk Edit */}
                  {expandedRow === item.name && (
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={4} className="p-4">
                        <div className="bg-white border rounded-lg p-4 shadow-sm">
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <Label htmlFor="edit-date" className="block mb-2">
                                Edit Tanggal Kunci untuk{" "}
                                <strong>{item.name}</strong>
                              </Label>
                              <div className="flex flex-col md:flex-row gap-2">
                                <Input
                                  id="edit-date"
                                  type="date"
                                  value={editDate}
                                  onChange={(e) => setEditDate(e.target.value)}
                                  className="flex-1"
                                  placeholder="YYYY-MM-DD"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditDate("");
                                    }}
                                    disabled={editLoading === item.name}
                                  >
                                    Hapus Tanggal
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleUpdate(item.name)}
                                    disabled={editLoading === item.name}
                                  >
                                    {editLoading === item.name ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Menyimpan...
                                      </>
                                    ) : (
                                      <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Simpan
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleExpand(item)}
                                    disabled={editLoading === item.name}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                Kosongkan tanggal untuk membuka form. Format:
                                YYYY-MM-DD
                              </p>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Info Total Data */}
      {!loading && filteredData.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          Menampilkan {filteredData.length} dari {data.length} data form
        </div>
      )}

      {/* Petunjuk */}
      <div className="mt-8 p-4 border rounded-lg bg-blue-50">
        <h3 className="font-medium text-blue-800 mb-2">Cara Menggunakan:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>
            • Klik tombol <Edit className="h-3 w-3 inline" /> untuk mengedit
            tanggal kunci
          </li>
          <li>• Atur tanggal untuk mengunci form mulai tanggal tersebut</li>
          <li>• Kosongkan tanggal untuk membuka form</li>
          <li>• Format tanggal: YYYY-MM-DD</li>
        </ul>
      </div>
    </div>
  );
}
