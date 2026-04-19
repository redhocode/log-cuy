"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, CheckCircle, XCircle, Calendar } from "lucide-react";
import { Button } from "../ui/button";
import { Spktype } from "@/lib/types";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";

interface ColumnsProps {
  setSelectedRows: React.Dispatch<React.SetStateAction<Spktype[]>>;
  onToggleComplete?: (spk: Spktype) => void;
}

export const columns = (
  setSelectedRows: ColumnsProps["setSelectedRows"],
  onToggleComplete?: (spk: Spktype) => void
): ColumnDef<Spktype>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        onCheckedChange={(value: any) => {
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
        onCheckedChange={(value: any) => {
          row.toggleSelected(!!value);
          if (value) {
            setSelectedRows((prev) => [...prev, row.original]);
          } else {
            setSelectedRows((prev) =>
              prev.filter(
                (selectedRow) => selectedRow.No_SPK !== row.original.No_SPK
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
    accessorKey: "No_SPK",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          No SPK
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "Tanggal_Order",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tanggal Order
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "Nama_PO",
    header: "Nama PO",
  },
  {
    accessorKey: "Departemen",
    header: "Departemen",
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const spk = row.original;
      const isCompleted = spk.Completed === true;
      
      return (
        <Badge
          variant={isCompleted ? "default" : "secondary"}
          className={`gap-1 ${
            isCompleted 
              ? "bg-green-100 text-green-800 hover:bg-green-100" 
              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
          }`}
        >
          {isCompleted ? (
            <>
              <CheckCircle className="h-3 w-3" />
              Selesai
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3" />
              Dalam Proses
            </>
          )}
        </Badge>
      );
    },
  },
  {
    id: "finished_date",
    header: "Tanggal Selesai",
    cell: ({ row }) => {
      const spk = row.original;
      if (!spk.Completed || !spk.FinishedDate) return <span className="text-muted-foreground">-</span>;
      
      const date = new Date(spk.FinishedDate);
      return (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          {date.toLocaleDateString("id-ID")}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const spk = row.original;
      const isCompleted = spk.Completed === true;
      
      return (
        <Button
          variant={isCompleted ? "outline" : "default"}
          size="sm"
          onClick={() => onToggleComplete?.(spk)}
          className={isCompleted ? "border-green-500 text-green-600 hover:bg-green-50" : "bg-green-600 hover:bg-green-700"}
        >
          {isCompleted ? (
            <>
              <XCircle className="mr-1 h-3 w-3" />
              Batalkan
            </>
          ) : (
            <>
              <CheckCircle className="mr-1 h-3 w-3" />
              Tandai Selesai
            </>
          )}
        </Button>
      );
    },
  },
];