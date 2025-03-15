"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";
import { MutasiType } from "@/lib/types";
import { Checkbox } from "../ui/checkbox";

export const columns: ColumnDef<MutasiType>[] = [
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
  //{ accessorKey: "MoveType", header: "Move Type" },
  { accessorKey: "Gudang_Asal", header: "Gudang Asal" },
  { accessorKey: "Gudang_Tujuan", header: "Gudang Tujuan" },
  { accessorKey: "Keterangan", header: "Keterangan" },
   { accessorKey: "NoRator", header: "No Rator" },
  { accessorKey: "ItemID", header: "ItemID" },
  { accessorKey: "Bags", header: "Bags" },
  { accessorKey: "Kgs", header: "Kgs" },
  { accessorKey: "username", header: "User Name" },
 // { accessorKey: "userdatetime", header: "User DateTime" },

];