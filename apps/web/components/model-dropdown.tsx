'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export function ModelDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState('v mid')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const options = ['v low', 'v mid', 'v high']

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 text-xs text-zinc-300 flex items-center gap-1.5 cursor-pointer transition-colors font-medium select-none"
      >
        <span>{selected}</span>
        <ChevronDown 
          className="h-3 w-3 text-zinc-500 transition-transform duration-200" 
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} 
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 w-28 bg-zinc-900 border border-zinc-800 rounded-lg p-1 shadow-2xl z-50 flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                setSelected(option)
                setIsOpen(false)
              }}
              className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                selected === option
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <span>{option}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
