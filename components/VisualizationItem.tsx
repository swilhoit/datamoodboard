'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Move, Maximize2, Palette, Type, Layers } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ScatterChart, Scatter
} from 'recharts'
import StyledTable from './StyledTable'

interface VisualizationItemProps {
  item: any
  isSelected: boolean
  onSelect: () => void
  onUpdate: (id: string, updates: any) => void
  onDelete: (id: string) => void
}

const DEFAULT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function VisualizationItem({
  item,
  isSelected,
  onSelect,
  onUpdate,
  onDelete
}: VisualizationItemProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, itemX: 0, itemY: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [resizeCorner, setResizeCorner] = useState<string>('')
  const [currentPosition, setCurrentPosition] = useState({ x: item.x, y: item.y })
  const itemRef = useRef<HTMLDivElement>(null)

  const handleMouseDownDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      itemX: item.x,
      itemY: item.y
    })
    onSelect()
  }

  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    setResizeCorner(corner)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: item.width,
      height: item.height,
    })
  }

  // Sync currentPosition with item position when not dragging
  useEffect(() => {
    if (!isDragging && !isResizing) {
      setCurrentPosition({ x: item.x, y: item.y })
    }
  }, [item.x, item.y, isDragging, isResizing])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Ultra-responsive: Direct position calculation with no throttling
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y
        const newX = dragStart.itemX + deltaX
        const newY = dragStart.itemY + deltaY
        
        // Immediate visual feedback
        setCurrentPosition({ x: newX, y: newY })
        
        // Update parent immediately for real-time sync
        onUpdate(item.id, { x: newX, y: newY })
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        
        let updates: any = {}
        let newX = item.x
        let newY = item.y
        
        if (resizeCorner.includes('e')) {
          updates.width = Math.max(200, resizeStart.width + deltaX)
        }
        if (resizeCorner.includes('w')) {
          updates.width = Math.max(200, resizeStart.width - deltaX)
          newX = item.x + deltaX
          updates.x = newX
        }
        if (resizeCorner.includes('s')) {
          updates.height = Math.max(150, resizeStart.height + deltaY)
        }
        if (resizeCorner.includes('n')) {
          updates.height = Math.max(150, resizeStart.height - deltaY)
          newY = item.y + deltaY
          updates.y = newY
        }
        
        // Immediate visual feedback for position changes
        if (newX !== item.x || newY !== item.y) {
          setCurrentPosition({ x: newX, y: newY })
        }
        
        onUpdate(item.id, updates)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('mouseup', handleMouseUp, { passive: true })
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, dragStart, resizeStart, resizeCorner, item, onUpdate])

  const renderVisualization = () => {
    const data = item.data || []
    const style = item.style || {}
    const colors = style.colors || DEFAULT_COLORS
    const gridColor = style.gridColor || '#e0e0e0'
    const textColor = style.textColor || '#666'
    const font = style.font || 'Inter'
    const fontSize = style.fontSize || 12
    
    // Create tick style object
    const tickStyle = {
      fontFamily: font,
      fontSize: fontSize,
      fill: textColor
    }
    
    // Create label style
    const labelStyle = {
      fontFamily: font,
      fontSize: fontSize + 2,
      fontWeight: style.bold ? 'bold' : 'normal',
      fontStyle: style.italic ? 'italic' : 'normal',
      textDecoration: style.underline ? 'underline' : 'none'
    }
    
    switch (item.type) {
      case 'lineChart':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" stroke={textColor} tick={tickStyle} />
              <YAxis stroke={textColor} tick={tickStyle} />
              <Tooltip contentStyle={{ fontFamily: font, fontSize }} />
              <Legend wrapperStyle={labelStyle} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={colors[0]} 
                strokeWidth={2} 
                dot={{ fill: colors[0] }}
                fill={style.gradients ? `url(#gradient-${item.id})` : colors[0]}
              />
            </LineChart>
          </ResponsiveContainer>
        )
      
      case 'barChart':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" stroke={textColor} tick={tickStyle} />
              <YAxis stroke={textColor} tick={tickStyle} />
              <Tooltip contentStyle={{ fontFamily: font, fontSize }} />
              <Legend wrapperStyle={labelStyle} />
              <Bar 
                dataKey="value" 
                fill={style.gradients ? `url(#gradient-${item.id})` : colors[1]}
              />
            </BarChart>
          </ResponsiveContainer>
        )
      
      case 'pieChart':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" stroke={textColor} tick={tickStyle} />
              <YAxis stroke={textColor} tick={tickStyle} />
              <Tooltip contentStyle={{ fontFamily: font, fontSize }} />
              <Legend wrapperStyle={labelStyle} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={colors[4] || '#EC4899'} 
                fill={style.gradients ? `url(#gradient-${item.id})` : colors[4] || '#EC4899'} 
                fillOpacity={0.3} 
              />
            </AreaChart>
          </ResponsiveContainer>
        )
      
      case 'scatter':
        const scatterData = [
          { x: 100, y: 200 },
          { x: 120, y: 100 },
          { x: 170, y: 300 },
          { x: 140, y: 250 },
          { x: 150, y: 180 },
          { x: 110, y: 280 },
        ]
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis type="number" dataKey="x" stroke={textColor} tick={tickStyle} />
              <YAxis type="number" dataKey="y" stroke={textColor} tick={tickStyle} />
              <Tooltip contentStyle={{ fontFamily: font, fontSize }} />
              <Scatter name="Data" data={scatterData} fill={colors[2] || '#F59E0B'} />
            </ScatterChart>
          </ResponsiveContainer>
        )
      
      case 'table':
        return (
          <StyledTable
            data={data}
            style={{
              theme: style.tableTheme || 'modern',
              colors: colors,
              background: style.background,
              headerBackground: style.headerBackground || gridColor,
              textColor: textColor,
              borderColor: gridColor,
              hoverColor: style.hoverColor,
              compact: style.compact,
              showSearch: style.showSearch !== false,
              stickyHeader: true
            }}
            width="100%"
            height="100%"
          />
        )
      
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Unknown visualization type</p>
          </div>
        )
    }
  }

  const getContainerStyle = () => {
    const style = item.style || {}
    let containerStyle: any = {
      transform: `translate3d(${currentPosition.x}px, ${currentPosition.y}px, 0)`,
      width: item.width,
      height: item.height,
      cursor: isDragging ? 'grabbing' : 'default',
      backgroundColor: style.background || '#FFFFFF',
      willChange: isDragging ? 'transform' : 'auto',
      position: 'absolute',
      left: 0,
      top: 0,
    }
    
    if (style.gradient && style.theme === 'gradient') {
      containerStyle.background = 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)'
    }
    
    if (style.theme === 'dark') {
      containerStyle.backgroundColor = '#1F2937'
    }
    
    if (style.theme === 'neon') {
      containerStyle.backgroundColor = '#0F0F23'
      containerStyle.boxShadow = style.glowEffect ? '0 0 30px rgba(0,245,255,0.5)' : undefined
    }
    
    return containerStyle
  }

  return (
    <div
      ref={itemRef}
      className={`absolute transition-all-smooth hover-lift canvas-item-enter ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      } ${isDragging ? 'opacity-80' : ''} ${
        item.style?.shadow ? 'shadow-2xl' : ''
      } ${
        item.style?.rounded ? 'rounded-2xl' : 'rounded-lg'
      } ${
        item.style?.border ? 'border-2 border-gray-300' : ''
      }`}
      style={getContainerStyle()}
      onClick={onSelect}
    >
      {/* Top bar - only visible when selected */}
      {isSelected && (
        <div 
          className={`absolute top-0 left-0 right-0 h-10 bg-opacity-50 flex items-center justify-between px-3 cursor-move ${
            item.style?.rounded ? 'rounded-t-2xl' : 'rounded-t-lg'
          }`}
          style={{
            backgroundColor: item.style?.theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.8)',
          }}
          onMouseDown={handleMouseDownDrag}
        >
        <div className="flex items-center gap-2 pointer-events-none">
          <Move size={14} className={item.style?.theme === 'dark' ? 'text-gray-300' : 'text-gray-400'} />
          <span className={`text-sm font-medium capitalize ${
            item.style?.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            {item.type.replace(/([A-Z])/g, ' $1').trim()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onUpdate(item.id, { 
                width: item.width === 400 ? 600 : 400,
                height: item.height === 300 ? 400 : 300
              })
            }}
            className="p-1 hover:bg-gray-200 hover:bg-opacity-50 rounded transition-colors-smooth button-press"
            title="Toggle size"
          >
            <Maximize2 size={14} className={item.style?.theme === 'dark' ? 'text-gray-300' : ''} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(item.id)
            }}
            className="p-1 hover:bg-red-100 hover:bg-opacity-50 rounded transition-colors-smooth button-press text-red-600"
            title="Delete"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      )}

      <div 
        className={`${isSelected ? 'pt-10' : 'pt-0'} h-full flex flex-col`} 
        style={{ 
          fontFamily: item.style?.font || 'Inter',
          padding: `${item.style?.padding || 16}px`
        }}
      >
        {/* Chart Title */}
        {item.title && (
          <div 
            className="text-center mb-3 px-2"
            style={{ 
              color: item.style?.textColor || '#1F2937',
              fontFamily: item.style?.font || 'Inter',
              fontSize: (item.style?.fontSize || 12) + 4,
              fontWeight: 'bold'
            }}
          >
            {item.title}
          </div>
        )}
        
        <div className="flex-1">
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id={`gradient-${item.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={item.style?.colors?.[0] || '#3B82F6'} stopOpacity={0.9} />
                <stop offset="100%" stopColor={item.style?.colors?.[1] || '#10B981'} stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id={`gradient-horizontal-${item.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={item.style?.colors?.[0] || '#3B82F6'} stopOpacity={0.9} />
                <stop offset="100%" stopColor={item.style?.colors?.[1] || '#10B981'} stopOpacity={0.3} />
              </linearGradient>
              {item.style?.colors?.map((color: string, index: number) => (
                <linearGradient key={index} id={`gradient-${item.id}-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.3} />
                </linearGradient>
              ))}
            </defs>
          </svg>
          {renderVisualization()}
        </div>
      </div>

      {isSelected && (
        <>
          {/* Corner resize handles */}
          <div
            className="absolute top-0 left-0 w-3 h-3 bg-blue-500 cursor-nw-resize rounded-tl-lg"
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
          <div
            className="absolute top-0 right-0 w-3 h-3 bg-blue-500 cursor-ne-resize rounded-tr-lg"
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          <div
            className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 cursor-sw-resize rounded-bl-lg"
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
          <div
            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize rounded-br-lg"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
          
          {/* Edge resize handles */}
          <div
            className="absolute top-0 left-3 right-3 h-1 bg-blue-500 cursor-n-resize"
            onMouseDown={(e) => handleResizeStart(e, 'n')}
          />
          <div
            className="absolute bottom-0 left-3 right-3 h-1 bg-blue-500 cursor-s-resize"
            onMouseDown={(e) => handleResizeStart(e, 's')}
          />
          <div
            className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 cursor-w-resize"
            onMouseDown={(e) => handleResizeStart(e, 'w')}
          />
          <div
            className="absolute right-0 top-3 bottom-3 w-1 bg-blue-500 cursor-e-resize"
            onMouseDown={(e) => handleResizeStart(e, 'e')}
          />
        </>
      )}
    </div>
  )
}