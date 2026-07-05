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

export default function DashboardPage() {
  const {
    activeProjectId,
    projects,
    toggleSidebar,
  } = useDashboardStore()

  const { user, signOut } = useAuthStore()

  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isChatActive = useIsChatActive()
  const activeProject = projects.find((p) => p.id === activeProjectId)

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-[#05070a] text-slate-800 dark:text-slate-200 overflow-hidden font-sans">
      
      {/* Far-Left Vertical Icon Toolbar matching Visora Workspace */}
      <div className="w-14 bg-slate-100 dark:bg-[#090b10] border-r border-slate-200 dark:border-slate-900 flex flex-col justify-between items-center py-4 shrink-0 z-30 select-none">
        {/* Top Icons */}
        <div className="flex flex-col items-center gap-5 w-full">
          {/* Visora Logo Icon from public folder */}
          <div className="w-8 h-8 relative mb-4">
            {mounted && (
              <Image
                src={resolvedTheme === "dark" ? "/visora_logo_dark_removebg.png" : "/visora_logo_light_removebg.png"}
                alt="Visora Logo"
                fill
                className="object-contain"
                priority
              />
            )}
          </div>
          
          <button 
            onClick={() => toggleSidebar()}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900/60 transition-colors cursor-pointer"
            title="Dashboard Overview"
          >
            <LayoutGrid className="w-4.5 h-4.5" />
          </button>
          
          <button 
            onClick={() => toggleSidebar()}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900/60 transition-colors cursor-pointer bg-slate-200/50 dark:bg-slate-900/40 border border-slate-350/20 dark:border-slate-800/40"
            title="Projects Directory"
          >
            <FolderClosed className="w-4.5 h-4.5 text-[#059669] dark:text-[#34d399]" />
          </button>
          
          <button 
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900/60 transition-colors cursor-pointer"
            title="History"
          >
            <History className="w-4.5 h-4.5" />
          </button>
          
          <button 
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900/60 transition-colors cursor-pointer"
            title="Copilot Parameters"
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Bottom Icons */}
        <div className="flex flex-col items-center gap-4">
          <TooltipStatus />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950 border border-violet-300 dark:border-violet-500/30 flex items-center justify-center text-violet-750 dark:text-violet-300 font-bold text-xs cursor-pointer focus:outline-none select-none">
                {user?.email ? user.email.slice(0, 2).toUpperCase() : "US"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right" className="w-56 ml-2 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-900 text-slate-800 dark:text-slate-200 z-50">
              <DropdownMenuLabel className="font-mono text-xs text-slate-500 dark:text-slate-400">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-900" />
              <div className="px-2 py-1.5 text-xs text-slate-650 dark:text-slate-400 font-mono truncate">
                {user?.email || "Not signed in"}
              </div>
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
          <div className="flex-1 flex overflow-hidden relative justify-center bg-white dark:bg-[#07090e]/20">
            <div className="w-full max-w-2xl border-x border-slate-200 dark:border-slate-900/60 h-full">
              <ChatView />
            </div>
          </div>
        ) : (
          /* State C: Active 3-panel workspace (Generating or Completed video) */
          <div className="flex-1 flex overflow-hidden relative">
            
            {/* Panel A: Left Chat list (constrained width) */}
            <div className="w-[300px] border-r border-slate-200 dark:border-slate-900 shrink-0 h-full">
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
