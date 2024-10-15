"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";
import { ProduksiType } from "@/lib/types";

export const columns: ColumnDef<ProduksiType>[] = [
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
  {
    accessorKey: "HeaderProdDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date Transaksi
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },

  { accessorKey: "HeaderProdType", header: "HeaderProdType" },
  { accessorKey: "ProdType", header: "ProdType" },

  { accessorKey: "DeptID", header: "DeptID" },
  { accessorKey: "OrderID", header: "SPK" },
  { accessorKey: "OrderType", header: "OrderType" },
  { accessorKey: "LocID", header: "LocID" },
  { accessorKey: "Remark", header: "Remark" },
  { accessorKey: "ItemID", header: "ItemID" },
  { accessorKey: "ItemType", header: "ItemType" },
  { accessorKey: "Bags", header: "Bags" },
  { accessorKey: "Kgs", header: "Kgs" },
  { accessorKey: "UserName", header: "User Name" },
  { accessorKey: "UserDateTime", header: "User DateTime" },
];