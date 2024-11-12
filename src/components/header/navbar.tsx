"use client";
import { useRouter, usePathname } from "next/navigation";
import { CircleUser, Menu, Package2, Search } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useEffect } from 'react';
// import useState from 'react';

const navItems = [
  // { href: "/", label: "Home" },
  { href: "/dashboard/data", label: "Produksi" },
  { href: "/dashboard/lbm", label: "LBM" },
  { href: "/dashboard/lbk", label: "LBK" },
  { href: "/dashboard/penerimaan", label: "Penerimaan" },
  { href: "/dashboard/mutasi", label: "Mutasi" },
  { href: "/dashboard/import", label: "Import" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [userName, setUserName] = React.useState<string | null>(null);
    React.useEffect(() => {
      // Cek apakah pengguna sudah login, jika tidak redirect ke halaman login

      const isLoggedIn =
        typeof window !== "undefined" && localStorage.getItem("user") !== null;

      if (!isLoggedIn) {
        router.push("/"); // Redirect ke halaman login jika belum login
      }
    }, [router]);

 useEffect(() => {
   const user = localStorage.getItem("user");
   if (!user) {
     router.push("/"); // Redirect ke halaman login jika belum login
   } else {
     const parsedUser = JSON.parse(user);
     setUserName(parsedUser.UserName); // Ambil nama pengguna
   }
 }, [router]);
  const handleNavigation = (href: string) => {
    router.push(href);
  };
const hendlelogout = () => {
  localStorage.removeItem("user");
  router.push("/auth/login");
}
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 mb-4">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <div
          onClick={() => handleNavigation("/")}
          className="flex items-center gap-2 text-lg font-semibold md:text-base cursor-pointer"
        >
          <Package2 className="h-6 w-6" />
          <span className="sr-only">R Inc</span>
        </div>
        {navItems.map(({ href, label }) => (
          <div
            key={href}
            onClick={() => handleNavigation(href)}
            className={`transition-colors cursor-pointer ${
              pathname === href
                ? "font-bold text-sky-600 text-md"
                : "text-muted-foreground hover:text-sky-700"
            }`}
          >
            {label}
          </div>
        ))}
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <div
              onClick={() => handleNavigation("/")}
              className="flex items-center gap-2 text-lg font-semibold cursor-pointer"
            >
              <Package2 className="h-6 w-6" />
              <span className="sr-only">R Inc</span>
            </div>
            {navItems.map(({ href, label }) => (
              <div
                key={href}
                onClick={() => handleNavigation(href)}
                className={`transition-colors cursor-pointer ${
                  pathname === href
                    ? "font-bold underline text-sky-500 text-xl"
                    : "text-muted-foreground hover:text-sky-500"
                }`}
              >
                {label}
              </div>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              disabled
              placeholder="Search data"
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            />
          </div>
        </form>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {" "}
              {userName && <p className="text-xl">{userName}!</p>}{" "}
            </DropdownMenuLabel>
            {/* <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={hendlelogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
