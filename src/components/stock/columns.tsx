"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";

interface ColumnsProps {
  setSelectedRows: React.Dispatch<React.SetStateAction<any[]>>; // Update with your correct type
}

export const columns = (
  setSelectedRows: ColumnsProps["setSelectedRows"]
): ColumnDef<any>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        onCheckedChange={(value) => {
          table.toggleAllRowsSelected(!!value);
          if (value) {
            setSelectedRows(
              table.getSelectedRowModel().rows.map((row) => row.original)
            );
          } else {
            setSelectedRows([]);
          }
        }}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => {
          row.toggleSelected(!!value);
          if (value) {
            setSelectedRows((prev) => [...prev, row.original]);
          } else {
            setSelectedRows((prev) =>
              prev.filter(
                (selectedRow) => selectedRow.itemid !== row.original.itemid
              )
            );
          }
        }}
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
    accessorKey: "itemid",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Item ID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "itemname",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Nama
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  { accessorKey: "stockAkhir", header: "Qty" },
  { accessorKey: "kategori", header: "Kategori" },
];
