'use client'

import { useState, useRef, useEffect } from 'react'
import { Paintbrush, ChevronDown } from 'lucide-react'

interface MarkerToolProps {
  onSelectMarker: (config: MarkerConfig) => void
  onToolChange?: (tool: string) => void
  isActive: boolean
  isDarkMode?: boolean
}

interface MarkerConfig {
  type: 'marker'
  color: string
  size: number
  opacity: number
}

export default function MarkerTool({ onSelectMarker, onToolChange, isActive }: MarkerToolProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#FF6B6B')
  const [selectedSize, setSelectedSize] = useState(4)
  const [selectedOpacity, setSelectedOpacity] = useState(0.8)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA', '#F1948A', '#D7DBDD',
    '#2C3E50', '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6'
  ]

  const sizes = [2, 4, 8, 12, 16, 20]

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

  const handleMarkerSelect = () => {
    const config: MarkerConfig = {
      type: 'marker',
      color: selectedColor,
      size: selectedSize,
      opacity: selectedOpacity
    }
    onSelectMarker(config)
    if (onToolChange) onToolChange('marker')
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Marker Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-all-smooth button-press relative group flex items-center gap-1 ${
          isActive 
            ? 'bg-gray-200 text-gray-800' 
            : 'hover:bg-gray-100 text-gray-700'
        }`}
        title="Marker Tool"
      >
        <Paintbrush size={18} />
        <ChevronDown size={12} />
        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Marker Tool
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
          <div className="space-y-4">
            {/* Colors */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Color</label>
              <div className="grid grid-cols-6 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color ? 'border-gray-400 ring-2 ring-gray-300' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Size: {selectedSize}px
              </label>
              <div className="flex items-center gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                      selectedSize === size ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                    }`}
                    title={`${size}px`}
                  >
                    <div
                      className="rounded-full bg-current"
                      style={{ width: size, height: size }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Opacity: {Math.round(selectedOpacity * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={selectedOpacity}
                onChange={(e) => setSelectedOpacity(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Preview */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Preview</label>
              <div className="h-12 bg-gray-50 rounded flex items-center justify-center">
                <div
                  className="rounded-full"
                  style={{
                    width: selectedSize,
                    height: selectedSize,
                    backgroundColor: selectedColor,
                    opacity: selectedOpacity
                  }}
                />
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={handleMarkerSelect}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Use Marker
            </button>
          </div>
        </div>
      )}
    </div>
  )
}