// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const isLogin = false;

  if (!isLogin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

// Tentukan path yang akan dilindungi
export const config = {
  matcher: ["/dashboard/:path*"], // Ganti dengan path yang ingin dilindungi
};
