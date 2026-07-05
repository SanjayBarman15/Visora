"use client"

import React from "react"
import { useDashboardStore } from "@/hooks/use-dashboard-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft, MoreHorizontal, LayoutGrid } from "lucide-react"

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
      return `<span class="text-emerald-450">${escapeHtml(part)}</span>`
    }

    // Otherwise escape and highlight keywords/classes
    let escaped = escapeHtml(part)
    escaped = escaped.replace(/\b(def|class|import|from|self|lambda|for|in|return|enumerate|range|construct)\b/g, '<span class="text-pink-400 font-semibold">$1</span>')
    escaped = escaped.replace(/\b(Axes|Circle|Dot|Arrow|MathTex|Create|Write|Rotate|Transform|TransformMatchingShapes|Rectangle|VGroup|ORIGIN|BLUE|YELLOW|GREEN|RED|UP|LEFT|RIGHT|Scene|BLUE_C|YELLOW_D|GREEN_D|GREEN_B|FadeIn)\b/g, '<span class="text-sky-400 font-mono">$1</span>')
    
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
    selectScene,
  } = useDashboardStore()

  const activeProject = projects.find((p) => p.id === activeProjectId)
  if (!activeProject) return null

  const scenes = activeProjectId ? scenePlans[activeProjectId] || [] : []
  const activeScene = scenes[activeProject.activeSceneIndex]

  if (codePanelCollapsed) {
    return (
      <div className="w-12 border-l border-slate-200 dark:border-slate-900 bg-slate-100 dark:bg-[#090b10] flex flex-col items-center py-4 shrink-0 transition-all duration-300 select-none">
        <Button
          onClick={toggleCodePanel}
          size="icon"
          variant="ghost"
          className="w-8 h-8 rounded-lg cursor-pointer text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-white"
          title="Open Source Files"
        >
          <ChevronLeft className="w-4.5 h-4.5" />
        </Button>
        <div className="mt-8 flex flex-col items-center gap-1 select-none pointer-events-none">
          <span className="text-[9px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-widest font-mono [writing-mode:vertical-lr] mt-2">
            SOURCE FILES
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[360px] border-l border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-[#090b10] flex flex-col shrink-0 transition-all duration-300 text-slate-800 dark:text-slate-200">
      
      {/* Code Inspector Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-900 flex justify-between items-center shrink-0 select-none">
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleCodePanel}
            size="icon"
            variant="ghost"
            className="w-6 h-6 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-900 dark:hover:text-white"
            title="Collapse Panel"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
            Source Files
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-6 h-6 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <LayoutGrid className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-6 h-6 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Tabs list matching reference design */}
      <div className="flex bg-slate-100 dark:bg-[#07090d] border-b border-slate-200 dark:border-slate-900 overflow-x-auto select-none shrink-0 scrollbar-none">
        {scenes.map((scene, idx) => {
          const isSelected = activeProject.activeSceneIndex === idx
          return (
            <button
              key={scene.id}
              onClick={() => selectScene(activeProjectId!, idx)}
              className={`px-3 py-2 text-[10px] font-mono border-r border-slate-200 dark:border-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isSelected 
                  ? "bg-slate-50 dark:bg-[#090b10] text-violet-600 dark:text-violet-400 font-bold border-t-2 border-t-violet-500" 
                  : "text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-200/20 dark:bg-slate-950/20"
              }`}
            >
              <span className="opacity-60 font-semibold">&lt;&gt;</span>
              <span>Scene{idx + 1}.py</span>
            </button>
          )
        })}
        {/* Constant tab mockup config */}
        <div className="px-3 py-2 text-[10px] font-mono border-r border-slate-200 dark:border-slate-900 text-slate-400 dark:text-slate-550 bg-slate-200/20 dark:bg-slate-950/20 select-none flex items-center gap-1.5 opacity-60">
          <span>&lt;&gt;</span>
          <span>Config.py</span>
        </div>
      </div>

      {/* Main editor window */}
      <ScrollArea className="flex-1 p-4 bg-[#07090c] text-slate-350 font-mono text-[11px] leading-relaxed">
        {activeScene?.code ? (
          <pre className="whitespace-pre-wrap selection:bg-violet-950 selection:text-white">
            {activeScene.code.split("\n").map((line, lineIdx) => {
              const highlighted = highlightLine(line)
              return (
                <div key={lineIdx} className="flex gap-4">
                  <span className="text-slate-650 w-6 text-right select-none">{lineIdx + 1}</span>
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
