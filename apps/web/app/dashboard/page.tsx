import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { signout } from '@/app/auth/actions'
import { ChatContainer } from '@/components/chat-container'
import {
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
        <ChatContainer displayName={displayName} greetingWord={greetingWord} />
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-[10px] text-zinc-600 z-10">
        Powered by Supabase Auth & NVIDIA NIM API
      </footer>
    </div>
  )
}
