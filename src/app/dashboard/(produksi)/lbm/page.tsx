import BackButton from "@/components/back-button";
import DataLBMPage from "@/components/lbm/page";
import * as React from "react";

export default function Page() {
  return (
    <>
     
            <BackButton />
           
      <div className="justify-center flex px-4">

      <DataLBMPage />
      </div>
    </>
  );
}
