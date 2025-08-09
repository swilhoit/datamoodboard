'use client'

import React from 'react'
import { Menu, FilePlus2, FolderOpen, Save, Moon, Sun } from 'lucide-react'

interface MainMenuProps {
  isDarkMode?: boolean
  isSaving?: boolean
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onToggleDarkMode: () => void
}

export default function MainMenu({
  isDarkMode = false,
  isSaving = false,
  onNew,
  onOpen,
  onSave,
  onToggleDarkMode,
}: MainMenuProps) {
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = navigator.platform.toLowerCase().includes('mac') ? e.metaKey : e.ctrlKey
      if (!isMeta) return
      if (e.key.toLowerCase() === 's') {
        e.preventDefault()
        onSave()
      } else if (e.key.toLowerCase() === 'o') {
        e.preventDefault()
        onOpen()
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        onNew()
      } else if (e.key.toLowerCase() === 'd') {
        // Cmd/Ctrl + D to toggle dark mode
        e.preventDefault()
        onToggleDarkMode()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onNew, onOpen, onSave, onToggleDarkMode])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`px-3 py-2 rounded-lg shadow-md transition-colors flex items-center gap-2 ${
          isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        title="Menu"
      >
        <Menu size={18} />
        <span className="text-sm">menu</span>
      </button>

      {open && (
        <div
          className={`absolute mt-2 w-56 rounded-lg border shadow-lg overflow-hidden z-50 ${
            isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <MenuItem
            isDarkMode={isDarkMode}
            icon={<FilePlus2 size={16} />}
            label="New"
            shortcut={navigator.platform.toLowerCase().includes('mac') ? '⌘N' : 'Ctrl+N'}
            onClick={() => {
              setOpen(false)
              onNew()
            }}
          />
          <MenuItem
            isDarkMode={isDarkMode}
            icon={<FolderOpen size={16} />}
            label="Open"
            shortcut={navigator.platform.toLowerCase().includes('mac') ? '⌘O' : 'Ctrl+O'}
            onClick={() => {
              setOpen(false)
              onOpen()
            }}
          />
          <MenuItem
            isDarkMode={isDarkMode}
            icon={<Save size={16} />}
            label={isSaving ? 'Saving…' : 'Save'}
            shortcut={navigator.platform.toLowerCase().includes('mac') ? '⌘S' : 'Ctrl+S'}
            disabled={isSaving}
            onClick={() => {
              setOpen(false)
              onSave()
            }}
          />
          <div className={isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-200'} />
          <MenuItem
            isDarkMode={isDarkMode}
            icon={isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            label={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            shortcut={navigator.platform.toLowerCase().includes('mac') ? '⌘D' : 'Ctrl+D'}
            onClick={() => {
              setOpen(false)
              onToggleDarkMode()
            }}
          />
        </div>
      )}
    </div>
  )
}

function MenuItem({
  isDarkMode,
  icon,
  label,
  shortcut,
  onClick,
  disabled,
}: {
  isDarkMode?: boolean
  icon: React.ReactNode
  label: string
  shortcut?: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left transition-colors ${
        disabled
          ? isDarkMode
            ? 'text-gray-500 cursor-not-allowed'
            : 'text-gray-400 cursor-not-allowed'
          : isDarkMode
            ? 'text-gray-200 hover:bg-gray-800'
            : 'text-gray-800 hover:bg-gray-100'
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        <span className="text-sm">{label}</span>
      </span>
      {shortcut && <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{shortcut}</span>}
    </button>
  )
}


