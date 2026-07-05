"use client"

import React, { useState, useRef, useEffect } from "react"
import { useDashboardStore } from "@/hooks/use-dashboard-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowUp } from "lucide-react"

export function ChatPanel() {
  const [chatInputText, setChatInputText] = useState("")
  const messageEndRef = useRef<HTMLDivElement>(null)

  const {
    activeProjectId,
    projectMessages,
    sendMessage,
  } = useDashboardStore()

  const activeMessages = activeProjectId ? projectMessages[activeProjectId] || [] : []

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
    <div className="w-[300px] border-r border-slate-200 dark:border-slate-900 bg-white dark:bg-[#07090e]/40 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
          Refinement Chat
        </h3>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 pb-4">
          {activeMessages.map((msg) => {
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
                    ? "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-100"
                    : "bg-card dark:bg-[#07090e]/50 border border-border dark:border-slate-900/60 text-slate-700 dark:text-slate-300"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            )
          })}
          <div ref={messageEndRef} />
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-[#05070a]">
        <form onSubmit={handleChatSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Refine selected scene..."
            value={chatInputText}
            onChange={(e) => setChatInputText(e.target.value)}
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500/30"
          />
          <Button type="submit" disabled={!chatInputText.trim()} size="icon" className="bg-sky-500 hover:bg-sky-600 text-slate-950">
            <ArrowUp className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
