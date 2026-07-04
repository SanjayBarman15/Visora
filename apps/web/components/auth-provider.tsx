"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
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

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes on auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Route protection logic
  useEffect(() => {
    if (loading) return

    const isAuthRoute = pathname === "/login" || pathname === "/signup"
    const isProtectedRoute = pathname.startsWith("/dashboard")

    if (session && isAuthRoute) {
      router.push("/dashboard")
    } else if (!session && isProtectedRoute) {
      router.push("/login")
    }
  }, [session, loading, pathname, router])

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push("/login")
  }

  // Beautiful matching loader
  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070a] text-slate-100 flex flex-col items-center justify-center font-sans">
        <div className="relative w-16 h-16 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center font-mono font-bold text-sky-400 text-2xl animate-pulse">
          M
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="absolute bottom-1 left-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
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
