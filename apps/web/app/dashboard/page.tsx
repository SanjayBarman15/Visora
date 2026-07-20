import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signout } from '@/app/auth/actions'
import { DashboardInput } from '@/components/dashboard-input'
import { LogOut, User as UserIcon, Plus, Film, Clock } from 'lucide-react'

// Helper to format date
function formatRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: projectsData } = await supabase
    .from('projects')
    .select('id, title, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const projects = projectsData || []

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'Casanova'

  const hour = new Date().getHours()
  let greetingWord = 'Evening'
  if (hour < 12) {
    greetingWord = 'Morning'
  } else if (hour < 17) {
    greetingWord = 'Afternoon'
  }

  return (
    <div className="h-screen bg-zinc-950 text-white flex relative overflow-hidden select-none">
      {/* Background radial gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/5 blur-[150px] pointer-events-none" />

      {/* Left Sidebar */}
      <aside className="w-64 h-full bg-zinc-950/60 backdrop-blur-xl border-r border-zinc-900 flex flex-col z-20">
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-zinc-900/60 flex items-center justify-between shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer group">
            <svg
              className="w-6 h-6 text-indigo-500 fill-current group-hover:text-indigo-400 transition-colors"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
            </svg>
            <span className="font-serif text-lg font-semibold text-zinc-100 tracking-wide">
              Visora
            </span>
          </Link>
        </div>

        {/* New Project Action */}
        <div className="px-4 py-4 shrink-0">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/60 hover:border-zinc-700/80 hover:text-white text-zinc-300 text-xs font-semibold cursor-pointer transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </div>

        {/* Projects List Header */}
        <div className="px-6 py-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider select-none shrink-0">
          Recent Projects
        </div>

        {/* Scrollable Project List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 scrollbar-thin scrollbar-thumb-zinc-900">
          {projects.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-zinc-600 select-none">
              No projects yet.
            </div>
          ) : (
            projects.map((project) => (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className="group w-full flex flex-col gap-1.5 px-4 py-3 rounded-xl border border-transparent hover:border-zinc-900 hover:bg-zinc-900/30 cursor-pointer transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <Film className="h-3.5 w-3.5 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                  <span className="text-xs font-semibold text-zinc-300 group-hover:text-zinc-100 transition-colors truncate flex-1">
                    {project.title || 'Untitled Project'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pl-5.5 text-[10px] text-zinc-500 font-medium">
                  <Clock className="h-3 w-3 text-zinc-600" />
                  <span>{formatRelativeTime(project.created_at)}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Top Navbar */}
        <header className="w-full px-6 py-4 flex justify-between items-center z-10 shrink-0">
          <div className="flex-1" />

          {/* Plan Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-400 font-medium">
            <span>Free plan</span>
            <span className="text-zinc-600">•</span>
            <button className="text-zinc-200 hover:text-white transition-colors cursor-pointer font-semibold">
              Upgrade
            </button>
          </div>

          {/* User Menu */}
          <div className="flex-1 flex justify-end items-center gap-4">
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

        {/* Main Workspace Input */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 max-w-3xl w-full mx-auto z-10 min-h-0 pb-16">
          <DashboardInput
            userId={user.id}
            displayName={displayName}
            greetingWord={greetingWord}
          />
        </main>

        <footer className="w-full text-center py-4 text-[10px] text-zinc-600 z-10 shrink-0">
          Powered by Supabase Auth & NVIDIA NIM API
        </footer>
      </div>
    </div>
  )
}
