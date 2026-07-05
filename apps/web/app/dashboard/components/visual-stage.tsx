"use client"

import React, { useState } from "react"
import { useDashboardStore, Scene } from "@/hooks/use-dashboard-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Pause,
  Loader2,
  CheckCircle,
  Volume2,
  Maximize2,
  Code,
  Sparkles,
} from "lucide-react"

export function VisualStage() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  const {
    activeProjectId,
    projects,
    isCodePanelOpen,
    toggleCodePanel,
    selectScene,
    approvePlan,
  } = useDashboardStore()

  const activeProject = projects.find((p) => p.id === activeProjectId)
  if (!activeProject) return null

  const activeScene = activeProject.scenes?.[activeProject.activeSceneIndex]

  const getSceneStatusComponent = (status: Scene["status"]) => {
    switch (status) {
      case "done":
        return <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
      case "rendering":
        return <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
      case "generating":
        return <Loader2 className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
      case "retrieving":
        return <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
      default:
        return <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
    }
  }

  const renderActiveSceneVisual = () => {
    if (!activeScene) return null
    
    switch (activeScene.id) {
      case "s1":
        return (
          <div className="space-y-4">
            <div className="text-xl md:text-2xl font-extrabold text-sky-400 font-serif">Riemann Integrals</div>
            <div className="text-xs text-slate-500 font-mono">f(x) = 0.1x² + 1</div>
            <div className="h-28 w-60 border-l border-b border-slate-700 relative mx-auto mt-4">
              <div className="absolute bottom-0 left-4 w-6 h-8 bg-emerald-500/40 border border-emerald-400" />
              <div className="absolute bottom-0 left-10 w-6 h-12 bg-emerald-500/40 border border-emerald-400" />
              <div className="absolute bottom-0 left-16 w-6 h-16 bg-emerald-500/40 border border-emerald-400" />
              <div className="absolute bottom-0 left-22 w-6 h-22 bg-emerald-500/40 border border-emerald-400" />
              <div className="absolute bottom-0 left-28 w-6 h-26 bg-emerald-500/40 border border-emerald-400" />
            </div>
          </div>
        )
      case "s2":
        return (
          <div className="space-y-4">
            <div className="text-xl md:text-2xl font-extrabold text-amber-400 font-serif">Riemann Limit Approximation</div>
            <div className="text-xs text-slate-500 font-mono">dx → 0</div>
            <div className="h-28 w-60 border-l border-b border-slate-700 relative mx-auto mt-4 overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-full flex items-end">
                {Array.from({ length: 30 }).map((_, idx) => (
                  <div key={idx} className="flex-1 bg-green-400/40 border-r border-green-500/50" style={{ height: `${20 + Math.sin(idx * 0.1) * 30}%` }} />
                ))}
              </div>
            </div>
          </div>
        )
      case "s3":
        return (
          <div className="space-y-4">
            <div className="text-xl md:text-2xl font-extrabold text-emerald-400 font-serif">Formal Integral definition</div>
            <div className="text-3xl font-bold font-serif text-yellow-300 mt-6">
              {"\\int_a^b f(x) dx"}
            </div>
            <p className="text-slate-500 text-xs max-w-sm mx-auto mt-2">
              The total accumulated area under the curve between boundaries a and b.
            </p>
          </div>
        )
      case "s5":
        return (
          <div className="space-y-4">
            <div className="text-xl md:text-2xl font-extrabold text-sky-400 font-serif">Fourier Winding Map</div>
            <div className="text-xs text-slate-500 font-mono">f(t) winding at 2 Hz</div>
            <div className="relative w-32 h-32 rounded-full border border-slate-750 flex items-center justify-center mx-auto mt-4">
              <div className="absolute w-2 h-2 rounded-full bg-yellow-400" style={{ transform: "rotate(130deg) translate(50px)" }} />
              <div className="absolute w-1 bg-yellow-400/55 h-12 top-16 left-16 origin-top -rotate-[50deg]" />
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>
        )
      default:
        return (
          <div className="space-y-2">
            <Sparkles className="w-8 h-8 text-sky-500 animate-pulse mx-auto" />
            <p className="text-slate-500 text-xs">No preview available for this scene format.</p>
          </div>
        )
    }
  }

  const isProgressState = activeProject.status === "generating" || activeProject.status === "assembling"

  return (
    <div className="flex-1 flex flex-col bg-slate-50/20 dark:bg-[#05070a]/20 p-6 overflow-y-auto min-w-0">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Workspace Stage</h2>
            <span className="text-xs text-slate-500">
              {activeProject.status === "generating" && "Generating asset directories and components..."}
              {activeProject.status === "assembling" && "Mixing audio tracks and rendering final merge..."}
              {activeProject.status === "done" && "Render complete. Preview final animation video."}
            </span>
          </div>
          <div className="flex gap-2">
            {activeProject.status === "done" && (
              <Button
                variant="outline"
                onClick={() => approvePlan(activeProjectId!)}
                className="text-xs border-slate-750 text-slate-350 hover:text-white"
              >
                Regenerate Entire Video
              </Button>
            )}
          </div>
        </div>

        {isProgressState ? (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-sky-500 animate-spin" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Parallel Scene Pipeline</h3>
              <Badge className="ml-auto font-mono text-[9px] bg-slate-800 text-slate-400">
                {activeProject.status}
              </Badge>
            </div>

            <div className="space-y-4">
              {activeProject.scenes?.map((scene, idx) => (
                <div key={scene.id} className="space-y-1 bg-slate-950/20 border border-slate-900/60 rounded-xl p-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-350 flex items-center gap-2">
                      {getSceneStatusComponent(scene.status)}
                      Scene {idx + 1}: {scene.title}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 capitalize">{scene.status}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        scene.status === "done" ? "w-full bg-emerald-500" :
                        scene.status === "rendering" ? "w-3/4 bg-amber-500 animate-pulse" :
                        scene.status === "generating" ? "w-1/2 bg-sky-500 animate-pulse" :
                        scene.status === "retrieving" ? "w-1/4 bg-indigo-500 animate-pulse" :
                        "w-0"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-900 pt-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 flex items-center gap-2">
                  {activeProject.status === "assembling" ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  )}
                  Narration & TTS Pipeline (ElevenLabs)
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {activeProject.status === "assembling" ? "completed" : "generating"}
                </span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    activeProject.status === "assembling" ? "w-full bg-emerald-500" : "w-1/2 bg-indigo-500 animate-pulse"
                  }`}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="w-full aspect-video bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden relative shadow-2xl group flex flex-col items-center justify-center">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none" />
              
              <div className="flex-1 flex flex-col justify-center items-center relative z-10 w-full p-8 text-center select-none text-white">
                {renderActiveSceneVisual()}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950/90 to-transparent flex flex-col gap-2 relative z-20">
                <div className="w-full bg-slate-800 h-1 rounded-full cursor-pointer relative overflow-hidden">
                  <div className={`h-full bg-sky-500 ${isVideoPlaying ? "w-1/2" : "w-0"}`} />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                      className="w-8 h-8 text-white hover:bg-slate-900 cursor-pointer"
                    >
                      {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="w-8 h-8 text-white hover:bg-slate-900 cursor-pointer">
                      <Volume2 className="w-4 h-4" />
                    </Button>
                    <span className="text-[10px] font-mono text-slate-400">
                      {isVideoPlaying ? "0:05" : "0:00"} / 0:19
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleCodePanel}
                      className={`w-8 h-8 cursor-pointer rounded-lg border ${
                        isCodePanelOpen 
                          ? "bg-sky-500/10 border-sky-500/20 text-sky-400" 
                          : "border-slate-800 text-slate-450 hover:text-white"
                      }`}
                    >
                      <Code className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="w-8 h-8 text-white hover:bg-slate-900 cursor-pointer">
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                Select Scene to Inspect
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {activeProject.scenes?.map((scene, idx) => {
                  const isSelected = activeProject.activeSceneIndex === idx
                  return (
                    <button
                      key={scene.id}
                      onClick={() => selectScene(activeProjectId!, idx)}
                      className={`p-3 text-left border rounded-xl transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected 
                          ? "bg-white dark:bg-card border-sky-500/50 shadow-md ring-1 ring-sky-500/20" 
                          : "bg-white/40 dark:bg-card/40 border-border hover:border-slate-350 dark:hover:border-slate-850"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-slate-500">Scene {idx + 1}</span>
                        <span className="text-[10px] font-mono text-slate-500">{scene.duration}s</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate w-full">
                        {scene.title}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
