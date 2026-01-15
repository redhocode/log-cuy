"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function NumberPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const fetchData = async () => {
    const res = await fetch("/api/number");
    const json = await res.json();
    setData(json);
  };

  const increment = async (uniqueId: string, column: string) => {
    setLoading(column);
    await fetch("/api/number/increment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uniqueId, column }),
    });
    await fetchData();
    setLoading(null);
  };

  const maskNumber = (value: number | string) => {
    const str = value?.toString() ?? "";
    if (str.length <= 2) return "**";
    return "**" + str.slice(2);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!data.length) return null;

  const row = data[0];

  const COLUMNS = ["Jurnal"];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 h-auto">
      <Card>
        <CardHeader>
          <CardTitle>Number Counter</CardTitle>
          {/* <p className="text-sm text-muted-foreground">
            Unique ID: {row.UniqueID}
          </p> */}
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Nama Kolom</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {COLUMNS.map((col) => (
                <TableRow key={col}>
                  <TableCell className="font-medium">{col}</TableCell>

                  <TableCell>{maskNumber(row[col])}</TableCell>

                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => increment(row.UniqueID, col)}
                      disabled={loading === col}
                    >
                      {loading === col ? "Updating..." : "repair"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
