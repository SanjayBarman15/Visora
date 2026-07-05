"use client"

import React from "react"
import { useDashboardStore, useIsChatActive } from "@/hooks/use-dashboard-store"
import { SidebarProvider } from "@/components/ui/sidebar"
import { DashboardSidebar } from "./components/dashboard-sidebar"
import { DashboardHeader } from "./components/dashboard-header"
import { EmptyState } from "./components/empty-state"
import { PlanReview } from "./components/plan-review"
import { ChatPanel } from "./components/chat-panel"
import { VisualStage } from "./components/visual-stage"
import { CodeInspector } from "./components/code-inspector"
import { Code, ChevronLeft } from "lucide-react"

export default function DashboardPage() {
  const {
    sidebarCollapsed,
    activeProjectId,
    projects,
    isCodePanelOpen,
    toggleSidebar,
    toggleCodePanel,
  } = useDashboardStore()

  const isChatActive = useIsChatActive()
  const activeProject = projects.find((p) => p.id === activeProjectId)

  return (
    <SidebarProvider open={!sidebarCollapsed} onOpenChange={() => toggleSidebar()}>
      {/* Panel 1: Collapsible Left Sidebar */}
      <DashboardSidebar />

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50 dark:bg-[#030508]">
        {/* Decorative Grid Overlay */}
        {!isChatActive && (
          <>
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgb(148 163 184 / 0.18) 1px, transparent 1px),
                  linear-gradient(to bottom, rgb(148 163 184 / 0.18) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
            />
            <div 
              className="absolute inset-0 dark:block hidden pointer-events-none opacity-[0.025]"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #ffffff 1px, transparent 1px),
                  linear-gradient(to bottom, #ffffff 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
            />
          </>
        )}

        {/* Workspace Top Header */}
        <DashboardHeader />

        {!activeProjectId ? (
          /* State A: Workspace is empty */
          <EmptyState />
        ) : (activeProject?.status === "draft" || activeProject?.status === "eliciting" || activeProject?.status === "plan_review") ? (
          /* State B: Unified conversation chat view (full width scrollable) */
          <div className="flex-1 flex overflow-hidden relative justify-center bg-white dark:bg-[#07090e]/20">
            <div className="w-full max-w-2xl border-x border-slate-200/80 dark:border-slate-900/60 h-full">
              <ChatPanel />
            </div>
          </div>
        ) : (
          /* State C: Active 3-panel workspace (Generating or Completed video) */
          <div className="flex-1 flex overflow-hidden relative">
            
            {/* Panel A: Left Chat list (constrained width) */}
            <div className="w-[300px] border-r border-slate-200/80 dark:border-slate-900 shrink-0 h-full">
              <ChatPanel />
            </div>

            {/* Panel B: Center visual frame */}
            <VisualStage />

            {/* Panel C: Right Code Inspector */}
            <CodeInspector />

            {/* Collapsed side handle to open code panel when collapsed */}
            {!isCodePanelOpen && activeProject?.status === "done" && (
              <button
                onClick={toggleCodePanel}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-sky-500 hover:bg-sky-600 text-slate-950 border border-slate-700 py-3.5 px-1.5 rounded-l-xl cursor-pointer flex flex-col items-center gap-2 shadow-2xl z-30 transition-transform"
              >
                <Code className="w-3.5 h-3.5" />
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
            
          </div>
        )}
      </main>
    </SidebarProvider>
  )
}
