"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";
import { kasType } from "@/lib/types";
import { Checkbox } from "../ui/checkbox";
interface ColumnsProps {
  setSelectedRows: React.Dispatch<React.SetStateAction<kasType[]>>;
}
export const columns = (
  setSelectedRows: ColumnsProps["setSelectedRows"]
): ColumnDef<kasType>[] => [
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
                (selectedRow) => selectedRow.RefNo !== row.original.RefNo
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
    accessorKey: "RefNo",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          RefNo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "RefDate",
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

  { accessorKey: "RefType", header: "Type" },
  { accessorKey: "TotalRp", header: "Total" },
  { accessorKey: "Remark", header: "Keterangan" },
  { accessorKey: "Acc", header: "Acc" },
  // { accessorKey: "Pos", header: "Pos" },
  { accessorKey: "Curr", header: "Curr" },
  { accessorKey: "username", header: "User Name" },
  { accessorKey: "userdatetime", header: "User DateTime" },
];