'use client'

import { useState } from 'react'
import BackgroundSettings from '@/components/BackgroundSettings'

export default function BackgroundTest() {
  const [background, setBackground] = useState({ type: 'color', value: '#F3F4F6' })
  const [showGrid, setShowGrid] = useState(true)

  const getBackgroundStyle = () => {
    const style: any = {}
    
    if (background?.type === 'color') {
      style.backgroundColor = background.value
    } else if (background?.type === 'gradient') {
      style.background = background.value
    } else if (background?.type === 'image') {
      style.backgroundImage = `url(${background.value})`
      style.backgroundSize = 'cover'
      style.backgroundPosition = 'center'
      style.backgroundRepeat = 'no-repeat'
    }

    if (showGrid) {
      style.backgroundImage = `
        ${background?.type === 'image' ? `url(${background.value}), ` : ''}
        linear-gradient(0deg, rgba(0,0,0,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
      `
      style.backgroundSize = background?.type === 'image' 
        ? 'cover, 20px 20px, 20px 20px'
        : '20px 20px'
    }

    return style
  }

  return (
    <div className="flex h-screen">
      <div className="w-80 p-4 bg-white border-r border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Background Settings Test</h2>
        <BackgroundSettings
          background={background}
          onUpdateBackground={setBackground}
          showGrid={showGrid}
          onToggleGrid={setShowGrid}
        />
        
        <div className="mt-6 p-3 bg-gray-100 rounded text-xs">
          <div className="font-semibold mb-2">Current State:</div>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(background, null, 2)}
          </pre>
          <div className="mt-2">Grid: {showGrid ? 'ON' : 'OFF'}</div>
        </div>
      </div>
      
      <div className="flex-1 relative overflow-hidden">
        <div 
          className="absolute inset-0 transition-all duration-300"
          style={getBackgroundStyle()}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-lg shadow-xl">
            <h1 className="text-2xl font-bold mb-4">Canvas Background Demo</h1>
            <p className="text-gray-600">
              The background changes based on your settings. Try:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Solid colors</li>
              <li>• Gradient presets</li>
              <li>• Custom gradients</li>
              <li>• Image backgrounds (upload or URL)</li>
              <li>• Toggle grid overlay</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}