// components/master/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Edit, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { masterType } from "@/lib/types";
import { Checkbox } from "../ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface ColumnsProps {
  setSelectedRows: React.Dispatch<React.SetStateAction<masterType[]>>;
  filteredData: masterType[];
  onEditItem?: (item: masterType) => void;
  onDeleteItem?: (item: masterType) => void;
}

export const columns = (
  setSelectedRows: ColumnsProps["setSelectedRows"],
  filteredData: masterType[],
  onEditItem?: (item: masterType) => void,
  onDeleteItem?: (item: masterType) => void
): ColumnDef<masterType>[] => [
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
        className="whitespace-nowrap"
      >
        ItemID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const itemID = row.getValue("ItemID") as string;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-mono text-sm cursor-help">
                {itemID.length > 20 ? `${itemID.substring(0, 20)}...` : itemID}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{itemID}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "ItemName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="whitespace-nowrap"
      >
        Item Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const itemName = row.getValue("ItemName") as string;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                {itemName.length > 40 ? `${itemName.substring(0, 40)}...` : itemName}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <p>{itemName}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "ItemName2",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="whitespace-nowrap"
      >
        Name China
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const itemName2 = row.getValue("ItemName2") as string;
      if (!itemName2) return <span className="text-gray-400">-</span>;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help text-sm">
                {itemName2.length > 35 ? `${itemName2.substring(0, 35)}...` : itemName2}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-lg">
              <p className="whitespace-pre-wrap break-words">{itemName2}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "warna",
    header: "Warna",
    cell: ({ row }) => {
      const warna = row.getValue("warna") as string;
      if (!warna) return <span className="text-gray-400">-</span>;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                {warna.length > 15 ? `${warna.substring(0, 15)}...` : warna}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{warna}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "Spec",
    header: "Spesifikasi",
    cell: ({ row }) => {
      const spec = row.getValue("Spec") as string;
      if (!spec) return <span className="text-gray-400">-</span>;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                {spec.length > 25 ? `${spec.substring(0, 25)}...` : spec}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <p className="whitespace-pre-wrap break-words">{spec}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "SatuanKecil",
    header: "Satuan",
    cell: ({ row }) => {
      const satuan = row.getValue("SatuanKecil") as string;
      return satuan || <span className="text-gray-400">-</span>;
    },
  },
  // components/master/columns.tsx - update untuk KodeJenis dan NamaJenis
{
  accessorKey: "KodeJenis",
  header: "Kode Kategori",
  cell: ({ row }) => {
    const kodeJenis = row.getValue("KodeJenis") as string;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help font-mono text-sm">
              {kodeJenis || "-"}
            </span>
          </TooltipTrigger>
          {kodeJenis && (
            <TooltipContent>
              <p>Kode: {kodeJenis}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  },
},
{
  accessorKey: "NamaJenis",
  header: "Kategori",
  cell: ({ row }) => {
    const namaJenis = row.getValue("NamaJenis") as string;
    const kodeJenis = row.getValue("KodeJenis") as string;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">
              {namaJenis || "-"}
            </span>
          </TooltipTrigger>
          {namaJenis && (
            <TooltipContent>
              <p>{namaJenis}</p>
              {kodeJenis && <p className="text-xs text-gray-500">Kode: {kodeJenis}</p>}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  },
},
  {
    accessorKey: "Departemen",
    header: "Proses",
    cell: ({ row }) => {
      const dept = row.getValue("Departemen") as string;
      if (!dept) return <span className="text-gray-400">-</span>;
      
      const getBadgeColor = (dept: string) => {
        switch (dept?.toLowerCase()) {
          case "molding":
            return "bg-blue-100 text-blue-800";
          case "injection":
            return "bg-purple-100 text-purple-800";
          case "assembly":
            return "bg-green-100 text-green-800";
          case "spary":
            return "bg-orange-100 text-orange-800";
          case "plating":
            return "bg-cyan-100 text-cyan-800";
          default:
            return "bg-gray-100 text-gray-800";
        }
      };
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(dept)}`}>
          {dept}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-blue-600"
            onClick={() => onEditItem?.(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {/* <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-red-600"
            onClick={() => onDeleteItem?.(item)}
          >
            <Trash2 className="h-4 w-4" />
          </Button> */}
        </div>
      );
    },
  },
];