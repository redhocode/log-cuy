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
      setActiveTab("execute");
    } else {
      toast.error("Incorrect password!");
      setIsPasswordCorrect(false);
      setIsPasswordEntered(true);
    }
  };

  const handleExecuteSQL = async () => {
    if (!isPasswordCorrect) {
      toast.error("Please enter the correct password.");
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
    <div className="h-screen p-4 mb-4 -mt-8">

    <Card className="h-full flex flex-col">
      {/* HEADER (FIXED) */}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Repair System
        </CardTitle>
        <CardDescription>
          Harap masukkan password terlebih dahulu untuk melanjutkan.
        </CardDescription>
      </CardHeader>

      {/* CONTENT (SCROLL HERE) */}
      <CardContent className="flex-1 overflow-auto">
        {!isPasswordEntered ? (
          <div className="flex flex-col gap-4">
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

            <Button onClick={handlePasswordSubmit}>Submit Password</Button>
          </div>
        ) : isPasswordCorrect ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="execute" className="flex gap-2">
                <Database className="h-4 w-4" />
                Execute
              </TabsTrigger>
              <TabsTrigger value="numberPage" className="flex gap-2">
                <Hash className="h-4 w-4" />
                Number
              </TabsTrigger>
              <TabsTrigger value="kunciPage" className="flex gap-2">
                <Key className="h-4 w-4" />
                Kunci
              </TabsTrigger>
            </TabsList>

            {/* EXECUTE TAB */}
            <TabsContent value="execute" className="mt-0">
              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="font-medium">SQL Query Execution</h3>
                <p className="text-sm text-muted-foreground">
                  Menjalankan query maintenance database.
                </p>

                <Button
                  onClick={handleExecuteSQL}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? "Executing..." : "Execute SQL Query"}
                </Button>

                {statusMessage && (
                  <div
                    className={`p-3 rounded-md text-center font-medium ${
                      statusMessage === "Success"
                        ? "bg-green-50 text-green-700 border"
                        : "bg-red-50 text-red-700 border"
                    }`}
                  >
                    {statusMessage}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* NUMBER TAB */}
            <TabsContent value="numberPage" className="mt-0">
              <div className="rounded-lg border p-4">
                <NumberPage />
              </div>
            </TabsContent>

            {/* KUNCI TAB */}
            <TabsContent value="kunciPage" className="mt-0">
              <div className="rounded-lg border p-4">
                <KunciPage />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4 max-w-md">
            <div className="text-red-500 p-4 bg-red-50 rounded-lg border">
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
      </CardContent>

      {/* FOOTER (FIXED) */}
      <CardFooter>
        <p className="text-sm text-muted-foreground text-center w-full">
          Menjalankan query ini akan merubah recovery model dan mengecilkan file
          log database. Pastikan Anda memiliki backup sebelum melakukan
          eksekusi.
        </p>
      </CardFooter>
    </Card>
    </div>
  );
};

export default DiskLogAbsensi;
