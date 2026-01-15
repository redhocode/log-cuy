// ./src/app/middleware.ts - Simplified Version
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // ============================================
  // 1. ONLY HANDLE API ROUTES FOR CORS
  // ============================================
  if (pathname.startsWith("/api/")) {
    console.log(`[API Middleware] ${method} ${pathname}`);

    // Clone the request headers
    const requestHeaders = new Headers(request.headers);

    // Create response
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Add CORS headers
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    // Handle preflight requests
    if (method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      });
    }

    return response;
  }

  // ============================================
  // 2. FOR NON-API ROUTES, CHECK AUTHENTICATION
  // ============================================
  console.log(`[Web Middleware] ${method} ${pathname}`);

  // Skip static files
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/public/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check maintenance mode
  if (process.env.MAINTENANCE_MODE === "true" && pathname !== "/maintenance") {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  // Check authentication (simplified)
  const authToken = request.cookies.get("auth-token")?.value;
  const isLoggedIn = !!authToken;

  // Public pages
  const publicPages = ["/login", "/register", "/", "/about"];

  // If not logged in and accessing protected page
  if (!isLoggedIn && !publicPages.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If logged in and trying to access login page
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
