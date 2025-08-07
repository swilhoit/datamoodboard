'use client'

import { useState, useRef, useEffect } from 'react'
import { Shapes, Square, Circle, Triangle, ChevronDown } from 'lucide-react'

interface ShapesDropdownProps {
  onAddShape: (shapeType: string) => void
}

export default function ShapesDropdown({ onAddShape }: ShapesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const shapes = [
    { type: 'rectangle', icon: Square, label: 'Rectangle' },
    { type: 'circle', icon: Circle, label: 'Circle' },
    { type: 'triangle', icon: Triangle, label: 'Triangle' },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleShapeSelect = (shapeType: string) => {
    onAddShape(shapeType)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Shapes Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-all-smooth button-press relative group flex items-center gap-1"
        title="Shapes"
      >
        <Shapes size={18} />
        <ChevronDown size={12} />
        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Shapes
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
          {shapes.map((shape) => (
            <button
              key={shape.type}
              onClick={() => handleShapeSelect(shape.type)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <shape.icon size={16} />
              {shape.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}