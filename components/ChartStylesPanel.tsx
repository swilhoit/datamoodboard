'use client'

import React, { useState } from 'react'
import { 
  X, Palette, Type, Grid, Eye, EyeOff, 
  Sparkles, Sun, Moon, Zap, Layers,
  Settings, ChevronDown, ChevronUp, Check, Plus
} from 'lucide-react'

interface ChartStylesPanelProps {
  isOpen: boolean
  onClose: () => void
  chartConfig: any
  onConfigChange: (config: any) => void
  chartType: string
}

// Preset themes with comprehensive styling
const PRESET_THEMES = {
  default: {
    name: 'Default',
    icon: Sun,
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    background: '#FFFFFF',
    gridColor: '#E5E7EB',
    textColor: '#1F2937',
    font: 'Inter',
    borderRadius: 8,
    strokeWidth: 2,
    animationDuration: 800
  },
  dark: {
    name: 'Dark Mode',
    icon: Moon,
    colors: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'],
    background: '#1F2937',
    gridColor: '#374151',
    textColor: '#F3F4F6',
    font: 'Inter',
    borderRadius: 8,
    strokeWidth: 2,
    animationDuration: 800
  },
  vibrant: {
    name: 'Vibrant',
    icon: Sparkles,
    colors: ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF'],
    background: '#FAFAFA',
    gridColor: '#E5E5E5',
    textColor: '#18181B',
    font: 'Poppins',
    borderRadius: 12,
    strokeWidth: 3,
    animationDuration: 1000
  },
  minimal: {
    name: 'Minimal',
    icon: Layers,
    colors: ['#000000', '#525252', '#737373', '#A3A3A3', '#D4D4D4'],
    background: '#FFFFFF',
    gridColor: '#F5F5F5',
    textColor: '#000000',
    font: 'DM Mono',
    borderRadius: 0,
    strokeWidth: 1,
    animationDuration: 500
  },
  pastel: {
    name: 'Pastel',
    icon: Zap,
    colors: ['#FFE5E5', '#FFE5F1', '#FFF0E5', '#E5F3FF', '#E5FFEF'],
    background: '#FEFEFE',
    gridColor: '#F8F8F8',
    textColor: '#4A4A4A',
    font: 'Quicksand',
    borderRadius: 16,
    strokeWidth: 2,
    animationDuration: 600
  },
  neon: {
    name: 'Neon',
    icon: Zap,
    colors: ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF00', '#FF0080'],
    background: '#0A0A0A',
    gridColor: '#1A1A1A',
    textColor: '#FFFFFF',
    font: 'Space Mono',
    borderRadius: 4,
    strokeWidth: 2,
    animationDuration: 1200,
    glowEffect: true
  }
}

const FONTS = [
  { value: 'Inter', label: 'Inter', sample: 'Aa' },
  { value: 'DM Mono', label: 'DM Mono', sample: 'Aa' },
  { value: 'Poppins', label: 'Poppins', sample: 'Aa' },
  { value: 'Roboto', label: 'Roboto', sample: 'Aa' },
  { value: 'Open Sans', label: 'Open Sans', sample: 'Aa' },
  { value: 'Quicksand', label: 'Quicksand', sample: 'Aa' },
  { value: 'Space Mono', label: 'Space Mono', sample: 'Aa' },
  { value: 'system-ui', label: 'System', sample: 'Aa' }
]

const COLOR_PALETTES = [
  { name: 'Blue Ocean', colors: ['#0077BE', '#00A8E8', '#00C9FF', '#7EC8E3', '#CAE9FF'] },
  { name: 'Forest', colors: ['#2D5016', '#486B00', '#7FB069', '#A2C523', '#D6ED17'] },
  { name: 'Sunset', colors: ['#FF4E50', '#FC913A', '#F9D423', '#EDE574', '#E1F5C4'] },
  { name: 'Purple Dream', colors: ['#4A0E4E', '#81689D', '#A884B6', '#C9ACD4', '#E8D5F2'] },
  { name: 'Earth Tones', colors: ['#8D5524', '#C68642', '#E0AC69', '#F1C27D', '#FFDBAC'] },
  { name: 'Cyberpunk', colors: ['#FF006E', '#8338EC', '#3A86FF', '#06FFB4', '#FFBE0B'] },
  { name: 'Monochrome', colors: ['#000000', '#3C3C3C', '#787878', '#B4B4B4', '#F0F0F0'] },
  { name: 'Rainbow', colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF'] }
]

export default function ChartStylesPanel({ 
  isOpen, 
  onClose, 
  chartConfig, 
  onConfigChange,
  chartType 
}: ChartStylesPanelProps) {
  const [activeTab, setActiveTab] = useState<'themes' | 'colors' | 'typography' | 'layout'>('themes')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    themes: true,
    colors: false,
    typography: false,
    layout: false
  })

  if (!isOpen) return null

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const applyTheme = (themeKey: string) => {
    const theme = PRESET_THEMES[themeKey as keyof typeof PRESET_THEMES]
    onConfigChange({
      ...chartConfig,
      theme: themeKey,
      colors: theme.colors,
      background: theme.background,
      gridColor: theme.gridColor,
      textColor: theme.textColor,
      font: theme.font,
      borderRadius: theme.borderRadius,
      strokeWidth: theme.strokeWidth,
      animationDuration: theme.animationDuration,
      glowEffect: theme.glowEffect || false
    })
  }

  const applyColorPalette = (palette: typeof COLOR_PALETTES[0]) => {
    onConfigChange({
      ...chartConfig,
      colors: palette.colors,
      colorPaletteName: palette.name
    })
  }

  return (
    <div className="fixed top-20 right-4 z-[9999] w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" />
          <h3 className="font-dm-mono font-medium text-sm uppercase tracking-wider">Chart Styles</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/60 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['themes', 'colors', 'typography', 'layout'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
              activeTab === tab 
                ? 'bg-white text-purple-600 border-b-2 border-purple-600' 
                : 'bg-gray-50 text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-[600px] overflow-y-auto">
        {/* Themes Tab */}
        {activeTab === 'themes' && (
          <div className="p-4 space-y-3">
            <div className="text-xs text-gray-500 mb-3">Select a preset theme to quickly style your chart</div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(PRESET_THEMES).map(([key, theme]) => {
                const Icon = theme.icon
                const isActive = chartConfig?.theme === key
                return (
                  <button
                    key={key}
                    onClick={() => applyTheme(key)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isActive 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={16} className={isActive ? 'text-purple-600' : 'text-gray-600'} />
                      <span className="text-sm font-medium">{theme.name}</span>
                      {isActive && <Check size={14} className="ml-auto text-purple-600" />}
                    </div>
                    <div className="flex gap-1">
                      {theme.colors.slice(0, 5).map((color, i) => (
                        <div 
                          key={i} 
                          className="flex-1 h-3 rounded" 
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Color Palettes</label>
              <div className="space-y-2">
                {COLOR_PALETTES.map(palette => (
                  <button
                    key={palette.name}
                    onClick={() => applyColorPalette(palette)}
                    className={`w-full p-2 rounded-lg border transition-all ${
                      chartConfig?.colorPaletteName === palette.name
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{palette.name}</span>
                      {chartConfig?.colorPaletteName === palette.name && (
                        <Check size={14} className="text-purple-600" />
                      )}
                    </div>
                    <div className="flex gap-1">
                      {palette.colors.map((color, i) => (
                        <div 
                          key={i} 
                          className="flex-1 h-4 rounded" 
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Custom Colors</label>
              <div className="flex gap-2">
                {(chartConfig?.colors || ['#3B82F6']).map((color: string, i: number) => (
                  <div key={i} className="relative">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        const newColors = [...(chartConfig?.colors || [])]
                        newColors[i] = e.target.value
                        onConfigChange({ ...chartConfig, colors: newColors })
                      }}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newColors = [...(chartConfig?.colors || []), '#808080']
                    onConfigChange({ ...chartConfig, colors: newColors })
                  }}
                  className="w-10 h-10 rounded border-2 border-dashed border-gray-300 hover:border-gray-400 flex items-center justify-center"
                >
                  <Plus size={16} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={chartConfig?.background || '#FFFFFF'}
                  onChange={(e) => onConfigChange({ ...chartConfig, background: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={chartConfig?.background || '#FFFFFF'}
                  onChange={(e) => onConfigChange({ ...chartConfig, background: e.target.value })}
                  className="w-24 px-2 text-xs border rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* Typography Tab */}
        {activeTab === 'typography' && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Font Family</label>
              <div className="grid grid-cols-2 gap-2">
                {FONTS.map(font => (
                  <button
                    key={font.value}
                    onClick={() => onConfigChange({ ...chartConfig, font: font.value })}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      chartConfig?.font === font.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{font.label}</span>
                      <span 
                        className="text-lg font-bold" 
                        style={{ fontFamily: font.value }}
                      >
                        {font.sample}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Font Size</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="8"
                  max="20"
                  value={chartConfig?.fontSize || 12}
                  onChange={(e) => onConfigChange({ ...chartConfig, fontSize: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-8">{chartConfig?.fontSize || 12}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Text Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={chartConfig?.textColor || '#1F2937'}
                  onChange={(e) => onConfigChange({ ...chartConfig, textColor: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={chartConfig?.textColor || '#1F2937'}
                  onChange={(e) => onConfigChange({ ...chartConfig, textColor: e.target.value })}
                  className="w-24 px-2 text-xs border rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* Layout Tab */}
        {activeTab === 'layout' && (
          <div className="p-4 space-y-4">
            <div>
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={chartConfig?.showLegend !== false}
                  onChange={(e) => onConfigChange({ ...chartConfig, showLegend: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <span className="text-sm">Show Legend</span>
              </label>
              
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={chartConfig?.showGrid !== false}
                  onChange={(e) => onConfigChange({ ...chartConfig, showGrid: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <span className="text-sm">Show Grid</span>
              </label>

              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={chartConfig?.animated !== false}
                  onChange={(e) => onConfigChange({ ...chartConfig, animated: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <span className="text-sm">Enable Animations</span>
              </label>

              {chartType === 'pie' && (
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={chartConfig?.showLabels !== false}
                    onChange={(e) => onConfigChange({ ...chartConfig, showLabels: e.target.checked })}
                    className="rounded text-purple-600"
                  />
                  <span className="text-sm">Show Labels</span>
                </label>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Border Radius</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={chartConfig?.borderRadius || 8}
                  onChange={(e) => onConfigChange({ ...chartConfig, borderRadius: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-8">{chartConfig?.borderRadius || 8}px</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Stroke Width</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={chartConfig?.strokeWidth || 2}
                  onChange={(e) => onConfigChange({ ...chartConfig, strokeWidth: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-8">{chartConfig?.strokeWidth || 2}px</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Grid Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={chartConfig?.gridColor || '#E5E7EB'}
                  onChange={(e) => onConfigChange({ ...chartConfig, gridColor: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={chartConfig?.gridColor || '#E5E7EB'}
                  onChange={(e) => onConfigChange({ ...chartConfig, gridColor: e.target.value })}
                  className="w-24 px-2 text-xs border rounded"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}