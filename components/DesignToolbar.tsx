'use client'

import { useState, useEffect } from 'react'
import { 
  Palette, Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Layers, Sparkles, Brush, Square, Circle, Triangle, Minus, Plus,
  Sun, Moon, Zap, Droplet, Flame, Leaf
} from 'lucide-react'

interface DesignToolbarProps {
  selectedItem: any
  onUpdateStyle: (id: string, style: any) => void
  onClose?: () => void
}

export const chartThemes = {
  modern: {
    name: 'Modern',
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    background: '#FFFFFF',
    gridColor: '#E5E7EB',
    textColor: '#1F2937',
    font: 'Inter',
    gradients: false,
  },
  dark: {
    name: 'Dark Mode',
    colors: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'],
    background: '#1F2937',
    gridColor: '#374151',
    textColor: '#F9FAFB',
    font: 'Inter',
    gradients: false,
  },
  neon: {
    name: 'Neon Glow',
    colors: ['#00F5FF', '#FF00E4', '#FFE500', '#00FF88', '#FF5E00'],
    background: '#0F0F23',
    gridColor: '#1A1A3E',
    textColor: '#FFFFFF',
    font: 'Orbitron',
    gradients: true,
    glowEffect: true,
  },
  pastel: {
    name: 'Soft Pastel',
    colors: ['#FFB6C1', '#FFD700', '#98FB98', '#87CEEB', '#DDA0DD'],
    background: '#FFF5F5',
    gridColor: '#FFE0E0',
    textColor: '#4A5568',
    font: 'Quicksand',
    gradients: false,
  },
  gradient: {
    name: 'Gradient Dreams',
    colors: [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    ],
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gridColor: 'rgba(255,255,255,0.1)',
    textColor: '#FFFFFF',
    font: 'Poppins',
    gradients: true,
  },
  retro: {
    name: 'Retro Wave',
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
    background: '#2C3E50',
    gridColor: '#34495E',
    textColor: '#ECF0F1',
    font: 'Space Mono',
    gradients: false,
  },
  nature: {
    name: 'Nature',
    colors: ['#2ECC71', '#27AE60', '#F39C12', '#E67E22', '#8B4513'],
    background: '#F5F3E9',
    gridColor: '#E8E4D6',
    textColor: '#2C3E50',
    font: 'Merriweather',
    gradients: false,
  },
  cyberpunk: {
    name: 'Cyberpunk',
    colors: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00AA', '#00FF00'],
    background: '#0A0A0A',
    gridColor: '#1A1A1A',
    textColor: '#00FFFF',
    font: 'Rajdhani',
    gradients: true,
    glowEffect: true,
  },
}

const fontFamilies = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 
  'Poppins', 'Playfair Display', 'Merriweather', 'Space Mono',
  'Orbitron', 'Rajdhani', 'Quicksand'
]

export default function DesignToolbar({ selectedItem, onUpdateStyle, onClose }: DesignToolbarProps) {
  const [activeTheme, setActiveTheme] = useState(selectedItem?.style?.theme || 'modern')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showFontPicker, setShowFontPicker] = useState(false)
  const [customColor, setCustomColor] = useState(selectedItem?.style?.primaryColor || '#3B82F6')
  const [fontSize, setFontSize] = useState(selectedItem?.style?.fontSize || 12)

  useEffect(() => {
    if (selectedItem) {
      setActiveTheme(selectedItem.style?.theme || 'modern')
      setCustomColor(selectedItem.style?.primaryColor || selectedItem.style?.colors?.[0] || '#3B82F6')
      setFontSize(selectedItem.style?.fontSize || 12)
    }
  }, [selectedItem])

  if (!selectedItem) return null

  const handleClose = () => {
    // Call the onClose callback if provided
    if (onClose) {
      onClose()
    }
  }

  const applyTheme = (themeKey: string) => {
    const theme = chartThemes[themeKey as keyof typeof chartThemes]
    setActiveTheme(themeKey)
    onUpdateStyle(selectedItem.id, {
      theme: themeKey,
      colors: theme.colors,
      background: theme.background,
      gridColor: theme.gridColor,
      textColor: theme.textColor,
      font: theme.font,
      gradients: theme.gradients,
    })
  }

  const updateColor = (color: string) => {
    setCustomColor(color)
    // Update the first color in the colors array
    const currentColors = selectedItem.style?.colors || ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    const newColors = [color, ...currentColors.slice(1)]
    onUpdateStyle(selectedItem.id, {
      primaryColor: color,
      colors: newColors,
    })
  }

  const updateFont = (font: string) => {
    onUpdateStyle(selectedItem.id, {
      font: font,
    })
  }

  const updateFontSize = (size: number) => {
    setFontSize(size)
    onUpdateStyle(selectedItem.id, {
      fontSize: size,
    })
  }

  const updateTextStyle = (style: string) => {
    onUpdateStyle(selectedItem.id, {
      [style]: !selectedItem.style?.[style],
    })
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 shadow-xl">
      <div className="max-w-full px-4 py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-dm-mono font-medium text-xs uppercase tracking-wider flex items-center gap-2">
            <Layers size={16} />
            DESIGN TOOLS
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Changed from space-y-4 to flex layout */}
        <div className="flex gap-4 items-start overflow-x-auto">

        {/* Theme Presets */}
        <div className="min-w-fit">
          <label className="text-xs font-dm-mono font-medium text-gray-700 mb-1 block uppercase tracking-wider">
            THEMES
          </label>
          <div className="flex gap-1">
            {Object.entries(chartThemes).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => applyTheme(key)}
                className={`p-2 rounded border text-xs transition-all ${
                  activeTheme === key
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                title={theme.name}
              >
                {key === 'dark' && <Moon size={14} />}
                {key === 'neon' && <Zap size={14} />}
                {key === 'pastel' && <Droplet size={14} />}
                {key === 'gradient' && <Sparkles size={14} />}
                {key === 'retro' && <Sun size={14} />}
                {key === 'nature' && <Leaf size={14} />}
                {key === 'cyberpunk' && <Flame size={14} />}
                {key === 'modern' && <Square size={14} />}
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker */}
        <div className="min-w-fit">
          <label className="text-xs font-dm-mono font-medium text-gray-700 mb-1 block uppercase tracking-wider">
            Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={customColor}
              onChange={(e) => updateColor(e.target.value)}
              className="w-12 h-8 rounded border border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => updateColor(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded"
            />
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="px-3 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200"
            >
              <Palette size={14} />
            </button>
          </div>
          {showColorPicker && (
            <div className="mt-2 p-2 bg-gray-50 rounded">
              <div className="grid grid-cols-8 gap-1">
                {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF00FF', '#00FFFF',
                  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6'].map(color => (
                  <button
                    key={color}
                    onClick={() => updateColor(color)}
                    className="w-8 h-8 rounded border-2 border-white shadow-sm hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Typography */}
        <div className="min-w-fit">
          <label className="text-xs font-dm-mono font-medium text-gray-700 mb-1 block uppercase tracking-wider">
            Typography
          </label>
          <div className="flex gap-2">
            <select
              onChange={(e) => updateFont(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-200 rounded"
              value={selectedItem.style?.font || 'Inter'}
            >
              {fontFamilies.map(font => (
                <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
              ))}
            </select>
              <button
                onClick={() => updateTextStyle('bold')}
                className={`p-2 rounded ${selectedItem.style?.bold ? 'bg-blue-100' : 'bg-gray-100'} hover:bg-gray-200`}
              >
                <Bold size={14} />
              </button>
              <button
                onClick={() => updateTextStyle('italic')}
                className={`p-2 rounded ${selectedItem.style?.italic ? 'bg-blue-100' : 'bg-gray-100'} hover:bg-gray-200`}
              >
                <Italic size={14} />
              </button>
              <button
                onClick={() => updateTextStyle('underline')}
                className={`p-2 rounded ${selectedItem.style?.underline ? 'bg-blue-100' : 'bg-gray-100'} hover:bg-gray-200`}
              >
                <Underline size={14} />
              </button>
              <div className="flex items-center gap-1 px-2 bg-gray-100 rounded">
                <button onClick={() => updateFontSize(fontSize - 1)}>
                  <Minus size={14} />
                </button>
                <span className="text-xs w-8 text-center">{fontSize}</span>
                <button onClick={() => updateFontSize(fontSize + 1)}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Effects */}
        <div className="min-w-fit">
          <label className="text-xs font-dm-mono font-medium text-gray-700 mb-1 block uppercase tracking-wider">
            Effects
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateStyle(selectedItem.id, { shadow: !selectedItem.style?.shadow })}
              className={`px-3 py-2 text-xs rounded border ${
                selectedItem.style?.shadow 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              Drop Shadow
            </button>
            <button
              onClick={() => onUpdateStyle(selectedItem.id, { gradients: !selectedItem.style?.gradients })}
              className={`px-3 py-2 text-xs rounded border ${
                selectedItem.style?.gradients 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              Gradient Fill
            </button>
            <button
              onClick={() => onUpdateStyle(selectedItem.id, { rounded: !selectedItem.style?.rounded })}
              className={`px-3 py-2 text-xs rounded border ${
                selectedItem.style?.rounded 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              Rounded
            </button>
            <button
              onClick={() => onUpdateStyle(selectedItem.id, { border: !selectedItem.style?.border })}
              className={`px-3 py-2 text-xs rounded border ${
                selectedItem.style?.border 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              Border
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}