'use client'

import { useState } from 'react'
import { Square, Image, Palette, Upload, X, Loader2 } from 'lucide-react'

interface BackgroundSettingsProps {
  background: any
  onUpdateBackground: (background: any) => void
  showGrid: boolean
  onToggleGrid: (show: boolean) => void
  isDarkMode?: boolean
}

const gradientPresets = [
  { name: 'Sunset', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #667eea 0%, #00c6fb 100%)' },
  { name: 'Fire', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Forest', value: 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)' },
  { name: 'Sky', value: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' },
  { name: 'Peach', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { name: 'Purple', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { name: 'Rainbow', value: 'linear-gradient(135deg, #ff0844 0%, #ffb199 25%, #ffeb3b 50%, #00ff00 75%, #00bfff 100%)' },
  { name: 'Dark', value: 'linear-gradient(135deg, #434343 0%, #000000 100%)' },
  { name: 'Light', value: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)' },
]

export default function BackgroundSettings({
  background,
  onUpdateBackground,
  showGrid,
  onToggleGrid,
  isDarkMode
}: BackgroundSettingsProps) {
  const [backgroundType, setBackgroundType] = useState<'color' | 'gradient' | 'image'>(
    background?.type || 'color'
  )
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [customGradient, setCustomGradient] = useState('')
  const [gradientAngle, setGradientAngle] = useState(135)
  const [gradientColor1, setGradientColor1] = useState('#667eea')
  const [gradientColor2, setGradientColor2] = useState('#764ba2')

  const handleColorChange = (color: string) => {
    onUpdateBackground({
      type: 'color',
      value: color
    })
  }

  const handleGradientSelect = (gradient: string) => {
    onUpdateBackground({
      type: 'gradient',
      value: gradient
    })
  }

  const handleCustomGradient = () => {
    const gradient = `linear-gradient(${gradientAngle}deg, ${gradientColor1} 0%, ${gradientColor2} 100%)`
    onUpdateBackground({
      type: 'gradient',
      value: gradient
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        onUpdateBackground({
          type: 'image',
          value: event.target?.result as string
        })
        setShowImageUpload(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUrl = (url: string) => {
    onUpdateBackground({
      type: 'image',
      value: url
    })
    setShowImageUpload(false)
  }

  return (
    <div className="space-y-3">
      {/* Background Type Selector */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded">
        <button
          onClick={() => setBackgroundType('color')}
          className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
            backgroundType === 'color' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Square size={12} className="inline mr-1" />
          Color
        </button>
        <button
          onClick={() => setBackgroundType('gradient')}
          className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
            backgroundType === 'gradient' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Palette size={12} className="inline mr-1" />
          Gradient
        </button>
        <button
          onClick={() => setBackgroundType('image')}
          className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
            backgroundType === 'image' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Image size={12} className="inline mr-1" />
          Image
        </button>
      </div>

      {/* Color Picker */}
      {backgroundType === 'color' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={background?.value || '#F3F4F6'}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={background?.value || '#F3F4F6'}
              onChange={(e) => handleColorChange(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded"
              placeholder="#F3F4F6"
            />
          </div>
          
          {/* Quick color presets */}
          <div className="grid grid-cols-8 gap-1">
            {['#FFFFFF', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#374151', '#1F2937'].map(color => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Gradient Selector */}
      {backgroundType === 'gradient' && (
        <div className="space-y-2">
          {/* Gradient Presets */}
          <div className="grid grid-cols-2 gap-1">
            {gradientPresets.map(preset => (
              <button
                key={preset.name}
                onClick={() => handleGradientSelect(preset.value)}
                className="h-8 rounded text-xs text-white font-medium hover:scale-105 transition-transform"
                style={{ background: preset.value }}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Custom Gradient Builder */}
          <div className="p-2 bg-gray-50 rounded space-y-2">
            <div className="text-xs font-medium text-gray-700">Custom Gradient</div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={gradientColor1}
                onChange={(e) => setGradientColor1(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="color"
                value={gradientColor2}
                onChange={(e) => setGradientColor2(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="number"
                value={gradientAngle}
                onChange={(e) => setGradientAngle(Number(e.target.value))}
                className="w-16 px-2 py-1 text-xs border border-gray-200 rounded"
                placeholder="135"
                min="0"
                max="360"
              />
              <span className="text-xs text-gray-500">°</span>
              <button
                onClick={handleCustomGradient}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
            <div 
              className="h-8 rounded border border-gray-200"
              style={{ 
                background: `linear-gradient(${gradientAngle}deg, ${gradientColor1} 0%, ${gradientColor2} 100%)`
              }}
            />
          </div>
        </div>
      )}

      {/* Image Background */}
      {backgroundType === 'image' && (
        <div className="space-y-2">
          <button
            onClick={() => setShowImageUpload(true)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Upload size={14} />
            Upload Image
          </button>

          {/* Image URL Input */}
          <div className="flex gap-1">
            <input
              type="text"
              placeholder="Or paste image URL..."
              className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  handleImageUrl(e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>

          {/* Current image preview */}
          {background?.type === 'image' && background?.value && (
            <div className="relative">
              <img 
                src={background.value} 
                alt="Background" 
                className="w-full h-20 object-cover rounded border border-gray-200"
              />
              <button
                onClick={() => onUpdateBackground({ type: 'color', value: '#F3F4F6' })}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Grid Toggle */}
      <label className={`flex items-center gap-2 text-xs ${
        isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>
        <input
          type="checkbox"
          checked={showGrid}
          onChange={(e) => onToggleGrid(e.target.checked)}
          className={`rounded ${
            isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300'
          }`}
        />
        Show Grid
      </label>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upload Background Image</h3>
              <button
                onClick={() => setShowImageUpload(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Drag and drop an image here, or click to browse
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="bg-image-upload"
              />
              <label
                htmlFor="bg-image-upload"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block"
              >
                Choose Image
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}