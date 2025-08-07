'use client'

import { useState } from 'react'
import { Palette, Zap } from 'lucide-react'

interface ColorPickerProps {
  label: string
  value?: string
  gradient?: string
  onChange: (color?: string, gradient?: string) => void
  isDarkMode?: boolean
}

export default function ColorPicker({ label, value, gradient, onChange, isDarkMode }: ColorPickerProps) {
  const [colorMode, setColorMode] = useState<'solid' | 'gradient'>(gradient ? 'gradient' : 'solid')
  const [gradientAngle, setGradientAngle] = useState(45)
  const [gradientColor1, setGradientColor1] = useState('#3B82F6')
  const [gradientColor2, setGradientColor2] = useState('#8B5CF6')

  const presetColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'
  ]

  const updateSolidColor = (color: string) => {
    onChange(color, undefined)
  }

  const updateGradient = (angle: number, color1: string, color2: string) => {
    const gradientValue = `linear-gradient(${angle}deg, ${color1}, ${color2})`
    onChange(undefined, gradientValue)
  }

  return (
    <div className="space-y-3">
      <label className={`text-xs font-medium block ${
        isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>
        {label}
      </label>
      
      {/* Color Mode Toggle */}
      <div className={`flex rounded-lg p-1 ${
        isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <button
          onClick={() => setColorMode('solid')}
          className={`flex-1 px-2 py-1 text-xs rounded ${
            colorMode === 'solid'
              ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700')
              : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200')
          }`}
        >
          <Palette size={12} className="inline mr-1" />
          Solid
        </button>
        <button
          onClick={() => setColorMode('gradient')}
          className={`flex-1 px-2 py-1 text-xs rounded ${
            colorMode === 'gradient'
              ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700')
              : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200')
          }`}
        >
          <Zap size={12} className="inline mr-1" />
          Gradient
        </button>
      </div>

      {/* Color Picker Content */}
      {colorMode === 'solid' ? (
        <div className="space-y-2">
          {/* Preset Colors */}
          <div className="grid grid-cols-5 gap-1">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => updateSolidColor(color)}
                className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          
          {/* Custom Color */}
          <div className="flex gap-2">
            <input
              type="color"
              value={value || '#3B82F6'}
              onChange={(e) => updateSolidColor(e.target.value)}
              className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={value || '#3B82F6'}
              onChange={(e) => updateSolidColor(e.target.value)}
              className={`flex-1 px-2 py-1 text-xs rounded ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-200'
              } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="#3B82F6"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Gradient Colors */}
          <div className="flex gap-2">
            <input
              type="color"
              value={gradientColor1}
              onChange={(e) => {
                setGradientColor1(e.target.value)
                updateGradient(gradientAngle, e.target.value, gradientColor2)
              }}
              className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="color"
              value={gradientColor2}
              onChange={(e) => {
                setGradientColor2(e.target.value)
                updateGradient(gradientAngle, gradientColor1, e.target.value)
              }}
              className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="360"
                value={gradientAngle}
                onChange={(e) => {
                  setGradientAngle(parseInt(e.target.value))
                  updateGradient(parseInt(e.target.value), gradientColor1, gradientColor2)
                }}
                className="flex-1"
              />
              <span className={`text-xs w-8 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {gradientAngle}°
              </span>
            </div>
          </div>
          
          {/* Gradient Preview */}
          <div 
            className="h-8 rounded border border-gray-300"
            style={{
              background: `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})`
            }}
          />
        </div>
      )}
    </div>
  )
}