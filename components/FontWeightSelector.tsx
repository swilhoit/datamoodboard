'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { googleFonts } from './FontSelector'

interface FontWeightSelectorProps {
  selectedFont: string
  selectedWeight: string | number
  onWeightChange: (weight: string | number) => void
}

const weightLabels: Record<string, string> = {
  '100': 'Thin',
  '200': 'Extra Light',
  '300': 'Light',
  '400': 'Regular',
  '500': 'Medium',
  '600': 'Semi Bold',
  '700': 'Bold',
  '800': 'Extra Bold',
  '900': 'Black'
}

export default function FontWeightSelector({ 
  selectedFont, 
  selectedWeight, 
  onWeightChange 
}: FontWeightSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get available weights for the selected font
  const fontData = googleFonts.find(font => font.name === selectedFont)
  const availableWeights = fontData?.weights || ['400']

  // Ensure selected weight is valid for current font
  useEffect(() => {
    if (!availableWeights.includes(String(selectedWeight))) {
      // Default to 400 if available, otherwise first available weight
      const defaultWeight = availableWeights.includes('400') ? '400' : availableWeights[0]
      onWeightChange(defaultWeight)
    }
  }, [selectedFont, selectedWeight, availableWeights, onWeightChange])

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

  const handleWeightSelect = (weight: string) => {
    onWeightChange(weight)
    setIsOpen(false)
  }

  const getDisplayLabel = (weight: string) => {
    const label = weightLabels[weight]
    return label ? `${weight} ${label}` : weight
  }

  const currentLabel = weightLabels[String(selectedWeight)] || String(selectedWeight)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Weight Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-200 rounded hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-16"
        style={{ 
          fontFamily: selectedFont,
          fontWeight: selectedWeight
        }}
      >
        <span className="truncate">{currentLabel}</span>
        <ChevronDown size={10} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-60 overflow-y-auto">
          <div className="py-1">
            {availableWeights.map(weight => (
              <button
                key={weight}
                onClick={() => handleWeightSelect(weight)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between text-xs"
              >
                <span 
                  style={{ 
                    fontFamily: selectedFont,
                    fontWeight: weight
                  }}
                  className="truncate"
                >
                  {getDisplayLabel(weight)}
                </span>
                {String(selectedWeight) === weight && (
                  <Check size={12} className="text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}