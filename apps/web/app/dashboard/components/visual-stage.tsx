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
  VolumeX,
  Maximize2,
  Code,
  Sparkles,
  RefreshCw,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { gooeyToast } from "@/components/ui/goey-toaster"

export function VisualStage() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  const {
    activeProjectId,
    projects,
    scenePlans,
    isCodePanelOpen,
    toggleCodePanel,
    selectScene,
    approvePlan,
    regenerateScene,
    adjustAudioOnly,
  } = useDashboardStore()

  const activeProject = projects.find((p) => p.id === activeProjectId)
  if (!activeProject) return null

  const scenes = activeProjectId ? scenePlans[activeProjectId] || [] : []
  const activeScene = scenes[activeProject.activeSceneIndex]

  const handleRegenerateEntire = async () => {
    gooeyToast.success("Rebuilding entire video render process...")
    approvePlan(activeProjectId!)
  }

  const handleRegenerateScene = async (sceneId: string) => {
    gooeyToast.success("Regenerating scene compile steps...")
    await regenerateScene(activeProjectId!, sceneId)
    gooeyToast.success("Scene regeneration complete!")
  }

  const handleAdjustAudioOnly = async () => {
    gooeyToast.success("Applying audio track remixes...")
    await adjustAudioOnly(activeProjectId!, "remix")
    gooeyToast.success("Audio track mix successfully updated!")
  }

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
    
    const titleLower = activeScene.title.toLowerCase()
    const descLower = activeScene.description.toLowerCase()
    
    // Neural Simulation reference image layout matching
    if (titleLower.includes("neural") || titleLower.includes("network") || titleLower.includes("node") || titleLower.includes("simulation") || titleLower.includes("luh") || titleLower.includes("j")) {
      return (
        <div className="w-full h-full flex flex-col justify-center items-center relative py-6 select-none bg-slate-950/40">
          {/* Tech HUD labels just like in image */}
          <div className="absolute top-2 left-4 text-[8px] font-mono text-slate-500/70 text-left leading-normal">
            MODEL_04 | LAYER_14<br/>
            LOGS_FUNC: CCE
          </div>
          <div className="absolute top-2 right-4 text-[8px] font-mono text-slate-500/70 text-right leading-normal">
            ACTIVE FLOW | 84.3 TFLOPS<br/>
            EPOCH: 327
          </div>
          
          <div className="relative w-full max-w-md aspect-[1.8] flex items-center justify-center mt-2">
            <svg className="w-full h-full" viewBox="0 0 500 250">
              <defs>
                <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.15" />
                  <stop offset="50%" stopColor="#c084fc" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#f472b6" stopOpacity="0.15" />
                </linearGradient>
                <style>{`
                  @keyframes pulseEdge {
                    0% { stroke-dashoffset: 24; }
                    100% { stroke-dashoffset: 0; }
                  }
                  .pulsing-edge {
                    stroke-dasharray: 4 6;
                    animation: pulseEdge 1.2s linear infinite;
                  }
                `}</style>
              </defs>

              {/* Connections (Edges) */}
              {/* Layer 1 to 2 */}
              {[[50, 45], [50, 95], [50, 145], [50, 195]].map(([x1, y1]) =>
                [[150, 25], [150, 65], [150, 105], [150, 145], [150, 185], [150, 225]].map(([x2, y2], idx) => (
                  <line key={`l12-${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#edgeGrad)" strokeWidth="1" className={idx % 2 === 0 ? "pulsing-edge" : ""} />
                ))
              )}
              {/* Layer 2 to 3 */}
              {[[150, 25], [150, 65], [150, 105], [150, 145], [150, 185], [150, 225]].map(([x1, y1]) =>
                [[270, 25], [270, 65], [270, 105], [270, 145], [270, 185], [270, 225]].map(([x2, y2], idx) => (
                  <line key={`l23-${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#edgeGrad)" strokeWidth="1" className={(idx + 1) % 3 === 0 ? "pulsing-edge" : ""} />
                ))
              )}
              {/* Layer 3 to 4 */}
              {[[270, 25], [270, 65], [270, 105], [270, 145], [270, 185], [270, 225]].map(([x1, y1]) =>
                [[370, 45], [370, 95], [370, 145], [370, 195]].map(([x2, y2], idx) => (
                  <line key={`l34-${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#edgeGrad)" strokeWidth="1" className={idx % 2 !== 0 ? "pulsing-edge" : ""} />
                ))
              )}
              {/* Layer 4 to 5 */}
              {[[370, 45], [370, 95], [370, 145], [370, 195]].map(([x1, y1]) =>
                [[450, 85], [450, 155]].map(([x2, y2]) => (
                  <line key={`l45-${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#edgeGrad)" strokeWidth="1" className="pulsing-edge" />
                ))
              )}

              {/* Nodes */}
              {/* Layer 1 */}
              {[45, 95, 145, 195].map((y, idx) => (
                <circle key={`n1-${idx}`} cx="50" cy={y} r="5" fill="#fff" stroke="#818cf8" strokeWidth="2" />
              ))}
              {/* Layer 2 */}
              {[25, 65, 105, 145, 185, 225].map((y, idx) => (
                <circle key={`n2-${idx}`} cx="150" cy={y} r="5" fill="#fff" stroke="#c084fc" strokeWidth="2" />
              ))}
              {/* Layer 3 */}
              {[25, 65, 105, 145, 185, 225].map((y, idx) => (
                <circle key={`n3-${idx}`} cx="270" cy={y} r="5" fill="#fff" stroke="#f472b6" strokeWidth="2" />
              ))}
              {/* Layer 4 */}
              {[45, 95, 145, 195].map((y, idx) => (
                <circle key={`n4-${idx}`} cx="370" cy={y} r="5" fill="#fff" stroke="#818cf8" strokeWidth="2" />
              ))}
              {/* Layer 5 */}
              {[85, 155].map((y, idx) => (
                <circle key={`n5-${idx}`} cx="450" cy={y} r="5" fill="#fff" stroke="#f472b6" strokeWidth="2" />
              ))}
            </svg>
          </div>

          <div className="absolute bottom-2 left-4 text-[8px] font-mono text-slate-500/70 text-left leading-normal">
            LOSS_FUNC: CCE<br/>
            MODEL_04 | LAYER_14
          </div>
          <div className="absolute bottom-2 right-4 text-[8px] font-mono text-slate-500/70 text-right leading-normal">
            ACTIVE FLOW | 84.3 TFLOPS<br/>
            EPOCH: 327
          </div>
        </div>
      )
    }

    if (titleLower.includes("intro") || titleLower.includes("riemann") || descLower.includes("rectangles")) {
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="text-xl md:text-2xl font-extrabold text-sky-400 font-serif">Riemann Integrals</div>
          <div className="text-xs text-slate-500 font-mono">f(x) = 0.1x² + 1</div>
          <div className="h-28 w-60 border-l border-b border-slate-700/80 relative mx-auto mt-4">
            <div className="absolute bottom-0 left-4 w-6 h-8 bg-emerald-500/40 border border-emerald-400 rounded-t" />
            <div className="absolute bottom-0 left-10 w-6 h-12 bg-emerald-500/40 border border-emerald-400 rounded-t" />
            <div className="absolute bottom-0 left-16 w-6 h-16 bg-emerald-500/40 border border-emerald-400 rounded-t" />
            <div className="absolute bottom-0 left-22 w-6 h-22 bg-emerald-500/40 border border-emerald-400 rounded-t" />
            <div className="absolute bottom-0 left-28 w-6 h-26 bg-emerald-500/40 border border-emerald-400 rounded-t" />
          </div>
        </div>
      )
    }

    if (titleLower.includes("limit") || titleLower.includes("increasing") || titleLower.includes("approximation")) {
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="text-xl md:text-2xl font-extrabold text-amber-400 font-serif">Riemann Limit Approximation</div>
          <div className="text-xs text-slate-500 font-mono">dx → 0</div>
          <div className="h-28 w-60 border-l border-b border-slate-700/80 relative mx-auto mt-4 overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-full flex items-end">
              {Array.from({ length: 30 }).map((_, idx) => (
                <div key={idx} className="flex-1 bg-green-400/40 border-r border-green-500/50" style={{ height: `${20 + Math.sin(idx * 0.1) * 30}%` }} />
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (titleLower.includes("integral") || titleLower.includes("formula") || titleLower.includes("definition") || titleLower.includes("math")) {
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="text-xl md:text-2xl font-extrabold text-emerald-400 font-serif">Formal Integral Definition</div>
          <div className="text-3xl font-bold font-serif text-yellow-300 mt-6 select-all font-mono">
            ∫[a to b] f(x) dx
          </div>
          <p className="text-slate-500 text-xs max-w-sm mx-auto mt-2">
            The total accumulated area under the curve between boundaries a and b.
          </p>
        </div>
      )
    }

    if (titleLower.includes("winding") || titleLower.includes("circle") || titleLower.includes("fourier")) {
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="text-xl md:text-2xl font-extrabold text-sky-400 font-serif">Fourier Winding Map</div>
          <div className="text-xs text-slate-500 font-mono">f(t) winding at 2 Hz</div>
          <div className="relative w-28 h-28 rounded-full border border-slate-700 flex items-center justify-center mx-auto mt-4">
            <div className="absolute w-2 h-2 rounded-full bg-yellow-400" style={{ transform: "rotate(130deg) translate(46px)" }} />
            <div className="absolute w-[1.5px] bg-yellow-400/55 h-11 top-14 left-14 origin-top -rotate-[50deg]" />
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </div>
      )
    }

    if (titleLower.includes("signal") || titleLower.includes("wave")) {
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="text-xl md:text-2xl font-extrabold text-indigo-400 font-serif">Signal Construction</div>
          <div className="text-xs text-slate-500 font-mono">f(t) = sin(2π·3t) + sin(2π·5t)</div>
          <div className="h-24 w-60 border-l border-b border-slate-700/80 relative mx-auto mt-4 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-full h-16 stroke-indigo-400 fill-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 0 50 Q 12 10 25 50 T 50 50 T 75 50 T 100 50" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      )
    }

    if (titleLower.includes("sort") || titleLower.includes("array") || titleLower.includes("divide") || titleLower.includes("merge")) {
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="text-xl md:text-2xl font-extrabold text-red-400 font-serif">Merge Sort Visualization</div>
          <div className="text-xs text-slate-500 font-mono">Splitting array into sub-problems</div>
          <div className="flex gap-2 justify-center mt-6 items-end h-16">
            {[3, 1, 4, 1, 5, 9, 2, 6].map((val, idx) => (
              <div key={idx} className="w-5 bg-red-500/80 rounded-t flex items-end justify-center text-[9px] text-white font-bold" style={{ height: `${val * 6}px` }}>
                {val}
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Default fallback based on scene order to make sure we ALWAYS show a gorgeous visual
    const fallbackIdx = (activeScene.order || 1) % 3
    if (fallbackIdx === 1) {
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="text-xl md:text-2xl font-extrabold text-sky-400 font-serif">{activeScene.title}</div>
          <div className="text-xs text-slate-500 font-mono">Interactive Scene Preview (Scene 1)</div>
          <div className="h-28 w-60 border-l border-b border-slate-700/80 relative mx-auto mt-4 flex items-end justify-around pb-1">
            <div className="w-8 h-16 bg-sky-500/40 border border-sky-400 rounded-t" />
            <div className="w-8 h-24 bg-indigo-500/40 border border-indigo-400 rounded-t" />
            <div className="w-8 h-12 bg-emerald-500/40 border border-emerald-400 rounded-t" />
          </div>
        </div>
      )
    } else if (fallbackIdx === 2) {
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="text-xl md:text-2xl font-extrabold text-amber-400 font-serif">{activeScene.title}</div>
          <div className="text-xs text-slate-500 font-mono">Dynamic Motion Path (Scene 2)</div>
          <div className="relative w-28 h-28 rounded-full border border-slate-700 flex items-center justify-center mx-auto mt-4">
            <div className="absolute w-2 h-2 rounded-full bg-amber-400 animate-pulse" style={{ transform: "rotate(45deg) translate(46px)" }} />
            <div className="absolute w-[1.5px] bg-amber-400/50 h-11 top-14 left-14 origin-top -rotate-[45deg]" />
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </div>
      )
    } else {
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="text-xl md:text-2xl font-extrabold text-emerald-400 font-serif">{activeScene.title}</div>
          <div className="text-xs text-slate-500 font-mono">Final Output & Summary (Scene 3)</div>
          <div className="text-xl font-bold font-serif text-yellow-300 mt-6 select-all font-mono">
            {activeScene.title}
          </div>
          <p className="text-slate-500 text-[10px] max-w-sm mx-auto mt-2 leading-relaxed">
            {activeScene.description}
          </p>
        </div>
      )
    }
  }

  const isProgressState = activeProject.status === "generating" || activeProject.status === "assembling"

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#05070a] p-4 overflow-y-auto min-w-0 select-none">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-4">
        
        {/* Render Stage Top Header with Rendering State pill */}
        <div className="flex justify-between items-center bg-slate-100/60 dark:bg-[#0d0e12]/60 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-900">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-[#112423] text-[#10b981] dark:text-[#34d399] border border-[#1e463a] uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              {activeProject.status === "done" ? "Ready" : activeProject.status}
            </span>
            <span className="text-[10px] font-mono text-slate-550 dark:text-slate-500 bg-slate-200/50 dark:bg-slate-900/60 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-800">
              1920x1080 • 60fps
            </span>
          </div>
          
          <div className="flex gap-2">
            {(activeProject.status === "done" || activeProject.status === "done_with_warnings") && (
              <>
                <Button
                  variant="outline"
                  onClick={handleAdjustAudioOnly}
                  className="h-7 text-[10px] font-semibold border-slate-250 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer bg-slate-50 dark:bg-slate-950/20"
                >
                  Adjust Audio Only
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRegenerateEntire}
                  className="h-7 text-[10px] font-semibold border-slate-250 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer bg-slate-50 dark:bg-slate-950/20"
                >
                  Regenerate Entire Video
                </Button>
              </>
            )}
          </div>
        </div>

        {isProgressState ? (
          <div className="bg-slate-100 dark:bg-[#090b10] border border-slate-200 dark:border-slate-900 rounded-2xl p-6 shadow-sm dark:shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-sky-500 animate-spin" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Parallel Scene Pipeline</h3>
              <Badge className="ml-auto font-mono text-[9px] bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800">
                {activeProject.status}
              </Badge>
            </div>

            <div className="space-y-4">
              {scenes.map((scene, idx) => (
                <div key={scene.id} className="space-y-1 bg-slate-200/10 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-900 rounded-xl p-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-750 dark:text-slate-350 flex items-center gap-2">
                      {getSceneStatusComponent(scene.status)}
                      Scene {idx + 1}: {scene.title}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 capitalize">{scene.status}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
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

            {activeProject.narrationEnabled ? (
              <div className="border-t border-slate-200 dark:border-slate-900 pt-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-650 dark:text-slate-400 flex items-center gap-2">
                    {activeProject.status === "assembling" ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    )}
                    Narration & TTS Pipeline (ElevenLabs)
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {activeProject.status === "assembling" ? "completed" : "generating"}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      activeProject.status === "assembling" ? "w-full bg-emerald-500" : "w-1/2 bg-indigo-500 animate-pulse"
                    }`}
                  />
                </div>
              </div>
            ) : (
              <div className="border-t border-slate-200 dark:border-slate-900 pt-4 space-y-1 text-center">
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-600">
                  AI Narration disabled for this project
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 flex-1 flex flex-col">
            
            {/* Visual Frame */}
            <div className="w-full aspect-video bg-[#05070a] border border-slate-200 dark:border-slate-900 rounded-2xl overflow-hidden relative shadow-md dark:shadow-2xl group flex flex-col items-center justify-center">
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
              
              <div className="flex-1 flex flex-col justify-center items-center relative z-10 w-full text-center text-white">
                {renderActiveSceneVisual()}
              </div>

              {/* Video controller bar styled directly matching Visora mock */}
              <div className="w-full p-3 bg-slate-100 dark:bg-[#090b10] border-t border-slate-200 dark:border-slate-900 flex flex-col gap-2 relative z-20 select-none">
                
                {/* Micro Scrubber */}
                <div className="w-full bg-slate-300 dark:bg-slate-800 h-1 rounded-full cursor-pointer relative overflow-hidden">
                  <div className={`h-full bg-violet-500 ${isVideoPlaying ? "w-1/2" : "w-0"}`} />
                </div>
                
                <div className="flex justify-between items-center">
                  {/* Left Controls */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900 cursor-pointer"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                      className="w-7 h-7 text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900 cursor-pointer"
                    >
                      {isVideoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900 cursor-pointer"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </Button>
                    
                    {/* Time Counter */}
                    <span className="text-[10px] font-mono text-slate-550 dark:text-slate-400 ml-2">
                      {isVideoPlaying ? "00:04.23" : "00:00.00"} / 00:15.00
                    </span>
                  </div>
                  
                  {/* Right Controls */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900 cursor-pointer"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900 cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </Button>
                    <span className="w-[1px] h-3 bg-slate-200 dark:bg-slate-800 mx-1" />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className={`w-7 h-7 hover:bg-slate-200 dark:hover:bg-slate-900 cursor-pointer ${activeProject.narrationEnabled ? "text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white" : "text-slate-400 dark:text-slate-700"}`}
                      title={activeProject.narrationEnabled ? "Audio enabled" : "Audio disabled"}
                      disabled={!activeProject.narrationEnabled}
                    >
                      {activeProject.narrationEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleCodePanel}
                      className={`w-7 h-7 cursor-pointer rounded-lg border ${
                        isCodePanelOpen 
                          ? "bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400" 
                          : "border-slate-250 dark:border-slate-800 text-slate-550 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="w-7 h-7 text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900 cursor-pointer">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Visora timeline-styled track block scrubber tracks */}
            <div className="bg-slate-100 dark:bg-[#090b10] border border-slate-200 dark:border-slate-900 rounded-xl p-3 space-y-2 relative">
              <div className="absolute left-[38%] top-0 bottom-0 w-[1.5px] bg-violet-500 z-10 pointer-events-none opacity-80" />
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider flex justify-between select-none">
                <span>Timeline Scrubber Tracks</span>
                <span className="text-violet-600 dark:text-violet-400">Scrubber Position: 00:04.23</span>
              </div>
              <div className="space-y-1.5 relative">
                {/* Track 1 */}
                <div className="h-6 w-full bg-slate-200 dark:bg-slate-950 rounded flex items-center px-3 relative border border-slate-300 dark:border-slate-900 overflow-hidden">
                  <div className="absolute left-2 top-[3px] bottom-[3px] w-[50%] bg-violet-600/35 border-l-2 border-violet-500 rounded-sm flex items-center px-2 select-none">
                    <span className="text-[8px] font-bold text-violet-750 dark:text-violet-200 truncate">NetworkBuild.Animation</span>
                  </div>
                </div>
                {/* Track 2 */}
                <div className="h-6 w-full bg-slate-200 dark:bg-slate-950 rounded flex items-center px-3 relative border border-slate-300 dark:border-slate-900 overflow-hidden">
                  <div className="absolute left-[32%] top-[3px] bottom-[3px] w-[28%] bg-emerald-600/30 border-l-2 border-emerald-500 rounded-sm flex items-center px-2 select-none">
                    <span className="text-[8px] font-bold text-emerald-750 dark:text-emerald-200 truncate">PulseEdges.Effect</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Scene Tabs selectors */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                Select Scene to Inspect
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {scenes.map((scene, idx) => {
                  const isSelected = activeProject.activeSceneIndex === idx
                  return (
                    <button
                      key={scene.id}
                      onClick={() => selectScene(activeProjectId!, idx)}
                      className={`p-3 text-left border rounded-xl transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected 
                          ? "bg-white dark:bg-[#090b10] border-violet-500 dark:border-violet-500/50 shadow-sm ring-1 ring-violet-500/20 text-slate-950 dark:text-white" 
                          : "bg-slate-100/40 dark:bg-[#090b10]/40 border-slate-200 dark:border-slate-900 text-slate-800 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-800"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[10px] font-mono text-slate-500">Scene {idx + 1}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-500">{scene.duration}s</span>
                          {(activeProject.status === "done" || activeProject.status === "done_with_warnings") && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRegenerateScene(scene.id)
                              }}
                              className="p-0.5 rounded text-slate-500 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-slate-200 dark:hover:bg-slate-900 cursor-pointer transition-colors"
                              title="Regenerate this scene"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs font-bold truncate w-full">
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
