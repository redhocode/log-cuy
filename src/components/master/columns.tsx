"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";
import { masterType } from "@/lib/types";
import { Checkbox } from "../ui/checkbox";

interface ColumnsProps {
  setSelectedRows: React.Dispatch<React.SetStateAction<masterType[]>>;
}
export const columns = (
  setSelectedRows: ColumnsProps["setSelectedRows"]
): ColumnDef<masterType>[] => [
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
                (selectedRow) => selectedRow.ItemID !== row.original.ItemID
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
    accessorKey: "ItemID",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          ItemID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "ItemName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Item Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },

  { accessorKey: "ItemNameBuy", header: "Name Item Buy" },
  { accessorKey: "Spec", header: "Spesifikasi" },
  { accessorKey: "SatuanKecil", header: "Satuan" },
  { accessorKey: "KodeJenis", header: "Kode" },
  { accessorKey: "NamaJenis", header: "Kategori" },
  { accessorKey: "Mark", header: "Proses" },
];
