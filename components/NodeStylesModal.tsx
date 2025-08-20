'use client'

import React, { useState } from 'react'
import { 
  X, Palette, Square, Circle, Triangle, Hexagon, 
  ArrowRight, ArrowUpRight, Minus, Plus, Brush,
  Layers, Link2, Grid3X3, Sparkles
} from 'lucide-react'

interface NodeStylesModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdateNodeStyles: (styles: any) => void
  currentStyles?: any
  isDarkMode?: boolean
}

export default function NodeStylesModal({ 
  isOpen, 
  onClose, 
  onUpdateNodeStyles,
  currentStyles = {},
  isDarkMode 
}: NodeStylesModalProps) {
  const [activeTab, setActiveTab] = useState<'connectors' | 'frames'>('connectors')
  
  // Connector styles
  const [connectorStyle, setConnectorStyle] = useState(currentStyles.connector?.style || 'bezier')
  const [connectorColor, setConnectorColor] = useState(currentStyles.connector?.color || '#6B7280')
  const [connectorWidth, setConnectorWidth] = useState(currentStyles.connector?.width || 2)
  const [connectorAnimated, setConnectorAnimated] = useState(currentStyles.connector?.animated || false)
  const [connectorArrowStyle, setConnectorArrowStyle] = useState(currentStyles.connector?.arrowStyle || 'default')
  
  // Frame styles
  const [frameBackground, setFrameBackground] = useState(currentStyles.frame?.background || 'transparent')
  const [frameBorderColor, setFrameBorderColor] = useState(currentStyles.frame?.borderColor || '#E5E7EB')
  const [frameBorderWidth, setFrameBorderWidth] = useState(currentStyles.frame?.borderWidth || 1)
  const [frameBorderRadius, setFrameBorderRadius] = useState(currentStyles.frame?.borderRadius || 8)
  const [frameShadow, setFrameShadow] = useState(currentStyles.frame?.shadow || 'none')
  const [framePadding, setFramePadding] = useState(currentStyles.frame?.padding || 16)

  if (!isOpen) return null

  const handleApplyStyles = () => {
    const styles = {
      connector: {
        style: connectorStyle,
        color: connectorColor,
        width: connectorWidth,
        animated: connectorAnimated,
        arrowStyle: connectorArrowStyle
      },
      frame: {
        background: frameBackground,
        borderColor: frameBorderColor,
        borderWidth: frameBorderWidth,
        borderRadius: frameBorderRadius,
        shadow: frameShadow,
        padding: framePadding
      }
    }
    onUpdateNodeStyles(styles)
    onClose()
  }

  const connectorStyles = [
    { value: 'bezier', label: 'Curved', icon: '〰️' },
    { value: 'straight', label: 'Straight', icon: '➖' },
    { value: 'step', label: 'Step', icon: '⚡' },
    { value: 'smoothstep', label: 'Smooth Step', icon: '〽️' }
  ]

  const arrowStyles = [
    { value: 'default', label: 'Default Arrow' },
    { value: 'filled', label: 'Filled Arrow' },
    { value: 'open', label: 'Open Arrow' },
    { value: 'dot', label: 'Dot' },
    { value: 'none', label: 'No Arrow' }
  ]

  const shadowOptions = [
    { value: 'none', label: 'None' },
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large' },
    { value: 'xl', label: 'Extra Large' }
  ]

  const presetColors = [
    '#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6', '#F97316'
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`w-[600px] rounded-xl shadow-2xl overflow-hidden flex flex-col ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'
            }`}>
              <Layers className={`w-5 h-5 ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </div>
            <h2 className={`font-semibold text-lg ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Node Styles
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={() => setActiveTab('connectors')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'connectors'
                ? isDarkMode 
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-purple-600 border-b-2 border-purple-600'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Link2 size={16} />
              Node Connectors
            </div>
          </button>
          <button
            onClick={() => setActiveTab('frames')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'frames'
                ? isDarkMode 
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-purple-600 border-b-2 border-purple-600'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Grid3X3 size={16} />
              Node Frames
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[400px]">
          {activeTab === 'connectors' ? (
            <>
              {/* Connector Style */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Connector Style
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {connectorStyles.map(style => (
                    <button
                      key={style.value}
                      onClick={() => setConnectorStyle(style.value)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        connectorStyle === style.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : isDarkMode
                            ? 'border-gray-600 hover:border-gray-500'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{style.icon}</div>
                      <div className="text-xs">{style.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Connector Color */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Connector Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={connectorColor}
                    onChange={(e) => setConnectorColor(e.target.value)}
                    className="w-12 h-12 rounded border cursor-pointer"
                  />
                  <div className="flex gap-2 flex-1">
                    {presetColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setConnectorColor(color)}
                        className="w-8 h-8 rounded border-2 border-white shadow-sm hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Connector Width */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Connector Width: {connectorWidth}px
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={connectorWidth}
                    onChange={(e) => setConnectorWidth(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className={`text-sm w-10 text-center ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {connectorWidth}
                  </span>
                </div>
              </div>

              {/* Arrow Style */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Arrow Style
                </label>
                <select
                  value={connectorArrowStyle}
                  onChange={(e) => setConnectorArrowStyle(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {arrowStyles.map(style => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Animated */}
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={connectorAnimated}
                    onChange={(e) => setConnectorAnimated(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Animated Flow
                  </span>
                </label>
              </div>
            </>
          ) : (
            <>
              {/* Frame Background */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Frame Background
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={frameBackground === 'transparent' ? '#FFFFFF' : frameBackground}
                    onChange={(e) => setFrameBackground(e.target.value)}
                    className="w-12 h-12 rounded border cursor-pointer"
                  />
                  <button
                    onClick={() => setFrameBackground('transparent')}
                    className={`px-4 py-2 rounded-lg border text-sm ${
                      frameBackground === 'transparent'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : isDarkMode
                          ? 'border-gray-600 hover:border-gray-500'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Transparent
                  </button>
                </div>
              </div>

              {/* Frame Border */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Border Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={frameBorderColor}
                    onChange={(e) => setFrameBorderColor(e.target.value)}
                    className="w-12 h-12 rounded border cursor-pointer"
                  />
                  <div className="flex gap-2 flex-1">
                    {presetColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setFrameBorderColor(color)}
                        className="w-8 h-8 rounded border-2 border-white shadow-sm hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Border Width */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Border Width: {frameBorderWidth}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={frameBorderWidth}
                  onChange={(e) => setFrameBorderWidth(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Border Radius */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Corner Radius: {frameBorderRadius}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={frameBorderRadius}
                  onChange={(e) => setFrameBorderRadius(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Shadow */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Shadow
                </label>
                <select
                  value={frameShadow}
                  onChange={(e) => setFrameShadow(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {shadowOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Padding */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Padding: {framePadding}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="32"
                  value={framePadding}
                  onChange={(e) => setFramePadding(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 p-4 border-t ${
          isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleApplyStyles}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Apply Styles
          </button>
        </div>
      </div>
    </div>
  )
}