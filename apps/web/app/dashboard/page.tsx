import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { signout } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import {
  Activity,
  LogOut,
  User as UserIcon,
  Video,
  Layers,
  Settings,
  FolderOpen,
  Plus,
  Compass,
  CreditCard
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

  // Retrieve project listing from projects table
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const totalProjects = projects?.length || 0
  const completedProjects = projects?.filter((p) => p.status === 'completed').length || 0

  return (
    <div className="min-h-svh bg-zinc-950 text-white flex flex-col">
      {/* Navbar */}
      <header className="border-b border-zinc-900 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            <Activity className="h-5 w-5 text-indigo-400 animate-pulse" />
            VISORA
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-medium text-zinc-200">
                {profile?.display_name || user.email?.split('@')[0]}
              </span>
              <span className="text-xs text-zinc-500">{user.email}</span>
            </div>
            <form action={signout}>
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col gap-8">
        {/* Profile Card / Header Banner */}
        <div className="relative overflow-hidden border border-zinc-900 bg-radial from-zinc-900/60 to-zinc-950 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute top-[-20%] right-[-10%] w-[30%] h-[120%] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />

          <div className="flex items-center gap-4 z-10">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Hello, {profile?.display_name || 'Creator'}!
              </h2>
              <p className="text-sm text-zinc-400 mt-0.5">
                Manage your video creation and analysis projects below.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/50 text-xs font-medium text-zinc-300">
              <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
              <span>Tier: <span className="text-indigo-400 capitalize">{profile?.subscription_tier || 'free'}</span></span>
            </div>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/10 border-0">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border border-zinc-900 bg-zinc-900/20 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 mb-4">
              <span className="text-sm font-semibold uppercase tracking-wider">Total Projects</span>
              <FolderOpen className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <span className="text-3xl font-extrabold">{totalProjects}</span>
              <p className="text-xs text-zinc-500 mt-1">Draft or active video projects</p>
            </div>
          </div>

          <div className="border border-zinc-900 bg-zinc-900/20 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 mb-4">
              <span className="text-sm font-semibold uppercase tracking-wider">Videos Completed</span>
              <Video className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-3xl font-extrabold">{completedProjects}</span>
              <p className="text-xs text-zinc-500 mt-1">Rendered and compiled clips</p>
            </div>
          </div>

          <div className="border border-zinc-900 bg-zinc-900/20 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500 mb-4">
              <span className="text-sm font-semibold uppercase tracking-wider">System Integration</span>
              <Layers className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <span className="text-3xl font-extrabold text-indigo-400">Active</span>
              <p className="text-xs text-zinc-500 mt-1">Supabase database connected</p>
            </div>
          </div>
        </div>

        {/* Projects Listing */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold tracking-tight">Your Projects</h3>

          {projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="border border-zinc-900 bg-zinc-900/30 rounded-2xl p-6 hover:border-zinc-800 transition-all flex flex-col justify-between gap-4"
                >
                  <div>
                    <h4 className="font-semibold text-zinc-200">{project.title}</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      Status: <span className="capitalize text-indigo-400">{project.status}</span>
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-xs text-zinc-500 pt-4 border-t border-zinc-900/85">
                    <span>Scenes: {project.completed_scenes}/{project.total_scenes}</span>
                    <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 bg-zinc-900/5">
              <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                <FolderOpen className="h-5 w-5 text-zinc-500" />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-300">No projects yet</h4>
                <p className="text-sm text-zinc-500 mt-1">
                  Create your first project to start rendering animations.
                </p>
              </div>
              <Button size="sm" className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white cursor-pointer rounded-xl flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> Add Project
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
