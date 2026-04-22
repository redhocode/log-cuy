import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import StoreProvider from "../StroreProvider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import Maintenance from "../maintenance/page";
import { SidebarInset } from "@/components/ui/sidebar";
import FloatingTelegram from "@/components/FloatingTelegram";

export const metadata: Metadata = {
  title: "Kiw ✖",
  description: "data",
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: "/Untitled.png",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "/Untitled.png",
      },
    ],
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true';

  if (isMaintenance) {
    return <Maintenance />;
  }
  
  return (
       
   
    <StoreProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex-1">
            {/* Header dengan tombol hamburger hanya di mobile */}
            <header className="sticky top-0 z-10 border-b bg-background px-4 py-3 md:px-6 md:py-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
                {/* <h1 className="text-lg font-semibold md:text-xl">Dashboard</h1> */}
              </div>
            </header>
            
            <main className="flex-1 flex items-center justify-center p-4 md:p-6">
              <div className="w-full max-w-7xl mx-auto">
                {children}
              </div>
              <FloatingTelegram/>
            </main>
          </SidebarInset>
          <Toaster />
        </div>
      </SidebarProvider>
    </StoreProvider>
  );
}