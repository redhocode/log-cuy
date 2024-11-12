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
    accessorKey: "OrderID",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          OrderID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "OrderDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  { accessorKey: "OrderType", header: "Order Type" },
  { accessorKey: "CompanyID", header: "Company ID" },
  { accessorKey: "Total", header: "Total" },
  { accessorKey: "Curr", header: "Curr" },
  { accessorKey: "Rate", header: "Rate" },
  { accessorKey: "TotalRp", header: "TotalRp" },
  { accessorKey: "DueDate", header: "Due Date" },
  { accessorKey: "Remark", header: "Remark" },
  { accessorKey: "TipeDok", header: "Tipe Dok" },
  { accessorKey: "DPP", header: "DPP" },
  { accessorKey: "ItemID", header: "ItemID" },
  { accessorKey: "Bags", header: "Bags" },
  { accessorKey: "Kgs", header: "Kgs" },
  { accessorKey: "Price", header: "Price" },
  { accessorKey: "TotalDt", header: "Total Item" },
  { accessorKey: "Satuan", header: "Satuan" },
];