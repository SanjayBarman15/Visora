"use client"

import Image from "next/image"

export function VisoraFooter() {
  return (
    <footer className="border-t border-slate-900 bg-[#05070a] py-12">
      <div className="container mx-auto px-6 max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Image
            src="/visora_logo_removebg.png"
            alt="Visora Logo"
            width={24}
            height={24}
            className="object-contain"
          />
          <span className="font-sans font-bold text-white text-sm">Visora</span>
          <span className="text-slate-600 font-mono text-[10px] ml-2">v0.1.0</span>
        </div>

        <div className="flex items-center gap-6 text-xs font-mono text-slate-600">
          <span>&copy; {new Date().getFullYear()} Visora Inc.</span>
          <a href="#" className="hover:text-slate-400">Terms</a>
          <a href="#" className="hover:text-slate-400">Privacy</a>
        </div>
      </div>
    </footer>
  )
}
