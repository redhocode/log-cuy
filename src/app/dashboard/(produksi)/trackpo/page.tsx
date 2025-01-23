
import DataTrackPOPage from "@/components/trackpo/page";
import * as React from "react";

export default function Page() {
  return (
    <>
      <div className="justify-center flex px-4">
        <div className="">
          <div className="flex justify-between items-center">
  
            <h1 className="text-5xl font-bold">Track PO</h1>
          </div>
          <DataTrackPOPage />
        </div>
      </div>
    </>
  );
}
