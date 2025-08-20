'use client'

import React, { useState, useEffect } from 'react'
import { 
  Palette, Type, Bold, Italic, Underline, Settings, ChevronRight,
  Layers, Sparkles, Brush, Square, Circle, Triangle, Minus, Plus,
  Sun, Moon, Zap, Droplet, Flame, Leaf, Database, Table
} from 'lucide-react'
import { chartThemes } from './DesignToolbar'

interface ChartDesignPanelProps {
  selectedItem: any
  onUpdateStyle: (id: string, style: any) => void
  isOpen: boolean
  onToggle: () => void
  isDarkMode?: boolean
  dataTables: any[]
}

const fontFamilies = [
  // Sans-serif fonts
  { name: 'Inter', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
  { name: 'Roboto', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap' },
  { name: 'Open Sans', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap' },
  { name: 'Lato', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap' },
  { name: 'Montserrat', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap' },
  { name: 'Poppins', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap' },
  { name: 'Raleway', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap' },
  { name: 'Nunito', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap' },
  { name: 'Work Sans', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600&display=swap' },
  { name: 'Quicksand', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap' },
  { name: 'Bebas Neue', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap' },
  { name: 'Oswald', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;600&display=swap' },
  
  // Serif fonts
  { name: 'Playfair Display', category: 'Serif', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap' },
  { name: 'Merriweather', category: 'Serif', url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap' },
  { name: 'Lora', category: 'Serif', url: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;600&display=swap' },
  { name: 'Crimson Text', category: 'Serif', url: 'https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap' },
  { name: 'EB Garamond', category: 'Serif', url: 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;600&display=swap' },
  { name: 'Cormorant Garamond', category: 'Serif', url: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap' },
  { name: 'Bitter', category: 'Serif', url: 'https://fonts.googleapis.com/css2?family=Bitter:wght@400;600&display=swap' },
  { name: 'Libre Baskerville', category: 'Serif', url: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap' },
  
  // Display fonts
  { name: 'Abril Fatface', category: 'Display', url: 'https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap' },
  { name: 'Righteous', category: 'Display', url: 'https://fonts.googleapis.com/css2?family=Righteous&display=swap' },
  { name: 'Fredoka One', category: 'Display', url: 'https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap' },
  { name: 'Bungee', category: 'Display', url: 'https://fonts.googleapis.com/css2?family=Bungee&display=swap' },
  { name: 'Rubik Mono One', category: 'Display', url: 'https://fonts.googleapis.com/css2?family=Rubik+Mono+One&display=swap' },
  
  // Monospace fonts
  { name: 'Space Mono', category: 'Monospace', url: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap' },
  { name: 'Fira Code', category: 'Monospace', url: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&display=swap' },
  { name: 'JetBrains Mono', category: 'Monospace', url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap' },
  { name: 'IBM Plex Mono', category: 'Monospace', url: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap' },
  { name: 'Source Code Pro', category: 'Monospace', url: 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;600&display=swap' },
  
  // Handwriting & Script
  { name: 'Dancing Script', category: 'Script', url: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap' },
  { name: 'Pacifico', category: 'Script', url: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap' },
  { name: 'Caveat', category: 'Script', url: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap' },
  { name: 'Satisfy', category: 'Script', url: 'https://fonts.googleapis.com/css2?family=Satisfy&display=swap' },
  { name: 'Great Vibes', category: 'Script', url: 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap' },
  
  // Modern & Tech
  { name: 'Orbitron', category: 'Tech', url: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap' },
  { name: 'Rajdhani', category: 'Tech', url: 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&display=swap' },
  { name: 'Exo 2', category: 'Tech', url: 'https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700&display=swap' },
  { name: 'Audiowide', category: 'Tech', url: 'https://fonts.googleapis.com/css2?family=Audiowide&display=swap' },
  { name: 'Electrolize', category: 'Tech', url: 'https://fonts.googleapis.com/css2?family=Electrolize&display=swap' }
]

function ChartDesignPanel({ selectedItem, onUpdateStyle, isOpen, onToggle, isDarkMode, dataTables }: ChartDesignPanelProps) {
  const [activeTheme, setActiveTheme] = useState(selectedItem?.style?.theme || 'modern')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customColor, setCustomColor] = useState(selectedItem?.style?.primaryColor || '#3B82F6')
  const [fontSize, setFontSize] = useState(selectedItem?.style?.fontSize || 12)
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set())
  const [selectedFontCategory, setSelectedFontCategory] = useState<string>('all')

  useEffect(() => {
    if (selectedItem) {
      setActiveTheme(selectedItem.style?.theme || 'modern')
      setCustomColor(selectedItem.style?.primaryColor || selectedItem.style?.colors?.[0] || '#3B82F6')
      setFontSize(selectedItem.style?.fontSize || 12)
      
      // Load the currently selected font
      const currentFont = selectedItem.style?.font || 'Inter'
      const fontConfig = fontFamilies.find(f => f.name === currentFont)
      if (fontConfig && !loadedFonts.has(fontConfig.name)) {
        const link = document.createElement('link')
        link.href = fontConfig.url
        link.rel = 'stylesheet'
        document.head.appendChild(link)
        setLoadedFonts(prev => new Set(prev).add(fontConfig.name))
      }
    }
  }, [selectedItem])

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

  if (!isOpen) {
    return null
  }

  return (
    <div className={`fixed left-0 top-20 w-80 h-[calc(100vh-80px)] flex flex-col shadow-lg z-10 animate-slideInLeft ${
      isDarkMode ? 'bg-gray-900 border-r-4 border-purple-400' : 'bg-white border-r-4 border-purple-400'
    }`}>
      {/* Header */}
      <div className={`p-3 ${
        isDarkMode 
          ? 'border-b border-gray-700 bg-gradient-to-r from-purple-900 to-pink-900' 
          : 'border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold text-sm flex items-center gap-2 ${
            isDarkMode ? 'text-purple-100' : 'text-purple-800'
          }`}>
            <div className={`p-1 rounded ${
              isDarkMode ? 'bg-purple-800' : 'bg-purple-100'
            }`}>
              <Palette size={14} className={isDarkMode ? 'text-purple-300' : 'text-purple-600'} />
            </div>
            Chart Designer
          </h3>
          <button
            onClick={onToggle}
            className={`p-1 rounded transition-colors ${
              isDarkMode 
                ? 'hover:bg-purple-700 text-purple-300' 
                : 'hover:bg-purple-100 text-purple-600'
            }`}
            title="Close design panel"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {selectedItem ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Chart Title */}
          <div>
            <label className={`text-xs font-medium mb-2 block ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Chart Title
            </label>
            <input
              type="text"
              value={selectedItem.title || ''}
              onChange={(e) => onUpdateStyle(selectedItem.id, { title: e.target.value })}
              placeholder="Enter chart title..."
              className={`w-full px-3 py-2 text-sm border rounded-md transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-400'
              } focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-20`}
            />
          </div>

          {/* Data Source Selector */}
          <div>
            <label className={`text-xs font-medium mb-2 block ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Data Source
            </label>
            <div className="space-y-2">
              {dataTables.length > 0 ? (
                <select
                  value={selectedItem.dataSource || ''}
                  onChange={(e) => {
                    const table = dataTables.find(t => t.id === e.target.value)
                    onUpdateStyle(selectedItem.id, { 
                      dataSource: e.target.value,
                      data: table?.data || selectedItem.data
                    })
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded-md transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-purple-400' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-purple-400'
                  } focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-20`}
                >
                  <option value="">Select a data source...</option>
                  {dataTables.map((table, index) => (
                    <option key={`${table.id}-${index}`} value={table.id}>
                      {table.tableName} ({table.database})
                    </option>
                  ))}
                </select>
              ) : (
                <div className={`p-3 rounded-lg border-2 border-dashed ${
                  isDarkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-gray-50'
                }`}>
                  <div className="text-center">
                    <Database className={`mx-auto h-8 w-8 mb-2 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      No data sources available
                    </p>
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      Switch to Data mode to add data sources
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Theme Presets */}
          <div>
            <label className={`text-xs font-medium mb-2 block ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Themes
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(chartThemes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => applyTheme(key)}
                  className={`p-3 rounded border text-xs transition-all flex flex-col items-center gap-2 ${
                    activeTheme === key
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={theme.name}
                >
                  <div className="text-lg">
                    {key === 'dark' && <Moon size={18} />}
                    {key === 'neon' && <Zap size={18} />}
                    {key === 'pastel' && <Droplet size={18} />}
                    {key === 'gradient' && <Sparkles size={18} />}
                    {key === 'retro' && <Sun size={18} />}
                    {key === 'nature' && <Leaf size={18} />}
                    {key === 'cyberpunk' && <Flame size={18} />}
                    {key === 'modern' && <Square size={18} />}
                  </div>
                  <span className="text-xs capitalize">{key}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className={`text-xs font-medium mb-2 block ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Primary Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => updateColor(e.target.value)}
                className={`w-12 h-8 rounded border cursor-pointer ${
                  isDarkMode ? 'border-gray-600' : 'border-gray-200'
                }`}
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => updateColor(e.target.value)}
                className={`flex-1 px-2 py-1 text-xs border rounded ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-200'
                }`}
              />
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`px-3 py-1 rounded text-xs ${
                  isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Palette size={14} />
              </button>
            </div>
            {showColorPicker && (
              <div className={`mt-2 p-2 rounded ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <div className="grid grid-cols-8 gap-1">
                  {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF00FF', '#00FFFF',
                    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6'].map(color => (
                    <button
                      key={color}
                      onClick={() => updateColor(color)}
                      className="w-6 h-6 rounded border-2 border-white shadow-sm hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Typography */}
          <div>
            <label className={`text-xs font-medium mb-2 block ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Typography
            </label>
            <div className="space-y-2">
              <div className="space-y-2">
                {/* Font Category Filter */}
                <select
                  value={selectedFontCategory}
                  onChange={(e) => setSelectedFontCategory(e.target.value)}
                  className={`w-full px-2 py-1 text-xs border rounded ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <option value="all">All Categories</option>
                  <option value="Sans-serif">Sans-serif</option>
                  <option value="Serif">Serif</option>
                  <option value="Display">Display</option>
                  <option value="Monospace">Monospace</option>
                  <option value="Script">Script & Handwriting</option>
                  <option value="Tech">Modern & Tech</option>
                </select>
                
                {/* Font Selection with Preview */}
                <select
                  onChange={(e) => {
                    const selectedFont = fontFamilies.find(f => f.name === e.target.value)
                    if (selectedFont && !loadedFonts.has(selectedFont.name)) {
                      // Load Google Font
                      const link = document.createElement('link')
                      link.href = selectedFont.url
                      link.rel = 'stylesheet'
                      document.head.appendChild(link)
                      setLoadedFonts(prev => new Set(prev).add(selectedFont.name))
                    }
                    updateFont(e.target.value)
                  }}
                  className={`w-full px-2 py-1 text-xs border rounded ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-200'
                  }`}
                  value={selectedItem.style?.font || 'Inter'}
                  style={{ fontFamily: selectedItem.style?.font || 'Inter' }}
                >
                  {fontFamilies
                    .filter(font => selectedFontCategory === 'all' || font.category === selectedFontCategory)
                    .map(font => {
                      // Load font for preview if not already loaded
                      if (!loadedFonts.has(font.name)) {
                        const link = document.createElement('link')
                        link.href = font.url
                        link.rel = 'stylesheet'
                        document.head.appendChild(link)
                        setLoadedFonts(prev => new Set(prev).add(font.name))
                      }
                      return (
                        <option 
                          key={font.name} 
                          value={font.name} 
                          style={{ fontFamily: font.name }}
                        >
                          {font.name}
                        </option>
                      )
                    })}
                </select>
                
                {/* Font Preview */}
                <div className={`p-3 rounded border ${
                  isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p 
                    style={{ 
                      fontFamily: selectedItem.style?.font || 'Inter',
                      fontSize: `${fontSize}px`
                    }}
                    className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}
                  >
                    The quick brown fox jumps over the lazy dog
                  </p>
                  <p 
                    style={{ 
                      fontFamily: selectedItem.style?.font || 'Inter',
                      fontSize: `${fontSize}px`
                    }}
                    className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    1234567890 !@#$%^&*()
                  </p>
                </div>
              </div>
              
              <div className="flex gap-1">
                <button
                  onClick={() => updateTextStyle('bold')}
                  className={`p-2 rounded flex-1 ${
                    selectedItem.style?.bold 
                      ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700')
                      : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200')
                  }`}
                >
                  <Bold size={14} />
                </button>
                <button
                  onClick={() => updateTextStyle('italic')}
                  className={`p-2 rounded flex-1 ${
                    selectedItem.style?.italic 
                      ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700')
                      : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200')
                  }`}
                >
                  <Italic size={14} />
                </button>
                <button
                  onClick={() => updateTextStyle('underline')}
                  className={`p-2 rounded flex-1 ${
                    selectedItem.style?.underline 
                      ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700')
                      : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200')
                  }`}
                >
                  <Underline size={14} />
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="8"
                    max="32"
                    value={fontSize}
                    onChange={(e) => {
                      e.stopPropagation()
                      updateFontSize(parseInt(e.target.value))
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) => {
                      e.stopPropagation()
                      const value = Math.max(8, Math.min(32, parseInt(e.target.value) || 12))
                      updateFontSize(value)
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`w-12 px-1 py-1 text-xs text-center border rounded ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-1 focus:ring-purple-400`}
                    min="8"
                    max="32"
                  />
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>px</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      updateFontSize(fontSize - 1)
                    }}
                    className={`px-2 py-1 rounded text-xs ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    <Minus size={12} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      updateFontSize(fontSize + 1)
                    }}
                    className={`px-2 py-1 rounded text-xs ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    <Plus size={12} />
                  </button>
                  <div className="flex-1" />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      updateFontSize(12)
                    }}
                    className={`px-2 py-1 rounded text-xs ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Effects */}
          <div>
            <label className={`text-xs font-medium mb-2 block ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Effects & Styling
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateStyle(selectedItem.id, { shadow: !selectedItem.style?.shadow })}
                className={`px-3 py-2 text-xs rounded border ${
                  selectedItem.style?.shadow 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Shadow
              </button>
              <button
                onClick={() => onUpdateStyle(selectedItem.id, { gradients: !selectedItem.style?.gradients })}
                className={`px-3 py-2 text-xs rounded border ${
                  selectedItem.style?.gradients 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Gradient
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

          {/* Chart Padding */}
          <div>
            <label className={`text-xs font-medium mb-2 block ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Chart Padding
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="50"
                value={selectedItem.style?.padding || 16}
                onChange={(e) => onUpdateStyle(selectedItem.id, { padding: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                value={selectedItem.style?.padding || 16}
                onChange={(e) => onUpdateStyle(selectedItem.id, { padding: Math.max(0, Math.min(50, parseInt(e.target.value) || 16)) })}
                className={`w-12 px-1 py-1 text-xs text-center border rounded ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-1 focus:ring-purple-400`}
                min="0"
                max="50"
              />
            </div>
          </div>

          {/* Background Controls */}
          <div>
            <label className={`text-xs font-medium mb-2 block ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Background
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateStyle(selectedItem.id, { background: 'transparent' })}
                  className={`px-3 py-2 text-xs rounded border ${
                    selectedItem.style?.background === 'transparent'
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  None
                </button>
                <button
                  onClick={() => onUpdateStyle(selectedItem.id, { background: '#FFFFFF' })}
                  className={`px-3 py-2 text-xs rounded border ${
                    selectedItem.style?.background === '#FFFFFF'
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  White
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedItem.style?.background || '#FFFFFF'}
                  onChange={(e) => onUpdateStyle(selectedItem.id, { background: e.target.value })}
                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <span className="text-xs text-gray-600">Custom Color</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`flex-1 flex items-center justify-center text-center text-sm ${
          isDarkMode ? 'text-gray-500' : 'text-gray-400'
        }`}>
          Select a chart to customize its design
        </div>
      )}
    </div>
  )
}

export default React.memo(ChartDesignPanel)