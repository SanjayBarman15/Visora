import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const allCookies = request.cookies.getAll()

  // Supabase sets an auth cookie named sb-<project-ref>-auth-token
  const isAuthenticated = allCookies.some(
    (cookie) =>
      cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")
  )

  // Guard private routes — redirect to login if not authenticated
  if (pathname.startsWith("/dashboard") && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect already-authenticated users away from auth pages
  if ((pathname === "/login" || pathname === "/signup") && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export default middleware

// Configure which paths the proxy runs on
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
}
