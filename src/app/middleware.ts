// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const isLogin = false; // Cek status login
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true"; // Periksa apakah mode pemeliharaan aktif

  console.log("Is Maintenance Mode:", isMaintenanceMode); // Debugging

  // Jika aplikasi dalam mode pemeliharaan, alihkan ke halaman /maintenance
  if (isMaintenanceMode) {
    console.log("Redirecting to maintenance page"); // Debugging
    if (req.nextUrl.pathname === "/maintenance") {
      return NextResponse.next(); // Tetap di halaman maintenance
    }
    return NextResponse.redirect(new URL("/maintenance", req.url));
  }

  // Jika pengguna belum login, arahkan ke halaman login
  if (!isLogin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next(); // Lanjutkan ke halaman yang diminta jika tidak ada masalah
}

// Tentukan matcher untuk rute yang akan diproses oleh middleware
export const config = {
  matcher: ["/((?!maintenance).*)"], // Semua rute selain /maintenance
};
