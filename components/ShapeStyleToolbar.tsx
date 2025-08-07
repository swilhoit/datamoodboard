'use client'

import { useState } from 'react'
import { X, Shapes, Square } from 'lucide-react'
import ColorPicker from './ColorPicker'

interface ShapeStyleToolbarProps {
  element: any
  isOpen: boolean
  onUpdate: (id: string, updates: any) => void
  onToggle: () => void
  isDarkMode?: boolean
}

export default function ShapeStyleToolbar({ element, isOpen, onUpdate, onToggle, isDarkMode }: ShapeStyleToolbarProps) {
  if (!isOpen || !element || element.type !== 'shape') return null

  const updateStyle = (styleUpdate: any) => {
    onUpdate(element.id, styleUpdate)
  }

  return (
    <div className={`fixed left-0 top-20 w-80 h-[calc(100vh-80px)] flex flex-col animate-slideInLeft ${
      isDarkMode ? 'bg-gray-900 border-r-4 border-orange-400' : 'bg-white border-r-4 border-orange-400'
    } shadow-lg z-10`}>
      {/* Header */}
      <div className={`p-3 ${
        isDarkMode 
          ? 'border-b border-gray-700 bg-gradient-to-r from-orange-900 to-red-900' 
          : 'border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold text-sm flex items-center gap-2 ${
            isDarkMode ? 'text-orange-100' : 'text-orange-800'
          }`}>
            <div className={`p-1 rounded ${
              isDarkMode ? 'bg-orange-800' : 'bg-orange-100'
            }`}>
              <Shapes size={14} className={isDarkMode ? 'text-orange-300' : 'text-orange-600'} />
            </div>
            Shape Style
          </h3>
          <button
            onClick={onToggle}
            className={`p-1 rounded hover:bg-opacity-20 hover:bg-white ${
              isDarkMode ? 'text-orange-300' : 'text-orange-600'
            }`}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Fill Color */}
        <ColorPicker
          label="Fill Color"
          value={element.fill}
          gradient={element.fillGradient}
          onChange={(color, gradient) => updateStyle({ 
            fill: color,
            fillGradient: gradient
          })}
          isDarkMode={isDarkMode}
        />

        {/* Stroke Settings */}
        <div className="space-y-3">
          <label className={`text-xs font-medium block ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Stroke
          </label>
          
          {/* Stroke Toggle */}
          <button
            onClick={() => updateStyle({ stroke: !element.stroke })}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
              element.stroke 
                ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700')
                : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600')
            }`}
          >
            <div className="flex items-center gap-2">
              <Square size={16} />
              <span className="text-sm font-medium">
                {element.stroke ? 'Stroke Enabled' : 'Enable Stroke'}
              </span>
            </div>
          </button>

          {/* Stroke Color & Width */}
          {element.stroke && (
            <div className="space-y-4 pl-4 border-l border-gray-300">
              <ColorPicker
                label="Stroke Color"
                value={element.strokeColor}
                gradient={element.strokeGradient}
                onChange={(color, gradient) => updateStyle({ 
                  strokeColor: color,
                  strokeGradient: gradient
                })}
                isDarkMode={isDarkMode}
              />
              
              {/* Stroke Width */}
              <div className="space-y-2">
                <label className={`text-xs font-medium block ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Stroke Width: {element.strokeWidth || 2}px
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={element.strokeWidth || 2}
                    onChange={(e) => updateStyle({ strokeWidth: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={element.strokeWidth || 2}
                    onChange={(e) => updateStyle({ strokeWidth: Math.max(1, Math.min(20, parseInt(e.target.value) || 2)) })}
                    className={`w-16 px-2 py-1 text-xs text-center rounded ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-200'
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <label className={`text-xs font-medium block ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Opacity: {Math.round((element.opacity || 1) * 100)}%
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={element.opacity || 1}
              onChange={(e) => updateStyle({ opacity: parseFloat(e.target.value) })}
              className="flex-1"
            />
            <span className={`text-xs w-12 text-center ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {Math.round((element.opacity || 1) * 100)}%
            </span>
          </div>
        </div>

        {/* Shape Type Info */}
        <div className={`p-3 rounded-lg ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
        }`}>
          <div className={`text-xs font-medium mb-1 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Shape Type
          </div>
          <div className={`text-xs capitalize ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {element.shapeType || 'rectangle'}
          </div>
        </div>
      </div>
    </div>
  )
}