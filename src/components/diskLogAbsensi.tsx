"use client"; // Direktif ini memungkinkan penggunaan hook di dalam komponen React

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

const DiskLogAbsensi = () => {
  const [isProcessing, setIsProcessing] = useState(false); // Menyimpan status eksekusi query
  const [statusMessage, setStatusMessage] = useState<string | null>(null); // Menyimpan status hasil eksekusi query
  const [password, setPassword] = useState(""); // Menyimpan input password dari pengguna
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false); // Menyimpan status apakah password benar atau tidak
  const [isPasswordEntered, setIsPasswordEntered] = useState(false); // Menyimpan status apakah password sudah dimasukkan

  const correctPassword = "123456"; // Ganti dengan password yang lebih kuat dan aman

  const handlePasswordSubmit = () => {
    if (password === correctPassword) {
      setIsPasswordCorrect(true);
      setIsPasswordEntered(true);
      setStatusMessage(null); // Reset status message jika password benar
    } else {
      toast.error("Incorrect password!");
      setIsPasswordCorrect(false);
      setIsPasswordEntered(true);
    }
  };

  const handleExecuteSQL = async () => {
    if (!isPasswordCorrect) {
      toast.error("Please enter the correct password to execute the query.");
      return; // Jangan lanjutkan jika password tidak benar
    }

    setIsProcessing(true); // Set status processing menjadi true
    setStatusMessage(null); // Reset statusMessage saat query mulai dieksekusi

    // Menampilkan notifikasi loading
    const loadingToast = toast.loading("Executing query...");

    try {
      // Memanggil API untuk mengeksekusi query SQL
      const response = await fetch("/api/utility", { method: "GET" });
      const data = await response.json();

      // Jika query berhasil
      if (response.ok) {
        toast.success(data.message || "Query executed successfully");
        setStatusMessage("Success"); // Set status menjadi 'Success' jika query berhasil
      } else {
        toast.error(data.error || "Something went wrong");
        setStatusMessage("Failed"); // Set status menjadi 'Failed' jika ada error
      }
    } catch {
      // Jika terjadi error saat menjalankan query
      toast.error("Error occurred while executing the query");
      setStatusMessage("Failed"); // Set status menjadi 'Failed' jika terjadi error
    } finally {
      setIsProcessing(false); // Set status processing menjadi false
      toast.dismiss(loadingToast); // Menghapus notifikasi loading
    }
  };

  return (
    <Card className="h-[20ic]">
      <CardHeader>
        <CardTitle>Disk Log Absensi</CardTitle>
        <CardDescription>
          Eksekusi query untuk merubah dan mengecilkan log database absensi.
          Harap masukkan password terlebih dahulu untuk melanjutkan.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!isPasswordEntered ? (
          <div className="flex flex-col space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="border p-2 rounded"
            />
            <Button onClick={handlePasswordSubmit}>Submit Password</Button>
          </div>
        ) : (
          <>
            {isPasswordCorrect ? (
              <div>
                <Button
                  onClick={handleExecuteSQL}
                  disabled={isProcessing} // Menonaktifkan tombol saat query sedang diproses
                  className="w-full"
                >
                  {isProcessing ? "Executing..." : "Execute SQL Query"}
                </Button>

                {/* Menampilkan status success atau error setelah eksekusi query */}
                {statusMessage && (
                  <div
                    className={`mt-4 text-center text-lg font-semibold ${
                      statusMessage === "Success"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {statusMessage}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-500 text-center">
                Incorrect password. Please try again.
              </div>
            )}
          </>
        )}
      </CardContent>

      <CardFooter>
        <p className="text-sm text-gray-500">
          Menjalankan query ini akan merubah recovery model dan mengecilkan file
          log.
        </p>
      </CardFooter>
    </Card>
  );
};

export default DiskLogAbsensi;
