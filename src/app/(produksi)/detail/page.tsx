import BackButton from "@/components/back-button";
import DataDetailProduksiPage from "@/components/detailproduksi/page";
import * as React from "react";

export default function Home() {
  return (
    <>
      <div className="flex flex-col items-center justify-between">
        <h1 className="text-5xl font-bold pt-2">Data Detail Produksi</h1>
        <BackButton/>
        <DataDetailProduksiPage />
      </div>
    </>
  );
}
