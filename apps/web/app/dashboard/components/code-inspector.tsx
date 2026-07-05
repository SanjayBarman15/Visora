"use client"

import React from "react"
import { useDashboardStore } from "@/hooks/use-dashboard-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Code, ChevronRight } from "lucide-react"

export function CodeInspector() {
  const {
    activeProjectId,
    projects,
    scenePlans,
    isCodePanelOpen,
    toggleCodePanel,
  } = useDashboardStore()

  const activeProject = projects.find((p) => p.id === activeProjectId)
  if (!activeProject) return null

  const scenes = activeProjectId ? scenePlans[activeProjectId] || [] : []
  const activeScene = scenes[activeProject.activeSceneIndex]

  return (
    <div 
      className={`border-l border-slate-200 dark:border-slate-900 bg-white dark:bg-[#07090e] flex flex-col transition-all duration-300 relative ${
        isCodePanelOpen ? "w-[360px]" : "w-0 overflow-hidden border-l-0"
      }`}
    >
      {isCodePanelOpen && (
        <Button
          onClick={toggleCodePanel}
          size="icon"
          variant="ghost"
          className="absolute top-4 -left-10 w-8 h-8 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-lg cursor-pointer shadow-md hover:bg-slate-50 text-slate-650 dark:text-slate-400 z-30"
        >
          <ChevronRight className="w-4.5 h-4.5" />
        </Button>
      )}

      <div className="p-4 border-b border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
            Manim Code Inspector
          </h3>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 bg-slate-950 text-slate-100 font-mono text-[11px] leading-relaxed">
        {activeScene?.code ? (
          <pre className="whitespace-pre-wrap selection:bg-slate-800">
            {activeScene.code.split("\n").map((line, lineIdx) => {
              const highlighted = line
                .replace(/(def|class|import|from|self|lambda|for|in|return)/g, '<span class="text-pink-400 font-bold">$1</span>')
                .replace(/(Axes|Circle|Dot|Arrow|MathTex|Create|Write|Rotate|Transform|TransformMatchingShapes|Rectangle|VGroup|ORIGIN|BLUE|YELLOW|GREEN|RED|UP|LEFT|RIGHT|Scene)/g, '<span class="text-sky-400">$1</span>')
                .replace(/(\#.*)/g, '<span class="text-slate-500 font-italic">$1</span>')
                .replace(/(\".*\")/g, '<span class="text-emerald-400">$1</span>')
              
              return (
                <div key={lineIdx} className="flex gap-4">
                  <span className="text-slate-600 w-6 text-right select-none">{lineIdx + 1}</span>
                  <span dangerouslySetInnerHTML={{ __html: highlighted }} />
                </div>
              )
            })}
          </pre>
        ) : (
          <div className="text-slate-600 italic text-center pt-8">No code generated yet.</div>
        )}
      </ScrollArea>
    </div>
  )
}
