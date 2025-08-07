'use client'

import { Database, LayoutDashboard, Sun, Moon } from 'lucide-react'
import { CanvasMode } from '@/app/page'
import AccountMenu from './AccountMenu'
import PublishButton from './PublishButton'

interface ModeToggleProps {
  mode: CanvasMode
  setMode: (mode: CanvasMode) => void
  isDarkMode?: boolean
  onToggleDarkMode?: () => void
}

export default function ModeToggle({ mode, setMode, isDarkMode, onToggleDarkMode }: ModeToggleProps) {
  return (
    <div className="px-4 py-3 bg-transparent">
      <div className="flex items-center justify-between">
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
        
        <div className="flex items-center gap-4">
          {/* Publish Button - only show in design mode */}
          {mode === 'design' && (
            <PublishButton isDarkMode={isDarkMode} />
          )}
          
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}

          <AccountMenu isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  )
}