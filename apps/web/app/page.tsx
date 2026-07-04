"use client"

import { Button } from "@/components/ui/button"
import { MovaHero } from "@/components/mova-hero"
import { MovaPipeline } from "@/components/mova-pipeline"
import { MovaComparison } from "@/components/mova-comparison"
import { MovaExamples } from "@/components/mova-examples"
import { Code2, ArrowRight, Play, Compass, FileCode, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"

export default function Page() {
  const { session } = useAuth()

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-100 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-300">
      
      {/* Precision Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-900 bg-[#05070a]/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Math Vector Style Logo */}
            <div className="relative w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center font-mono font-bold text-sky-400 text-sm">
              M
              {/* Corner coordinate decorations */}
              <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-emerald-400" />
              <span className="absolute bottom-0.5 left-0.5 w-1 h-1 rounded-full bg-amber-400" />
            </div>
            <span className="font-sans font-bold tracking-tight text-white text-lg">Mova</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-mono text-slate-400">
            <a href="#pipeline" className="hover:text-white transition-colors">01.Pipeline</a>
            <a href="#gallery" className="hover:text-white transition-colors">02.Gallery</a>
            <a href="#compare" className="hover:text-white transition-colors">03.Differentiation</a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            {session ? (
              <Link href="/dashboard">
                <Button className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="hidden sm:inline-flex text-xs font-mono text-slate-400 hover:text-white cursor-pointer">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer">
                    Start Generating
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <MovaHero />

        {/* Multi-Agent Pipeline Section */}
        <div id="pipeline">
          <MovaPipeline />
        </div>

        {/* Concept Gallery / Examples */}
        <div id="gallery">
          <MovaExamples />
        </div>

        {/* Feature Comparison */}
        <div id="compare">
          <MovaComparison />
        </div>

        {/* Audience / Use Cases Callout */}
        <section className="relative py-24 bg-[#05070a] border-b border-slate-900 overflow-hidden">
          <div className="container mx-auto px-6 relative z-10 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Text */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/20 bg-sky-950/20 text-sky-400 text-xs font-mono">
                  <Compass className="w-3.5 h-3.5" />
                  WHO IS IT FOR?
                </div>
                <h2 className="text-3xl font-extrabold text-white leading-tight">
                  Engineered for Technical Communicators
                </h2>
                <p className="text-slate-400 leading-relaxed font-sans text-sm">
                  Whether you are explaining advanced calculus to high schoolers, publishing scientific 
                  articles on physics, or building educational Youtube channels, Mova empowers you with:
                </p>

                <ul className="space-y-3 font-sans text-sm text-slate-300">
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
              <div className="lg:col-span-6 bg-[#07090e] border border-slate-900 rounded-2xl p-6 relative overflow-hidden">
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
        <section className="relative py-24 bg-[#05070a] text-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-sky-950/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="container mx-auto px-6 relative z-10 max-w-3xl space-y-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Start Generating Precise Explainer Videos Today
            </h2>
            <p className="text-slate-400 font-sans max-w-xl mx-auto leading-relaxed">
              Describe your mathematical concept, adjust the parameters, and let Mova&apos;s multi-agent 
              system generate production-ready Python Manim scripts and voiceovers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
              <Link href={session ? "/dashboard" : "/signup"} className="w-full sm:w-auto">
                <Button className="w-full bg-sky-500 hover:bg-sky-600 text-slate-950 font-semibold px-8 py-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                  {session ? "Go to Dashboard" : "Try Mova for Free"}
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

      {/* Math Themed Footer */}
      <footer className="border-t border-slate-900 bg-[#05070a] py-12">
        <div className="container mx-auto px-6 max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-sky-500/10 border border-sky-500/20 flex items-center justify-center font-mono font-bold text-sky-400 text-xs">
              M
            </div>
            <span className="font-sans font-bold text-white text-sm">Mova</span>
            <span className="text-slate-600 font-mono text-[10px] ml-2">v0.1.0</span>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono text-slate-600">
            <span>&copy; {new Date().getFullYear()} Mova Inc.</span>
            <a href="#" className="hover:text-slate-400">Terms</a>
            <a href="#" className="hover:text-slate-400">Privacy</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
