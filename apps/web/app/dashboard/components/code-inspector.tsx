"use client"

import React from "react"
import { useDashboardStore } from "@/hooks/use-dashboard-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Code, ChevronRight, ChevronLeft } from "lucide-react"

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function highlightLine(line: string) {
  // 1. Separate comments
  const commentMatch = line.match(/(#.*)/)
  let lineWithoutComment = line
  let commentPart = ""
  if (commentMatch) {
    lineWithoutComment = line.slice(0, commentMatch.index)
    commentPart = commentMatch[0]
  }

  // 2. Tokenize string literals
  const parts = lineWithoutComment.split(/(".*?"|'.*?')/g)

  const highlightedParts = parts.map((part) => {
    // If it is a string literal, color it green
    if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'"))) {
      return `<span class="text-emerald-400">${escapeHtml(part)}</span>`
    }

    // Otherwise escape and highlight keywords/classes
    let escaped = escapeHtml(part)
    escaped = escaped.replace(/\b(def|class|import|from|self|lambda|for|in|return)\b/g, '<span class="text-pink-400 font-bold">$1</span>')
    escaped = escaped.replace(/\b(Axes|Circle|Dot|Arrow|MathTex|Create|Write|Rotate|Transform|TransformMatchingShapes|Rectangle|VGroup|ORIGIN|BLUE|YELLOW|GREEN|RED|UP|LEFT|RIGHT|Scene)\b/g, '<span class="text-sky-400">$1</span>')
    
    return escaped
  })

  let finalHtml = highlightedParts.join("")
  if (commentPart) {
    finalHtml += `<span class="text-slate-500 italic">${escapeHtml(commentPart)}</span>`
  }

  return finalHtml
}

export function CodeInspector() {
  const {
    activeProjectId,
    projects,
    scenePlans,
    codePanelCollapsed,
    toggleCodePanel,
  } = useDashboardStore()

  const activeProject = projects.find((p) => p.id === activeProjectId)
  if (!activeProject) return null

  const scenes = activeProjectId ? scenePlans[activeProjectId] || [] : []
  const activeScene = scenes[activeProject.activeSceneIndex]

  if (codePanelCollapsed) {
    return (
      <div className="w-12 border-l border-slate-200 dark:border-slate-900 bg-white dark:bg-[#07090e] flex flex-col items-center py-4 shrink-0 transition-all duration-300">
        <Button
          onClick={toggleCodePanel}
          size="icon"
          variant="ghost"
          className="w-8 h-8 rounded-lg cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
          title="Open Code Inspector"
        >
          <ChevronLeft className="w-4.5 h-4.5" />
        </Button>
        <div className="mt-8 flex flex-col items-center gap-1 select-none pointer-events-none">
          <Code className="w-4.5 h-4.5 text-slate-400 dark:text-slate-600" />
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest font-mono [writing-mode:vertical-lr] mt-2">
            Code
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[360px] border-l border-slate-200 dark:border-slate-900 bg-white dark:bg-[#07090e] flex flex-col shrink-0 transition-all duration-300">
      <div className="p-4 border-b border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
            Manim Code Inspector
          </h3>
        </div>
        <Button
          onClick={toggleCodePanel}
          size="icon"
          variant="ghost"
          className="w-7 h-7 rounded-lg cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          title="Collapse Panel"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4 bg-slate-950 text-slate-100 font-mono text-[11px] leading-relaxed">
        {activeScene?.code ? (
          <pre className="whitespace-pre-wrap selection:bg-slate-800">
            {activeScene.code.split("\n").map((line, lineIdx) => {
              const highlighted = highlightLine(line)
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
