"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, FileCode, ArrowRight, Download, Volume2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoExample {
  id: string
  title: string
  concept: string
  description: string
  manimCommand: string
  codeSnippet: string
}

export function MovaExamples() {
  const [activeId, setActiveId] = useState<string>("pythagoras")
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(40)
  const [time, setTime] = useState(0)
  const lorenzPoints = useRef<{ x: number; y: number }[]>([])

  const examples: VideoExample[] = [
    {
      id: "pythagoras",
      title: "Visual Proof of Pythagoras",
      concept: "Geometry & Area Equivalence",
      description: "Demonstrates that the sum of the areas of the two squares on the legs of a right triangle equals the area of the square on the hypotenuse. Watch the grid units seamlessly slide and realign.",
      manimCommand: "manim -pql pythagoras_proof.py PythagorasProof",
      codeSnippet: `class PythagorasProof(Scene):
    def construct(self):
        # Create a right triangle with side lengths 3, 4, 5
        triangle = Polygon([0,0,0], [4,0,0], [4,3,0])
        sq_a = Square(side_length=3).next_to(triangle, UP, buff=0)
        sq_b = Square(side_length=4).next_to(triangle, LEFT, buff=0)
        sq_c = Square(side_length=5).align_to(triangle)
        
        # Transform square a and b into c...
        self.play(Create(triangle))
        self.play(FadeIn(sq_a), FadeIn(sq_b))
        self.play(Transform(sq_a, sq_c), Transform(sq_b, sq_c))`
    },
    {
      id: "lorenz",
      title: "Lorenz Attractor (Chaos Theory)",
      concept: "Nonlinear Differential Equations",
      description: "Visualizes the famous chaotic butterfly attractor. Computed on the fly using Lorenz equations, demonstrating how tiny changes in initial values yield dramatically different motion paths.",
      manimCommand: "manim -pql lorenz_system.py LorenzSystem",
      codeSnippet: `class LorenzSystem(ThreeDScene):
    def construct(self):
        # Setup 3D coordinate system
        axes = ThreeDAxes()
        self.set_camera_orientation(phi=75 * DEGREES, theta=-45 * DEGREES)
        
        # Define Lorenz differential equations
        def lorenz(pos, dt=0.01, sigma=10, rho=28, beta=8/3):
            x, y, z = pos
            dx = sigma * (y - x) * dt
            dy = (x * (rho - z) - y) * dt
            dz = (x * y - beta * z) * dt
            return np.array([x+dx, y+dy, z+dz])`
    },
    {
      id: "matrix",
      title: "Linear Transformations",
      concept: "Linear Algebra & Shear Matrices",
      description: "Watch a 2D grid deform under a shear matrix. Grid coordinates multiply in real-time, showing how basis vectors i-hat and j-hat span the new transformed mathematical space.",
      manimCommand: "manim -pql linear_transform.py ShearTransform",
      codeSnippet: `class ShearTransform(LinearTransformationScene):
    def __init__(self):
        LinearTransformationScene.__init__(
            self,
            show_coordinates=True,
            leave_ghost_vectors=True
        )
    def construct(self):
        # Define the shear matrix [[1, 2], [0, 1]]
        matrix = [[1, 2], [0, 1]]
        self.apply_matrix(matrix)
        self.wait()`
    }
  ]

  const activeExample = examples.find(ex => ex.id === activeId) || examples[0]

  // Handle ticking progress
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          lorenzPoints.current = [] // clear attractor path
          return 0
        }
        return prev + 0.5
      })
      setTime(prev => (prev + 0.05) % (Math.PI * 8))
    }, 30)

    return () => clearInterval(interval)
  }, [isPlaying, activeId])

  // Reset trajectory on concept change
  useEffect(() => {
    lorenzPoints.current = []
    setProgress(0)
  }, [activeId])

  // Physics simulation for Lorenz Attractor
  const getLorenzPath = () => {
    if (lorenzPoints.current.length === 0) {
      // initialize
      let x = 0.1, y = 0, z = 0
      const sigma = 10, rho = 28, beta = 8/3
      const dt = 0.01
      for (let i = 0; i < 400; i++) {
        const dx = sigma * (y - x) * dt
        const dy = (x * (rho - z) - y) * dt
        const dz = (x * y - beta * z) * dt
        x += dx
        y += dy
        z += dz
        lorenzPoints.current.push({ x: x * 6, y: y * 6 }) // scale for canvas
      }
    } else if (isPlaying) {
      // step forward
      const last = lorenzPoints.current[lorenzPoints.current.length - 1]
      const sigma = 10, rho = 28, beta = 8/3
      const dt = 0.015
      let x = last.x / 6, y = last.y / 6, z = 20 // approximate projection
      const dx = sigma * (y - x) * dt
      const dy = (x * (rho - z) - y) * dt
      const dz = (x * y - beta * z) * dt
      x += dx
      y += dy
      z += dz
      
      lorenzPoints.current.push({ x: x * 6, y: y * 6 })
      if (lorenzPoints.current.length > 500) {
        lorenzPoints.current.shift()
      }
    }
    return lorenzPoints.current
  }

  // Draw the Pythagoras demo morphing based on progress (0 to 100)
  const renderPythagoras = () => {
    const progressFactor = (progress % 100) / 100
    // Right triangle vertices (scaled)
    const p1 = { x: -80, y: -40 }
    const p2 = { x: 40, y: -40 }
    const p3 = { x: 40, y: 50 } // side a = 90, side b = 120, side c = 150

    // Side squares
    // Square A (on side a, right leg: p2 to p3) -> width 90
    // Square B (on side b, bottom leg: p1 to p2) -> width 120
    // Square C (on hypotenuse, p1 to p3) -> width 150

    // Morphing factor representation
    const opacityA = Math.max(0, 1 - progressFactor * 2)
    const opacityC = Math.max(0, (progressFactor - 0.4) * 2)

    return (
      <g>
        {/* Right Triangle */}
        <polygon 
          points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`} 
          fill="rgba(14, 165, 233, 0.1)" 
          stroke="#0ea5e9" 
          strokeWidth="2.5" 
        />
        
        {/* Square A */}
        <rect 
          x={p2.x} 
          y={p1.y} 
          width="90" 
          height="90" 
          fill="rgba(16, 185, 129, 0.15)" 
          stroke="#10b981" 
          strokeWidth="1.5"
          opacity={opacityA}
        />
        
        {/* Square B */}
        <rect 
          x={p1.x} 
          y={p1.y - 120} 
          width="120" 
          height="120" 
          fill="rgba(245, 158, 11, 0.15)" 
          stroke="#f59e0b" 
          strokeWidth="1.5"
          opacity={opacityA}
        />

        {/* Square C (Hypotenuse) */}
        <g transform={`translate(${p1.x}, ${p1.y}) rotate(36.87)`} opacity={progressFactor > 0.4 ? opacityC : 0}>
          <rect 
            x="0" 
            y="-150" 
            width="150" 
            height="150" 
            fill="rgba(244, 63, 94, 0.2)" 
            stroke="#f43f5e" 
            strokeWidth="2" 
          />
          {/* Grid lines inside hyp square to visually prove a^2 + b^2 fits inside */}
          <line x1="60" y1="0" x2="60" y2="-150" stroke="#f43f5e" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="90" y1="0" x2="90" y2="-150" stroke="#f43f5e" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="0" y1="-60" x2="150" y2="-60" stroke="#f43f5e" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="0" y1="-90" x2="150" y2="-90" stroke="#f43f5e" strokeWidth="0.5" strokeDasharray="2 2" />
        </g>

        {/* Dynamic labels */}
        <g transform="scale(1, -1)">
          <text x={p2.x + 35} y={-p1.y - 45} fill="#10b981" className="font-mono text-[10px] font-bold" opacity={opacityA}>a²</text>
          <text x={p1.x + 50} y={-p1.y + 60} fill="#f59e0b" className="font-mono text-[10px] font-bold" opacity={opacityA}>b²</text>
          <text x="20" y="20" fill="#f43f5e" className="font-mono text-[10px] font-bold" opacity={progressFactor > 0.4 ? opacityC : 0}>c² = a² + b²</text>
        </g>
      </g>
    )
  }

  // Draw Lorenz Attractor path
  const renderLorenz = () => {
    const path = getLorenzPath()
    if (path.length < 2) return null
    return (
      <g>
        <path 
          d={`M ${path.map(p => `${p.x} ${p.y}`).join(" L ")}`}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1.5"
          opacity="0.8"
        />
        {/* Head point */}
        <circle cx={path[path.length - 1].x} cy={path[path.length - 1].y} r="3" fill="#fff" />
      </g>
    )
  }

  // Draw shear matrix transformation
  const renderMatrix = () => {
    const progressFactor = (progress % 100) / 100
    const shear = progressFactor * 2 // shear goes from 0 to 2
    
    // Draw transformed grid lines
    const gridLines = []
    const range = [-4, -3, -2, -1, 0, 1, 2, 3, 4]
    
    // Grid scale
    const s = 40

    return (
      <g>
        {/* Horizontal Lines (sheared: y coordinate stays same, x changes by shear * y) */}
        {range.map(y => (
          <line 
            key={`h-${y}`}
            x1={-180 + shear * y * s} 
            y1={y * s} 
            x2={180 + shear * y * s} 
            y2={y * s} 
            stroke={y === 0 ? "#64748b" : "rgba(148, 163, 184, 0.15)"} 
            strokeWidth={y === 0 ? "1.5" : "0.5"} 
          />
        ))}

        {/* Vertical Lines (sheared: x increases linearly with y) */}
        {range.map(x => (
          <line 
            key={`v-${x}`}
            x1={x * s - shear * 4 * s} 
            y1={-160} 
            x2={x * s + shear * 4 * s} 
            y2={160} 
            stroke={x === 0 ? "#64748b" : "rgba(148, 163, 184, 0.15)"} 
            strokeWidth={x === 0 ? "1.5" : "0.5"} 
          />
        ))}

        {/* Transformed basis vectors */}
        {/* i-hat (1, 0) sheared to (1, 0) */}
        <line x1="0" y1="0" x2={1 * s} y2="0" stroke="#38bdf8" strokeWidth="3" />
        {/* j-hat (0, 1) sheared to (shear, 1) */}
        <line x1="0" y1="0" x2={shear * s} y2={1 * s} stroke="#f43f5e" strokeWidth="3" />
        
        <circle cx="0" cy="0" r="3" fill="#fff" />
      </g>
    )
  }

  return (
    <section className="relative bg-[#05070a] py-24 border-b border-slate-900 overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 max-w-6xl mx-auto gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/20 bg-sky-950/20 text-sky-400 text-xs font-mono mb-4">
              <FileCode className="w-3.5 h-3.5" />
              LIVE COMPILATION PREVIEWS
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Interactive Concept Gallery
            </h2>
            <p className="text-slate-400 font-sans">
              Choose a concept to compile and watch Mova&apos;s rendering engine execute 
              the Python instructions in real-time.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {examples.map(ex => (
              <button
                key={ex.id}
                onClick={() => {
                  setActiveId(ex.id)
                  setIsPlaying(true)
                }}
                className={`px-4 py-2 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
                  activeId === ex.id 
                    ? "bg-slate-900 border-sky-500/40 text-sky-400" 
                    : "bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800"
                }`}
              >
                {ex.title}
              </button>
            ))}
          </div>
        </div>

        {/* Split Screen Video Player / Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
          
          {/* Left Side: Mock Video Player */}
          <div className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-900 bg-[#07090d] overflow-hidden shadow-2xl">
            
            {/* Player Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950/50 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-xs font-mono text-slate-400">{activeExample.title}</span>
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                render_output.mp4
              </div>
            </div>

            {/* Canvas Area */}
            <div className="relative flex-1 min-h-[360px] bg-[#0b0e14] flex items-center justify-center overflow-hidden">
              <svg 
                className="w-full h-full min-h-[320px]" 
                viewBox="-240 -160 480 320"
                style={{ transform: "scaleY(-1)" }}
              >
                {activeId === "pythagoras" && renderPythagoras()}
                {activeId === "lorenz" && renderLorenz()}
                {activeId === "matrix" && renderMatrix()}
              </svg>

              {/* Formula Overlay watermark */}
              <div className="absolute bottom-4 left-4 bg-slate-950/80 border border-slate-900 px-2 py-1.5 rounded text-[10px] font-mono text-sky-400 flex items-center gap-1.5">
                <Info className="w-3 h-3" />
                {activeExample.concept}
              </div>
            </div>

            {/* Player Controls */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-900 space-y-3">
              {/* Scrub Bar */}
              <div className="relative w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-sky-500 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <span className="text-xs font-mono text-slate-500">
                    0:0{Math.floor(progress / 20)} / 0:05
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-950">
                    Manim v0.18
                  </span>
                  <button className="p-1.5 text-slate-400 hover:text-white cursor-pointer">
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Agent Details / Code */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            
            {/* Description Card */}
            <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 space-y-4">
              <h3 className="text-xl font-bold text-white">{activeExample.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-sans">
                {activeExample.description}
              </p>
              
              {/* Manim run command output mockup */}
              <div className="bg-[#090d14] border border-slate-900 rounded-lg p-3 font-mono text-xs text-slate-400">
                <span className="text-slate-600">$</span> {activeExample.manimCommand}
                <div className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Output: Video file rendered successfully in 2.4s
                </div>
              </div>
            </div>

            {/* Python code output tab */}
            <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider">Compiled Python code</h4>
                <div className="bg-[#07090e] border border-slate-900 rounded-lg p-4 font-mono text-[11px] leading-relaxed text-slate-300 max-h-[180px] overflow-y-auto">
                  <pre><code>{activeExample.codeSnippet}</code></pre>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-900/60">
                <Button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 text-xs font-mono flex items-center justify-center gap-2 cursor-pointer">
                  <Download className="w-4 h-4" />
                  Source Code
                </Button>
                <Button className="flex-1 bg-sky-500 hover:bg-sky-600 text-slate-950 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer">
                  Edit Concept
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
