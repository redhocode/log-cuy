"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";
import { PenerimaanType } from "@/lib/types";
import { Checkbox } from "../ui/checkbox";

export const columns: ColumnDef<PenerimaanType>[] = [
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
    accessorKey: "MoveType",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          MoveType
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },

  { accessorKey: "OrderID", header: "OrderID" },
  { accessorKey: "TransID", header: "TransID" },
  { accessorKey: "CompanyID", header: "CompanyID" },
  { accessorKey: "RJN", header: "RJN" },
  { accessorKey: "MoveDate", header: "Date" },
  { accessorKey: "LocID", header: "Gudang" },
  { accessorKey: "Nopol", header: "Nopol" },
  { accessorKey: "Nopen", header: "Nopen" },
  { accessorKey: "TglNopen", header: "TglNopen" },
  { accessorKey: "Timbang", header: "Timbang" },
  { accessorKey: "TipeEdit", header: "TipeEdit" },
  { accessorKey: "ItemID", header: "Item" },
  { accessorKey: "Bags", header: "Bags" },
  { accessorKey: "Kgs", header: "QTY" },
  { accessorKey: "username", header: "User Name" },
  // { accessorKey: "userdatetime", header: "User DateTime" },
  { accessorKey: "satuan", header: "Satuan" },
  { accessorKey: "TglSJSupplier", header: "TglSJSupplier" },
];