import BackButton from "@/components/back-button";
import DataMutasiPage from "@/components/mutasi/page";
import * as React from "react";

export default function Page() {
  return (
    <>
      <div className="justify-center flex px-4">
        <div className="">
          <div className="flex justify-between items-center">
            <BackButton />
            <h1 className="text-5xl font-bold">Data Mutasi</h1>
          </div>
          <DataMutasiPage />
        </div>
      </div>
    </>
  );
}
