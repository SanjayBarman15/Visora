import Link from 'next/link'
import { signup } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Activity, Mail, Lock, User, AlertCircle } from 'lucide-react'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

interface PageProps {
  searchParams: SearchParams
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const params = await searchParams
  const error = params.error as string | undefined

  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-zinc-950 text-white flex flex-col justify-center items-center p-6">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">
            <Activity className="h-6 w-6 text-indigo-400" />
            VISORA
          </Link>
          <p className="text-zinc-400 text-sm">Create an account to begin monitoring your projects.</p>
        </div>

        {/* Auth Card */}
        <div className="border border-zinc-800 bg-zinc-900/40 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
          <form className="flex flex-col gap-6">
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{decodeURIComponent(error)}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="displayName" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  placeholder="John Doe"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              formAction={signup}
              className="w-full py-6 mt-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-medium cursor-pointer shadow-lg shadow-indigo-500/10 border-0"
            >
              Sign Up
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-zinc-400 border-t border-zinc-800/80 pt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
