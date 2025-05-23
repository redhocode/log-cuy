"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";
import { masterType } from "@/lib/types";
import { Checkbox } from "../ui/checkbox";

interface ColumnsProps {
  setSelectedRows: React.Dispatch<React.SetStateAction<masterType[]>>;
  filteredData: masterType[];
}

export const columns = (
  setSelectedRows: ColumnsProps["setSelectedRows"],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  filteredData: masterType[] // Ensure this is the filtered data
): ColumnDef<masterType>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        onCheckedChange={(value) => {
          table.toggleAllRowsSelected(!!value); // Toggle all rows selection
          if (value) {
            // Sync selected rows based on current filtered data
            setSelectedRows(
              table.getSelectedRowModel().rows.map((row) => row.original)
            );
          } else {
            setSelectedRows([]); // Clear selection when de-selecting all
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
            // Add to selected rows if the checkbox is checked
            setSelectedRows((prev) => [...prev, row.original]);
          } else {
            // Remove from selected rows if the checkbox is unchecked
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
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        ItemID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "ItemName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Item Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  { accessorKey: "ItemNameBuy", header: "Name Item Buy" },
  { accessorKey: "warna", header: "Warna" },
  { accessorKey: "Spec", header: "Spesifikasi" },
  { accessorKey: "SatuanKecil", header: "Satuan" },
  { accessorKey: "KodeJenis", header: "Kode" },
  { accessorKey: "NamaJenis", header: "Kategori" },
  { accessorKey: "Mark", header: "Proses" },
];
