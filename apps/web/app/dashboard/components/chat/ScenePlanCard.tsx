"use client"

import React from "react"
import { useDashboardStore } from "@/hooks/use-dashboard-store"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, Trash2, Check } from "lucide-react"
import { gooeyToast } from "@/components/ui/goey-toaster"

interface ScenePlanCardProps {
  projectId: string
}

export function ScenePlanCard({ projectId }: ScenePlanCardProps) {
  const {
    projects,
    scenePlans,
    updateScene,
    reorderScenes,
    deleteScene,
    approveScenePlan,
    toggleNarration,
  } = useDashboardStore()

  const project = projects.find((p) => p.id === projectId)
  const scenes = scenePlans[projectId] || []

  if (!project) return null

  const handleApprove = () => {
    approveScenePlan(projectId)
    gooeyToast.success("Plan approved — generation started")
  }

  // If project status is already generating or done, we don't allow edits here (or show it in read-only form if in chat history)
  const isEditable = project.status === "plan_review" || project.status === "eliciting" || project.status === "draft"

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-xl p-4 my-2 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-900">
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
            Proposed Scene Plan
          </h4>
          <p className="text-[10px] text-slate-400">
            {isEditable ? "Review and refine the segments below" : "Approved Scene Outline"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {scenes.map((scene, idx) => (
          <div
            key={scene.id}
            className="bg-white dark:bg-slate-950 border border-slate-105 dark:border-slate-900/80 rounded-lg p-3 flex gap-3 items-start hover:border-sky-500/20 transition-all shadow-sm"
          >
            {isEditable && (
              <div className="flex flex-col gap-0.5 items-center justify-center pt-0.5">
                <span className="text-[9px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-900 w-5 h-5 flex items-center justify-center rounded-full border border-slate-200/50 dark:border-slate-900">
                  {idx + 1}
                </span>
                <div className="flex flex-col gap-0.5 mt-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={idx === 0}
                    onClick={() => reorderScenes(projectId, idx, idx - 1)}
                    className="w-4 h-4 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={idx === (scenes.length - 1)}
                    onClick={() => reorderScenes(projectId, idx, idx + 1)}
                    className="w-4 h-4 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex gap-2 items-center justify-between">
                {isEditable ? (
                  <input
                    type="text"
                    value={scene.title}
                    onChange={(e) => updateScene(projectId, scene.id, { title: e.target.value })}
                    className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-b border-sky-500/40 w-full"
                  />
                ) : (
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-250 truncate">
                    {!isEditable && `${idx + 1}. `}{scene.title}
                  </span>
                )}
                <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-900 rounded px-1.5 py-0.5 text-[9px] font-mono text-slate-450 shrink-0">
                  {isEditable ? (
                    <input
                      type="number"
                      value={scene.duration}
                      onChange={(e) => updateScene(projectId, scene.id, { duration: parseInt(e.target.value) || 0 })}
                      className="w-5 bg-transparent text-right focus:outline-none"
                    />
                  ) : (
                    <span>{scene.duration}</span>
                  )}
                  <span>s</span>
                </div>
              </div>

              {isEditable ? (
                <textarea
                  value={scene.description}
                  onChange={(e) => updateScene(projectId, scene.id, { description: e.target.value })}
                  rows={2}
                  className="bg-transparent text-slate-500 dark:text-slate-400 text-[10px] w-full resize-none focus:outline-none focus:border-b border-sky-500/10 leading-relaxed"
                />
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-relaxed break-words">
                  {scene.description}
                </p>
              )}
            </div>

            {isEditable && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => deleteScene(projectId, scene.id)}
                className="w-6 h-6 text-rose-500 hover:bg-rose-950/20 hover:text-rose-400 rounded cursor-pointer shrink-0 align-self-start"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {isEditable && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-900/60">
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={project.narrationEnabled}
              onChange={() => toggleNarration(projectId)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-sky-500"></div>
            <span className="ms-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium">AI Narration</span>
          </label>

          <Button
            onClick={handleApprove}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-[10px] flex items-center justify-center gap-1 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Approve & Start
          </Button>
        </div>
      )}
    </div>
  )
}
