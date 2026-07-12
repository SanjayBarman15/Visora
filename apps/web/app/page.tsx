import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/server'
import { ArrowRight, Activity, Shield, Sparkles } from 'lucide-react'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-radial from-zinc-900 via-black to-black text-white flex flex-col justify-between p-6 md:p-12">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center w-full max-w-7xl mx-auto z-10">
        <div className="flex items-center gap-2 font-semibold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
          <Activity className="h-6 w-6 text-indigo-400" />
          VISORA
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/dashboard">
              <Button variant="outline" className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white cursor-pointer transition-all">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <span className="text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer mr-4">Sign In</span>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white cursor-pointer transition-all shadow-lg shadow-indigo-500/20 border-0">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content (Vertically and Horizontally Centered) */}
      <main className="flex-1 flex flex-col justify-center items-center text-center max-w-4xl mx-auto z-10 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-xs text-indigo-300 mb-6 animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Next Generation Dashboard and Analytics</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Manage operations with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">
            Absolute Clarity
          </span>
        </h1>

        <p className="text-zinc-400 text-base sm:text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Visora provides real-time model statistics, performance pipelines, session tracking, and user profile management in a premium database dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          {user ? (
            <Link href="/dashboard">
              <Button size="lg" className="px-8 py-6 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-base rounded-xl cursor-pointer shadow-xl shadow-indigo-500/20 border-0 flex items-center gap-2">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/register">
                <Button size="lg" className="px-8 py-6 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-base rounded-xl cursor-pointer shadow-xl shadow-indigo-500/20 border-0 flex items-center gap-2">
                  Create Free Account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8 py-6 border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/80 text-zinc-300 hover:text-white text-base rounded-xl cursor-pointer transition-all">
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500 z-10 pt-6 border-t border-zinc-900">
        <div>&copy; {new Date().getFullYear()} Visora Inc. All rights reserved.</div>
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Secure via Supabase Auth</span>
        </div>
      </footer>
    </div>
  )
}
