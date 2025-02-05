"use client";
import { useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const CekPPN = () => {
  // State untuk menyimpan beberapa data harga dan PPN
  const [data, setData] = useState<
    { harga: number; ppn: number; total: number }[]
  >([{ harga: 0, ppn: 11, total: 0 }]);

  // Fungsi untuk menambah baris input baru
  const addRow = () => {
    setData([...data, { harga: 0, ppn: 0, total: 0 }]);
  };

  // Fungsi untuk menangani perubahan harga atau PPN
  const handleChange = (
    index: number,
    field: keyof (typeof data)[0],
    value: string
  ) => {
    const newData = [...data];
    const numericValue = parseFloat(value);

    // Update nilai untuk field yang dipilih (harga atau ppn)
    if (field === "harga") {
      newData[index].harga = numericValue;
    } else if (field === "ppn") {
      newData[index].ppn = numericValue;
    }

    // Menghitung total setelah PPN
    const { harga, ppn } = newData[index];
    const ppnAmount = harga * (ppn / 100);
    newData[index].total = harga + ppnAmount;

    setData(newData);
  };

  return (
    <>
      <div className="flex flex-col">
        <h2>Cek PPN - Banyak Baris</h2>
        <div className="flex flex-wrap gap-4">
          {/* Render input untuk harga dan PPN secara dinamis */}
          {data.map((row, index) => (
            <Card key={index} className="p-4 h-[300px]">
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
              <div className="flex-col flex justify-center">
                <p>Total setelah PPN:</p>
                <b>{row.total}</b>
              </div>
              <hr />
            </Card>
          ))}

          {/* Tombol untuk menambah baris */}
          <Button onClick={addRow} className="mt-4">
            Tambah Baris
          </Button>
        </div>
      </div>
    </>
  );
};

export default CekPPN;
