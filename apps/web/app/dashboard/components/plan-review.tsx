"use client"

import React, { useState } from "react"
import { useDashboardStore } from "@/hooks/use-dashboard-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Check,
  ArrowUp,
} from "lucide-react"

export function PlanReview() {
  const [chatInputText, setChatInputText] = useState("")

  const {
    activeProjectId,
    projects,
    projectMessages,
    sendMessage,
    updateScene,
    reorderScenes,
    deleteScene,
    approvePlan,
  } = useDashboardStore()

  const activeProject = projects.find((p) => p.id === activeProjectId)
  const activeMessages = activeProjectId ? projectMessages[activeProjectId] || [] : []

  if (!activeProject) return null

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInputText.trim()) return
    sendMessage(chatInputText)
    setChatInputText("")
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      {/* Left Side: Scout Chat */}
      <div className="w-full md:w-[400px] border-r border-slate-200/80 dark:border-slate-900 bg-white dark:bg-[#07090e]/40 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-900 bg-slate-50/80 dark:bg-slate-950/20">
          <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider font-mono">
            Coordinating with Scout
          </h3>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 pb-4">
            {activeMessages.map((msg) => {
              const isUser = msg.role === "user"
              return (
                <div key={msg.id} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <Avatar className="w-6 h-6 border border-slate-200 dark:border-slate-800 shrink-0">
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
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-900 bg-white dark:bg-[#05070a]">
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Suggest adjustments to the plan..."
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

      {/* Right Side: Editable Plan breakdown */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#05070a]/50 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Scene Plan Review</h2>
              <p className="text-slate-500 text-xs mt-1">
                Review, edit, or reorder scenes. Approving starts parallel rendering.
              </p>
            </div>
            <Button
              onClick={() => approvePlan(activeProject.id)}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-2.5 rounded-lg shadow-[0_2px_12px_rgba(16,185,129,0.2)] text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Approve & Start Generation
            </Button>
          </div>

          <div className="space-y-4">
            {activeProject.scenes?.map((scene, idx) => (
              <div
                key={scene.id}
                className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl p-4.5 shadow-sm dark:shadow-md flex gap-4 items-start hover:border-sky-300 dark:hover:border-slate-800 hover:shadow-md dark:hover:shadow-md transition-all"
              >
                <div className="flex flex-col gap-1 items-center justify-center pt-1">
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-900 w-6 h-6 flex items-center justify-center rounded-full border border-slate-200 dark:border-border">
                    {idx + 1}
                  </span>
                  <div className="flex flex-col gap-0.5 mt-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={idx === 0}
                      onClick={() => reorderScenes(activeProject.id, idx, idx - 1)}
                      className="w-5 h-5 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={idx === (activeProject.scenes.length - 1)}
                      onClick={() => reorderScenes(activeProject.id, idx, idx + 1)}
                      className="w-5 h-5 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={scene.title}
                      onChange={(e) => updateScene(activeProject.id, scene.id, { title: e.target.value })}
                      className="bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-b border-sky-500/50 w-full"
                    />
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-border rounded px-2 py-0.5 text-[10px] font-mono text-slate-500">
                      <input
                        type="number"
                        value={scene.duration}
                        onChange={(e) => updateScene(activeProject.id, scene.id, { duration: parseInt(e.target.value) || 0 })}
                        className="w-6 bg-transparent text-right focus:outline-none"
                      />
                      <span>s</span>
                    </div>
                  </div>

                  <textarea
                    value={scene.description}
                    onChange={(e) => updateScene(activeProject.id, scene.id, { description: e.target.value })}
                    rows={2}
                    className="bg-transparent text-slate-500 dark:text-slate-400 text-xs w-full resize-none focus:outline-none focus:border-b border-sky-500/20 leading-relaxed"
                  />
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteScene(activeProject.id, scene.id)}
                  className="w-8 h-8 text-rose-500 hover:bg-rose-950/20 hover:text-rose-450 rounded-lg cursor-pointer align-self-start"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
