"use client";
import { useRouter, usePathname } from "next/navigation";
import {  Package2, Import, User2, ChevronUp, Annoyed, User } from "lucide-react";
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
  { href: "/dashboard/barang", label: "Master Barang", icon: Package2 },
]
const navItems = [
  { href: "/dashboard/data", label: "Produksi", icon: Package2 },
  { href: "/dashboard/lbm", label: "LBM", icon: Package2 },
  { href: "/dashboard/lbk", label: "LBK", icon: Package2 },
  { href: "/dashboard/penerimaan", label: "Penerimaan", icon: Package2 },
  { href: "/dashboard/mutasi", label: "Mutasi", icon: Package2 },
//   { href: "/dashboard/import", label: "Import", icon: Import },
];

const items = [
  {
    title: "Import",
    url: "/dashboard/import",
    icon: Import,
    disabled: false,
  },
]
const Items2 = [
  { href: "/dashboard/spk", label: "SPK", icon: Package2 },
  { href: "/dashboard/purchase", label: "Purchase", icon: Package2 },
]
const Items3 = [
  { href: "/dashboard/kas", label: "Kas", icon: Package2 },
  { href: "/dashboard/bank", label: "Bank", icon: Package2 },
  { href: "/dashboard/jurnal", label: "Jurnal Umum", icon: Package2 },
];
const Items4 = [
  { href: "/dashboard/loguser", label: "Log Users", icon: User },
  { href: "/dashboard/logacr", label: "Log Acc", icon: User}
]
export default function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = React.useState<string | null>(null);

  useEffect(() => {
    const isLoggedIn =
      typeof window !== "undefined" && localStorage.getItem("user") !== null;

    if (!isLoggedIn) {
      router.push("/"); // Redirect to login if not logged in
    } else {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setUserName(user.UserName); // Get the user's name
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg">
            <Annoyed className="h-5 w-5" />
            <Label className="text-lg font-semibold">
              <Link href="/dashboard" replace={false}>
                Kiw-kiw
              </Link>
            </Label>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Collapsible Section with Nav Links */}
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="flex items-center gap-2">
                      <Package2 className="h-5 w-5" />
                      <span>Master</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {masterItems.map(({ href, label, icon: Icon }) => (
                        <SidebarMenuItem key={href}>
                          <SidebarMenuButton asChild>
                            <Button
                              variant={pathname === href ? "outline" : "ghost"}
                              onClick={() => router.push(href)}
                              className="flex items-center gap-2 justify-start"
                            >
                              <Icon className="h-5 w-5" />
                              <span>{label}</span>
                            </Button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              {/* Collapsible Section with Nav Links */}
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="flex items-center gap-2">
                      <Package2 className="h-5 w-5" />
                      <span>Keuangan</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {Items3.map(({ href, label, icon: Icon }) => (
                        <SidebarMenuItem key={href}>
                          <SidebarMenuButton asChild>
                            <Button
                              variant={pathname === href ? "outline" : "ghost"}
                              onClick={() => router.push(href)}
                              className="flex items-center gap-2 justify-start"
                            >
                              <Icon className="h-5 w-5" />
                              <span>{label}</span>
                            </Button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              {/* Collapsible Section with Nav Links */}
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="flex items-center gap-2">
                      <Package2 className="h-5 w-5" />
                      <span>Operasional</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {Items2.map(({ href, label, icon: Icon }) => (
                        <SidebarMenuItem key={href}>
                          <SidebarMenuButton asChild>
                            <Button
                              variant={pathname === href ? "outline" : "ghost"}
                              onClick={() => router.push(href)}
                              className="flex items-center gap-2 justify-start"
                            >
                              <Icon className="h-5 w-5" />
                              <span>{label}</span>
                            </Button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="flex items-center gap-2">
                      <Package2 className="h-5 w-5" />
                      <span>Produksi</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {navItems.map(({ href, label, icon: Icon }) => (
                        <SidebarMenuItem key={href}>
                          <SidebarMenuButton asChild>
                            <Button
                              variant={pathname === href ? "outline" : "ghost"}
                              onClick={() => router.push(href)}
                              className="flex items-center gap-2 justify-start"
                            >
                              <Icon className="h-5 w-5" />
                              <span>{label}</span>
                            </Button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              {/* log */}
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="flex items-center gap-2">
                      <Package2 className="h-5 w-5" />
                      <span>Log</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {Items4.map(({ href, label, icon: Icon }) => (
                        <SidebarMenuItem key={href}>
                          <SidebarMenuButton asChild>
                            <Button
                              variant={pathname === href ? "outline" : "ghost"}
                              onClick={() => router.push(href)}
                              className="flex items-center gap-2 justify-start"
                            >
                              <Icon className="h-5 w-5" />
                              <span>{label}</span>
                            </Button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {item.disabled ? (
                      <span>
                        <item.icon />
                        <span className="text-gray-400">{item.title}</span>
                      </span>
                    ) : (
                      <Link href={item.url}>
                        <item.icon />
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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 />{" "}
                  {userName && <span className="ml-2">{userName}</span>}
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem onClick={handleLogout}>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
