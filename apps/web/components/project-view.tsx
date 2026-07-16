'use client'

import { useVisoraStore } from '@/store/useVisoraStore'
import { ChatContainer } from '@/components/chat-container'
import { StudioLayout } from '@/components/studio/studio-layout'
import { signout } from '@/app/auth/actions'
import { useRouter } from 'next/navigation'
import { LogOut, User as UserIcon, Plus } from 'lucide-react'

interface ProjectViewProps {
  projectId: string
  projectTitle: string
  displayName: string
}

export function ProjectView({ projectId, projectTitle, displayName }: ProjectViewProps) {
  const { forgeCode } = useVisoraStore()
  const router = useRouter()

  const isStudioMode = !!forgeCode

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/5 blur-[150px] pointer-events-none" />

      {/* Navbar */}
      <header className="w-full px-6 py-3 flex justify-between items-center z-20 border-b border-zinc-900/80 shrink-0">
        {/* Left: New Project */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          New Project
        </button>

        {/* Center: Project Title */}
        <div className="flex-1 flex justify-center">
          <span className="text-xs text-zinc-500 font-medium truncate max-w-xs" title={projectTitle}>
            {projectTitle}
          </span>
        </div>

        {/* Right: Plan badge + user */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-400 font-medium">
            <span>Free plan</span>
            <span className="text-zinc-600">•</span>
            <button className="text-zinc-200 hover:text-white transition-colors cursor-pointer font-semibold">
              Upgrade
            </button>
          </div>

          <div className="group relative">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center cursor-pointer shadow-md shadow-indigo-500/10">
              <UserIcon className="h-4 w-4 text-white" />
            </div>
            <div className="absolute right-0 top-9 w-40 bg-zinc-900 border border-zinc-800 rounded-xl p-2 hidden group-hover:block hover:block shadow-2xl z-50">
              <form action={signout}>
                <button
                  type="submit"
                  className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content — switches between Chat Mode and Studio Mode */}
      <main className="flex-1 min-h-0 relative">
        {isStudioMode ? (
          <StudioLayout />
        ) : (
          <div className="h-full flex flex-col items-center px-4 max-w-3xl w-full mx-auto z-10">
            <ChatContainer displayName={displayName} greetingWord="" />
          </div>
        )}
      </main>
    </div>
  )
}
