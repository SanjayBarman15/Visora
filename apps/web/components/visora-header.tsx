"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"

interface VisoraHeaderProps {
  minimal?: boolean
}

export function VisoraHeader({ minimal = false }: VisoraHeaderProps) {
  const { session } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-[#05070a]/80 backdrop-blur-md">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <Image
            src={mounted && resolvedTheme === "dark" ? "/visora_logo_dark_removebg.png" : "/visora_logo_light_removebg.png"}
            alt="Visora Logo"
            width={32}
            height={32}
            className="object-contain"
          />
          <span className="font-sans font-bold tracking-tight text-slate-900 dark:text-white text-lg">Visora</span>
        </Link>

        {minimal ? (
          <div className="flex items-center gap-4">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="w-8 h-8 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            )}
            <div className="text-xs font-mono text-slate-500">
              01.Authentication
            </div>
          </div>
        ) : (
          <>
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-mono text-slate-500 dark:text-slate-400">
              <Link href="/#pipeline" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                01.Pipeline
              </Link>
              <Link href="/#gallery" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                02.Gallery
              </Link>
              <Link href="/#compare" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                03.Differentiation
              </Link>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="w-8 h-8 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              )}
              {session ? (
                <Link href="/dashboard">
                  <Button className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="hidden sm:inline-flex text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer">
                      Start Generating
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  )
}
