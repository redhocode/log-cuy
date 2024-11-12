"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CardList from "@/components/cardlist";
import { Database, FileInput, FileOutput } from "lucide-react";

const DashboardPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Cek apakah pengguna sudah login, jika tidak redirect ke halaman login
    
    const isLoggedIn =
      typeof window !== "undefined" && localStorage.getItem("user") !== null;
    if (!isLoggedIn) {
      router.push("/auth/login"); // Redirect ke halaman login jika belum login
    }
  }, [router]);

  const items = [
    {
      title: "Produksi",
      description: "Monitoring Bahan dan hasil Produksi",
      link: "/dashboard/data",
      icon: <Database size={60} />,
    },
    {
      title: "LBM",
      description: "Monitoring Bahan Non-Produksi Masuk",
      link: "/dashboard/lbm",
      icon: <FileInput size={60}/>,
    },
    {
      title: "LBK",
      description: "Monitoring Bahan Non-Produksi Keluar",
      link: "/dashboard/lbk",
      icon: <FileOutput size={60}/>,
    },
    {
      title: "Penerimaan",
      description: "Monitoring Barang Masuk Gudang",
      link: "/dashboard/penerimaan",
      icon: <FileInput size={60}/>,
    },
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
  )
};

export default DashboardPage;
