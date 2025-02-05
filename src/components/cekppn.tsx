"use client";
import { useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { jsPDF } from "jspdf"; // Import jsPDF
import "jspdf-autotable"; // Import jsPDF autotable

const CekPPN = () => {
  // State untuk menyimpan beberapa data harga, PPN, qty dan total
  const [data, setData] = useState<
    { harga: number; ppn: number; qty: number; total: number }[]
  >([{ harga: 0, ppn: 11, qty: 1, total: 0 }]);

  // Fungsi untuk menambah baris input baru
  const addRow = () => {
    setData([...data, { harga: 0, ppn: 0, qty: 1, total: 0 }]);
  };

  // Fungsi untuk menangani perubahan harga, PPN, atau qty
  const handleChange = (
    index: number,
    field: keyof (typeof data)[0],
    value: string
  ) => {
    const newData = [...data];
    const numericValue = value.trim() === "" ? 0 : parseFloat(value);

    if (isNaN(numericValue)) {
      return;
    }

    if (field === "harga") {
      newData[index].harga = numericValue;
    } else if (field === "ppn") {
      newData[index].ppn = numericValue;
    } else if (field === "qty") {
      newData[index].qty = numericValue;
    }

    const { harga, ppn, qty } = newData[index];
    const ppnAmount = harga * qty * (ppn / 100);
    newData[index].total = harga * qty + ppnAmount;

    setData(newData);
  };
 const formatRupiah = (value: number) => {
   return new Intl.NumberFormat("id-ID", {
     style: "currency",
     currency: "IDR",
     minimumFractionDigits: 2,
     maximumFractionDigits: 2,
   })
     .format(value)
     .replace("IDR", "Rp");
 };

  // Fungsi untuk mengekspor ke PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Hitung PPN", 10, 10);

    // Data untuk tabel
    const tableData = data.map((row, index) => {
      const hargaSebelumPPN = row.total / (1 + row.ppn / 100); // Hitung harga sebelum PPN
      return [
        `Harga Sebelum PPN ${index + 1}`, // Deskripsi harga sebelum PPN
        formatRupiah(hargaSebelumPPN),
        `${row.ppn}%`,
        `${row.qty}`,
        formatRupiah(row.total),
      ];
    });

    // Menambahkan header tabel
    const headers = [
      "Deskripsi",
      "Harga Sebelum PPN",
      "PPN",
      "Qty",
      "Total setelah PPN",
    ];

    // Menambahkan tabel ke PDF
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 (doc as any).autoTable({
   // Cast doc to any to access autoTable method
   head: [headers],
   body: tableData,
   startY: 20, // Posisi awal tabel
   theme: "grid", // Gaya tabel
 });

    const totalAll = data.reduce((acc, row) => acc + row.total, 0); 

    // Menambahkan total keseluruhan setelah tabel
   doc.text(
     `Total Keseluruhan: ${formatRupiah(totalAll)}`,
     10,
     80 // Specify the y-position directly
   );

    // Simpan PDF
    doc.save("Hitung_ppn.pdf");
  };

  return (
    <>
      <div className="flex flex-col">
        <h2>Hitung PPN</h2>
        <div className="flex flex-wrap gap-4">
          {/* Render input untuk harga, PPN, dan quantity secara dinamis */}
          {data.map((row, index) => (
            <Card key={index} className="p-4 h-[350px]">
              <div className="mb-4">
                <Label>
                  Harga {index + 1}:
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={row.harga}
                    onChange={(e) =>
                      handleChange(index, "harga", e.target.value)
                    }
                    placeholder="Masukkan harga"
                  />
                </Label>
              </div>
              <div className="mb-4">
                <Label>
                  Persentase PPN {index + 1}:
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={row.ppn}
                    onChange={(e) => handleChange(index, "ppn", e.target.value)}
                    placeholder="Masukkan persentase PPN"
                  />
                </Label>
              </div>
              <div className="mb-4">
                <Label>
                  Quantity {index + 1}:
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={row.qty}
                    onChange={(e) => handleChange(index, "qty", e.target.value)}
                    placeholder="Masukkan jumlah barang"
                  />
                </Label>
              </div>
              <div className="flex-col flex justify-center">
                <p>Total setelah PPN:</p>
                <b>{formatRupiah(row.total)}</b>
              </div>
              <hr />
            </Card>
          ))}

          {/* Tombol untuk menambah baris */}
          <Button onClick={addRow} className="mt-4">
            Tambah Baris
          </Button>
        </div>

        {/* Tombol untuk mengekspor ke PDF */}
        <Button onClick={exportToPDF} className="mt-4">
          Export ke PDF
        </Button>
      </div>
    </>
  );
};

export default CekPPN;
