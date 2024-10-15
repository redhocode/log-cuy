import BackButton from "@/components/back-button";
import DataProduksiPage from "@/components/dataproduksi/page";
import * as React from "react";

export default function Home() {
  return (
    <>
      <div className="flex flex-col items-center justify-between mt-2">
        <h1 className="text-5xl font-bold">Data Produksi</h1>
        <BackButton/>
        <DataProduksiPage />
      </div>
    </>
  );
}
