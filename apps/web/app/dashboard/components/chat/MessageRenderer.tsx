"use client"

import React from "react"
import { Message } from "@/hooks/use-dashboard-store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScenePlanCard } from "./ScenePlanCard"

interface MessageRendererProps {
  message: Message
}

export function MessageRenderer({ message }: MessageRendererProps) {
  if (message.role === "scene_plan") {
    return <ScenePlanCard projectId={message.projectId} />
  }

  const isUser = message.role === "user"

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <Avatar className="w-6 h-6 border border-slate-800 shrink-0">
          <AvatarFallback className="bg-sky-500/10 text-sky-400 text-[9px] font-bold">SC</AvatarFallback>
        </Avatar>
      )}
      <div className={`rounded-xl px-3 py-2 text-xs max-w-[85%] leading-relaxed ${
        isUser
          ? "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-100"
          : "bg-white dark:bg-[#07090e]/50 border border-slate-200/80 dark:border-slate-900/60 text-slate-600 dark:text-slate-300"
      }`}>
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}
