"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  X 
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface ExcelUploaderProps<T = any> {
  onDataLoaded?: (data: T[]) => void;
  apiEndpoint: string;
  accept?: string;
  maxSize?: number;
}

export default function ExcelUploader<T = any>({ 
  onDataLoaded, 
  apiEndpoint, 
  accept = ".xlsx,.xls",
  maxSize = 10 
}: ExcelUploaderProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setSuccess(false);
    setProgress(0);

    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`Ukuran file maksimal ${maxSize}MB`);
      return;
    }

    const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(fileExt || '')) {
      setError('Format file harus .xlsx atau .xls');
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = useCallback(async () => {
    if (!file) {
      setError("Pilih file terlebih dahulu");
      return;
    }

    setUploading(true);
    setProgress(10);
    setError(null);

    try {
      const data = await file.arrayBuffer();
      setProgress(30);
      
      const workbook = XLSX.read(data, { type: "array" });
      setProgress(50);
      
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<T>(worksheet);
      setProgress(70);

      if (jsonData.length === 0) {
        throw new Error("Tidak ada data dalam file Excel");
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(apiEndpoint, {
        method: "POST",
        body: formData,
      });

      setProgress(90);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload gagal");
      }

      const result = await response.json();
      setProgress(100);
      setSuccess(true);
      
      toast.success(`Berhasil upload ${jsonData.length} data`);
      
      if (onDataLoaded) {
        onDataLoaded(result.data || jsonData);
      }
      
      setTimeout(() => {
        setFile(null);
        setSuccess(false);
        setProgress(0);
        const fileInput = document.getElementById(`file-upload-${apiEndpoint}`) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      }, 3000);
      
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat upload");
      toast.error("Gagal upload file");
    } finally {
      setUploading(false);
    }
  }, [file, apiEndpoint, onDataLoaded]);

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
    setProgress(0);
    const fileInput = document.getElementById(`file-upload-${apiEndpoint}`) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <FileSpreadsheet className="h-12 w-12 text-gray-400" />
          <p className="text-sm text-gray-500">Loading uploader...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <FileSpreadsheet className="h-12 w-12 text-gray-400" />
          <div className="space-y-2">
            <Label htmlFor={`file-upload-${apiEndpoint}`} className="cursor-pointer">
              <div className="flex items-center gap-2 text-primary hover:underline">
                <Upload className="h-4 w-4" />
                <span>Klik untuk upload file Excel</span>
              </div>
              <Input
                id={`file-upload-${apiEndpoint}`}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
            </Label>
            <p className="text-xs text-gray-500">
              Format: .xlsx atau .xls (Maks. {maxSize}MB)
            </p>
          </div>
          
          {file && !success && (
            <div className="w-full max-w-md bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="p-1 hover:bg-gray-200 rounded"
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {progress > 0 && progress < 100 && (
            <div className="w-full max-w-md">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center mt-1">{progress}%</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="max-w-md bg-green-50 border-green-500">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Upload berhasil! Data telah tersimpan.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || uploading || success}
            className="gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload ke Server
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}