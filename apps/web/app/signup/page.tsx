"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { z } from "zod"
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react"
import { gooeyToast } from "@/components/ui/goey-toaster"

const signupSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
})

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const result = signupSchema.safeParse({ email, password, confirmPassword })
    if (!result.success) {
      const errMsg = result.error.issues[0].message
      setError(errMsg)
      gooeyToast.error(errMsg)
      return
    }

    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        setError(authError.message)
        gooeyToast.error(authError.message)
      } else {
        setSuccess(true)
        gooeyToast.success("Verification email sent!")
        // If auto-signed in, wait a bit then redirect.
        if (data?.session) {
          setTimeout(() => {
            router.push("/dashboard")
          }, 1500)
        }
      }
    } catch (err: unknown) {
      const errMsg = (err as { message?: string }).message || "An unexpected error occurred."
      setError(errMsg)
      gooeyToast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-100 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-300 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-950/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: "30px 30px",
        }}
      />

      {/* Top Header/Logo Link */}
      <header className="w-full border-b border-slate-900/60 bg-[#05070a]/80 backdrop-blur-md z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="relative w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center font-mono font-bold text-sky-400 text-sm">
              M
              <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-emerald-400" />
              <span className="absolute bottom-0.5 left-0.5 w-1 h-1 rounded-full bg-amber-400" />
            </div>
            <span className="font-sans font-bold tracking-tight text-white text-lg">Visora</span>
          </Link>
          <div className="text-xs font-mono text-slate-500">
            01.Authentication
          </div>
        </div>
      </header>

      {/* Card container */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md bg-[#07090e] border border-slate-900 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-500/0 via-sky-500/40 to-sky-500/0" />
          
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Create an account
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Sign up to start generating premium mathematical explainer animations
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-lg border border-red-500/20 bg-red-950/20 text-red-400 text-xs font-mono">
                Error: {error}
              </div>
            )}

            {success ? (
              <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 text-xs font-mono text-center space-y-2">
                <p className="font-bold">Sign up successful!</p>
                <p className="text-slate-400 text-[11px]">
                  Please check your email to verify your account or hold on while we redirect you.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
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
                      className="w-full pl-10 pr-4 py-2.5 bg-[#05070a] border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-colors font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-[#05070a] border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-colors font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#05070a] border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-colors font-sans"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-slate-950 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.15)] mt-6 text-sm"
                >
                  {loading ? "Creating account..." : "Sign Up"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </Button>
              </form>
            )}

            <div className="relative my-6 flex items-center justify-center">
              <span className="absolute w-full h-[1px] bg-slate-900/60" />
              <span className="relative px-3 bg-[#07090e] text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Already have an account?
              </span>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="text-xs font-mono text-sky-400 hover:text-sky-300 transition-colors"
              >
                Sign in to your account
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
