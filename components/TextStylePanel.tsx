'use client'

import { useState } from 'react'
import { 
  Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, 
  Palette, Minus, Plus, ChevronRight, Settings, Zap
} from 'lucide-react'
import FontSelector from './FontSelector'

interface TextStylePanelProps {
  selectedItem: any
  onUpdateStyle: (id: string, updates: any) => void
  isOpen: boolean
  onToggle: () => void
  isDarkMode?: boolean
}

export default function TextStylePanel({ 
  selectedItem, 
  onUpdateStyle, 
  isOpen, 
  onToggle, 
  isDarkMode 
}: TextStylePanelProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [colorMode, setColorMode] = useState<'solid' | 'gradient'>('solid')
  const [gradientAngle, setGradientAngle] = useState(45)
  const [gradientColor1, setGradientColor1] = useState('#3B82F6')
  const [gradientColor2, setGradientColor2] = useState('#8B5CF6')

  if (!isOpen) {
    return null
  }

  const updateStyle = (styleUpdate: any) => {
    onUpdateStyle(selectedItem.id, styleUpdate)
  }

  return (
    <div className={`fixed left-0 top-20 w-80 h-[calc(100vh-80px)] flex flex-col animate-slideInLeft ${
      isDarkMode ? 'bg-gray-900 border-r-4 border-emerald-400' : 'bg-white border-r-4 border-emerald-400'
    } shadow-lg z-10`}>
      {/* Header */}
      <div className={`p-3 ${
        isDarkMode 
          ? 'border-b border-gray-700 bg-gradient-to-r from-emerald-900 to-green-900' 
          : 'border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold text-sm flex items-center gap-2 ${
            isDarkMode ? 'text-emerald-100' : 'text-emerald-800'
          }`}>
            <div className={`p-1 rounded ${
              isDarkMode ? 'bg-emerald-800' : 'bg-emerald-100'
            }`}>
              <Type size={14} className={isDarkMode ? 'text-emerald-300' : 'text-emerald-600'} />
            </div>
            Text Styling
          </h3>
          <button
            onClick={onToggle}
            className={`p-1 rounded transition-colors ${
              isDarkMode 
                ? 'hover:bg-emerald-700 text-emerald-300' 
                : 'hover:bg-emerald-100 text-emerald-600'
            }`}
            title="Close text style panel"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {selectedItem && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Font Family */}
          <div>
            <label className={`text-xs font-medium mb-2 block ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Font Family
            </label>
            <FontSelector
              selectedFont={selectedItem.fontFamily || 'Inter'}
              onFontChange={(font) => updateStyle({ fontFamily: font })}
            />
          </div>

          {/* Font Size */}
          <div>
            <label className={`text-xs font-medium mb-2 block ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Font Size
            </label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateStyle({ fontSize: Math.max(8, (selectedItem.fontSize || 16) - 2) })}
                className={`p-1 rounded ${
                  isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
                title="Decrease font size"
              >
                <Minus size={14} />
              </button>
              <span className={`text-xs w-8 text-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {selectedItem.fontSize || 16}
              </span>
              <button
                onClick={() => updateStyle({ fontSize: Math.min(72, (selectedItem.fontSize || 16) + 2) })}
                className={`p-1 rounded ${
                  isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
                title="Increase font size"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Text Style */}
          <div>
            <label className={`text-xs font-medium mb-2 block ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Text Style
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => updateStyle({ bold: !selectedItem.bold })}
                className={`p-2 rounded flex-1 ${
                  selectedItem.bold 
                    ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700')
                    : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200')
                }`}
              >
                <Bold size={14} />
              </button>
              <button
                onClick={() => updateStyle({ italic: !selectedItem.italic })}
                className={`p-2 rounded flex-1 ${
                  selectedItem.italic 
                    ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700')
                    : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200')
                }`}
              >
                <Italic size={14} />
              </button>
              <button
                onClick={() => updateStyle({ underline: !selectedItem.underline })}
                className={`p-2 rounded flex-1 ${
                  selectedItem.underline 
                    ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700')
                    : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200')
                }`}
              >
                <Underline size={14} />
              </button>
            </div>
          </div>

          {/* Text Alignment */}
          <div>
            <label className={`text-xs font-medium mb-2 block ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Text Alignment
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => updateStyle({ align: 'left' })}
                className={`p-2 rounded flex-1 ${
                  (selectedItem.align || 'left') === 'left'
                    ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700')
                    : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200')
                }`}
              >
                <AlignLeft size={14} />
              </button>
              <button
                onClick={() => updateStyle({ align: 'center' })}
                className={`p-2 rounded flex-1 ${
                  selectedItem.align === 'center'
                    ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700')
                    : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200')
                }`}
              >
                <AlignCenter size={14} />
              </button>
              <button
                onClick={() => updateStyle({ align: 'right' })}
                className={`p-2 rounded flex-1 ${
                  selectedItem.align === 'right'
                    ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700')
                    : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200')
                }`}
              >
                <AlignRight size={14} />
              </button>
            </div>
          </div>

          {/* Text Color */}
          <div>
            <label className={`text-xs font-medium mb-2 block ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Text Color
            </label>
            
            {/* Color Mode Toggle */}
            <div className="flex gap-1 mb-2">
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

            {colorMode === 'solid' ? (
              <div className="flex gap-2">
                <input
                  type="color"
                  value={selectedItem.color || '#1F2937'}
                  onChange={(e) => updateStyle({ color: e.target.value, gradient: null })}
                  className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedItem.color || '#1F2937'}
                  onChange={(e) => updateStyle({ color: e.target.value, gradient: null })}
                  className={`flex-1 px-2 py-1 text-xs rounded ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-200'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className={`px-3 py-1 text-xs rounded ${
                    isDarkMode 
                      ? 'bg-gray-800 hover:bg-gray-700' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <Palette size={14} />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={gradientColor1}
                    onChange={(e) => {
                      setGradientColor1(e.target.value)
                      const gradient = `linear-gradient(${gradientAngle}deg, ${e.target.value}, ${gradientColor2})`
                      updateStyle({ gradient, color: null })
                    }}
                    className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="color"
                    value={gradientColor2}
                    onChange={(e) => {
                      setGradientColor2(e.target.value)
                      const gradient = `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${e.target.value})`
                      updateStyle({ gradient, color: null })
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
                        const gradient = `linear-gradient(${e.target.value}deg, ${gradientColor1}, ${gradientColor2})`
                        updateStyle({ gradient, color: null })
                      }}
                      className="flex-1"
                    />
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {gradientAngle}°
                    </span>
                  </div>
                </div>
                <div className="h-6 rounded border"
                  style={{
                    background: `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})`
                  }}
                />
              </div>
            )}
            {showColorPicker && (
              <div className={`mt-2 p-2 rounded ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <div className="grid grid-cols-8 gap-1">
                  {['#1F2937', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6', '#FFFFFF',
                    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981', '#14B8A6',
                    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E'].map(color => (
                    <button
                      key={color}
                      onClick={() => updateStyle({ color })}
                      className="w-6 h-6 rounded border-2 border-white shadow-sm hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}