"use client"

import React, { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { useDashboardStore, Project } from "@/hooks/use-dashboard-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  Sparkles,
  Settings,
  Sun,
  Moon,
} from "lucide-react"

export function DashboardHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { activeProjectId, projects } = useDashboardStore()
  const activeProject = projects.find((p) => p.id === activeProjectId)

  const getStatusBadge = (status: Project["status"]) => {
    switch (status) {
      case "done":
        return (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60 font-mono text-[9px] h-4 px-1.5 py-0">
            done
          </Badge>
        )
      case "generating":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60 font-mono text-[9px] h-4 px-1.5 py-0 animate-pulse">
            generating
          </Badge>
        )
      case "assembling":
        return (
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/60 font-mono text-[9px] h-4 px-1.5 py-0 animate-pulse">
            assembling
          </Badge>
        )
      case "plan_review":
        return (
          <Badge variant="secondary" className="bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/60 font-mono text-[9px] h-4 px-1.5 py-0">
            plan review
          </Badge>
        )
      case "error":
        return (
          <Badge variant="secondary" className="bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 font-mono text-[9px] h-4 px-1.5 py-0">
            error
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 font-mono text-[9px] h-4 px-1.5 py-0">
            draft
          </Badge>
        )
    }
  }

  return (
    <header className="h-16 border-b border-slate-200/80 dark:border-slate-900/60 bg-white/80 dark:bg-[#05070a]/70 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0 shadow-sm dark:shadow-none">
      <div className="flex items-center gap-3 min-w-0">
        {activeProjectId ? (
          <>
            <MessageSquare className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-lg">
              {activeProject?.title}
            </h2>
            {activeProject && (
              <div className="hidden sm:block shrink-0">
                {getStatusBadge(activeProject.status)}
              </div>
            )}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Visora Workspace
            </h2>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="w-8 h-8 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white cursor-pointer"
          >
            {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        )}
        <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
