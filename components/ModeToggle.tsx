'use client'

import { Database, LayoutDashboard } from 'lucide-react'
import { CanvasMode } from '@/app/page'

interface ModeToggleProps {
  mode: CanvasMode
  setMode: (mode: CanvasMode) => void
  isDarkMode?: boolean
  onToggleDarkMode?: () => void
}

export default function ModeToggle({ mode, setMode, isDarkMode }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-4">
      <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Data Moodboard
      </h1>
      <div className="flex rounded-lg p-1">
        <button
          onClick={() => setMode('design')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
            mode === 'design'
              ? (isDarkMode ? 'bg-gray-700 text-blue-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm')
              : (isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800')
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-sm font-medium">Design</span>
        </button>
        <button
          onClick={() => setMode('data')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
            mode === 'data'
              ? (isDarkMode ? 'bg-gray-700 text-blue-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm')
              : (isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800')
          }`}
        >
          <Database size={18} />
          <span className="text-sm font-medium">Data</span>
        </button>
      </div>
    </div>
  )
}