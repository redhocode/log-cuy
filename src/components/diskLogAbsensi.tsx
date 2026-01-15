"use client";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import NumberPage from "@/app/dashboard/number/page";
import { Lock, Database, Hash, Key } from "lucide-react";
import KunciPage from "@/app/dashboard/(utility)/kunci/page";

const DiskLogAbsensi = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
  const [isPasswordEntered, setIsPasswordEntered] = useState(false);
  const [activeTab, setActiveTab] = useState("execute");

  const correctPassword = "123456";

  const handlePasswordSubmit = () => {
    if (password === correctPassword) {
      setIsPasswordCorrect(true);
      setIsPasswordEntered(true);
      setStatusMessage(null);
      toast.success("Password correct! Access granted.");
      // Set tab aktif ke "execute" setelah password benar
      setActiveTab("execute");
    } else {
      toast.error("Incorrect password!");
      setIsPasswordCorrect(false);
      setIsPasswordEntered(true);
    }
  };

  const handleExecuteSQL = async () => {
    if (!isPasswordCorrect) {
      toast.error("Please enter the correct password to execute the query.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    const loadingToast = toast.loading("Executing query...");

    try {
      const response = await fetch("/api/utility", { method: "GET" });
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Query executed successfully");
        setStatusMessage("Success");
      } else {
        toast.error(data.error || "Something went wrong");
        setStatusMessage("Failed");
      }
    } catch {
      toast.error("Error occurred while executing the query");
      setStatusMessage("Failed");
    } finally {
      setIsProcessing(false);
      toast.dismiss(loadingToast);
    }
  };

  return (
    <Card className="h-auto min-h-[20rem] mb-5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Repair System
        </CardTitle>
        <CardDescription>
          Harap masukkan password terlebih dahulu untuk melanjutkan.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!isPasswordEntered ? (
          <div className="flex flex-col space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePasswordSubmit();
                  }}
                />
              </div>
            </div>
            <Button onClick={handlePasswordSubmit} className="w-full">
              Submit Password
            </Button>
          </div>
        ) : (
          <>
            {isPasswordCorrect ? (
              <Tabs
                defaultValue="execute"
                className="w-full"
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger
                    value="execute"
                    className="flex items-center gap-2"
                  >
                    <Database className="h-4 w-4" />
                    Execute Query
                  </TabsTrigger>
                  <TabsTrigger
                    value="numberPage"
                    className="flex items-center gap-2"
                  >
                    <Hash className="h-4 w-4" />
                    Number Page
                  </TabsTrigger>
                  <TabsTrigger
                    value="kunciPage"
                    className="flex items-center gap-2"
                  >
                    <Key className="h-4 w-4" />
                    Kunci Page
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="execute" className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-2">SQL Query Execution</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Menjalankan query untuk mengubah recovery model dan
                      mengecilkan file log database.
                    </p>
                    <Button
                      onClick={handleExecuteSQL}
                      disabled={isProcessing}
                      className="w-full"
                      variant={isProcessing ? "secondary" : "default"}
                    >
                      {isProcessing ? (
                        <>
                          <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-b-transparent" />
                          Executing...
                        </>
                      ) : (
                        "Execute SQL Query"
                      )}
                    </Button>

                    {statusMessage && (
                      <div
                        className={`mt-4 p-3 rounded-md text-center font-medium ${
                          statusMessage === "Success"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {statusMessage === "Success"
                          ? "✓ Query executed successfully"
                          : "✗ Query execution failed"}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="numberPage">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-2">
                      Number Page Configuration
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Konfigurasi dan pengaturan halaman number.
                    </p>
                    <NumberPage />
                  </div>
                </TabsContent>

                <TabsContent value="kunciPage">
                 <KunciPage/>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-red-500 p-4 bg-red-50 rounded-lg border border-red-200">
                  Incorrect password. Please try again.
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsPasswordEntered(false);
                    setPassword("");
                  }}
                >
                  Try Again
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>

      <CardFooter>
        <p className="text-sm text-muted-foreground text-center w-full">
          Menjalankan query ini akan merubah recovery model dan mengecilkan file
          log database. Pastikan Anda memiliki backup sebelum melakukan
          eksekusi.
        </p>
      </CardFooter>
    </Card>
  );
};

export default DiskLogAbsensi;
