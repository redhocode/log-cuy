import type { Metadata } from "next";
// import localFont from "next/font/local";
// import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
// import Navbar from "@/components/header/navbar";
import StoreProvider from "../StroreProvider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import  AppSidebar  from "@/components/app-sidebar";
import Maintenance from "../maintenance/page";
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
      <section>
      <SidebarProvider>
        <AppSidebar />
          <SidebarTrigger />
      <Toaster />
      <StoreProvider>
        <div className="h-screen pt-16 flex justify-center mx-auto">

        {children}
        </div>
        </StoreProvider>
        
      </SidebarProvider>
    </section>
  );
}
