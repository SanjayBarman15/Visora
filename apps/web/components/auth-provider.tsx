"use client"

import React, { createContext, useContext, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useAuthStore } from "@/hooks/use-auth-store"
import { Session, User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

const PUBLIC_ROUTES = new Set(["/", "/login", "/signup", "/auth/callback"])

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, session, loading, initialized, init, signOut } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()

  // Track whether the theme image has mounted to avoid flicker
  const mountedRef = useRef(false)
  useEffect(() => {
    mountedRef.current = true
  }, [])

  // Initialize the auth store once on mount.
  // The store's onAuthStateChange listener is registered at module load,
  // so after init() resolves, `initialized` will be true in the store.
  useEffect(() => {
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Navigation guard — reactive to session & pathname changes.
  // Runs only after the auth store has finished initializing.
  useEffect(() => {
    if (!initialized) return

    const isPublicRoute = PUBLIC_ROUTES.has(pathname)

    if (!session && !isPublicRoute) {
      // Unauthenticated user trying to access a protected route → login
      router.replace("/login")
    } else if (session && (pathname === "/login" || pathname === "/signup")) {
      // Already authenticated user landing on auth pages → dashboard
      router.replace("/dashboard")
    }
  }, [session, initialized, pathname, router])

  // Show a splash screen while auth state is being determined.
  // We block rendering children until we know whether the user is logged in,
  // preventing a flash of protected content or a redirect loop.
  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#05070a] text-slate-100 flex flex-col items-center justify-center font-sans">
        <div className="relative w-16 h-16 flex items-center justify-center animate-pulse">
          <Image
            src="/visora_logo_dark_removebg.png"
            alt="Visora Logo"
            width={64}
            height={64}
            className="object-contain"
            priority
          />
        </div>
        <p className="mt-4 text-xs font-mono text-slate-500 tracking-widest animate-pulse uppercase">
          Initializing...
        </p>
      </div>
    )
  }

  // After initialization, if a redirect is needed, also show the splash
  // to avoid a flash of the wrong page content while navigation is in flight.
  const isPublicRoute = PUBLIC_ROUTES.has(pathname)
  const needsRedirect =
    (!session && !isPublicRoute) || (session && (pathname === "/login" || pathname === "/signup"))

  if (needsRedirect) {
    return (
      <div className="min-h-screen bg-[#05070a] text-slate-100 flex flex-col items-center justify-center font-sans">
        <div className="relative w-16 h-16 flex items-center justify-center animate-pulse">
          <Image
            src="/visora_logo_dark_removebg.png"
            alt="Visora Logo"
            width={64}
            height={64}
            className="object-contain"
            priority
          />
        </div>
        <p className="mt-4 text-xs font-mono text-slate-500 tracking-widest animate-pulse uppercase">
          Redirecting...
        </p>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
