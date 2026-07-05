"use client"

import React, { useState } from "react"
import { useDashboardStore } from "@/hooks/use-dashboard-store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Cpu, ArrowUp } from "lucide-react"

export function EmptyState() {
  const [initPromptText, setInitPromptText] = useState("")
  const startNewProject = useDashboardStore((state) => state.startNewProject)

  const handleChipClick = (text: string) => {
    setInitPromptText(text)
  }

  const handleInitSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!initPromptText.trim()) return
    startNewProject(initPromptText)
    setInitPromptText("")
  }

  const exampleChips = [
    "Explain Newton's laws of motion",
    "Visualize a bubble sort algorithm",
    "Show how neural networks optimize weights",
    "Explain the geometry of derivatives",
  ]

  return (
    <div className="flex-1 flex items-center justify-center p-6 relative z-10">
      <div className="w-full max-w-2xl space-y-8">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-500/20 bg-sky-500/10 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 text-[10px] font-mono tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Code-Driven Explainer Engine
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            What are we visualising today?
          </h1>
          <p className="text-slate-650 dark:text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
            Type your prompt to coordinate with Scout and generate mathematically precise Python Manim videos.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-sky-500/0 via-sky-500/30 to-sky-500/0" />
          
          <form onSubmit={handleInitSubmit} className="space-y-3">
            <Textarea
              required
              placeholder="Describe the video you want to create..."
              value={initPromptText}
              onChange={(e) => setInitPromptText(e.target.value)}
              className="min-h-[120px] w-full bg-background border border-border rounded-lg placeholder-slate-400 dark:placeholder-slate-750 text-foreground focus:border-sky-500/20 focus:ring-0 resize-none font-sans text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-650 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-sky-500/50" />
                Powered by Visora NIM Pipeline
              </span>
              <Button
                type="submit"
                disabled={!initPromptText.trim()}
                className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-slate-950 font-semibold px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 transition-all text-xs"
              >
                Generate Outline
                <ArrowUp className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-2.5">
          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-650 uppercase tracking-wider text-center">
            Suggested Prompt Templates
          </div>
          <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
            {exampleChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleChipClick(chip)}
                className="px-3.5 py-1.5 bg-card border border-border hover:border-slate-350 dark:hover:border-slate-80 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 text-xs rounded-lg transition-colors cursor-pointer font-sans"
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
