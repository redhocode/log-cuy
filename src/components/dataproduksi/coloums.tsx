"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";

// Tipe data untuk DataProduksi
export type DataProduksi = {
  ProdID: string;
  HeaderProdType: string;
  HeaderProdDate: string;
  DeptID: string;
  OrderID: string;
  OrderType: string;
  LocID: string;
  Remark: string;
  ItemID: string;
  ItemType: string;
  Bags: number;
  Kgs: number;
  BagsLeft: number;
  KgsLeft: number;
  UserName: string;
  UserDateTime: string;
};

export const columns: ColumnDef<DataProduksi>[] = [
  {
    accessorKey: "ProdID",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          ProdID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  { accessorKey: "HeaderProdType", header: "Header ProdType" },
  { accessorKey: "HeaderProdDate", header: "Header ProdDate" },
  { accessorKey: "DeptID", header: "DeptID" },
  { accessorKey: "OrderID", header: "OrderID" },
  { accessorKey: "OrderType", header: "OrderType" },
  { accessorKey: "LocID", header: "LocID" },
  { accessorKey: "Remark", header: "Remark" },
  { accessorKey: "ItemID", header: "ItemID" },
  { accessorKey: "ItemType", header: "ItemType" },
  { accessorKey: "Bags", header: "Bags" },
  { accessorKey: "Kgs", header: "Kgs" },
  { accessorKey: "BagsLeft", header: "Bags Left" },
  { accessorKey: "KgsLeft", header: "Kgs Left" },
  { accessorKey: "UserName", header: "User Name" },
  { accessorKey: "UserDateTime", header: "User DateTime" },
];