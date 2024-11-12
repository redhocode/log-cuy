"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card,CardContent,CardHeader,CardTitle,CardDescription } from "@/components/ui/card";
export default function Home() {
   const router = useRouter();
   const [userName, setUserName] = useState<string | null>(null);

   useEffect(() => {
     const user = localStorage.getItem("user");
     if (!user) {
       router.push("/auth/login"); // Redirect ke halaman login jika belum login
     } else {
       const parsedUser = JSON.parse(user);
       setUserName(parsedUser.UserName); // Ambil nama pengguna
     }
   }, [router]);

   return (
     <div className="flex flex-col items-center justify-center mt-10">
       <Card>
         <CardHeader>
           <CardTitle className="text-3xl font-bold">
             
       {userName && <p className="text-xl">Welcome, {userName}!</p>}
       <Link href="/dashboard">Dashboard</Link>
           </CardTitle>
           <CardDescription>
             Silahkan pilih menu yang ingin anda lihat
             </CardDescription>
         </CardHeader>
         <CardContent></CardContent>
       </Card>
       
       {" "}
       {/* Tampilkan hanya nama pengguna */}
     </div>
   );
}
