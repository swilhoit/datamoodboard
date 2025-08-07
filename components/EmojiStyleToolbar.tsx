'use client'

import { useState, useRef, useEffect } from 'react'
import { Palette, Type } from 'lucide-react'

interface EmojiStyleToolbarProps {
  element: any
  isSelected: boolean
  onUpdate: (id: string, updates: any) => void
}

export default function EmojiStyleToolbar({ element, isSelected, onUpdate }: EmojiStyleToolbarProps) {
  const [showPanel, setShowPanel] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const sizes = [24, 32, 48, 64, 96, 128]

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowPanel(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!isSelected || element.type !== 'emoji') return null

  return (
    <div className="absolute -top-12 left-0 z-50" ref={panelRef}>
      {/* Toggle Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Emoji Style"
      >
        <Type size={14} />
      </button>

      {/* Style Panel */}
      {showPanel && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50">
          <div className="space-y-3">
            {/* Size */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Size: {element.fontSize || 48}px
              </label>
              <div className="grid grid-cols-3 gap-1">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => onUpdate(element.id, { fontSize: size })}
                    className={`px-2 py-1 text-xs rounded transition-all ${
                      (element.fontSize || 48) === size 
                        ? 'bg-blue-100 text-blue-600 border border-blue-300' 
                        : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    {size}px
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Preview</label>
              <div className="flex items-center justify-center h-16 bg-gray-50 rounded border">
                <span style={{ fontSize: element.fontSize || 48 }}>
                  {element.emoji || '🙂'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}