"use client"

import React, { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { useDashboardStore } from "@/hooks/use-dashboard-store"
import { Button } from "@/components/ui/button"
import {
  Settings,
  Sun,
  Moon,
  HelpCircle,
  Menu,
} from "lucide-react"

export function DashboardHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { activeProjectId, projects, toggleSidebar } = useDashboardStore()
  const activeProject = projects.find((p) => p.id === activeProjectId)

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-900/60 bg-white dark:bg-[#090b10] text-slate-800 dark:text-slate-200 px-6 flex items-center justify-between z-20 shrink-0 select-none">
      <div className="flex items-center gap-3 text-sm font-sans font-medium">
        <Button
          onClick={() => toggleSidebar()}
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-lg mr-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
          title="Toggle Sidebar"
        >
          <Menu className="w-4.5 h-4.5" />
        </Button>
        <span className="font-bold text-slate-900 dark:text-white tracking-wide">Visora Workspace</span>
        {activeProject && (
          <>
            <span className="text-slate-350 dark:text-slate-700">|</span>
            <span className="text-slate-400 dark:text-slate-450">Project:</span>
            <span className="text-violet-600 dark:text-violet-400 underline underline-offset-4 decoration-violet-500/50 font-semibold cursor-pointer hover:text-violet-500 dark:hover:text-violet-300 transition-colors">
              {activeProject.title.replace(/\s+/g, "_")}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-md text-slate-600 dark:text-slate-300"
        >
          Share
        </Button>
        <Button
          size="sm"
          className="h-8 text-xs font-semibold px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-md transition-colors"
        >
          Export
        </Button>
        <span className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="w-8 h-8 rounded-lg text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            {resolvedTheme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </Button>
        )}
        <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white cursor-pointer">
          <Settings className="w-4.5 h-4.5" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white cursor-pointer">
          <HelpCircle className="w-4.5 h-4.5" />
        </Button>
      </div>
    </header>
  )
}
