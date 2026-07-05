"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useDashboardStore, useIsChatActive } from "@/hooks/use-dashboard-store"
import { DashboardSidebar } from "./components/dashboard-sidebar"
import { DashboardHeader } from "./components/dashboard-header"
import { ChatView } from "./components/chat/ChatView"
import { VisualStage } from "./components/visual-stage"
import { CodeInspector } from "./components/code-inspector"
import { LayoutGrid, FolderClosed, History, SlidersHorizontal, Cloud, LogOut } from "lucide-react"
import { useAuthStore } from "@/hooks/use-auth-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function DashboardPage({ isProjectSubroute = false }: { isProjectSubroute?: boolean } = {}) {
  const {
    activeProjectId,
    projects,
    toggleSidebar,
    setActiveProject,
  } = useDashboardStore()

  const { user, signOut } = useAuthStore()

  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isProjectSubroute) {
      setActiveProject(null)
    }
  }, [isProjectSubroute, setActiveProject])

  const isChatActive = useIsChatActive()
  const activeProject = projects.find((p) => p.id === activeProjectId)

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-[#05070a] text-slate-800 dark:text-slate-200 overflow-hidden font-sans">
      
      {/* Panel 1: Collapsible Left Projects Sidebar */}
      <DashboardSidebar />

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50 dark:bg-[#05070a]">
        {/* Decorative Grid Overlay */}
        {!isChatActive && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-100"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgb(148 163 184 / 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgb(148 163 184 / 0.1) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
        )}

        {/* Workspace Top Header */}
        <DashboardHeader />

        {!activeProjectId ? (
          /* State A: Workspace is empty */
          <ChatView />
        ) : (activeProject?.status === "draft" || activeProject?.status === "eliciting" || activeProject?.status === "plan_review") ? (
          /* State B: Unified conversation chat view (full width scrollable) */
          <div className="flex-1 flex overflow-hidden relative bg-white dark:bg-[#07090e]/20">
            <ChatView />
          </div>
        ) : (
          /* State C: Active 3-panel workspace (Generating or Completed video) */
          <div className="flex-1 flex overflow-hidden relative">
            
            {/* Panel A: Left Chat list (constrained width) */}
            <div className="w-[360px] border-r border-slate-200 dark:border-slate-900 shrink-0 h-full">
              <ChatView />
            </div>

            {/* Panel B: Center visual frame */}
            <VisualStage />

            {/* Panel C: Right Code Inspector */}
            <CodeInspector />
            
          </div>
        )}
      </main>
    </div>
  )
}

function TooltipStatus() {
  return (
    <div className="relative group cursor-pointer">
      <Cloud className="w-4.5 h-4.5 text-[#059669] dark:text-[#34d399]" />
      <span className="absolute left-10 bottom-0 bg-slate-900 dark:bg-slate-950 text-white text-[9px] px-2 py-1 rounded shadow border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-mono">
        Cloud Sync Active
      </span>
    </div>
  )
}
