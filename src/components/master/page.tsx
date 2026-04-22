"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMasterData, updateMasterItem, deleteMasterItem } from "@/lib/features/masterSlice";
import { RootState, AppDispatch } from "@/lib/store";
import Loading from "@/app/loading";
import { DataTable } from "../data-table";
import { columns } from "./columns";
import { saveAs } from "file-saver";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader } from "../ui/card";
import { toast } from "sonner";
import ExcelUploader from "@/components/ExcelUploader";
import * as XLSX from "xlsx";
import { Button } from "../ui/button";
import { masterType, saldoType } from "@/lib/types";
import { FileUp, RefreshCcw, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditMasterModal from "./EditMasterModal";

const useAppDispatch = () => useDispatch<AppDispatch>();

const DataMasterBarangPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error, updating } = useSelector(
    (state: RootState) => state.master
  );
  
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<masterType[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<masterType | null>(null);
  
  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<masterType | null>(null);
  
  const EXCEL_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const EXCEL_EXTENSION = ".xlsx";

  useEffect(() => {
    setIsMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    const myPromise = dispatch(fetchMasterData());
    toast.promise(myPromise, {
      loading: "Loading...",
      success: "Data fetched successfully!",
      error: "Error fetching data",
    });
  };

  const handleEdit = (item: masterType) => {
    setEditingItem(item);
    setEditModalOpen(true);
  };


const handleSaveEdit = async (data: masterType) => {
  console.log("Saving data:", data);
  try {
    const result = await dispatch(updateMasterItem(data)).unwrap();
    toast.success("Item updated successfully!");
    setEditModalOpen(false);
    setEditingItem(null);
    // Refresh data
    await loadData();
  } catch (error) {
    console.error("Save error:", error);
    toast.error("Failed to update item");
  }
};
  const handleDelete = (item: masterType) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    
    try {
      await dispatch(deleteMasterItem(deletingItem.ItemID)).unwrap();
      toast.success("Item deleted successfully!");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const handleExport = () => {
    const rowsToExport = selectedRows.length > 0 ? selectedRows : filteredData;
    if (rowsToExport.length === 0) {
      toast.error("Please select rows to export");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(rowsToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master Barang");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: EXCEL_TYPE });
    saveAs(blob, `Data Master Barang${EXCEL_EXTENSION}`);
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const safeData = Array.isArray(data) ? data : [];
  
  const filteredData = safeData.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleDataLoaded = (newData: masterType[]) => {
    console.log("Data loaded:", newData);
    loadData();
  };

  const handleDataLoaded2 = (newData: saldoType[]) => {
    console.log("Data loaded:", newData);
    loadData();
  };

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading />
      </div>
    );
  }

  if (loading) return <Loading />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex flex-col p-6">
      <h1 className="text-3xl font-bold mb-4">Master Kode Barang</h1>
      <p className="text-gray-500 mb-4">Total data: {safeData.length} items</p>
      
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between">
            <form className="ml-auto flex-1 sm:flex-initial">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  onChange={handleSearchChange}
                  value={searchTerm}
                  placeholder="Search data"
                  className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                />
              </div>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={handleRefresh}
              disabled={updating}
              className="bg-gray-500 text-white hover:bg-gray-600"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button
              onClick={handleExport}
              disabled={filteredData.length === 0}
              className="bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
            >
              <FileUp className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Upload Master Barang</h3>
              <ExcelUploader<masterType>
                onDataLoaded={handleDataLoaded}
                apiEndpoint="/api/master"
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Upload Saldo Awal</h3>
              <ExcelUploader<saldoType>
                onDataLoaded={handleDataLoaded2}
                apiEndpoint="/api/master/saldo"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <DataTable
        columns={columns(
          setSelectedRows, 
          filteredData, 
          handleEdit, 
          handleDelete
        )}
        data={filteredData}
      />

      {/* Edit Modal */}
      <EditMasterModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveEdit}
        item={editingItem}
        loading={updating}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Item</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus item "{deletingItem?.ItemName}"?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DataMasterBarangPage;