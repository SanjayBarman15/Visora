"use client"

import React, { useState, useRef, useEffect } from "react"
import { useDashboardStore } from "@/hooks/use-dashboard-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowUp } from "lucide-react"
import { ScenePlanCard } from "./chat/ScenePlanCard"

export function ChatPanel() {
  const [chatInputText, setChatInputText] = useState("")
  const messageEndRef = useRef<HTMLDivElement>(null)

  const {
    activeProjectId,
    messages,
    sendMessage,
  } = useDashboardStore()

  const activeMessages = activeProjectId ? messages.filter((m) => m.projectId === activeProjectId) : []

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeMessages])

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInputText.trim()) return
    sendMessage(chatInputText)
    setChatInputText("")
  }

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#07090e]/40">
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-900 bg-slate-50/80 dark:bg-slate-950/20">
        <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider font-mono">
          Refinement Chat
        </h3>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 pb-4">
          {activeMessages.map((msg) => {
            if (msg.role === "scene_plan") {
              return <ScenePlanCard key={msg.id} projectId={activeProjectId!} />
            }
            const isUser = msg.role === "user"
            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
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
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            )
          })}
          <div ref={messageEndRef} />
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-900 bg-white dark:bg-[#05070a]">
        <form onSubmit={handleChatSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Refine selected scene..."
            value={chatInputText}
            onChange={(e) => setChatInputText(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg px-3 py-2 text-xs placeholder-slate-400 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-400/50 dark:focus:border-sky-500/30 shadow-inner dark:shadow-none"
          />
          <Button type="submit" disabled={!chatInputText.trim()} size="icon" className="bg-sky-500 hover:bg-sky-600 text-slate-950">
            <ArrowUp className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
