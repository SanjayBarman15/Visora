"use client"

import React, { useState } from "react"
import Link from "next/link"
import { VisoraHeader } from "@/components/visora-header"
import { useAuthStore } from "@/hooks/use-auth-store"
import { Button } from "@/components/ui/button"
import { z } from "zod"
import { Lock, Mail, ArrowRight, Eye, EyeOff } from "lucide-react"
import { gooeyToast } from "@/components/ui/goey-toaster"

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const loginAction = useAuthStore((state) => state.login)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      loginSchema.parse({ email, password })
      await loginAction(email, password)

      // AuthProvider's navigation guard detects the new session from
      // the Zustand store and redirects to /dashboard automatically.
      gooeyToast.success("Welcome back!", {
        description: "You have successfully signed in.",
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred."
      setError(message)
      gooeyToast.error("Sign in failed", {
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative overflow-hidden">
      {/* Decorative Grid Background */}
      <div 
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none text-slate-900 dark:text-slate-100"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "30px 30px",
        }}
      />

      {/* Top Header/Logo Link */}
      <VisoraHeader minimal />

      {/* Card container */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-500/0 via-sky-500/20 to-sky-500/0" />
          
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
                Welcome back
              </h2>
              <p className="text-xs font-mono text-muted-foreground">
                Enter your credentials to access your workspace
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-lg border border-red-500/20 bg-red-950/20 text-red-400 text-xs font-mono">
                Error: {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder-slate-400 focus:outline-none focus:border-sky-500/50 transition-colors font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder-slate-400 focus:outline-none focus:border-sky-500/50 transition-colors font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-slate-950 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.15)] mt-6 text-sm"
              >
                {loading ? "Authenticating..." : "Sign In"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>

            <div className="relative my-6 flex items-center justify-center">
              <span className="absolute w-full h-[1px] bg-border" />
              <span className="relative px-3 bg-card text-[10px] font-mono uppercase tracking-wider text-slate-500">
                New to Visora?
              </span>
            </div>

            <div className="text-center">
              <Link
                href="/signup"
                className="text-xs font-mono text-sky-400 hover:text-sky-300 transition-colors"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
