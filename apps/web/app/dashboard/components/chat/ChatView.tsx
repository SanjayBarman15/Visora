"use client"

import React, { useState, useRef, useEffect } from "react"
import { useDashboardStore } from "@/hooks/use-dashboard-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Cpu, ArrowUp } from "lucide-react"
import { MessageRenderer } from "./MessageRenderer"
import { gooeyToast } from "@/components/ui/goey-toaster"

import { useRouter } from "next/navigation"

export function ChatView() {
  const router = useRouter()
  const [initPromptText, setInitPromptText] = useState("")
  const [chatInputText, setChatInputText] = useState("")
  const [revisionConfirmText, setRevisionConfirmText] = useState("")
  const messageEndRef = useRef<HTMLDivElement>(null)

  const {
    activeProjectId,
    projects,
    messages,
    sendMessage,
    startNewProject,
    cancelGenerationAndRevise,
    queueRevision,
  } = useDashboardStore()

  const activeProject = projects.find((p) => p.id === activeProjectId)
  const activeMessages = activeProjectId ? messages.filter((m) => m.projectId === activeProjectId) : []
  const hasMessages = activeMessages.length > 0

  useEffect(() => {
    if (hasMessages) {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [activeMessages, hasMessages])

  // Empty State Handlers
  const handleChipClick = (text: string) => {
    setInitPromptText(text)
  }

  const handleInitSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!initPromptText.trim()) return
    try {
      const newId = await startNewProject(initPromptText)
      router.push(`/dashboard/project/${newId}`)
    } catch (err) {
      console.error(err)
    }
    setInitPromptText("")
  }

  // Chat Panel Handlers
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInputText.trim()) return

    if (activeProject && activeProject.status === "generating") {
      setRevisionConfirmText(chatInputText)
      setChatInputText("")
      return
    }

    sendMessage(chatInputText)
    setChatInputText("")
  }

  const exampleChips = [
    "Explain Newton's laws of motion",
    "Visualize a bubble sort algorithm",
    "Show how neural networks optimize weights",
    "Explain the geometry of derivatives",
  ]

  // Mode A: Empty mode (No active project or active project is message-less draft)
  if (!activeProjectId || !hasMessages) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 relative z-10 w-full h-full">
        <div className="w-full max-w-2xl space-y-8">
          
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-400/30 bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 text-[10px] font-mono tracking-wider uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Code-Driven Explainer Engine
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight animate-fade-in">
              What are we visualising today?
            </h1>
            <p className="text-slate-500 dark:text-slate-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Type your prompt to coordinate with Scout and generate mathematically precise Python Manim videos.
            </p>
          </div>

          <div className="bg-white dark:bg-card border border-slate-200/80 dark:border-border rounded-xl p-4 shadow-md dark:shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-sky-500/0 via-sky-400/50 to-sky-500/0" />
            
            <form onSubmit={handleInitSubmit} className="space-y-3">
              <Textarea
                required
                placeholder="Describe the video you want to create..."
                value={initPromptText}
                onChange={(e) => setInitPromptText(e.target.value)}
                className="min-h-[120px] w-full bg-slate-50 dark:bg-background border border-slate-200 dark:border-border rounded-lg placeholder-slate-400 dark:placeholder-slate-750 text-foreground focus:border-sky-400/50 dark:focus:border-sky-500/20 focus:ring-0 ring-0 outline-none resize-none font-sans text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-inner dark:shadow-none"
              />
              
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/80 dark:border-border">
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-650 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-sky-400/70" />
                  Powered by Visora NIM Pipeline
                </span>
                <Button
                  type="submit"
                  disabled={!initPromptText.trim()}
                  className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-slate-950 font-semibold px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 transition-all text-xs shadow-[0_2px_12px_rgba(14,165,233,0.25)] dark:shadow-none"
                >
                  Generate Outline
                  <ArrowUp className="w-3.5 h-3.5" />
                </Button>
              </div>
            </form>
          </div>

          <div className="space-y-2.5">
            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-650 uppercase tracking-wider text-center">
              Suggested Prompt Templates
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
              {exampleChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChipClick(chip)}
                  className="px-3.5 py-1.5 bg-white dark:bg-card border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-900/40 text-xs rounded-lg transition-all cursor-pointer font-sans shadow-sm dark:shadow-none"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    )
  }

  const getPlaceholderText = () => {
    if (!activeProject) return "Describe the video you want to create..."
    if (activeProject.status === "eliciting" || activeProject.status === "plan_review" || activeProject.status === "draft") {
      return "Ask a question or suggest a change..."
    }
    return "Describe what to animate..."
  }

  // Mode B: Conversation mode
  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#07090c] border-r border-slate-200 dark:border-slate-900">
      
      <ScrollArea className="flex-1 bg-white dark:bg-[#07090c]">
        <div className="max-w-[760px] mx-auto w-full px-4 py-8 flex flex-col gap-6">
          {activeMessages.map((msg, idx) => {
            const prevMsg = idx > 0 ? activeMessages[idx - 1] : null
            const isContinuation = prevMsg?.role === msg.role || (msg.role === "scene_plan" && prevMsg?.role === "assistant")
            return (
              <div key={msg.id} className={isContinuation ? "-mt-4" : ""}>
                <MessageRenderer message={msg} isContinuation={isContinuation} />
              </div>
            )
          })}
          <div ref={messageEndRef} />
        </div>
      </ScrollArea>

      {revisionConfirmText && (
        <div className="max-w-[760px] mx-auto w-full px-4 my-2">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl space-y-2 animate-fade-in relative z-25">
            <p className="text-[10px] text-slate-650 dark:text-slate-400 leading-normal">
              <strong>Revision requested mid-generation:</strong> "{revisionConfirmText}"
              <br />
              Choose how to apply this feedback:
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setRevisionConfirmText("")
                }}
                className="text-[9px] h-6 cursor-pointer text-slate-500 dark:text-slate-455 hover:text-slate-900 dark:hover:text-white"
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                className="text-[9px] h-6 cursor-pointer bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:bg-slate-300 dark:hover:bg-slate-800 text-slate-800 dark:text-white"
                onClick={() => {
                  queueRevision(activeProjectId!, revisionConfirmText)
                  gooeyToast.success("Got it, we'll apply this once the current generation finishes")
                  setRevisionConfirmText("")
                }}
              >
                Wait
              </Button>
              <Button
                size="sm"
                className="text-[9px] h-6 cursor-pointer bg-violet-600 hover:bg-violet-750 text-white font-bold"
                onClick={() => {
                  cancelGenerationAndRevise(activeProjectId!, revisionConfirmText)
                  gooeyToast.success("Generation cancelled — updating your plan")
                  setRevisionConfirmText("")
                }}
              >
                Cancel & revise now
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-slate-100 dark:border-slate-900/60 p-4 bg-white dark:bg-[#07090c]">
        <div className="max-w-[760px] mx-auto w-full">
          <form onSubmit={handleChatSubmit} className="flex gap-2 relative items-center">
            <input
              type="text"
              placeholder={getPlaceholderText()}
              value={chatInputText}
              onChange={(e) => setChatInputText(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-lg pl-3 pr-9 py-2.5 text-xs placeholder-slate-450 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500/50 shadow-inner font-sans"
            />
            <Button type="submit" disabled={!chatInputText.trim()} size="icon" className="w-7 h-7 bg-violet-600 hover:bg-violet-700 text-white absolute right-1 cursor-pointer rounded-md">
              <ArrowUp className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
