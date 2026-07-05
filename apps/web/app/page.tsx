"use client"

import { Button } from "@/components/ui/button"
import { VisoraHero } from "@/components/visora-hero"
import { VisoraPipeline } from "@/components/visora-pipeline"
import { VisoraComparison } from "@/components/visora-comparison"
import { VisoraExamples } from "@/components/visora-examples"
import { Code2, ArrowRight, Play, Compass, FileCode, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import Image from "next/image"
import { VisoraHeader } from "@/components/visora-header"
import { VisoraFooter } from "@/components/visora-footer"

export default function Page() {
  const { session } = useAuth()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-300">
      
      <VisoraHeader />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <VisoraHero />

        {/* Multi-Agent Pipeline Section */}
        <div id="pipeline">
          <VisoraPipeline />
        </div>

        {/* Concept Gallery / Examples */}
        <div id="gallery">
          <VisoraExamples />
        </div>

        {/* Feature Comparison */}
        <div id="compare">
          <VisoraComparison />
        </div>

        {/* Audience / Use Cases Callout */}
        <section className="relative py-24 bg-background border-b border-border overflow-hidden">
          <div className="container mx-auto px-6 relative z-10 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Text */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/20 bg-sky-500/10 text-sky-500 dark:text-sky-400 text-xs font-mono">
                  <Compass className="w-3.5 h-3.5" />
                  WHO IS IT FOR?
                </div>
                <h2 className="text-3xl font-extrabold text-foreground leading-tight">
                  Engineered for Technical Communicators
                </h2>
                <p className="text-muted-foreground leading-relaxed font-sans text-sm">
                  Whether you are explaining advanced calculus to high schoolers, publishing scientific 
                  articles on physics, or building educational Youtube channels, Visora empowers you with:
                </p>

                <ul className="space-y-3 font-sans text-sm text-muted-foreground dark:text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>No Manim coding required, but code output is always ready.</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Exact mathematical coordinate mapping and LaTeX formulas.</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Self-reviewed, correct rendering from the first try.</span>
                  </li>
                </ul>
              </div>

              {/* Graphical illustration / Visual box */}
              <div className="lg:col-span-6 bg-card dark:bg-[#07090e] border border-border rounded-2xl p-6 relative overflow-hidden">
                <div 
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #ffffff 1px, transparent 1px),
                      linear-gradient(to bottom, #ffffff 1px, transparent 1px)
                    `,
                    backgroundSize: "20px 20px",
                  }}
                />
                
                {/* Visual coordinate node graph mockup */}
                <div className="relative min-h-[220px] flex items-center justify-center">
                  <svg className="w-full h-full min-h-[200px]" viewBox="0 0 300 200">
                    {/* Grid */}
                    <circle cx="150" cy="100" r="60" fill="none" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="1" />
                    <line x1="30" y1="100" x2="270" y2="100" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="1" />
                    <line x1="150" y1="20" x2="150" y2="180" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="1" />
                    
                    {/* Orbit lines / Vectors */}
                    <line x1="150" y1="100" x2="190" y2="60" stroke="#f59e0b" strokeWidth="2" />
                    <line x1="150" y1="100" x2="110" y2="140" stroke="#10b981" strokeWidth="2" />
                    <circle cx="190" cy="60" r="4" fill="#f59e0b" />
                    <circle cx="110" cy="140" r="4" fill="#10b981" />
                    
                    {/* LaTeX mockup formulas */}
                    <text x="200" y="55" fill="#f59e0b" className="font-mono text-[9px] font-bold">r(t)</text>
                    <text x="75" y="145" fill="#10b981" className="font-mono text-[9px] font-bold">-r(t)</text>
                    <text x="155" y="25" fill="#64748b" className="font-mono text-[8px]">(0, 1)</text>
                    <text x="155" y="185" fill="#64748b" className="font-mono text-[8px]">(0, -1)</text>
                  </svg>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-24 bg-background text-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-sky-950/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="container mx-auto px-6 relative z-10 max-w-3xl space-y-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              Start Generating Precise Explainer Videos Today
            </h2>
            <p className="text-muted-foreground font-sans max-w-xl mx-auto leading-relaxed">
              Describe your mathematical concept, adjust the parameters, and let Visora&apos;s multi-agent 
              system generate production-ready Python Manim scripts and voiceovers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
              <Link href={session ? "/dashboard" : "/signup"} className="w-full sm:w-auto">
                <Button className="w-full bg-sky-500 hover:bg-sky-600 text-slate-950 font-semibold px-8 py-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                  {session ? "Go to Dashboard" : "Try Visora for Free"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 px-8 py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer">
                View GitHub Source
                <FileCode className="w-4 h-4 text-sky-400" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <VisoraFooter />

    </div>
  )
}
