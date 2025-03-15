"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";
import { PurchaseType } from "@/lib/types";
import { Checkbox } from "../ui/checkbox";

export const columns: ColumnDef<PurchaseType>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  },
  {
    id: "index",
    header: "No",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "No_Transaksi",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          No Transaksi
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "Tanggal",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tanggal
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  // { accessorKey: "OrderType", header: "Order Type" },
  { accessorKey: "Supplier", header: "Supplier" },
  // { accessorKey: "Total", header: "Total" },
  // { accessorKey: "Curr", header: "Curr" },
  // { accessorKey: "Rate", header: "Rate" },
  // { accessorKey: "TotalRp", header: "TotalRp" },
  // { accessorKey: "DueDate", header: "Due Date" },
  { accessorKey: "Keterangan", header: "Keterangan" },
  { accessorKey: "TipeDok", header: "Tipe Dok" },
  // { accessorKey: "DPP", header: "DPP" },
  { accessorKey: "ItemID", header: "ItemID" },
  { accessorKey: "Bags", header: "Bags" },
  { accessorKey: "Kgs", header: "Kgs" },
  { accessorKey: "Price", header: "Price" },
  // { accessorKey: "TotalDt", header: "Total Item" },
  { accessorKey: "Satuan", header: "Satuan" },
  { accessorKey: "username", header: "User Name" },
];