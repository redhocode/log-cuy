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
    accessorKey: "MoveID",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          MoveID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "MoveDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Move Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  { accessorKey: "MoveType", header: "Move Type" },
  { accessorKey: "LocIDSrc", header: "Gudang Asal" },
  { accessorKey: "LocIDDest", header: "Gudang Tujuan" },
  { accessorKey: "Remark", header: "Keterangan" },
   { accessorKey: "NoRator", header: "No Rator" },
  { accessorKey: "ItemID", header: "ItemID" },
  { accessorKey: "Bags", header: "Bags" },
  { accessorKey: "Kgs", header: "Kgs" },
  { accessorKey: "username", header: "User Name" },
  { accessorKey: "userdatetime", header: "User DateTime" },

];