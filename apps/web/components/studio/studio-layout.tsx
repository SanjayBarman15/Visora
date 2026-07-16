'use client'

import { ChatPanel } from './chat-panel'
import { VideoPanel } from './video-panel'
import { CodePanel } from './code-panel'

export function StudioLayout() {
  return (
    <div className="h-full w-full flex animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Left Panel — Chat History */}
      <div className="w-[300px] shrink-0 border-r border-zinc-900 h-full overflow-hidden">
        <ChatPanel />
      </div>

      {/* Middle Panel — Video Preview */}
      <div className="flex-1 h-full overflow-hidden border-r border-zinc-900">
        <VideoPanel />
      </div>

      {/* Right Panel — Code */}
      <div className="w-[420px] shrink-0 h-full overflow-hidden">
        <CodePanel />
      </div>
    </div>
  )
}
