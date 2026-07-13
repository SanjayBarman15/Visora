'use client'

import { useState, useRef, useEffect } from 'react'
import { useVisoraStore } from '@/store/useVisoraStore'
import { ModelDropdown } from '@/components/model-dropdown'
import { Plus, Mic, ArrowUp, Sparkles, User as UserIcon } from 'lucide-react'

interface ChatContainerProps {
  displayName: string
  greetingWord: string
}

export function ChatContainer({ displayName, greetingWord }: ChatContainerProps) {
  const { messages, requirements, isGenerating, sendMessage } = useVisoraStore()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isGenerating])

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return
    const textToSend = input
    setInput('')
    await sendMessage(textToSend)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Pre-filled template click handler
  const handleTemplateClick = (templateText: string) => {
    setInput(templateText)
  }

  const suggestions = [
    "A 2D animation explaining Pythagoras theorem for high school students",
    "A 5-minute premium styled animation about quantum entanglement basics",
    "A professional visual guide showing how binary trees search for elements"
  ]

  const hasMessages = messages.length > 0

  return (
    <div className="w-full max-w-3xl flex flex-col gap-6 relative z-10">
      
      {/* 1. Empty State (when no messages) */}
      {!hasMessages && (
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
      )}

      {/* 2. Chat Messages Stream */}
      {hasMessages && (
        <div className="w-full flex flex-col gap-4 overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 max-w-[85%] ${
                message.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'
              }`}
            >
              {/* Avatar */}
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                  message.role === 'user'
                    ? 'bg-gradient-to-tr from-indigo-500 to-violet-600'
                    : 'bg-zinc-900 border border-zinc-800'
                }`}
              >
                {message.role === 'user' ? (
                  <UserIcon className="h-4 w-4 text-white" />
                ) : (
                  <Sparkles className="h-4 w-4 text-amber-500" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-zinc-900/60 border border-zinc-800 text-zinc-200 rounded-tl-none backdrop-blur-xl'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {/* Typing/Generating Indicator */}
          {isGenerating && (
            <div className="flex gap-3 max-w-[80%] self-start animate-pulse">
              <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-zinc-900/40 border border-zinc-800/80 rounded-tl-none text-xs text-zinc-500 flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                </span>
                Scout is thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* 3. Requirements Summary Cards (Showed as a sleek premium sidebar or panel if hasMessages) */}
      {hasMessages && (
        <div className="w-full bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-3.5 backdrop-blur-md text-[11px] text-zinc-400 flex flex-wrap gap-x-6 gap-y-2 select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px]">Audience:</span>
            <span className={requirements.audience_level ? 'text-zinc-200 font-medium' : 'text-zinc-600'}>
              {requirements.audience_level || 'Pending'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px]">Duration:</span>
            <span className={requirements.duration_target ? 'text-zinc-200 font-medium' : 'text-zinc-600'}>
              {requirements.duration_target ? `${requirements.duration_target}s` : 'Pending'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px]">Style:</span>
            <span className={requirements.style_preference ? 'text-zinc-200 font-medium' : 'text-zinc-600'}>
              {requirements.style_preference || 'Pending'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px]">Math:</span>
            <span className={requirements.math_inclusion_flag !== null ? 'text-zinc-200 font-medium' : 'text-zinc-600'}>
              {requirements.math_inclusion_flag !== null ? (requirements.math_inclusion_flag ? 'Yes' : 'No') : 'Pending'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px]">Tone:</span>
            <span className={requirements.voiceover_tone_preference ? 'text-zinc-200 font-medium' : 'text-zinc-600'}>
              {requirements.voiceover_tone_preference || 'Pending'}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            <span className="text-[10px] text-zinc-400 font-medium">
              Status: {requirements.is_complete ? 'Ready for Plan' : 'Collecting'}
            </span>
          </div>
        </div>
      )}

      {/* 4. Chat Card Box (The input composer) */}
      <div className="w-full border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
        
        {/* Message Area */}
        <div className="w-full">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to visualize..."
            className="w-full bg-transparent border-0 outline-none text-zinc-200 placeholder-zinc-500 resize-none text-base focus:ring-0 p-0"
          />
        </div>

        {/* Controls Bar */}
        <div className="flex justify-between items-center pt-2 border-t border-zinc-800/50">
          
          {/* Attachment Button */}
          <button className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 hover:text-white text-zinc-400 flex items-center justify-center cursor-pointer transition-colors">
            <Plus className="h-4 w-4" />
          </button>

          {/* Configs (Model, Mic, Send) */}
          <div className="flex items-center gap-3">
            <ModelDropdown />

            {/* Mic Icon */}
            <button className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 hover:text-white text-zinc-400 flex items-center justify-center cursor-pointer transition-colors">
              <Mic className="h-3.5 w-3.5" />
            </button>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={isGenerating || !input.trim()}
              className="h-8 w-8 rounded-lg bg-zinc-100 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-900 flex items-center justify-center cursor-pointer transition-colors shadow-md shadow-zinc-100/10"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

      {/* 5. Suggestions Chips (when no messages) */}
      {!hasMessages && (
        <div className="flex flex-col gap-3 mt-4">
          <span className="text-[10px] text-zinc-600 font-semibold tracking-wider uppercase pl-1 select-none">
            Suggested Prompts
          </span>
          <div className="flex flex-col gap-2.5">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleTemplateClick(suggestion)}
                className="w-full text-left px-4 py-3 rounded-xl border border-zinc-900/60 bg-zinc-950/20 hover:bg-zinc-900/30 hover:border-zinc-800/50 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer transition-all duration-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
