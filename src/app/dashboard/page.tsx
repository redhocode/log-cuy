"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StockList from "@/components/stock/stocklist";

const DashboardPage = () => {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.push("/auth/login");
    } else {
      const parsedUser = JSON.parse(user);
      setUserName(parsedUser.UserName);
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center w-full min-h-screen p-4 md:p-6">
      {/* Header dengan teks responsif */}
      <div className="w-full max-w-7xl mx-auto text-center mb-6 md:mb-8">
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-bold mb-2 md:mb-4">
          KIW-KIW
        </h1>
        {userName && (
          <div className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-400">
            <p className="mb-1">Sistem Monitoring Produksi</p>
            <p className="font-semibold text-primary">Halo, {userName}!</p>
          </div>
        )}
      </div>

      {/* Card utama dengan lebar responsif */}
      <Card className="w-full max-w-7xl mx-auto shadow-lg">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
            Dashboard Utama
          </CardTitle>
        </CardHeader>
        
        <hr className="mx-4 md:mx-6" />
        
        <CardContent className="pt-6">
          {/* Section ringkasan statistik (opsional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Statistik Card 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 border">
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Stock</span>
                <span className="text-2xl font-bold">1,234</span>
                <span className="text-xs text-green-600 dark:text-green-400 mt-1">+12% dari bulan lalu</span>
              </div>
            </div>
            
            {/* Statistik Card 2 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4 border">
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 dark:text-gray-400">Produksi Hari Ini</span>
                <span className="text-2xl font-bold">56</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 mt-1">Aktif: 3 line</span>
              </div>
            </div>
            
            {/* Statistik Card 3 */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-lg p-4 border">
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending PO</span>
                <span className="text-2xl font-bold">23</span>
                <span className="text-xs text-red-600 dark:text-red-400 mt-1">2 perlu perhatian</span>
              </div>
            </div>
            
            {/* Statistik Card 4 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg p-4 border">
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Supplier</span>
                <span className="text-2xl font-bold">48</span>
                <span className="text-xs text-purple-600 dark:text-purple-400 mt-1">5 aktif hari ini</span>
              </div>
            </div>
          </div>

          {/* Aksi cepat (Quick Actions) */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Aksi Cepat</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <button 
                onClick={() => router.push('/dashboard/data')}
                className="bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-lg text-center transition-colors"
              >
                Data Produksi
              </button>
              <button 
                onClick={() => router.push('/dashboard/stock')}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg text-center transition-colors"
              >
                Stock Gudang
              </button>
              <button 
                onClick={() => router.push('/dashboard/po')}
                className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg text-center transition-colors"
              >
                PO Produksi
              </button>
            </div>
          </div>

          {/* Komponen StockList dengan container responsif */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Stock Terbaru</h3>
              <button 
                onClick={() => router.push('/dashboard/')}
                className="text-sm text-primary hover:underline"
              >
                Lihat Semua
              </button>
            </div>
            <div className="overflow-x-auto">
              <StockList />
            </div>
          </div>

          {/* Informasi tambahan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Update Sistem</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span>Sistem berjalan normal</span>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  <span>Update terakhir: 2 jam yang lalu</span>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                  <span>Backup otomatis: 00:00 WIB</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Tips & Trik</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">📊</span>
                  <span>Gunakan filter untuk mencari data lebih cepat</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🔔</span>
                  <span>Aktifkan notifikasi untuk update penting</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">📱</span>
                  <span>Akses sistem dari mobile dengan scan QR code</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto mt-8 pt-4 border-t text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} KIW System v2.0 • Terakhir login: {new Date().toLocaleDateString('id-ID')}</p>
      </footer>
    </div>
  );
};

export default DashboardPage;