"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";
import { Spktype } from "@/lib/types";
import { Checkbox } from "../ui/checkbox";

interface ColumnsProps {
  setSelectedRows: React.Dispatch<React.SetStateAction<Spktype[]>>;
}
export const columns = (
  setSelectedRows: ColumnsProps["setSelectedRows"]
): ColumnDef<Spktype>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        // indeterminate={table.getIsSomeRowsSelected()} // Menambahkan kondisi indeterminate
        onCheckedChange={(value) => {
          table.toggleAllRowsSelected(!!value); // Pilih atau batalkan semua baris di seluruh dataset
          if (value) {
            // Update selectedRows jika memilih semua baris
            setSelectedRows(
              table.getSelectedRowModel().rows.map((row) => row.original)
            );
          } else {
            // Kosongkan selectedRows jika batal memilih
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
            // Tambahkan ke selectedRows jika memilih baris
            setSelectedRows((prev) => [...prev, row.original]);
          } else {
            // Hapus dari selectedRows jika membatalkan pemilihan
            setSelectedRows((prev) =>
              prev.filter(
                (selectedRow) => selectedRow.OrderID !== row.original.OrderID
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
    accessorKey: "OrderID",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order ID
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
          Order date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },

  { accessorKey: "OrderType", header: "OrderType" },
  { accessorKey: "PlanDate", header: "Plan Date" },
  { accessorKey: "Remark", header: "Keterangan" },
  { accessorKey: "ItemID", header: "ItemID" },
  { accessorKey: "ItemIDDT", header: "ItemID" },
  { accessorKey: "Bags", header: "Bags" },
  { accessorKey: "Kgs", header: "Kgs" },
  { accessorKey: "PRDeptID", header: "PRDeptID" },
  { accessorKey: "TypeSO", header: "TypeSO" },
  { accessorKey: "UserName", header: "User Name" },
  { accessorKey: "UserDateTime", header: "User DateTime" },
  // { accessorKey: "RJN", header: "RJN" },
];