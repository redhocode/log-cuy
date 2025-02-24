import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
// import Navbar from "@/components/header/navbar";
import StoreProvider from "./StroreProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "kiw-kiw",
  description: "data",
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: "/icon2.png",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "/icon2.png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const isMaintenance = process.env.MAINTENANCE_MODE === "true";
  // if (isMaintenance) {
  //   return <Maintenance />;
  // }
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        
        <Toaster />
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
