"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  Factory, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Clock,
  Bell,
  QrCode,
  Shield,
  Database,
  Download,
  GitBranch,
  Heart,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/lib/store";
import { fetchSpkData } from "@/lib/features/spkSlice";
import Loading from "@/app/loading";

const useAppDispatch = () => useDispatch<AppDispatch>();

const DashboardPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [userName, setUserName] = useState<string | null>(null);
  const [loginTime, setLoginTime] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const spkState = useSelector((state: RootState) => state.spk);
  const spkData = Array.isArray(spkState?.data) ? spkState.data : [];

  useEffect(() => {
    const user = localStorage.getItem("user");
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const formattedDate = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    setLoginTime(`${formattedDate}, ${formattedTime}`);
    
    if (!user) {
      router.push("/auth/login");
    } else {
      try {
        const parsedUser = JSON.parse(user);
        setUserName(parsedUser.UserName || parsedUser.username || "Pengguna");
      } catch {
        router.push("/auth/login");
      }
    }

    const fetchData = async () => {
      setLoading(true);
      await dispatch(fetchSpkData({}));
      setLoading(false);
    };
    fetchData();
  }, [router, dispatch]);

  const totalSPK = spkData.length;
  const completedSPK = spkData.filter((item: any) => item.Completed === true).length;
  const pendingSPK = totalSPK - completedSPK;
  const completionRate = totalSPK > 0 ? ((completedSPK / totalSPK) * 100).toFixed(1) : 0;

  const stats = [
    { label: "Total SPK", value: totalSPK, change: `${completionRate}% selesai`, icon: FileText, color: "blue" },
    { label: "SPK Selesai", value: completedSPK, change: `${pendingSPK} pending`, icon: CheckCircle, color: "green" },
    { label: "SPK Proses", value: pendingSPK, change: "Belum selesai", icon: Clock, color: "amber" },
    { label: "Akses Cepat", value: "3 Menu", change: "Klik tombol di bawah", icon: Database, color: "purple" },
  ];

  const quickActions = [
    { label: "Data SPK", path: '/dashboard/spk', color: "primary", icon: FileText, description: "Kelola Surat Perintah Kerja" },
    { label: "Stock Gudang", path: '/dashboard/stock', color: "blue", icon: Package, description: "Monitoring stok barang" },
    { label: "Data Produksi", path: '/dashboard/production', color: "green", icon: Factory, description: "Lihat produksi harian" },
    { label: "Laporan", path: '/dashboard/report', color: "purple", icon: Download, description: "Export laporan data" },
  ];

  const systemUpdates = [
    { status: "normal", text: "Sistem berjalan normal", color: "text-green-500", bg: "bg-green-500" },
    { status: "update", text: `Update terakhir: ${loginTime}`, color: "text-blue-500", bg: "bg-blue-500" },
    { status: "backup", text: "Backup otomatis: 00:00 WIB", color: "text-amber-500", bg: "bg-amber-500" },
  ];

  const tips = [
    { icon: "📊", text: "Gunakan filter untuk mencari data lebih cepat" },
    { icon: "🔔", text: "Aktifkan notifikasi untuk update penting" },
    { icon: "📱", text: "Akses sistem dari mobile dengan scan QR code" },
    { icon: "🛡️", text: "Selalu logout setelah menggunakan sistem" },
  ];

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header dengan branding */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              KIW-KIW
            </h1>
            <div className="mt-2 space-y-1">
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Sistem Monitoring Produksi & Inventory
              </p>
              {userName && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Halo, <span className="font-semibold text-primary">{userName}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Clock className="w-3 h-3" />
              <span>Login: {loginTime}</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Database className="w-3 h-3" />
              <span>v2.0.1 Production</span>
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className={`text-xs mt-1 ${
                        stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                        stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                        stat.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                        'text-purple-600 dark:text-purple-400'
                      }`}>
                        <TrendingUp className="inline w-3 h-3 mr-1" />
                        {stat.change}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${
                      stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      stat.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                      stat.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30' :
                      'bg-purple-100 dark:bg-purple-900/30'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                        stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                        stat.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                        'text-purple-600 dark:text-purple-400'
                      }`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Dashboard Card */}
        <Card className="shadow-xl border-gray-200 dark:border-gray-800 mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Dashboard Utama
            </CardTitle>
          </CardHeader>
          
          <Separator className="mb-6" />
          
          <CardContent className="space-y-8">
            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Aksi Cepat
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      onClick={() => router.push(action.path)}
                      className={`h-auto py-4 flex flex-col items-center justify-center gap-2 ${
                        action.color === 'primary' ? 'bg-primary hover:bg-primary/90' :
                        action.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                        action.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                        'bg-purple-600 hover:bg-purple-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Updates */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Status Sistem
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {systemUpdates.map((update, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${update.bg}`}></div>
                        <span className="text-sm">{update.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Tips & Tricks */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-primary" />
                    Tips & Trik
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-lg">{tip.icon}</span>
                        <span className="text-sm">{tip.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Footer dengan attribution */}
        <footer className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>© {new Date().getFullYear()} KIW-KIW Production Monitoring System</p>
              <p className="mt-1">Terakhir login: {loginTime}</p>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Heart className="w-4 h-4 text-red-500" />
                <span>Dibuat dengan</span>
              </div>
              <a 
                href="https://github.com/redoamain" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 text-white hover:opacity-90 transition-opacity"
              >
                <GitBranch className="w-4 h-4" />
                <span className="font-medium">redo</span>
                <span className="text-xs opacity-80">on GitHub</span>
              </a>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <Badge variant="outline" className="text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Online</span>
                </div>
              </Badge>
              <span>•</span>
              <span>Server: Production</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardPage;