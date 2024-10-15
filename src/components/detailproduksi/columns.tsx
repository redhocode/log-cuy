"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";

// Tipe data untuk DataProduksi
export type DataDetailProduksi = {
  ProdID: string;
  ProdType: string;
  ProdDate: Date; // Keep as Date for processing
  ItemID: string;
  ItemType: string;
  Bags: number;
  Kgs: number;
  UserName: string;
  UserDateTime: string;

};

export const columns: ColumnDef<DataDetailProduksi>[] = [
  {
    accessorKey: "ProdID",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          No. Transaksi
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
  { accessorKey: "ProdType", header: "Departement" },
  { accessorKey: "ItemID", header: "Item" },
  { accessorKey: "ItemType", header: "type" },
  { accessorKey: "Bags", header: "Bags" },
  { accessorKey: "Kgs", header: "Jumlah" },
  { accessorKey: "UserName", header: "User" },
  { accessorKey: "UserDateTime", header: "User DateTime" },
];