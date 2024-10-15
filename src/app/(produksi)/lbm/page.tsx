import BackButton from "@/components/back-button";
import DataLBMPage from "@/components/lbm/page";
import * as React from "react";

export default function Home() {
  return (
    <>
      <div className="justify-center flex px-4">
        <div className="">
          <div className="flex justify-between items-center">
            <BackButton />
            <h1 className="text-5xl font-bold">Data LBM</h1>
          </div>
          <DataLBMPage />
        </div>
      </div>
    </>
  );
}
