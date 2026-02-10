// File: app/(dashboard)/retur/columns.tsx
"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";
import { LbmType } from "@/lib/types";
import { Checkbox } from "../ui/checkbox";

// Definisikan tipe Row yang memiliki properti table
interface RowWithTable<TData> extends Row<TData> {
  table: {
    getSelectedRowModel: () => {
      rows: Row<TData>[];
    };
  };
}

export const columns = (setSelectedRows?: (rows: LbmType[]) => void): ColumnDef<LbmType>[] => [
  {
    id: "select",
    header: ({ table }) => {
      if (!setSelectedRows) return null;
      
      return (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
            if (setSelectedRows) {
              setSelectedRows(table.getSelectedRowModel().rows.map(row => row.original));
            }
          }}
          aria-label="Select all"
        />
      );
    },
    cell: ({ row }) => {
      if (!setSelectedRows) return null;
      
      // Type assertion untuk mengakses table
      const rowWithTable = row as RowWithTable<LbmType>;
      
      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => {
            row.toggleSelected(!!value);
            if (setSelectedRows) {
              const selectedRows = rowWithTable.table.getSelectedRowModel().rows.map(row => row.original);
              setSelectedRows(selectedRows);
            }
          }}
          aria-label="Select row"
        />
      );
    },
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
  { accessorKey: "Gudang", header: "Gudang" },
  { accessorKey: "NoRator", header: "No Rator" },
  { accessorKey: "Keterangan", header: "Keterangan" },
  { accessorKey: "ItemID", header: "ItemID" },
  { accessorKey: "Bags", header: "Bags" },
  { accessorKey: "Kgs", header: "Kgs" },
  { accessorKey: "HPPPrice", header: "HPP" },
  { accessorKey: "Kategori", header: "Kategori" },
  { accessorKey: "username", header: "User Name" },
];