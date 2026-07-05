import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const allCookies = request.cookies.getAll()

  // Accept EITHER a real Supabase session cookie OR the custom visora-auth cookie
  // (visora-auth is set by use-auth-store when mock auth is used)
  const hasRealAuthCookie = allCookies.some(
    (cookie) =>
      cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")
  )
  const hasMockAuthCookie = allCookies.some(
    (cookie) => cookie.name === "visora-auth" && cookie.value === "1"
  )
  const isAuthenticated = hasRealAuthCookie || hasMockAuthCookie

  // Guard private routes — redirect to login if not authenticated
  if (pathname.startsWith("/dashboard") && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect already-authenticated users away from auth pages
  if ((pathname === "/login" || pathname === "/signup") && isAuthenticated) {
    const dashboardUrl = new URL("/dashboard", request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export default middleware

// Configure which paths the proxy runs on
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
}
