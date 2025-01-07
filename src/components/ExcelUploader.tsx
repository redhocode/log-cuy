import React, { useState } from "react";
import { Input } from "./ui/input"; // Pastikan pathnya benar
import { Button } from "./ui/button"; // Pastikan pathnya benar
import { toast } from "sonner"; // Pastikan ini sudah diinstal
import * as XLSX from "xlsx";

interface ExcelUploaderProps<T extends object> {
  onDataLoaded: (newData: T[]) => void;
  apiEndpoint: string;
  acceptFileTypes?: string;
}

const ExcelUploader = <T extends object>({
  onDataLoaded,
  apiEndpoint,
  acceptFileTypes = ".xlsx, .xls",
}: ExcelUploaderProps<T>) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]); // Menyimpan errors global
  const [previewData, setPreviewData] = useState<T[]>([]); // Data untuk preview
  const [errorRows, setErrorRows] = useState<Map<number, string>>(new Map()); // Menyimpan error per baris

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setErrors([]); // Reset errors saat file baru dipilih
      setErrorRows(new Map()); // Reset error rows
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

      const result = await response.json();

      if (!response.ok) {
        // Jika response tidak ok, tangani error dari server
        if (result.errors) {
          setErrors(result.errors); // Menyimpan errors untuk ditampilkan
          toast.error("Failed to upload some data.");
          // Mengatur error per baris jika ada error spesifik per item
          const rowErrors = new Map<number, string>();
          result.errors.forEach((err: string, index: number) => {
            rowErrors.set(index, err);
          });
          setErrorRows(rowErrors);
        } else {
          setError(result.error || "Upload failed");
          toast.error(result.error || "Upload failed");
        }
        return;
      }

      // Jika upload berhasil, tampilkan pesan sukses
      toast.success(result.message || "Upload successful!");
      onDataLoaded(result.data || []); // Kirim data yang berhasil diupload ke parent component

      // Reset setelah upload sukses
      setFile(null);
      setPreviewData([]);
    } catch (error: unknown) {
      console.error("Upload error:", error);
      setError(
        `Failed to upload the file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      toast.error("Failed to upload the file.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData([]);
    setErrors([]); // Clear errors when reset
    setErrorRows(new Map()); // Clear error rows
  };

  const renderPreview = () => {
    if (previewData.length === 0) return null;

    return (
      <div className="mt-4">
        <table className="border-collapse w-full">
          <thead>
            <tr>
              {Object.keys(previewData[0]).map((key) => (
                <th key={key} className="border px-2 py-1">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.map((row, index) => (
              <tr key={index}>
                {Object.entries(row).map(([key, value], idx) => {
                  const hasError = errorRows.has(index); // Cek apakah ada error pada baris ini
                  return (
                    <td
                      key={idx}
                      className={`border px-2 py-1 ${
                        hasError ? "bg-red-100" : ""
                      }`}
                    >
                      {key === "ItemID" && hasError ? (
                        <div>
                          <span className="text-red-500">{value}</span>
                          <div className="text-red-500 text-xs">
                            {errorRows.get(index)}{" "}
                            {/* Menampilkan pesan error per baris */}
                          </div>
                        </div>
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <Input
        type="file"
        accept={acceptFileTypes}
        onChange={handleFileChange}
        className="mt-2"
      />
      <div className="flex gap-2 mt-2">
        <Button onClick={handleUpload} disabled={!file}>
          Upload
        </Button>
        <Button onClick={handleReset} variant="outline">
          Reset
        </Button>
      </div>
      {error && <div style={{ color: "red" }}>{error}</div>}

      {errors.length > 0 && (
        <div className="mt-4 text-red-500">
          <h3>Error(s) occurred:</h3>
          <ul>
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {renderPreview()}
    </div>
  );
};

export default ExcelUploader;
