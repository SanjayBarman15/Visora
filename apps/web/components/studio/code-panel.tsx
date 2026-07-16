'use client'

import { useVisoraStore } from '@/store/useVisoraStore'
import { gooeyToast } from '@/components/ui/goey-toaster'
import { Code2, Copy, Download, RotateCcw, Loader2 } from 'lucide-react'

export function CodePanel() {
  const { forgeCode, scenePlan, generateCode, isGenerating } = useVisoraStore()

  if (!forgeCode) return null

  const filename = `${forgeCode.scene_class_name}.py`

  const handleCopy = () => {
    navigator.clipboard.writeText(forgeCode.code)
    gooeyToast.success('Copied to clipboard!')
  }

  const handleDownload = () => {
    const blob = new Blob([forgeCode.code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    gooeyToast.success(`Downloaded ${filename}`)
  }

  const handleRegenerate = async () => {
    if (!scenePlan) return
    gooeyToast.success('Regenerating code...')
    await generateCode()
  }

  // Split code into lines for display
  const lines = forgeCode.code.split('\n')

  return (
    <div className="h-full flex flex-col bg-zinc-950/80 backdrop-blur-sm">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-zinc-900 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Code2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span
            className="text-xs font-mono text-zinc-300 truncate"
            title={filename}
          >
            {filename}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <button
            onClick={handleCopy}
            className="h-7 px-2.5 rounded-md bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Copy className="h-3 w-3" />
            Copy
          </button>
          <button
            onClick={handleDownload}
            className="h-7 px-2.5 rounded-md bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Download className="h-3 w-3" />
            Save
          </button>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <div className="flex min-h-full">
          {/* Line numbers */}
          <div className="shrink-0 select-none py-4 px-3 text-right bg-zinc-950/60 border-r border-zinc-900">
            {lines.map((_, i) => (
              <div key={i} className="text-[10px] font-mono text-zinc-700 leading-5">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code content */}
          <pre className="flex-1 py-4 px-4 text-[11px] font-mono text-zinc-300 leading-5 overflow-x-auto whitespace-pre">
            <code>{forgeCode.code}</code>
          </pre>
        </div>
      </div>

      {/* Footer — Regenerate */}
      <div className="px-4 py-3 border-t border-zinc-900 shrink-0">
        <button
          onClick={handleRegenerate}
          disabled={isGenerating}
          className="w-full py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Regenerating...
            </>
          ) : (
            <>
              <RotateCcw className="h-3.5 w-3.5" />
              Regenerate Code
            </>
          )}
        </button>
      </div>
    </div>
  )
}
