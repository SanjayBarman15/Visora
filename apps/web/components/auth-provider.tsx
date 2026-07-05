"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useTheme } from "next-themes"
import { supabase } from "@/lib/supabase"
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Navigation Guard / Route Protection
  useEffect(() => {
    if (loading) return

    const publicRoutes = ["/", "/login", "/signup", "/auth/callback"]
    const isPublicRoute = publicRoutes.includes(pathname)

    if (!session && !isPublicRoute) {
      router.push("/login")
    }
  }, [session, loading, pathname, router])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  // Beautiful matching loader
  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070a] text-slate-100 flex flex-col items-center justify-center font-sans">
        <div className="relative w-16 h-16 flex items-center justify-center animate-pulse">
          <Image
            src={mounted && resolvedTheme === "dark" ? "/visora_logo_dark_removebg.png" : "/visora_logo_light_removebg.png"}
            alt="Visora Logo"
            width={64}
            height={64}
            className="object-contain"
          />
        </div>
        <p className="mt-4 text-xs font-mono text-slate-500 tracking-widest animate-pulse uppercase">
          Initializing Visora Auth...
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
