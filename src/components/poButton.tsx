"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";

export default function UpdateNoPOButton() {
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  const handleClick = async () => {
    if (!startDate || !endDate) {
      setMessage("❌ Harap isi kedua tanggal");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("⏳ Sedang memproses update data...");
    setMessageType("info");
    
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

      if (data.success) {
        setMessage("✅ Berhasil update data Production");
        setMessageType("success");
      } else {
        setMessage("❌ Gagal: " + data.message);
        setMessageType("error");
      }
    } catch (err) {
      setMessage("❌ Error: " + (err as Error).message);
      setMessageType("error");
    }
    setLoading(false);
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50 mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="h-5 w-5" />
          Penting: Update Data Production
        </CardTitle>
        <CardDescription className="text-yellow-700">
          Sebelum melihat laporan Monitoring PO, harap update data terlebih dahulu untuk memastikan informasi terkini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Info Alert */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-700">
              Proses update akan menyinkronkan nomor PO dengan data terbaru dari sistem.
            </AlertDescription>
          </Alert>

          {/* Date Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-gray-700">
                <Calendar className="inline h-4 w-4 mr-1" />
                Tanggal Mulai
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-gray-700">
                <Calendar className="inline h-4 w-4 mr-1" />
                Tanggal Akhir
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button 
            onClick={handleClick}
            disabled={loading || !startDate || !endDate}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            size="lg"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Memproses Update...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 mr-2" />
                Update No. PO
              </>
            )}
          </Button>

          {/* Message Display */}
          {message && (
            <Alert className={
              messageType === "success" ? "bg-green-50 border-green-200" :
              messageType === "error" ? "bg-red-50 border-red-200" :
              "bg-blue-50 border-blue-200"
            }>
              <div className="flex items-start gap-2">
                {messageType === "success" ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : messageType === "error" ? (
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                ) : (
                  <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5" />
                )}
                <AlertDescription className={
                  messageType === "success" ? "text-green-700" :
                  messageType === "error" ? "text-red-700" :
                  "text-blue-700"
                }>
                  {message}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Info Footer */}
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
            <p>Periode yang disarankan: Bulan berjalan (contoh: 1 Mei 2024 - 31 Mei 2024)</p>
            <p className="mt-1">Proses ini akan memperbarui data PO untuk periode yang ditentukan.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}