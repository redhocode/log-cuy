import BackButton from "@/components/back-button";
import DataPenerimaanPage from "@/components/penerimaan/page";
import * as React from "react";

export default function Page() {
  return (
    <>
         <div className="justify-center flex px-4">
      <div className="">
        <div className="flex justify-between items-center">
        <BackButton/>
        <h1 className="text-5xl font-bold">Data Penerimaan Barang</h1>
        </div>
        <DataPenerimaanPage />
      </div>
      </div>
    </>
  );
}
