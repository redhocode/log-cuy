"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";
import { trackPoType } from "@/lib/types";
import { Checkbox } from "../ui/checkbox";

export const columns: ColumnDef<trackPoType>[] = [
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
    accessorKey: "SPK",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          SPK
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "Name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name PO
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  { accessorKey: "OrderDate", header: "Order Date" },
  { accessorKey: "Dept", header: "Departement" },
  { accessorKey: "PlanDate", header: "Plan Date" },
  { accessorKey: "Item_PO", header: "Item Pesanan" },
  { accessorKey: "Qty_PO", header: "QTY PO" },
  { accessorKey: "ItemType", header: "Type Produksi" },
  { accessorKey: "Item_Prod", header: "Item Produksi"},
  { accessorKey: "Qty_Prod", header: "QTY Produksi" },
  { accessorKey: "Status", header: "Status" },
 
];