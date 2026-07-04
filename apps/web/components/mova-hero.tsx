"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Sliders, Code2, Sparkles, ArrowRight } from "lucide-react"

export function MovaHero() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [harmonics, setHarmonics] = useState(3)
  const [speed, setSpeed] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [showVectors, setShowVectors] = useState(true)
  const [promptText, setPromptText] = useState("Draw a Fourier series approximation of a square wave with rotating vectors and project the wave.")
  const [activeTab, setActiveTab] = useState<"visualizer" | "code">("visualizer")

  // Animation states
  const [time, setTime] = useState(0)
  const animationRef = useRef<number | null>(null)

  // Physics loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      return
    }

    const update = () => {
      setTime((prev) => (prev + 0.02 * speed) % (Math.PI * 2))
      animationRef.current = requestAnimationFrame(update)
    }
    animationRef.current = requestAnimationFrame(update)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying, speed])

  // Generate wave trace points directly during render (derived state)
  const wavePoints: { x: number; y: number }[] = []
  const step = 0.05
  // We sample the past time steps to draw the projected wave
  for (let t = 0; t < Math.PI * 3; t += step) {
    let y = 0
    for (let i = 1; i <= harmonics; i++) {
      const n = 2 * i - 1 // odd harmonics
      y += (4 / Math.PI) * (Math.sin(n * (time - t)) / n)
    }
    // scale and shift: center of projection is x=170, y=0.
    // x grows as t goes back (moving to the right)
    wavePoints.push({
      x: 170 + t * 30, // modified spacing to fit layout nicely
      y: y * 60, // scale factor
    })
  }

  const handleReset = () => {
    setTime(0)
  }

  // Calculate epicycle circle data for the current time
  const getEpicycles = () => {
    const list: { cx: number; cy: number; r: number; ex: number; ey: number }[] = []
    let currentX = -120 // start X coordinate offset
    let currentY = 0 // start Y coordinate offset

    for (let i = 1; i <= harmonics; i++) {
      const n = 2 * i - 1
      const r = (4 / Math.PI) * (1 / n) * 60 // radius scaled
      const angle = n * time
      const nextX = currentX + r * Math.cos(angle)
      const nextY = currentY - r * Math.sin(angle) // SVG coordinates are inverted y

      list.push({
        cx: currentX,
        cy: currentY,
        r: r,
        ex: nextX,
        ey: nextY,
      })

      currentX = nextX
      currentY = nextY
    }
    return list
  }

  const epicycles = getEpicycles()
  const finalPointer = epicycles.length > 0 ? epicycles[epicycles.length - 1] : { ex: -120, ey: 0 }

  // Generate python manim code based on state
  const getManimCode = () => {
    return `from manim import *

class FourierSquareWave(Scene):
    def construct(self):
        # Configure coordinate axes
        axes = Axes(
            x_range=[-3, 5, 1], y_range=[-2, 2, 0.5],
            x_length=8, y_length=5
        ).add_coordinates()
        
        # Define harmonics: ${harmonics} (Odd only)
        harmonics = [${Array.from({ length: harmonics }, (_, i) => 2 * i - 1).join(", ")}]
        
        # Construct rotating epicycles
        circles = VGroup()
        vectors = VGroup()
        
        # Set parameters: speed_factor = ${speed.toFixed(1)}
        time = ValueTracker(0)
        
        # Render mathematical animation...
        self.play(Create(axes), Create(circles))
        self.play(time.animate.set_value(TAU), run_time=6, rate_func=linear)
`
  }

  return (
    <section className="relative overflow-hidden border-b border-slate-900 bg-[#07090e] pt-20 pb-24 md:pt-28 md:pb-32">
      {/* Precision Grid Background */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/20 bg-sky-950/20 text-sky-400 text-xs font-mono mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            ENGINE-LEVEL PRECISION
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 font-sans">
            Mathematical explainer videos, <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-emerald-400 to-yellow-400">
              generated from a single prompt.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-slate-400 max-w-2xl mb-8 leading-relaxed font-sans">
            Mova orchestrates specialized AI agents to plan, code, self-correct, and render 
            mathematically rigorous explainer videos in Python Manim. No keyframes. No pixel slop. Just pure geometry and code.
          </p>

          {/* Quick Prompt Bar */}
          <div className="w-full max-w-2xl bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col sm:flex-row gap-2 shadow-2xl backdrop-blur-md">
            <div className="flex-1 flex items-center gap-3 px-3">
              <Sparkles className="w-5 h-5 text-sky-400 shrink-0" />
              <input 
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
                placeholder="Describe a scientific or math concept..."
              />
            </div>
            <Button className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-semibold px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)]">
              Generate Explainer
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-6 mt-4 text-xs font-mono text-slate-500">
            <span>Try: &quot;Explain chaos theory&quot;</span>
            <span>&bull;</span>
            <span>&quot;Visualize eigenvalues&quot;</span>
          </div>
        </div>

        {/* The Manim Simulator Split Screen */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto bg-slate-950/60 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
          
          {/* Left panel: Code Editor / Controls */}
          <div className="lg:col-span-5 flex flex-col border-r border-slate-900 bg-[#090d14]/80">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-900 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="ml-2 text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-sky-400" />
                  scene_renderer.py
                </span>
              </div>
              <div className="flex bg-slate-900/50 p-0.5 rounded-lg border border-slate-800">
                <button 
                  onClick={() => setActiveTab("visualizer")}
                  className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer ${activeTab === "visualizer" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Controls
                </button>
                <button 
                  onClick={() => setActiveTab("code")}
                  className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer ${activeTab === "code" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Code
                </button>
              </div>
            </div>

            {/* Panel Body */}
            {activeTab === "visualizer" ? (
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">Live Simulation Inputs</h3>
                    <p className="text-sm text-slate-400 mb-4 font-sans">
                      Modify mathematical parameters and watch the vector projections adjust in real-time. This is the exact canvas Mova builds behind the scenes.
                    </p>
                  </div>

                  {/* Slider: Harmonics */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Fourier Harmonics (Complexity)</span>
                      <span className="text-amber-400 font-bold">{harmonics} terms</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="8" 
                      value={harmonics}
                      onChange={(e) => setHarmonics(parseInt(e.target.value))}
                      className="w-full accent-amber-400 bg-slate-900 h-1.5 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                      <span>Simple (1 circle)</span>
                      <span>Complex (8 circles)</span>
                    </div>
                  </div>

                  {/* Slider: Speed */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Time Execution Speed</span>
                      <span className="text-emerald-400 font-bold">{speed.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.2" 
                      max="2" 
                      step="0.1"
                      value={speed}
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="w-full accent-emerald-400 bg-slate-900 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={showGrid}
                        onChange={(e) => setShowGrid(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-900 text-sky-500 focus:ring-0 w-4 h-4"
                      />
                      <span className="text-xs font-mono text-slate-400">Axes & Grid</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={showVectors}
                        onChange={(e) => setShowVectors(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-900 text-sky-500 focus:ring-0 w-4 h-4"
                      />
                      <span className="text-xs font-mono text-slate-400">Vector Arrows</span>
                    </label>
                  </div>
                </div>

                {/* Bottom player controls */}
                <div className="flex items-center justify-between border-t border-slate-900/80 pt-6 mt-8">
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4 mr-1.5" /> : <Play className="w-4 h-4 mr-1.5" />}
                      {isPlaying ? "Pause" : "Play"}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={handleReset}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 mr-1.5" />
                      Reset
                    </Button>
                  </div>
                  <div className="text-[10px] font-mono text-slate-600">
                    t = {time.toFixed(2)} rad
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 flex-1 flex flex-col justify-between font-mono text-xs leading-relaxed text-slate-300 overflow-y-auto max-h-[380px] bg-slate-950/40">
                <pre className="text-emerald-400/90 selection:bg-emerald-950 overflow-x-auto">
                  <code>{getManimCode()}</code>
                </pre>
                <div className="border-t border-slate-900/60 pt-4 mt-4 text-[10px] text-slate-500">
                  * Generated by Mova&apos;s Manim Agent dynamically depending on prompts.
                </div>
              </div>
            )}
          </div>

          {/* Right panel: Live Manim Math Canvas */}
          <div className="lg:col-span-7 flex flex-col bg-[#0b0e14]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-900 bg-slate-950/20">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Manim Render Canvas
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-500">60 FPS</span>
              </div>
            </div>

            {/* SVG Render Workspace */}
            <div className="relative flex-1 min-h-[350px] flex items-center justify-center overflow-hidden p-6">
              
              {/* Custom mathematical background axes */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none opacity-30">
                  {/* Central Axes */}
                  <div className="absolute left-[35%] top-0 bottom-0 w-[1px] bg-slate-800" />
                  <div className="absolute top-[50%] left-0 right-0 h-[1px] bg-slate-800" />
                  
                  {/* Origin Indicator */}
                  <span className="absolute left-[36%] top-[51%] text-[9px] font-mono text-slate-600">(0,0)</span>
                  
                  {/* Small axis ticks */}
                  {Array.from({ length: 9 }).map((_, idx) => (
                    <div 
                      key={`xtick-${idx}`}
                      className="absolute w-[1px] h-2 bg-slate-800"
                      style={{ left: `${10 + idx * 10}%`, top: "calc(50% - 4px)" }}
                    />
                  ))}
                  {Array.from({ length: 9 }).map((_, idx) => (
                    <div 
                      key={`ytick-${idx}`}
                      className="absolute h-[1px] w-2 bg-slate-800"
                      style={{ top: `${10 + idx * 10}%`, left: "calc(35% - 4px)" }}
                    />
                  ))}
                </div>
              )}

              {/* Precise Vector SVG Drawing */}
              <svg 
                suppressHydrationWarning
                className="w-full h-full min-h-[300px]" 
                viewBox="-280 -180 560 360"
                style={{ transform: "scaleY(-1)" }} // Flip Y so positive math coordinates are up
              >
                {/* Epicycles */}
                {showVectors && epicycles.map((circle, index) => (
                  <g key={`epi-${index}`}>
                    {/* Circle perimeter */}
                    <circle 
                      cx={circle.cx} 
                      cy={circle.cy} 
                      r={circle.r} 
                      fill="none" 
                      stroke={index === 0 ? "#1e293b" : "rgba(148, 163, 184, 0.15)"} 
                      strokeWidth={index === 0 ? "1.5" : "1"} 
                    />
                    {/* Rotating Vector Arrow */}
                    <line 
                      x1={circle.cx} 
                      y1={circle.cy} 
                      x2={circle.ex} 
                      y2={circle.ey} 
                      stroke={index === 0 ? "#38bdf8" : "#fbbf24"} 
                      strokeWidth="2" 
                    />
                    <circle cx={circle.ex} cy={circle.ey} r="2" fill="#fff" />
                  </g>
                ))}

                {/* Projection connection line */}
                {showVectors && (
                  <line 
                    x1={finalPointer.ex} 
                    y1={finalPointer.ey} 
                    x2={170} 
                    y2={finalPointer.ey} 
                    stroke="rgba(244, 63, 94, 0.4)" 
                    strokeWidth="1.5" 
                    strokeDasharray="4 3" 
                  />
                )}

                {/* Plotted Wave Curve */}
                {wavePoints.length > 1 && (
                  <path 
                    suppressHydrationWarning
                    d={`M ${wavePoints.map(p => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L ")}`}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />
                )}

                {/* Projected drawing point */}
                <circle cx={170} cy={finalPointer.ey} r="4" fill="#f43f5e" />

                {/* Math Labels (Flipped back to positive Y for text readability) */}
                <g transform="scale(1, -1)">
                  {/* Origin */}
                  {showGrid && (
                    <text x="-260" y="-140" fill="#64748b" className="font-mono text-[9px]">
                      f(t) = &Sigma; (4/&pi;n) sin(n&omega;t)
                    </text>
                  )}
                  <text x="170" y={-finalPointer.ey - 10} fill="#f43f5e" className="font-mono text-[10px] font-bold">
                    P(x,y)
                  </text>
                </g>
              </svg>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-900 bg-slate-950/40 text-xs font-mono text-slate-500">
              <span>Formula: Fourier Square Approximation</span>
              <span className="text-emerald-400">Manim Code Compiled Successfully</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
