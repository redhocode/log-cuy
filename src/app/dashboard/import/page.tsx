// import { Button } from "@/components/ui/button";
// import Link from "next/link";
import * as React from "react";
// import { CardHome } from "@/components/cardtitle";
import CardList from "@/components/cardlist";
import { Database, FileInput, FileOutput } from "lucide-react";
// import {  as Chart } from '../components/chartexp';
export default function Page() {
  const items = [
    {
      title: "Produksi",
      description: "Import Bahan dan hasil Produksi",
      link: "/dashboard/import/produksi",
      icon: <Database size={60} />,
    },
    {
      title: "LBM",
      description: "Monitoring Bahan Non-Produksi Masuk",
      link: "/dashboard/import/lbm",
      icon: <FileInput size={60} />,
    },
    {
      title: "LBK",
      description: "Import Bahan Non-Produksi Keluar",
      link: "/dashboard/import/lbk",
      icon: <FileOutput size={60} />,
    },
    {
      title: "Penerimaan",
      description: "Import Barang Masuk Gudang",
      link: "/dashboard/import/penerimaan",
      icon: <FileInput size={60} />,
    },
    {
      title: "Surat Perintah Kerja",
      description: "Import Barang Masuk Gudang",
      link: "/dashboard/import/spk",
      icon: <FileInput size={60} />,
    },
    {
      title: "Purchase",
      description: "Import Purchase Order",
      link: "/dashboard/import/purchase",
      icon: <FileInput size={60} />,
    }
    // {
    //   title: "Mutasi",
    //   description: "Import Mutasi Gudang",
    //   link: "/import/mutasi",
    //   icon: <FileOutput size={60} />,
    // },
  ]; // Array objek konten dengan ikon
  return (
    <>
      <div className="flex justify-center">
        <CardList
          cards={items} // Mengisi CardList dengan array objek
          footer={<p></p>} // Footer yang sama untuk semua card
          headerIcon={null}
        />
      </div>
    </>
  );
}
