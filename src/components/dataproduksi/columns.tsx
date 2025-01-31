"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";
import { ProduksiType } from "@/lib/types";
 import { Checkbox } from "@/components/ui/checkbox";
interface ColumnsProps {
setSelectedRows: React.Dispatch<React.SetStateAction<ProduksiType[]>>;
}

export const columns = (
  setSelectedRows: ColumnsProps["setSelectedRows"]
): ColumnDef<ProduksiType>[] => [
 {
  id: "select",
  header: ({ table }) => (
    <Checkbox
      checked={table.getIsAllRowsSelected()} 
      // indeterminate={table.getIsSomeRowsSelected()} // Menambahkan kondisi indeterminate
      onCheckedChange={(value) => {
        table.toggleAllRowsSelected(!!value);  // Pilih atau batalkan semua baris di seluruh dataset
        if (value) {
          // Update selectedRows jika memilih semua baris
          setSelectedRows(table.getSelectedRowModel().rows.map(row => row.original));
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
            prev.filter((selectedRow) => selectedRow.ProdID !== row.original.ProdID)
          );
        }
      }}
      aria-label="Select row"
    />
  ),
},  {
    id: "index",
    header: "No",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "ProdID",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          ProdID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "ProdDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date Transaksi
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },

  // { accessorKey: "HeaderProdType", header: "HeaderProdType" },
  // { accessorKey: "ProdType", header: "ProdType" },
   { accessorKey: "DeptID", header: "Dept" },

  { accessorKey: "OrderID", header: "SPK" },
  // { accessorKey: "OrderType", header: "OrderType" },
  { accessorKey: "Shift", header: "NO. Rator" },
  { accessorKey: "LocID", header: "WH" },
  { accessorKey: "Remark", header: "Description" },
  { accessorKey: "ItemID", header: "ItemID" },
  { accessorKey: "ItemType", header: "Type" },
  { accessorKey: "Bags", header: "Bags" },
  { accessorKey: "Kgs", header: "Qty" },
  { accessorKey: "UserName", header: "User Name" },
  { accessorKey: "UserDateTime", header: "User DateTime" },
];