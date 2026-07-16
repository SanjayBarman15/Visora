'use client'

import { Film, Play, Loader2 } from 'lucide-react'

interface VideoPanelProps {
  videoUrl?: string | null
}

export function VideoPanel({ videoUrl }: VideoPanelProps) {
  return (
    <div className="h-full w-full flex flex-col bg-zinc-950 relative overflow-hidden">
      {/* Panel Header */}
      <div className="px-5 py-3 border-b border-zinc-900 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Preview
          </span>
        </div>
        {videoUrl && (
          <span className="text-[10px] text-emerald-500 font-medium">● Ready</span>
        )}
      </div>

      {/* Video or Placeholder */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {videoUrl ? (
          // Actual video player
          <video
            src={videoUrl}
            controls
            className="w-full max-h-full rounded-2xl shadow-2xl shadow-black/60 border border-zinc-800/50"
          />
        ) : (
          // Stunning placeholder state
          <div className="w-full h-full flex flex-col items-center justify-center gap-8 text-center select-none">
            {/* Ambient glow behind the icon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 rounded-full bg-indigo-500/5 blur-[80px]" />
            </div>

            {/* Animated film reel icon */}
            <div className="relative flex items-center justify-center">
              {/* Outer ping ring */}
              <span className="absolute h-28 w-28 rounded-full border border-indigo-500/10 animate-ping" style={{ animationDuration: '3s' }} />
              <span className="absolute h-20 w-20 rounded-full border border-indigo-500/15 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />

              {/* Icon container */}
              <div className="relative h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center shadow-2xl shadow-black">
                <Film className="h-7 w-7 text-zinc-600" />
              </div>
            </div>

            <div className="space-y-2 relative z-10">
              <h3 className="text-sm font-semibold text-zinc-400">
                Your animation will appear here
              </h3>
              <p className="text-[11px] text-zinc-600 max-w-[220px] leading-relaxed">
                Once the scene is rendered, your Manim animation will play in this panel
              </p>
            </div>

            {/* Render button — wired up when pipeline is ready */}
            <button
              disabled
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/40 to-violet-600/40 border border-indigo-500/20 text-white/50 text-xs font-medium cursor-not-allowed select-none relative z-10"
              title="Render pipeline coming soon"
            >
              <Play className="h-3.5 w-3.5" />
              Render Scene
            </button>

            <p className="text-[10px] text-zinc-700 relative z-10">Render pipeline coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}
