import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Proxy (Next.js 16+ middleware convention).
 *
 * NOTE: This project uses @supabase/supabase-js which stores the session in
 * localStorage — NOT in cookies. Cookie-based auth guards here would always
 * see unauthenticated users and create redirect loops.
 *
 * All authentication-based navigation is handled by the client-side
 * AuthProvider which has direct access to the Zustand store / Supabase session.
 *
 * This proxy is intentionally kept minimal — extend it only for things that
 * don't require reading the auth session (e.g. locale detection, A/B testing).
 */
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export default middleware

// Run on all routes except static assets and Next.js internals
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
