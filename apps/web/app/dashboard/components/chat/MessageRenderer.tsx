"use client"

import React from "react"
import { Message, useDashboardStore } from "@/hooks/use-dashboard-store"
import { ScenePlanCard } from "./ScenePlanCard"
import { Button } from "@/components/ui/button"
import { Code2 } from "lucide-react"
import { gooeyToast } from "@/components/ui/goey-toaster"
import { useAuthStore } from "@/hooks/use-auth-store"

interface MessageRendererProps {
  message: Message
  isContinuation?: boolean
}

export function MessageRenderer({ message, isContinuation = false }: MessageRendererProps) {
  const { selectScene, toggleCodePanel } = useDashboardStore()
  const { user } = useAuthStore()

  // Dynamic Scene Plan Card grouping turn layout
  if (message.role === "scene_plan") {
    return (
      <div className="flex gap-3 justify-start items-start w-full">
        {/* Align with assistant avatar column */}
        <div className="w-8 h-8 shrink-0 select-none" />
        <div className="flex-1 min-w-0">
          <ScenePlanCard projectId={message.projectId} />
        </div>
      </div>
    )
  }

  const isUser = message.role === "user"

  // Check if content mentions applying to a scene to render action button
  const matchApply = message.content.match(/apply to scene\s+(\d+)/i)
  const targetSceneNum = matchApply ? parseInt(matchApply[1], 10) : null

  const handleApplyClick = () => {
    if (targetSceneNum) {
      selectScene(message.projectId, targetSceneNum - 1)
      toggleCodePanel()
      gooeyToast.success(`Navigated to Scene ${targetSceneNum} code module!`)
    }
  }

  const userInitial = user?.email ? user.email.slice(0, 2).toUpperCase() : "US"

  const userAvatar = (
    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950 border border-violet-300 dark:border-violet-500/30 flex items-center justify-center text-violet-750 dark:text-violet-300 font-bold text-xs select-none shrink-0 font-sans">
      {userInitial}
    </div>
  )

  const assistantAvatar = (
    <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950 border border-sky-300 dark:border-sky-500/30 flex items-center justify-center text-sky-700 dark:text-sky-400 font-bold text-[10px] font-mono select-none shrink-0">
      AI
    </div>
  )

  if (isUser) {
    return (
      <div className="flex gap-3 justify-end items-start w-full">
        <div className="flex flex-col items-end max-w-[80%]">
          <div className="rounded-2xl px-4 py-2.5 text-xs bg-[#f8fafc] dark:bg-[#090b10] border border-slate-200 dark:border-[#1a1e27] text-slate-800 dark:text-slate-200 shadow-sm leading-relaxed whitespace-pre-wrap select-text">
            {message.content}
          </div>
        </div>
        {!isContinuation ? userAvatar : <div className="w-8 h-8 shrink-0 select-none" />}
      </div>
    )
  }

  return (
    <div className="flex gap-3 justify-start items-start w-full">
      {!isContinuation ? assistantAvatar : <div className="w-8 h-8 shrink-0 select-none" />}
      <div className="flex flex-col items-start max-w-[80%]">
        <div className="rounded-2xl px-4 py-2.5 text-xs bg-slate-100/60 dark:bg-[#090b10]/80 border border-slate-200 dark:border-slate-900 text-slate-700 dark:text-slate-350 shadow-sm leading-relaxed select-text">
          <p className="whitespace-pre-wrap">{message.content}</p>
          
          {/* Apply inline action button */}
          {targetSceneNum && (
            <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-900 flex justify-start">
              <Button
                onClick={handleApplyClick}
                size="sm"
                className="h-6 text-[10px] font-mono bg-white dark:bg-[#090b10] border border-slate-200 dark:border-[#1e293b] hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 px-2 rounded cursor-pointer"
              >
                <Code2 className="w-3 h-3 text-[#059669] dark:text-[#34d399]" />
                Apply to Scene {targetSceneNum}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
