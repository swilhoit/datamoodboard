'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Handle, Position } from 'reactflow'
import { 
  Frame, ChevronDown, ChevronRight, Lock, Unlock, Eye, EyeOff,
  Copy, Trash2, Settings, Move, Maximize2, Grid3X3, AlignLeft,
  AlignStartVertical, Plus, Minus, ZoomIn, ZoomOut
} from 'lucide-react'

interface FrameNodeProps {
  data: {
    label?: string
    width?: number
    height?: number
    background?: string
    elements?: any[]
    incomingData?: any[]
    locked?: boolean
    visible?: boolean
    autoLayout?: {
      enabled: boolean
      direction: 'horizontal' | 'vertical'
      gap: number
      padding: number
      alignment: 'start' | 'center' | 'end' | 'space-between' | 'space-around'
    }
    constraints?: {
      minWidth?: number
      maxWidth?: number
      minHeight?: number
      maxHeight?: number
      aspectRatio?: number
    }
  }
  selected: boolean
  id: string
  onDataChange?: (data: any) => void
}

const FRAME_PRESETS = [
  { name: 'Desktop', width: 1440, height: 900, icon: '🖥️' },
  { name: 'Laptop', width: 1280, height: 800, icon: '💻' },
  { name: 'Tablet', width: 768, height: 1024, icon: '📱' },
  { name: 'Mobile', width: 375, height: 812, icon: '📱' },
  { name: 'Dashboard', width: 1200, height: 800, icon: '📊' },
  { name: 'Report', width: 800, height: 1200, icon: '📄' },
  { name: 'Slide', width: 1920, height: 1080, icon: '🎬' },
  { name: 'Square', width: 600, height: 600, icon: '⬜' },
]

export default function FrameNode({ data, selected, id, onDataChange }: FrameNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isResizing, setIsResizing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [dimensions, setDimensions] = useState({
    width: data.width || 800,
    height: data.height || 600
  })
  const frameRef = useRef<HTMLDivElement>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation()
    setIsResizing(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    
    const startWidth = dimensions.width
    const startHeight = dimensions.height
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart!.x
      const deltaY = e.clientY - dragStart!.y
      
      let newWidth = startWidth
      let newHeight = startHeight
      
      if (direction.includes('right')) {
        newWidth = Math.max(200, startWidth + deltaX)
      }
      if (direction.includes('left')) {
        newWidth = Math.max(200, startWidth - deltaX)
      }
      if (direction.includes('bottom')) {
        newHeight = Math.max(200, startHeight + deltaY)
      }
      if (direction.includes('top')) {
        newHeight = Math.max(200, startHeight - deltaY)
      }
      
      // Apply constraints
      if (data.constraints) {
        if (data.constraints.minWidth) newWidth = Math.max(data.constraints.minWidth, newWidth)
        if (data.constraints.maxWidth) newWidth = Math.min(data.constraints.maxWidth, newWidth)
        if (data.constraints.minHeight) newHeight = Math.max(data.constraints.minHeight, newHeight)
        if (data.constraints.maxHeight) newHeight = Math.min(data.constraints.maxHeight, newHeight)
        
        // Maintain aspect ratio if set
        if (data.constraints.aspectRatio) {
          if (direction.includes('right') || direction.includes('left')) {
            newHeight = newWidth / data.constraints.aspectRatio
          } else {
            newWidth = newHeight * data.constraints.aspectRatio
          }
        }
      }
      
      setDimensions({ width: newWidth, height: newHeight })
      if (onDataChange) {
        onDataChange({ ...data, width: newWidth, height: newHeight })
      }
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Apply auto-layout to elements
  const getElementPosition = (index: number) => {
    if (!data.autoLayout?.enabled) return undefined
    
    const { direction, gap, padding, alignment } = data.autoLayout
    let x = padding
    let y = padding
    
    if (direction === 'horizontal') {
      x = padding + index * (100 + gap)
      
      switch (alignment) {
        case 'center':
          y = (dimensions.height - 100) / 2
          break
        case 'end':
          y = dimensions.height - padding - 100
          break
        default:
          y = padding
      }
    } else {
      y = padding + index * (100 + gap)
      
      switch (alignment) {
        case 'center':
          x = (dimensions.width - 100) / 2
          break
        case 'end':
          x = dimensions.width - padding - 100
          break
        default:
          x = padding
      }
    }
    
    return { x, y }
  }

  // Apply preset
  const applyPreset = (preset: typeof FRAME_PRESETS[0]) => {
    setDimensions({ width: preset.width, height: preset.height })
    if (onDataChange) {
      onDataChange({ 
        ...data, 
        width: preset.width, 
        height: preset.height,
        label: `${preset.name} Frame`
      })
    }
    setShowPresets(false)
  }

  const resizeHandles = [
    { position: 'top-left', cursor: 'nw-resize', className: 'top-0 left-0' },
    { position: 'top', cursor: 'n-resize', className: 'top-0 left-1/2 -translate-x-1/2' },
    { position: 'top-right', cursor: 'ne-resize', className: 'top-0 right-0' },
    { position: 'right', cursor: 'e-resize', className: 'top-1/2 right-0 -translate-y-1/2' },
    { position: 'bottom-right', cursor: 'se-resize', className: 'bottom-0 right-0' },
    { position: 'bottom', cursor: 's-resize', className: 'bottom-0 left-1/2 -translate-x-1/2' },
    { position: 'bottom-left', cursor: 'sw-resize', className: 'bottom-0 left-0' },
    { position: 'left', cursor: 'w-resize', className: 'top-1/2 left-0 -translate-y-1/2' },
  ]

  return (
    <div
      ref={frameRef}
      className={`relative bg-white rounded-lg shadow-lg border-2 ${
        selected ? 'border-blue-500' : 'border-gray-300'
      } ${data.locked ? 'pointer-events-none opacity-50' : ''} ${
        data.visible === false ? 'opacity-30' : ''
      }`}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        background: data.background || '#ffffff'
      }}
    >
      {/* Resize Handles */}
      {selected && !data.locked && (
        <>
          {resizeHandles.map((handle) => (
            <div
              key={handle.position}
              onMouseDown={(e) => handleResizeStart(e, handle.position)}
              className={`absolute w-3 h-3 bg-blue-500 rounded-full ${handle.className} ${
                isResizing ? 'bg-blue-600' : 'hover:bg-blue-600'
              } transition-colors z-20`}
              style={{ cursor: handle.cursor }}
            />
          ))}
        </>
      )}

      {/* Frame Header */}
      <div className="absolute top-0 left-0 right-0 bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between z-10 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Frame size={14} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">{data.label || 'Frame'}</span>
          <span className="text-xs text-gray-500">
            {dimensions.width} × {dimensions.height}
          </span>
          {data.incomingData && data.incomingData.length > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
              {data.incomingData.length} source{data.incomingData.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Frame Presets */}
          <div className="relative">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="p-1 hover:bg-gray-200 rounded text-gray-600"
              title="Frame presets"
            >
              <Grid3X3 size={14} />
            </button>
            
            {showPresets && (
              <div className="absolute top-8 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-50 min-w-[200px]">
                <div className="text-xs font-semibold text-gray-600 mb-2 px-2">Frame Presets</div>
                {FRAME_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded text-left"
                  >
                    <span className="text-lg">{preset.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-700">{preset.name}</div>
                      <div className="text-xs text-gray-500">{preset.width} × {preset.height}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auto Layout Toggle */}
          <button
            onClick={() => {
              const newAutoLayout = {
                ...data.autoLayout,
                enabled: !data.autoLayout?.enabled
              }
              if (onDataChange) {
                onDataChange({ ...data, autoLayout: newAutoLayout })
              }
            }}
            className={`p-1 rounded ${
              data.autoLayout?.enabled ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="Toggle auto-layout"
          >
            {data.autoLayout?.direction === 'horizontal' ? (
              <AlignLeft size={14} />
            ) : (
              <AlignStartVertical size={14} />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-200 rounded text-gray-600"
            title="Frame settings"
          >
            <Settings size={14} />
          </button>

          {/* Visibility Toggle */}
          <button
            onClick={() => {
              if (onDataChange) {
                onDataChange({ ...data, visible: !data.visible })
              }
            }}
            className="p-1 hover:bg-gray-200 rounded text-gray-600"
            title={data.visible !== false ? 'Hide frame' : 'Show frame'}
          >
            {data.visible !== false ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>

          {/* Lock Toggle */}
          <button
            onClick={() => {
              if (onDataChange) {
                onDataChange({ ...data, locked: !data.locked })
              }
            }}
            className="p-1 hover:bg-gray-200 rounded text-gray-600"
            title={data.locked ? 'Unlock frame' : 'Lock frame'}
          >
            {data.locked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>

          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-200 rounded text-gray-600"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-12 right-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 w-64">
          <h4 className="text-xs font-semibold text-gray-700 mb-3">Frame Settings</h4>
          
          {/* Auto Layout Settings */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600">Layout Direction</label>
              <div className="flex gap-1 mt-1">
                <button
                  onClick={() => {
                    if (onDataChange) {
                      onDataChange({
                        ...data,
                        autoLayout: { ...data.autoLayout, direction: 'horizontal' }
                      })
                    }
                  }}
                  className={`flex-1 px-2 py-1 text-xs rounded ${
                    data.autoLayout?.direction === 'horizontal' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Horizontal
                </button>
                <button
                  onClick={() => {
                    if (onDataChange) {
                      onDataChange({
                        ...data,
                        autoLayout: { ...data.autoLayout, direction: 'vertical' }
                      })
                    }
                  }}
                  className={`flex-1 px-2 py-1 text-xs rounded ${
                    data.autoLayout?.direction === 'vertical' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Vertical
                </button>
              </div>
            </div>
            
            <div>
              <label className="text-xs text-gray-600">Gap</label>
              <input
                type="number"
                value={data.autoLayout?.gap || 16}
                onChange={(e) => {
                  if (onDataChange) {
                    onDataChange({
                      ...data,
                      autoLayout: { ...data.autoLayout, gap: Number(e.target.value) }
                    })
                  }
                }}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded mt-1"
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-600">Padding</label>
              <input
                type="number"
                value={data.autoLayout?.padding || 16}
                onChange={(e) => {
                  if (onDataChange) {
                    onDataChange({
                      ...data,
                      autoLayout: { ...data.autoLayout, padding: Number(e.target.value) }
                    })
                  }
                }}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded mt-1"
              />
            </div>

            {/* Constraints */}
            <div className="border-t pt-3">
              <label className="text-xs text-gray-600">Constraints</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  type="number"
                  placeholder="Min W"
                  value={data.constraints?.minWidth || ''}
                  onChange={(e) => {
                    if (onDataChange) {
                      onDataChange({
                        ...data,
                        constraints: { ...data.constraints, minWidth: Number(e.target.value) }
                      })
                    }
                  }}
                  className="px-2 py-1 text-xs border border-gray-200 rounded"
                />
                <input
                  type="number"
                  placeholder="Max W"
                  value={data.constraints?.maxWidth || ''}
                  onChange={(e) => {
                    if (onDataChange) {
                      onDataChange({
                        ...data,
                        constraints: { ...data.constraints, maxWidth: Number(e.target.value) }
                      })
                    }
                  }}
                  className="px-2 py-1 text-xs border border-gray-200 rounded"
                />
                <input
                  type="number"
                  placeholder="Min H"
                  value={data.constraints?.minHeight || ''}
                  onChange={(e) => {
                    if (onDataChange) {
                      onDataChange({
                        ...data,
                        constraints: { ...data.constraints, minHeight: Number(e.target.value) }
                      })
                    }
                  }}
                  className="px-2 py-1 text-xs border border-gray-200 rounded"
                />
                <input
                  type="number"
                  placeholder="Max H"
                  value={data.constraints?.maxHeight || ''}
                  onChange={(e) => {
                    if (onDataChange) {
                      onDataChange({
                        ...data,
                        constraints: { ...data.constraints, maxHeight: Number(e.target.value) }
                      })
                    }
                  }}
                  className="px-2 py-1 text-xs border border-gray-200 rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Frame Content Area */}
      {isExpanded && (
        <div className="pt-10 p-4 h-full overflow-auto">
          {data.elements && data.elements.length > 0 ? (
            <div className={`${data.autoLayout?.enabled ? 'flex' : ''} ${
              data.autoLayout?.direction === 'horizontal' ? 'flex-row' : 'flex-col'
            } gap-${data.autoLayout?.gap || 4}`}>
              {data.elements.map((element: any, index: number) => {
                const position = getElementPosition(index)
                return (
                  <div
                    key={element.id}
                    className="p-4 border border-gray-200 rounded bg-white"
                    style={position ? { 
                      position: 'absolute', 
                      left: position.x, 
                      top: position.y 
                    } : undefined}
                  >
                    <div className="text-sm text-gray-600">
                      {element.type === 'chart' && '📊 Chart'}
                      {element.type === 'text' && '📝 Text'}
                      {element.type === 'shape' && '⬜ Shape'}
                      {element.type === 'table' && '📋 Table'}
                      {element.type === 'image' && '🖼️ Image'}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Frame size={48} className="mb-2" />
              <p className="text-sm">Drop elements here to build your report</p>
              <p className="text-xs mt-1">Connect data sources to enable charts</p>
              
              {/* Quick Add Buttons */}
              <div className="flex gap-2 mt-4">
                <button className="px-3 py-1.5 text-xs bg-gray-100 rounded hover:bg-gray-200">
                  + Add Chart
                </button>
                <button className="px-3 py-1.5 text-xs bg-gray-100 rounded hover:bg-gray-200">
                  + Add Text
                </button>
                <button className="px-3 py-1.5 text-xs bg-gray-100 rounded hover:bg-gray-200">
                  + Add Table
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input handle for data connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
        style={{ top: '50%' }}
      />
    </div>
  )
}