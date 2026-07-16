'use client'

import { useRouter } from 'next/navigation'
import { useVisoraStore } from '@/store/useVisoraStore'
import { ScenePlanCard } from '@/components/scene-plan-card'
import { Sparkles, User as UserIcon, CheckCircle2, Plus } from 'lucide-react'

export function ChatPanel() {
  const router = useRouter()
  const { messages, scenePlan, resetStore } = useVisoraStore()

  const handleNewProject = () => {
    resetStore()
    router.push('/dashboard')
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950/60 backdrop-blur-sm">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-zinc-900 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Session History
          </span>
        </div>
      </div>

      {/* Scrollable Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${
              message.role === 'user' ? 'flex-row-reverse self-end max-w-[90%]' : 'self-start max-w-[95%]'
            }`}
          >
            {/* Avatar */}
            <div
              className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                message.role === 'user'
                  ? 'bg-gradient-to-tr from-indigo-500 to-violet-600'
                  : 'bg-zinc-900 border border-zinc-800'
              }`}
            >
              {message.role === 'user' ? (
                <UserIcon className="h-3 w-3 text-white" />
              ) : (
                <Sparkles className="h-3 w-3 text-amber-500" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                message.role === 'user'
                  ? 'bg-indigo-600/80 text-white rounded-tr-none'
                  : 'bg-zinc-900/60 border border-zinc-800/60 text-zinc-300 rounded-tl-none'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {/* Approved Scene Plan — locked/muted state */}
        {scenePlan && (
          <div className="mt-2 w-full">
            <div className="w-full bg-zinc-900/40 border border-emerald-900/30 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">
                  Plan Approved
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium leading-snug">{scenePlan.title}</p>
              <p className="text-[10px] text-zinc-600 leading-relaxed">{scenePlan.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer — New Project */}
      <div className="px-3 py-3 border-t border-zinc-900 shrink-0">
        <button
          onClick={handleNewProject}
          className="w-full py-2 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/60 text-xs text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
        >
          <Plus className="h-3.5 w-3.5" />
          New Project
        </button>
      </div>
    </div>
  )
}
