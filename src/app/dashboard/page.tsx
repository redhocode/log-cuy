"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
//import CardList from "@/components/cardlist";
//import { Database, FileInput, FileOutput } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StockList from "@/components/stock/stocklist";
// import Grafik from "@/components/grafik";
// import KartuStockPage from "@/components/stock/kartustock";

const DashboardPage = () => {
   const router = useRouter();
   const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
     const user = localStorage.getItem("user");
     if (!user) {
       router.push("/auth/login"); // Redirect ke halaman login jika belum login
     } else {
       const parsedUser = JSON.parse(user);
       setUserName(parsedUser.UserName); // Ambil nama pengguna
     }
   }, [router]);

  // const items = [
  //   {
  //     title: "Produksi",
  //     description: "Monitoring Bahan dan hasil Produksi",
  //     link: "/dashboard/data",
  //     icon: <Database size={60} />,
  //   },
  //   {
  //     title: "LBM",
  //     description: "Monitoring Bahan Non-Produksi Masuk",
  //     link: "/dashboard/lbm",
  //     icon: <FileInput size={60}/>,
  //   },
  //   {
  //     title: "LBK",
  //     description: "Monitoring Bahan Non-Produksi Keluar",
  //     link: "/dashboard/lbk",
  //     icon: <FileOutput size={60}/>,
  //   },
  //   {
  //     title: "Penerimaan",
  //     description: "Monitoring Barang Masuk Gudang",
  //     link: "/dashboard/penerimaan",
  //     icon: <FileInput size={60}/>,
  //   },
  // ]; // Array objek konten dengan ikon
  return (
    <>
      <div className="flex flex-col ">
        <Card className="w-[1000px]">
          <CardHeader>
            <CardTitle className="text-3xl font-bold justify-center items-center">
              {userName && <p className="text-3xl">Welcome, {userName}!</p>}
            </CardTitle>
          </CardHeader>
          <CardContent>
          
      {/* <div className="flex justify-center">
        <CardList
          cards={items} // Mengisi CardList dengan array objek
          footer={<p></p>} // Footer yang sama untuk semua card
          headerIcon={null}
        />
      </div> */}
          <StockList/>
          {/* <KartuStockPage/> */}
              {/* <Grafik/> */}
          </CardContent>
        </Card>{" "}
        {/* Tampilkan hanya nama pengguna */}
      </div>
    </>
  );
};

export default DashboardPage;
