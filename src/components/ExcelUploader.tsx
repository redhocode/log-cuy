import React, { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ExcelUploaderProps<T extends object> {
  // Menambahkan batasan extends object
  onDataLoaded: (newData: T[]) => void; // Menggunakan tipe generik T
  apiEndpoint: string; // Endpoint API yang dapat disesuaikan
  acceptFileTypes?: string; // Tipe file yang dapat diterima
}

const ExcelUploader = <T extends object>({
  // Tipe generik T
  onDataLoaded,
  apiEndpoint,
  acceptFileTypes = ".xlsx, .xls",
}: ExcelUploaderProps<T>) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<T[]>([]); // State untuk menyimpan data preview

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      readFile(selectedFile); // Panggil fungsi untuk membaca file
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json<T>(worksheet); // Menggunakan tipe generik T
      setPreviewData(jsonData); // Simpan data preview
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("No file selected");
      toast.error("No file selected");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        console.error("Upload failed:", errorResponse);
        throw new Error("Upload failed");
      }

      const result = await response.json();
      if (result.data) {
        const newData: T[] = result.data; // Menggunakan tipe generik T
        onDataLoaded(newData);
        toast.success("File uploaded successfully!");
      } else {
        throw new Error(result.error || "Unknown error");
      }

      setFile(null);
      setPreviewData([]); // Reset preview data setelah upload
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Upload error:", error);
        setError(`Failed to upload the file: ${error.message}`);
        toast.error("Failed to upload the file.");
      } else {
        // Handle other types of errors
        console.error("Unknown error:", error);
        setError("An unknown error occurred during upload");
        toast.error("An unknown error occurred during upload");
      }
    }
  }
  const handleReset = () => {
    setFile(null);
    setPreviewData([]);
  };

  const renderPreview = () => {
    if (previewData.length === 0) return null;

    return (
      <table className="mt-4 border">
        <thead>
          <tr>
            {Object.keys(previewData[0]).map((key) => (
              <th key={key} className="border">
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {previewData.map((row, index) => (
            <tr key={index}>
              {Object.values(row).map((value, idx) => (
                <td key={idx} className="border">
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div>
      <Input type="file" accept={acceptFileTypes} onChange={handleFileChange} />
      <div className="flex gap-2 mt-2">
        <Button onClick={handleUpload} disabled={!file}>
          Upload
        </Button>
        <Button onClick={handleReset} variant="outline">
          Reset
        </Button>
      </div>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {renderPreview()}
    </div>
  );
};

export default ExcelUploader;
