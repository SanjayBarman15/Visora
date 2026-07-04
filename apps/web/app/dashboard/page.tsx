"use client"

import React from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { LogOut, LayoutDashboard } from "lucide-react"

export default function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-100 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-300 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-sky-950/15 rounded-full blur-[130px] pointer-events-none" />

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

      {/* Header */}
      <header className="w-full border-b border-slate-900/60 bg-[#05070a]/80 backdrop-blur-md z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center font-mono font-bold text-sky-400 text-sm">
              M
              <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-emerald-400" />
              <span className="absolute bottom-0.5 left-0.5 w-1 h-1 rounded-full bg-amber-400" />
            </div>
            <span className="font-sans font-bold tracking-tight text-white text-lg">Visora</span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden sm:inline-block text-xs font-mono text-slate-400">
                {user.email}
              </span>
            )}
            <Button
              onClick={signOut}
              variant="ghost"
              className="text-xs font-mono text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Center of the screen dashboard text */}
      <main className="flex-1 flex flex-col items-center justify-center z-10 p-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/25 bg-sky-950/20 text-sky-400 text-xs font-mono mb-2 animate-bounce">
            <LayoutDashboard className="w-3.5 h-3.5" />
            AUTHENTICATED SESSION
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-400 font-sans max-w-md mx-auto text-sm">
            Welcome to your premium mathematical animation environment.
          </p>
        </div>
      </main>
    </div>
  )
}
