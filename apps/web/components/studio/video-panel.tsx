'use client'

import { useEffect } from 'react'
import { Film, Play, Loader2, AlertCircle, RotateCcw } from 'lucide-react'
import { useVisoraStore } from '@/store/useVisoraStore'
import { useRenderStatus } from '@/hooks/useRenderStatus'

export function VideoPanel() {
  const {
    checkpointId,
    renderStatus,
    clipUrl,
    submitRender,
  } = useVisoraStore()

  // Subscribe to Supabase Realtime for this checkpoint
  const { renderStatus: realtimeStatus, clipUrl: realtimeClipUrl } = useRenderStatus(checkpointId)

  // Sync realtime updates back into the global store
  const setStoreRender = useVisoraStore.getState

  useEffect(() => {
    if (realtimeStatus && realtimeStatus !== 'idle') {
      useVisoraStore.setState({
        renderStatus: realtimeStatus,
        clipUrl: realtimeClipUrl,
      })
    }
  }, [realtimeStatus, realtimeClipUrl])

  // Use store values (updated by realtime effect above)
  const isRendering = renderStatus === 'pending' || renderStatus === 'rendering'
  const hasFailed = renderStatus === 'failed'
  const isComplete = renderStatus === 'completed' && !!clipUrl

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
        {isComplete && (
          <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ready
          </span>
        )}
        {isRendering && (
          <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            {renderStatus === 'rendering' ? 'Rendering...' : 'Queued'}
          </span>
        )}
        {hasFailed && (
          <span className="text-[10px] text-red-400 font-medium flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Render failed
          </span>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-6 relative">

        {/* ── Video Player (render complete) ───────────────────────────── */}
        {isComplete && clipUrl && (
          <video
            src={clipUrl}
            controls
            autoPlay
            className="w-full max-h-full rounded-2xl shadow-2xl shadow-black/60 border border-zinc-800/50 animate-in fade-in duration-500"
          />
        )}

        {/* ── Rendering Progress State ──────────────────────────────────── */}
        {isRendering && (
          <div className="flex flex-col items-center gap-6 text-center select-none">
            <div className="relative flex items-center justify-center">
              <span className="absolute h-28 w-28 rounded-full border border-amber-500/10 animate-ping" style={{ animationDuration: '2s' }} />
              <span className="absolute h-20 w-20 rounded-full border border-amber-500/15 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
              <div className="relative h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center shadow-2xl shadow-black">
                <Loader2 className="h-7 w-7 text-amber-400 animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-300">
                {renderStatus === 'rendering' ? 'Manim is rendering your scene...' : 'Queued for rendering...'}
              </h3>
              <p className="text-[11px] text-zinc-500 max-w-[220px] leading-relaxed">
                This usually takes 30 seconds to 2 minutes depending on the complexity
              </p>
            </div>
          </div>
        )}

        {/* ── Failed State ──────────────────────────────────────────────── */}
        {hasFailed && (
          <div className="flex flex-col items-center gap-6 text-center select-none">
            <div className="h-16 w-16 rounded-2xl bg-red-950/40 border border-red-900/40 flex items-center justify-center shadow-2xl">
              <AlertCircle className="h-7 w-7 text-red-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-red-400">Render failed</h3>
              <p className="text-[11px] text-zinc-500 max-w-[220px] leading-relaxed">
                Manim encountered an error. You can try regenerating the code and rendering again.
              </p>
            </div>
            <button
              onClick={submitRender}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-medium cursor-pointer transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry Render
            </button>
          </div>
        )}

        {/* ── Idle Placeholder State ────────────────────────────────────── */}
        {renderStatus === 'idle' && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-8 text-center select-none">
            {/* Ambient glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 rounded-full bg-indigo-500/5 blur-[80px]" />
            </div>

            {/* Animated icon */}
            <div className="relative flex items-center justify-center">
              <span className="absolute h-28 w-28 rounded-full border border-indigo-500/10 animate-ping" style={{ animationDuration: '3s' }} />
              <span className="absolute h-20 w-20 rounded-full border border-indigo-500/15 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
              <div className="relative h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center shadow-2xl shadow-black">
                <Film className="h-7 w-7 text-zinc-600" />
              </div>
            </div>

            <div className="space-y-2 relative z-10">
              <h3 className="text-sm font-semibold text-zinc-400">
                Your animation will appear here
              </h3>
              <p className="text-[11px] text-zinc-600 max-w-[220px] leading-relaxed">
                Click Render Scene to start the Manim rendering process
              </p>
            </div>

            {/* Render button — now wired */}
            <button
              onClick={submitRender}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-medium cursor-pointer shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 relative z-10"
            >
              <Play className="h-3.5 w-3.5" />
              Render Scene
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
