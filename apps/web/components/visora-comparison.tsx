"use client"

import { Check, X, Code2, AlertTriangle, RefreshCw, Cpu } from "lucide-react"

export function VisoraComparison() {
  return (
    <section className="relative bg-[#07090e] py-24 border-b border-slate-900 overflow-hidden">
      {/* Precision background */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-500/20 bg-yellow-950/20 text-yellow-400 text-xs font-mono mb-4">
            <Cpu className="w-3.5 h-3.5" />
            ENGINE ARCHITECTURE
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
            Not Another Pixel Generator
          </h2>
          <p className="text-slate-400 leading-relaxed font-sans">
            Most &quot;AI Video&quot; tools output diffusion-based pixel frames. Visora writes and executes 
            precise Python code. Here is why that changes everything.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mova Side */}
          <div className="relative rounded-2xl border border-emerald-500/25 bg-slate-950/40 p-8 shadow-xl backdrop-blur-sm">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-3 py-1 rounded-full uppercase tracking-wider">
              Visora (Code-Driven)
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg border border-emerald-500/20 bg-emerald-950/20 text-emerald-400">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Mathematical Engine</h3>
            </div>

            <ul className="space-y-4">
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 text-sm leading-relaxed">
                  <strong>Absolute Precision</strong>: Renders mathematical curves, vectors, and coordinate systems using exact formulas, not hallucinatory pixels.
                </span>
              </li>
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 text-sm leading-relaxed">
                  <strong>Full Editability</strong>: Download the generated Manim code and edit the formula, geometry, timings, or color tokens directly.
                </span>
              </li>
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 text-sm leading-relaxed">
                  <strong>Error-Free Text</strong>: Mathematical formulas and LaTeX labels render with crisp vector lines, completely free of text gibberish.
                </span>
              </li>
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 text-sm leading-relaxed">
                  <strong>Style Memory</strong>: Maintains coordinate formatting, brand colors, grids, and font faces across files and video sessions.
                </span>
              </li>
              <li className="flex gap-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 text-sm leading-relaxed">
                  <strong>Dynamic Self-Healing</strong>: In-house sandboxed compiler catches run-time bugs and automatically repairs the code before rendering.
                </span>
              </li>
            </ul>
          </div>

          {/* Generic AI Side */}
          <div className="relative rounded-2xl border border-slate-900 bg-slate-950/20 p-8 opacity-65 hover:opacity-90 transition-opacity backdrop-blur-sm">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono px-3 py-1 rounded-full uppercase tracking-wider">
              Generic AI (Pixel-Diffusion)
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Diffusion Video</h3>
            </div>

            <ul className="space-y-4">
              <li className="flex gap-3">
                <X className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                <span className="text-slate-400 text-sm leading-relaxed">
                  <strong>Pixel Approximation</strong>: &quot;Guesses&quot; frames via diffusion, resulting in morphing graphs, wobbly vectors, and mathematically incorrect curves.
                </span>
              </li>
              <li className="flex gap-3">
                <X className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                <span className="text-slate-400 text-sm leading-relaxed">
                  <strong>Zero Editability</strong>: The final output is an MP4 video stream. If a formula has a minor typo, you must re-generate (and pay for) the entire video.
                </span>
              </li>
              <li className="flex gap-3">
                <X className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                <span className="text-slate-400 text-sm leading-relaxed">
                  <strong>Garbled Math Text</strong>: Generating LaTeX equations with pixel models produces distorted symbols and illegible math-slop.
                </span>
              </li>
              <li className="flex gap-3">
                <X className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                <span className="text-slate-400 text-sm leading-relaxed">
                  <strong>No Branding Memory</strong>: Every generation starts from a blank slate, resulting in inconsistent styles and colors from scene to scene.
                </span>
              </li>
              <li className="flex gap-3">
                <X className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                <span className="text-slate-400 text-sm leading-relaxed">
                  <strong>Blind Rendering</strong>: Diffusion generators run in one shot, with no feedback loops to check if a formula is valid or visually correct.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
