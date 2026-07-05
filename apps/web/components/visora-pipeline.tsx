"use client"

import { useState } from "react"
// import { motion } from "framer-motion"
import { 
  Users, MessageSquare, ListTodo, Code, ShieldCheck, 
  FileText, Volume2, Music, History,  RefreshCw 
} from "lucide-react"

interface AgentStep {
  num: string
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  description: string
  badge?: string
}

export function VisoraPipeline() {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  const steps: AgentStep[] = [
    {
      num: "01",
      title: "Coordinator Agent",
      subtitle: "Contextual Clarifier",
      icon: MessageSquare,
      color: "border-sky-500/30 text-sky-400 bg-sky-950/10",
      description: "Interviews the user to understand target audience complexity (e.g. 16-year-old vs. graduate level), stylistic preferences, and specific core focus areas.",
    },
    {
      num: "02",
      title: "Video Planner Agent",
      subtitle: "Storyboard Architect",
      icon: ListTodo,
      color: "border-indigo-500/30 text-indigo-400 bg-indigo-950/10",
      description: "Translates the clarified topic into a granular scene-by-scene storyboard, specifying duration, layout parameters, and mathematical equations.",
    },
    {
      num: "03",
      title: "Manim Code Writer",
      subtitle: "Python Geometry Generator",
      icon: Code,
      color: "border-emerald-500/30 text-emerald-400 bg-emerald-950/10",
      description: "Generates the raw mathematical code using Manim. Sets coordinate systems, vectors, axes, and precise matrix transforms.",
    },
    {
      num: "04",
      title: "Code Reviewer Agent",
      subtitle: "Self-Healing Compiler",
      icon: ShieldCheck,
      color: "border-rose-500/30 text-rose-400 bg-rose-950/10",
      description: "Compiles the generated Manim code in a sandboxed runtime. If syntax errors or coordinate overlaps occur, it feeds logs back to the writer in a self-correcting loop.",
      badge: "Self-Healing Loop",
    },
    {
      num: "05",
      title: "Voiceover Agent",
      subtitle: "Timed Scriptwriter",
      icon: FileText,
      color: "border-amber-500/30 text-amber-400 bg-amber-950/10",
      description: "Drafts the exact narration script, mapping key concepts to timestamps to ensure the vocal explanation aligns perfectly with the visual math transformations.",
    },
    {
      num: "06",
      title: "Voice Synthesizer",
      subtitle: "Vocal Synthesizer",
      icon: Volume2,
      color: "border-purple-500/30 text-purple-400 bg-purple-950/10",
      description: "Translates script text to audio using warm, clear, scientific narration voices. Controls cadence, speed, and mathematical pronunciation rules.",
    },
    {
      num: "07",
      title: "Audio Mixer Agent",
      subtitle: "Final Sync Engine",
      icon: Music,
      color: "border-teal-500/30 text-teal-400 bg-teal-950/10",
      description: "Combines rendered animation frames, speech tracks, and subtle background audio, adjusting decibels for maximum vocal clarity.",
    },
    {
      num: "08",
      title: "Style Rememberer",
      subtitle: "Stylistic Memory Vault",
      icon: History,
      color: "border-pink-500/30 text-pink-400 bg-pink-950/10",
      description: "Saves design tokens, LaTeX text preferences, custom palettes, and fonts so the next video maintains visual continuity without starting from scratch.",
      badge: "Cross-Session Memory",
    },
  ]

  return (
    <section className="relative bg-background py-24 border-b border-border overflow-hidden">
      {/* Visual background details */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-900/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 text-xs font-mono mb-4">
            <Users className="w-3.5 h-3.5" />
            MULTI-AGENT ORCHESTRATION
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-6">
            Under the Hood: The 8-Agent Pipeline
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
            Visora doesn&apos;t just guess pixels. Eight specialized AI agents coordinate in a sandboxed, 
            self-correcting environment to write actual code and sync voiceovers.
          </p>
        </div>

        {/* Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, idx) => {
            const Icon = step.icon
            const isActive = activeStep === idx

            return (
              <div 
                key={step.num}
                className={`relative group rounded-xl border p-6 transition-all duration-300 bg-white dark:bg-slate-950/40 backdrop-blur-sm cursor-pointer select-none
                  ${isActive ? "border-slate-400 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/80 shadow-lg" : "border-slate-200 dark:border-slate-900 hover:border-slate-350 dark:hover:border-slate-800"}`}
                onMouseEnter={() => setActiveStep(idx)}
                onMouseLeave={() => setActiveStep(null)}
              >
                {/* Connection lines (visible on desktop) */}
                {idx < 7 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-[1px] border-t border-dashed border-slate-800 z-0 pointer-events-none" />
                )}

                {/* Header info */}
                <div className="flex items-start justify-between mb-6">
                  <div className={`p-2 rounded-lg border ${step.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-2xl font-black text-slate-800 group-hover:text-slate-700 transition-colors">
                    {step.num}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-md font-bold text-slate-900 dark:text-white mb-1 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs font-mono text-slate-500 mb-4 uppercase tracking-wider">
                  {step.subtitle}
                </p>

                {/* Self-healing loop connection between 03 & 04 */}
                {step.num === "04" && (
                  <div className="absolute top-[-10px] right-4 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    Self-Healing Loop
                  </div>
                )}
                
                {step.num === "08" && (
                  <div className="absolute top-[-10px] right-4 bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[9px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                    <History className="w-2.5 h-2.5" />
                    Stylistic Memory
                  </div>
                )}

                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                  {step.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Self-Healing Loop Highlight Box */}
        <div className="mt-12 max-w-4xl mx-auto rounded-xl border border-rose-500/20 dark:border-rose-950/40 bg-rose-500/5 dark:bg-rose-950/5 p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-950/30 text-rose-400 shrink-0">
            <RefreshCw className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div className="flex-1 space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <h4 className="text-sm font-mono font-bold text-rose-400 uppercase tracking-wide">Dynamic Code Healing (Manim Compiler loop)</h4>
              <span className="bg-rose-500/20 text-rose-400 text-[10px] font-mono px-2 py-0.5 rounded border border-rose-500/20">Critical Differentiator</span>
            </div>
            <p className="text-sm text-slate-650 dark:text-slate-400 leading-relaxed font-sans">
              LLMs often write broken Python code. Visora solves this by wrapping the <strong>Manim Code Writer</strong> and <strong>Code Reviewer</strong> in a tight compile-and-fix feedback loop. The compiler intercepts syntax bugs, type errors, and boundary issues, fixing them before the video renders. You receive perfect, running Python animation code.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
