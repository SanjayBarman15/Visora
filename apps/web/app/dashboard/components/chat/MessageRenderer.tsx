"use client"

import React from "react"
import { Message, useDashboardStore } from "@/hooks/use-dashboard-store"
import { ScenePlanCard } from "./ScenePlanCard"
import { Button } from "@/components/ui/button"
import { Code2 } from "lucide-react"
import { gooeyToast } from "@/components/ui/goey-toaster"

interface MessageRendererProps {
  message: Message
}

export function MessageRenderer({ message }: MessageRendererProps) {
  const { selectScene, toggleCodePanel } = useDashboardStore()
  
  if (message.role === "scene_plan") {
    return <ScenePlanCard projectId={message.projectId} />
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

  return (
    <div className="flex flex-col gap-1 w-full text-slate-800 dark:text-slate-200">
      {/* Sender name label */}
      <div className={`text-[9px] font-mono tracking-wider font-bold uppercase select-none ${isUser ? "text-right text-[#059669] dark:text-[#34d399]" : "text-left text-slate-400 dark:text-slate-500"}`}>
        {isUser ? "You" : "Visora AI"}
      </div>
      
      {/* Message Bubble Container */}
      <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
        <div className={`rounded-lg px-3 py-2.5 text-xs max-w-[88%] leading-relaxed ${
          isUser
            ? "bg-[#f8fafc] dark:bg-[#090b10] border border-slate-200 dark:border-[#1a1e27] text-slate-800 dark:text-slate-200 ml-8"
            : "bg-slate-100/60 dark:bg-[#090b10]/80 border border-slate-200 dark:border-slate-900 text-slate-700 dark:text-slate-350 mr-8"
        }`}>
          <p className="whitespace-pre-wrap select-text">{message.content}</p>
          
          {/* Mova AI inline action button if applicable */}
          {!isUser && targetSceneNum && (
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
