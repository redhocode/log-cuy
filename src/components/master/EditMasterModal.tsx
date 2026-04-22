// components/master/EditMasterModal.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { masterType } from "@/lib/types";
import { Loader2 } from "lucide-react";
import axios from "axios";

interface KategoriType {
  KodeJenis: string;
  NamaJenis: string;
}

interface EditMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: masterType) => void;
  item: masterType | null;
  loading?: boolean;
}

const departemenOptions = [
  { value: "Molding", label: "Molding" },
  { value: "Injection", label: "Injection" },
  { value: "Assembly", label: "Assembly" },
  { value: "Spary", label: "Spary" },
  { value: "Plating", label: "Plating" },
];

export default function EditMasterModal({
  isOpen,
  onClose,
  onSave,
  item,
  loading = false,
}: EditMasterModalProps) {
  const [formData, setFormData] = useState({
    ItemID: "",
    ItemName: "",
    ItemName2: "",
    warna: "",
    Spec: "",
    SatuanKecil: "",
    KodeJenis: "",
    NamaJenis: "",
    Departemen: "",
  });
  
  const [kategoriList, setKategoriList] = useState<KategoriType[]>([]);
  const [loadingKategori, setLoadingKategori] = useState(false);

  // Fetch kategori list
  useEffect(() => {
    const fetchKategori = async () => {
      setLoadingKategori(true);
      try {
        const response = await axios.get("/api/master/kategori");
        if (response.data.success) {
          setKategoriList(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching kategori:", error);
      } finally {
        setLoadingKategori(false);
      }
    };
    
    if (isOpen) {
      fetchKategori();
    }
  }, [isOpen]);

  useEffect(() => {
    if (item) {
      setFormData({
        ItemID: item.ItemID || "",
        ItemName: item.ItemName || "",
        ItemName2: item.ItemName2 || item.ItemNameBuy || "",
        warna: item.warna || "",
        Spec: item.Spec || "",
        SatuanKecil: item.SatuanKecil || "",
        KodeJenis: item.KodeJenis || "",
        NamaJenis: item.NamaJenis || "",
        Departemen: item.Departemen || item.Mark || "",
      });
    }
  }, [item]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle KodeJenis change - auto fill NamaJenis
  const handleKodeJenisChange = (kodeJenis: string) => {
    const selected = kategoriList.find(k => k.KodeJenis === kodeJenis);
    setFormData((prev) => ({ 
      ...prev, 
      KodeJenis: kodeJenis,
      NamaJenis: selected?.NamaJenis || "" 
    }));
  };

  const handleSubmit = () => {
    const submitData: masterType = {
      ItemID: formData.ItemID,
      ItemName: formData.ItemName,
      ItemName2: formData.ItemName2,
      ItemNameBuy: formData.ItemName2,
      warna: formData.warna,
      Spec: formData.Spec,
      SatuanKecil: formData.SatuanKecil,
      KodeJenis: formData.KodeJenis,
      NamaJenis: formData.NamaJenis,
      Departemen: formData.Departemen,
      Mark: formData.Departemen,
      UserName: "System",
      UserDateTime: new Date().toISOString(),
    };
    onSave(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Data Barang</DialogTitle>
          <DialogDescription>
            Edit informasi lengkap data barang
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* ItemID - Readonly */}
          <div className="space-y-2">
            <Label htmlFor="ItemID">Item ID *</Label>
            <Input
              id="ItemID"
              value={formData.ItemID}
              onChange={(e) => handleChange("ItemID", e.target.value)}
              disabled
              className="bg-gray-100"
            />
          </div>

          {/* Item Name */}
          <div className="space-y-2">
            <Label htmlFor="ItemName">Nama Item *</Label>
            <Input
              id="ItemName"
              value={formData.ItemName}
              onChange={(e) => handleChange("ItemName", e.target.value)}
              placeholder="Masukkan nama item"
            />
          </div>

          {/* Item Name China */}
          <div className="space-y-2">
            <Label htmlFor="ItemName2">Nama Item (China)</Label>
            <Input
              id="ItemName2"
              value={formData.ItemName2}
              onChange={(e) => handleChange("ItemName2", e.target.value)}
              placeholder="Masukkan nama item dalam bahasa China"
            />
          </div>

          {/* Warna */}
          <div className="space-y-2">
            <Label htmlFor="warna">Warna</Label>
            <Input
              id="warna"
              value={formData.warna}
              onChange={(e) => handleChange("warna", e.target.value)}
              placeholder="Masukkan warna"
            />
          </div>

          {/* Spesifikasi */}
          <div className="space-y-2">
            <Label htmlFor="Spec">Spesifikasi</Label>
            <Input
              id="Spec"
              value={formData.Spec}
              onChange={(e) => handleChange("Spec", e.target.value)}
              placeholder="Masukkan spesifikasi"
            />
          </div>

          {/* Satuan */}
          <div className="space-y-2">
            <Label htmlFor="SatuanKecil">Satuan</Label>
            <Input
              id="SatuanKecil"
              value={formData.SatuanKecil}
              onChange={(e) => handleChange("SatuanKecil", e.target.value)}
              placeholder="Contoh: pcs, kg, meter"
            />
          </div>

          {/* Kode Jenis - Select */}
          <div className="space-y-2">
            <Label htmlFor="KodeJenis">Kode Kategori</Label>
            <Select
              value={formData.KodeJenis}
              onValueChange={handleKodeJenisChange}
              disabled={loadingKategori}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingKategori ? "Memuat data..." : "Pilih kode kategori"} />
              </SelectTrigger>
              <SelectContent>
                {kategoriList.map((kategori) => (
                  <SelectItem key={kategori.KodeJenis} value={kategori.KodeJenis}>
                    {kategori.KodeJenis} - {kategori.NamaJenis}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Kode yang terhubung dengan nama kategori di atas
            </p>
          </div>

          {/* Nama Jenis - Auto fill from KodeJenis */}
          <div className="space-y-2">
            <Label htmlFor="NamaJenis">Nama Kategori</Label>
            <Input
              id="NamaJenis"
              value={formData.NamaJenis}
              onChange={(e) => handleChange("NamaJenis", e.target.value)}
              placeholder="Akan terisi otomatis dari kode kategori"
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">
              {formData.KodeJenis && !formData.NamaJenis && "Pilih kode kategori terlebih dahulu"}
            </p>
          </div>

          {/* Departemen */}
          <div className="space-y-2">
            <Label htmlFor="Departemen">Departemen / Proses</Label>
            <Select
              value={formData.Departemen}
              onValueChange={(value) => handleChange("Departemen", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih departemen" />
              </SelectTrigger>
              <SelectContent>
                {departemenOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}