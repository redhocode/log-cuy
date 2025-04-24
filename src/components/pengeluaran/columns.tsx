"use client";
/*@typescript-eslint/no-explicit-any*/
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { pengeluaran } from "./notifpengeluaran";

interface ColumnsProps {
  setSelectedRows: React.Dispatch<React.SetStateAction<pengeluaran[]>>; // Update with your correct type
}

export const columns = (
  setSelectedRows: ColumnsProps["setSelectedRows"]
): ColumnDef<pengeluaran>[] => [
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
                (selectedRow) =>
                  selectedRow.KodeBarang !== row.original.KodeBarang
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
    accessorKey: "PembeliPeneima",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Custommer
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "KodeBarang",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Kode Barang
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  { accessorKey: "NamaBarang", header: "Nama Barang" },
  { accessorKey: "Jumlah", header: "Jumlah" },
  {
    accessorKey: "TanggalSuratJalan",
    header: "Tanggal",
   cell: ({ row }) => {
     const value = row.getValue("TanggalSuratJalan");
     return value?.toString() ? new Date(value.toString()).toLocaleDateString("id-ID") : "-";
   },
  },
];
