'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export type RenderStatus = 'idle' | 'pending' | 'rendering' | 'completed' | 'failed'

interface RenderState {
  renderStatus: RenderStatus
  clipUrl: string | null
  renderError: string | null
}

/**
 * useRenderStatus — subscribes to Supabase Realtime on a scene_checkpoints row.
 *
 * When the Celery worker updates render_status and clip_url in the DB,
 * this hook fires immediately — no polling needed.
 *
 * Falls back gracefully if no checkpointId is provided yet.
 */
export function useRenderStatus(checkpointId: string | null): RenderState {
  const [state, setState] = useState<RenderState>({
    renderStatus: 'idle',
    clipUrl: null,
    renderError: null,
  })

  useEffect(() => {
    if (!checkpointId) return

    const supabase = createClient()

    // Set initial status to pending as soon as we have a checkpointId
    setState({ renderStatus: 'pending', clipUrl: null, renderError: null })


    // 1. Fallback polling helper (checks status every 3 seconds)
    const pollStatus = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/render/status/${checkpointId}`)
        if (res.ok) {
          const data = await res.json()
          setState({
            renderStatus: data.render_status as RenderStatus,
            clipUrl: data.clip_url ?? null,
            renderError: data.render_error ?? null,
          })
        }
      } catch (err) {
        console.error('Error polling render status:', err)
      }
    }

    // Run once immediately
    pollStatus()
    const interval = setInterval(pollStatus, 3000)

    // 2. Subscribe to Postgres changes on this specific checkpoint row (realtime)
    const channel = supabase
      .channel(`render:${checkpointId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scene_checkpoints',
          filter: `id=eq.${checkpointId}`,
        },
        (payload) => {
          const row = payload.new as {
            render_status: string
            clip_url: string | null
            render_error: string | null
          }

          setState({
            renderStatus: row.render_status as RenderStatus,
            clipUrl: row.clip_url ?? null,
            renderError: row.render_error ?? null,
          })
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [checkpointId])

  return state
}
