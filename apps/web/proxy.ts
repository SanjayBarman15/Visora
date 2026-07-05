import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  // 1. Get the session cookie (Supabase stores auth token in cookies if configured, or we check for general auth cookie)
  // Supabase default cookie name starts with 'sb-'
  const allCookies = request.cookies.getAll()
  const hasAuthCookie = allCookies.some(cookie => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"))

  const { pathname } = request.nextUrl

  // 2. Guard the dashboard route
  if (pathname.startsWith("/dashboard") && !hasAuthCookie) {
    // Redirect to login page
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // 3. Redirect authenticated users away from auth pages
  if ((pathname === "/login" || pathname === "/signup") && hasAuthCookie) {
    const dashboardUrl = new URL("/dashboard", request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

// Configure which paths the middleware runs on
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
}
