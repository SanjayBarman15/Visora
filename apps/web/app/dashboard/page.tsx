import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { signout } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { ModelDropdown } from '@/components/model-dropdown'
import {
  Sparkles,
  Plus,
  Mic,
  ArrowUp,
  LogOut,
  User as UserIcon
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Retrieve user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Retrieve user profile information from the profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'Casano'

  // Determine current greeting based on local time
  const hour = new Date().getHours()
  let greetingWord = 'Evening'
  if (hour < 12) {
    greetingWord = 'Morning'
  } else if (hour < 17) {
    greetingWord = 'Afternoon'
  }

  return (
    <div className="min-h-svh bg-zinc-950 text-white flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background radial gradients for premium feel */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/5 blur-[150px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full px-6 py-4 flex justify-between items-center z-10">
        <div className="flex-1" />
        
        {/* Top Center: Plan Badge */}
        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-400 font-medium">
          <span>Free plan</span>
          <span className="text-zinc-600">•</span>
          <button className="text-zinc-200 hover:text-white transition-colors cursor-pointer font-semibold">
            Upgrade
          </button>
        </div>

        {/* Top Right: User Profile Menu / Sign Out */}
        <div className="flex-1 flex justify-end items-center gap-4">
          <div className="group relative">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center cursor-pointer shadow-md shadow-indigo-500/10">
              <UserIcon className="h-4 w-4 text-white" />
            </div>
            {/* Simple dropdown hover list for logout */}
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

      {/* Centered Main Area */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 max-w-3xl w-full mx-auto z-10">
        
        {/* Greeting Section */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          {/* Salmon/Orange pointed star icon */}
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

        {/* Chat Card Box */}
        <div className="w-full border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
          
          {/* Message Area */}
          <div className="w-full">
            <textarea
              rows={2}
              placeholder="How can I help you today?"
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
              {/* Model Dropdown Selection */}
              <ModelDropdown />

              {/* Mic Icon */}
              <button className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 hover:text-white text-zinc-400 flex items-center justify-center cursor-pointer transition-colors">
                <Mic className="h-3.5 w-3.5" />
              </button>

              {/* Send Button */}
              <button className="h-8 w-8 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 flex items-center justify-center cursor-pointer transition-colors shadow-md shadow-zinc-100/10">
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Usage Limits Section commented out */}
          {/* 
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-zinc-800/30 text-[10px] text-zinc-500 font-medium tracking-wide">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="shrink-0 uppercase">Session: 0%</span>
              <div className="w-full sm:w-32 h-1 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50">
                <div className="h-full bg-zinc-700 w-0 rounded-full" />
              </div>
            </div>

            <div className="hidden sm:flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-2">
                <span className="shrink-0 uppercase">Weekly: 31%</span>
                <div className="w-24 sm:w-28 h-1 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50">
                  <div className="h-full bg-zinc-700 w-[31%] rounded-full" />
                </div>
              </div>
              <span className="text-zinc-600 text-[9px] shrink-0 font-normal ml-1">
                resets in 5d 13h
              </span>
            </div>
          </div>
          */}

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-[10px] text-zinc-600 z-10">
        Powered by Supabase Auth & NVIDIA NIM API
      </footer>
    </div>
  )
}
