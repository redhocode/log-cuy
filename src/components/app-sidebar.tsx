"use client";
import { useRouter, usePathname } from "next/navigation";
import { 
  Package2, Import, User2, ChevronUp, Annoyed, TimerReset,
  Warehouse, FileText, Calculator, Users, Factory, Repeat, Truck, BarChart,
  ClipboardList, ShoppingCart, Eye, Settings, History, Package, Layers
} from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import Link from "next/link";
import { Label } from "./ui/label";

const masterItems = [ 
  { href: "/dashboard/", label: "Stock Gudang", icon: Warehouse },
  { href: "/dashboard/bom", label: "BOM", icon: FileText },
  { href: "/dashboard/barang", label: "Master Barang", icon: Package },
  { href: "/dashboard/cekppn", label: "Hitung PPN", icon: Calculator },
  { href: "/dashboard/supplier", label: "Supplier", icon: Users },
  { href: "/dashboard/absensi", label: "Ripair", icon: TimerReset },
];

const navItems = [
  { href: "/dashboard/data", label: "Produksi", icon: Factory },
  { href: "/dashboard/lbm", label: "LBM", icon: Package2 },
  { href: "/dashboard/lbk", label: "LBK", icon: Package2 },
  { href: "/dashboard/retur", label: "Retur Produksi", icon: Repeat },
  { href: "/dashboard/mutasi", label: "Mutasi Gudang", icon: Truck },
  { href: "/dashboard/kartustock", label: "Kartu Stock", icon: Layers },
  { href: "/dashboard/stock", label: "Stock Pergudang", icon: Warehouse },
];

const items = [
  {
    title: "Import",
    url: "/dashboard/import",
    icon: Import,
    disabled: true,
  },
];

const Items2 = [
  { href: "/dashboard/ppic", label: "PPIC", icon: ClipboardList },
  { href: "/dashboard/spk", label: "SPK/SO", icon: FileText },
  { href: "/dashboard/purchase", label: "Pembelian", icon: ShoppingCart },
  { href: "/dashboard/penerimaan", label: "Penerimaan", icon: Truck },
  { href: "/dashboard/pengeluaran", label: "Penjualan", icon: BarChart },
  { href: "/dashboard/returpembelian", label: "Retur Pembelian", icon: Repeat },
];

const Items5 = [
  { href: "/dashboard/po", label: "Produksi", icon: Eye },
  { href: "/dashboard/so", label: "Seles Order", icon: FileText },
  { href: "/dashboard/po-beli", label: "Pembelian", icon: ShoppingCart },
];

const Items4 = [
  { href: "/dashboard/loguser", label: "Log Users", icon: History },
];

export default function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = React.useState<string | null>(null);

  useEffect(() => {
    const isLoggedIn =
      typeof window !== "undefined" && localStorage.getItem("user") !== null;

    if (!isLoggedIn) {
      router.push("/");
    } else {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setUserName(user.UserName);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent className="overflow-y-auto pt-0">
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg py-2">
            <Annoyed className="h-6 w-6" />
            <Label className="text-lg font-semibold ml-2">
              <Link href="/dashboard" replace={false}>
                Kiw-kiw
              </Link>
            </Label>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Master Section */}
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      <span className="font-medium">Master</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {masterItems.map(({ href, label, icon: Icon }) => (
                        <SidebarMenuItem key={href}>
                          <SidebarMenuButton asChild>
                            <Button
                              variant={pathname === href ? "secondary" : "ghost"}
                              onClick={() => router.push(href)}
                              className="flex items-center gap-2 justify-start w-full h-9 px-3"
                            >
                              <Icon className="h-4 w-4" />
                              <span className="text-sm">{label}</span>
                            </Button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Monitoring Section */}
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      <span className="font-medium">Monitoring</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {Items5.map(({ href, label, icon: Icon }) => (
                        <SidebarMenuItem key={href}>
                          <SidebarMenuButton asChild>
                            <Button
                              variant={pathname === href ? "secondary" : "ghost"}
                              onClick={() => router.push(href)}
                              className="flex items-center gap-2 justify-start w-full h-9 px-3"
                            >
                              <Icon className="h-4 w-4" />
                              <span className="text-sm">{label}</span>
                            </Button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Operasional Section */}
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5" />
                      <span className="font-medium">Operasional</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {Items2.map(({ href, label, icon: Icon }) => (
                        <SidebarMenuItem key={href}>
                          <SidebarMenuButton asChild>
                            <Button
                              variant={pathname === href ? "secondary" : "ghost"}
                              onClick={() => router.push(href)}
                              className="flex items-center gap-2 justify-start w-full h-9 px-3"
                            >
                              <Icon className="h-4 w-4" />
                              <span className="text-sm">{label}</span>
                            </Button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Produksi Section */}
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="flex items-center gap-2">
                      <Factory className="h-5 w-5" />
                      <span className="font-medium">Produksi</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {navItems.map(({ href, label, icon: Icon }) => (
                        <SidebarMenuItem key={href}>
                          <SidebarMenuButton asChild>
                            <Button
                              variant={pathname === href ? "secondary" : "ghost"}
                              onClick={() => router.push(href)}
                              className="flex items-center gap-2 justify-start w-full h-9 px-3"
                            >
                              <Icon className="h-4 w-4" />
                              <span className="text-sm">{label}</span>
                            </Button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Log Section */}
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      <span className="font-medium">Log</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {Items4.map(({ href, label, icon: Icon }) => (
                        <SidebarMenuItem key={href}>
                          <SidebarMenuButton asChild>
                            <Button
                              variant={pathname === href ? "secondary" : "ghost"}
                              onClick={() => router.push(href)}
                              className="flex items-center gap-2 justify-start w-full h-9 px-3"
                            >
                              <Icon className="h-4 w-4" />
                              <span className="text-sm">{label}</span>
                            </Button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
            
            {/* Import Section */}
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {item.disabled ? (
                      <span className="flex items-center gap-2 text-gray-400 text-sm py-2 px-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </span>
                    ) : (
                      <Link href={item.url} className="flex items-center gap-2 text-sm py-2 px-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t pt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full h-10 px-3">
                  <div className="flex items-center gap-2 w-full">
                    <User2 className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate text-sm font-medium">
                      {userName || "User"}
                    </span>
                    <ChevronUp className="ml-auto h-3 w-3 flex-shrink-0" />
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem onClick={handleLogout}>
                  <span className="text-sm">Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}