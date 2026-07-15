'use client'

import { ScenePlan } from '@/store/useVisoraStore'
import { gooeyToast } from '@/components/ui/goey-toaster'
import { CheckCircle2, Clapperboard, Timer, ListTodo } from 'lucide-react'

interface ScenePlanCardProps {
  plan: ScenePlan
}

export function ScenePlanCard({ plan }: ScenePlanCardProps) {
  const handleApprove = () => {
    gooeyToast.success('Plan approved — generation started!')
  }

  return (
    <div className="w-full bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
        <div className="flex items-center gap-2">
          <Clapperboard className="h-5 w-5 text-indigo-400" />
          <h3 className="font-serif text-lg font-semibold tracking-wide text-zinc-100">
            Proposed Scene Plan
          </h3>
        </div>
        <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800/80 px-2.5 py-1 rounded-full text-xs text-zinc-400 font-medium">
          <Timer className="h-3.5 w-3.5 text-zinc-500" />
          <span>{plan.duration_seconds}s</span>
        </div>
      </div>

      {/* Main Details */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-zinc-200 mb-1">{plan.title}</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">{plan.description}</p>
        </div>

        {/* Visual Cues */}
        {plan.key_visuals && plan.key_visuals.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
              <ListTodo className="h-3.5 w-3.5 text-indigo-400" />
              <span>Key Visual Sequences</span>
            </div>
            <ul className="grid grid-cols-1 gap-2 pl-1">
              {plan.key_visuals.map((visual, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2.5 text-[11px] text-zinc-400 leading-relaxed bg-zinc-950/20 border border-zinc-800/30 rounded-lg p-2.5"
                >
                  <span className="h-4 w-4 shrink-0 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] font-semibold text-zinc-500 flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span>{visual}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={handleApprove}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-200"
      >
        <CheckCircle2 className="h-4 w-4" />
        <span>Approve & Start Generation</span>
      </button>
    </div>
  )
}
