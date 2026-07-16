'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProject } from '@/lib/projects'
import { useVisoraStore } from '@/store/useVisoraStore'
import { ModelDropdown } from '@/components/model-dropdown'
import { Plus, Mic, ArrowUp } from 'lucide-react'

interface DashboardInputProps {
  userId: string
  displayName: string
  greetingWord: string
}

const suggestions = [
  'A 2D animation explaining Pythagoras theorem for high school students',
  'A 5-minute premium styled animation about quantum entanglement basics',
  'A professional visual guide showing how binary trees search for elements',
]

export function DashboardInput({ userId, displayName, greetingWord }: DashboardInputProps) {
  const router = useRouter()
  const { initProject, sendMessage } = useVisoraStore()
  const [input, setInput] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleStart = async () => {
    const text = input.trim()
    if (!text || isCreating) return

    setIsCreating(true)
    try {
      // 1. Create project + session in Supabase
      const { projectId, sessionId } = await createProject(userId, text)

      // 2. Seed the store with project context
      initProject(projectId, sessionId)

      // 3. Navigate to project page — sends first message on arrival
      router.push(`/project/${projectId}?firstMessage=${encodeURIComponent(text)}`)
    } catch (err) {
      console.error('Failed to create project:', err)
      setIsCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleStart()
    }
  }

  const handleTemplateClick = (templateText: string) => {
    setInput(templateText)
  }

  return (
    <div className="w-full max-w-3xl flex flex-col justify-center flex-1 gap-6 relative z-10">
      {/* Greeting */}
      <div className="flex flex-col items-center text-center animate-fade-in mb-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="relative flex items-center justify-center">
            <svg
              className="w-8 h-8 text-amber-500/80 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif tracking-wide text-zinc-200">
            {greetingWord}, {displayName}
          </h1>
        </div>
        <h2 className="text-xl md:text-2xl font-serif text-zinc-400 mb-8">
          What are we visualising today?
        </h2>
      </div>

      {/* Input Composer */}
      <div className="w-full border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
        <div className="w-full">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to visualize..."
            disabled={isCreating}
            className="w-full bg-transparent border-0 outline-none text-zinc-200 placeholder-zinc-500 resize-none text-base focus:ring-0 p-0 disabled:opacity-60"
          />
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-zinc-800/50">
          <button className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 hover:text-white text-zinc-400 flex items-center justify-center cursor-pointer transition-colors">
            <Plus className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <ModelDropdown />

            <button className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 hover:text-white text-zinc-400 flex items-center justify-center cursor-pointer transition-colors">
              <Mic className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handleStart}
              disabled={isCreating || !input.trim()}
              className="h-8 w-8 rounded-lg bg-zinc-100 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-900 flex items-center justify-center cursor-pointer transition-colors shadow-md shadow-zinc-100/10"
            >
              {isCreating ? (
                <span className="h-3 w-3 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Suggestion Chips */}
      <div className="flex flex-col gap-3 mt-4">
        <span className="text-[10px] text-zinc-600 font-semibold tracking-wider uppercase pl-1 select-none">
          Suggested Prompts
        </span>
        <div className="flex flex-col gap-2.5">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleTemplateClick(suggestion)}
              disabled={isCreating}
              className="w-full text-left px-4 py-3 rounded-xl border border-zinc-900/60 bg-zinc-950/20 hover:bg-zinc-900/30 hover:border-zinc-800/50 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer transition-all duration-200 disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
