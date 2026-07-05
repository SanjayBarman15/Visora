"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useDashboardStore } from "@/hooks/use-dashboard-store"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plus, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/hooks/use-auth-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DashboardSidebar() {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { user, signOut } = useAuthStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    sidebarCollapsed,
    projects,
    activeProjectId,
  } = useDashboardStore()

  const [isHovered, setIsHovered] = useState(false)
  const shouldSlideOver = sidebarCollapsed

  return (
    <>
      {/* Invisible hover detection zone at the left edge of the viewport */}
      {shouldSlideOver && (
        <div 
          className="fixed left-0 top-0 bottom-0 w-2.5 z-40 bg-transparent"
          onMouseEnter={() => setIsHovered(true)}
        />
      )}
      
      <div 
        onMouseEnter={() => {
          if (shouldSlideOver) setIsHovered(true)
        }}
        onMouseLeave={() => {
          if (shouldSlideOver) setIsHovered(false)
        }}
        className={`w-60 border-r border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-[#090b10] text-slate-800 dark:text-slate-200 flex flex-col h-full shrink-0 select-none transition-all duration-300 ${
          shouldSlideOver 
            ? `fixed left-0 top-0 bottom-0 z-40 shadow-2xl ${isHovered ? "translate-x-0" : "-translate-x-full"}`
            : ""
        }`}
      >
      
      {/* Brand Header with Logo */}
      <div className="h-14 flex items-center px-4 border-b border-slate-200 dark:border-slate-900 gap-2.5">
        <div className="w-6 h-6 relative shrink-0">
          {mounted && (
            <Image
              src={resolvedTheme === "dark" ? "/visora_logo_dark_removebg.png" : "/visora_logo_light_removebg.png"}
              alt="Visora Logo"
              fill
              sizes="24px"
              className="object-contain"
              priority
            />
          )}
        </div>
        <span className="font-sans font-bold text-sm tracking-wide text-slate-900 dark:text-white">
          Visora
        </span>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-3 space-y-4 overflow-y-auto scrollbar-none">
        <Button
          onClick={() => router.push("/dashboard")}
          className="w-full bg-[#0ea5e9] hover:bg-sky-600 text-slate-950 font-semibold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 text-xs shadow-sm border-none"
        >
          <Plus className="w-4 h-4" />
          New video
        </Button>
        
        <Separator className="bg-slate-200 dark:bg-slate-900" />
        
        <div className="space-y-1">
          <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-450 px-1 mb-2">
            Recent Projects
          </div>
          <div className="space-y-1.5">
            {projects.map((proj) => {
              const isActive = proj.id === activeProjectId
              return (
                <button
                  key={proj.id}
                  onClick={() => router.push(`/dashboard/project/${proj.id}`)}
                  className={`w-full text-left p-3 rounded-lg transition-all flex flex-col gap-1.5 cursor-pointer border ${
                    isActive
                      ? "bg-slate-200/60 dark:bg-[#161920]/60 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                      : "bg-transparent text-slate-500 dark:text-slate-450 hover:bg-slate-200/40 dark:hover:bg-slate-900/40 hover:text-slate-800 dark:hover:text-slate-250 border-transparent"
                  }`}
                >
                  <div className="text-xs font-semibold truncate leading-tight w-full">
                    {proj.title}
                  </div>
                  <div className="flex justify-between items-center mt-1 w-full text-[9px] font-mono text-slate-400 dark:text-slate-550">
                    <span>
                      {new Date(proj.lastMessageAt).toLocaleDateString()}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wide ${
                      proj.status === 'done' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50' :
                      proj.status === 'generating' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 animate-pulse' :
                      proj.status === 'plan_review' ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900/50' :
                      'bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-450 border border-slate-200 dark:border-slate-900'
                    }`}>
                      {proj.status.replace('_', ' ')}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* User Footer Account details */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-900 bg-slate-100/50 dark:bg-[#07090e]/20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full p-1.5 hover:bg-slate-200/50 dark:hover:bg-slate-900/50 rounded-lg transition-colors cursor-pointer text-left focus:outline-none select-none">
              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950 border border-violet-300 dark:border-violet-500/30 flex items-center justify-center text-violet-750 dark:text-violet-300 font-bold text-xs shrink-0">
                {user?.email ? user.email.slice(0, 2).toUpperCase() : "US"}
              </div>
              <div className="flex-1 min-w-0 font-sans">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {user?.email?.split('@')[0] || "User"}
                </p>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 truncate">
                  {user?.email || "Not signed in"}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-52 mb-2 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-900 text-slate-800 dark:text-slate-200 z-50">
            <DropdownMenuLabel className="font-mono text-[10px] text-slate-500">Account Options</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-900" />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-xs text-rose-500 dark:text-rose-455 focus:bg-rose-50 dark:focus:bg-rose-950/20 focus:text-rose-600 dark:focus:text-rose-350 cursor-pointer flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </>
  )
}
