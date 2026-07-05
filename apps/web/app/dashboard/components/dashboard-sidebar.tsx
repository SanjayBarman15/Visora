"use client"

import React from "react"
import { useDashboardStore } from "@/hooks/use-dashboard-store"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plus } from "lucide-react"

export function DashboardSidebar() {
  const {
    sidebarCollapsed,
    projects,
    activeProjectId,
    selectProject,
  } = useDashboardStore()

  if (sidebarCollapsed) return null

  return (
    <div className="w-60 border-r border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-[#090b10] text-slate-800 dark:text-slate-200 flex flex-col h-full shrink-0 select-none transition-all duration-300">
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-slate-200 dark:border-slate-900 font-sans font-bold text-xs uppercase tracking-wider text-slate-450">
        Recent Projects
      </div>
      
      {/* Content */}
      <div className="flex-1 p-3 space-y-4 overflow-y-auto scrollbar-none">
        <Button
          onClick={() => selectProject(null)}
          className="w-full bg-[#0ea5e9] hover:bg-sky-600 text-slate-950 font-semibold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 text-xs shadow-sm border-none"
        >
          <Plus className="w-4 h-4" />
          New video
        </Button>
        
        <Separator className="bg-slate-200 dark:bg-slate-900" />
        
        <div className="space-y-1.5">
          {projects.map((proj) => {
            const isActive = proj.id === activeProjectId
            return (
              <button
                key={proj.id}
                onClick={() => selectProject(proj.id)}
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
  )
}
