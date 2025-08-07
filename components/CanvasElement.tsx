'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Move, Maximize2, Type, Image as ImageIcon, RotateCw } from 'lucide-react'
import EmojiStyleToolbar from './EmojiStyleToolbar'

interface CanvasElementProps {
  element: any
  isSelected: boolean
  onSelect: () => void
  onUpdate: (id: string, updates: any) => void
  onDelete: (id: string) => void
}

export default function CanvasElement({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete
}: CanvasElementProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, itemX: 0, itemY: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [resizeCorner, setResizeCorner] = useState<string>('')
  const [currentPosition, setCurrentPosition] = useState({ x: element.x, y: element.y })
  const [isRotating, setIsRotating] = useState(false)
  const [rotationStart, setRotationStart] = useState({ angle: 0, centerX: 0, centerY: 0 })
  const elementRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)

  const handleMouseDownDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      itemX: element.x,
      itemY: element.y
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
      width: element.width || 200,
      height: element.height || 100,
    })
  }

  const handleRotationStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsRotating(true)
    
    const rect = elementRef.current?.getBoundingClientRect()
    if (rect) {
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
      
      setRotationStart({
        angle: currentAngle - (element.rotation || 0),
        centerX,
        centerY
      })
    }
  }

  const handleDoubleClick = () => {
    if (element.type === 'text') {
      setIsEditing(true)
      setTimeout(() => {
        if (textRef.current) {
          textRef.current.focus()
          // Select all text
          const selection = window.getSelection()
          const range = document.createRange()
          range.selectNodeContents(textRef.current)
          selection?.removeAllRanges()
          selection?.addRange(range)
        }
      }, 0)
    }
  }

  const handleTextBlur = () => {
    setIsEditing(false)
    if (textRef.current) {
      onUpdate(element.id, { text: textRef.current.innerText })
    }
  }

  // Sync currentPosition with element position when not dragging
  useEffect(() => {
    if (!isDragging && !isResizing) {
      setCurrentPosition({ x: element.x, y: element.y })
    }
  }, [element.x, element.y, isDragging, isResizing])

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
        onUpdate(element.id, { x: newX, y: newY })
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        
        let updates: any = {}
        let newX = element.x
        let newY = element.y
        
        if (resizeCorner.includes('e')) {
          updates.width = Math.max(50, resizeStart.width + deltaX)
        }
        if (resizeCorner.includes('w')) {
          updates.width = Math.max(50, resizeStart.width - deltaX)
          newX = element.x + deltaX
          updates.x = newX
        }
        if (resizeCorner.includes('s')) {
          updates.height = Math.max(30, resizeStart.height + deltaY)
        }
        if (resizeCorner.includes('n')) {
          updates.height = Math.max(30, resizeStart.height - deltaY)
          newY = element.y + deltaY
          updates.y = newY
        }
        
        // Immediate visual feedback for position changes
        if (newX !== element.x || newY !== element.y) {
          setCurrentPosition({ x: newX, y: newY })
        }
        
        onUpdate(element.id, updates)
      } else if (isRotating) {
        const newAngle = Math.atan2(e.clientY - rotationStart.centerY, e.clientX - rotationStart.centerX) * (180 / Math.PI)
        const rotation = newAngle - rotationStart.angle
        onUpdate(element.id, { rotation })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setIsRotating(false)
    }

    if (isDragging || isResizing || isRotating) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('mouseup', handleMouseUp, { passive: true })
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, isRotating, dragStart, resizeStart, resizeCorner, rotationStart, element, onUpdate])

  const renderContent = () => {
    switch (element.type) {
      case 'text':
        // Text is now handled by TextElement component
        return null
      
      case 'image':
      case 'gif':
        return (
          <div 
            className="w-full h-full flex items-center justify-center cursor-move"
            onMouseDown={handleMouseDownDrag}
            title="Drag to move"
          >
            {element.src ? (
              <img 
                src={element.src} 
                alt={element.type === 'gif' ? 'GIF' : 'Image'} 
                className="w-full h-full object-cover rounded pointer-events-none"
                draggable={false}
                style={{
                  objectFit: element.objectFit || 'cover',
                  filter: element.filter || 'none'
                }}
              />
            ) : (
              <div className="text-gray-400 pointer-events-none">
                <ImageIcon size={48} />
                <p className="text-sm mt-2">No {element.type}</p>
              </div>
            )}
          </div>
        )
      
      case 'emoji':
        return (
          <div 
            className="w-full h-full flex items-center justify-center select-none cursor-move"
            style={{
              fontSize: Math.min(element.width || 60, element.height || 60) * 0.8, // Scale emoji to fit container
              lineHeight: 1,
            }}
            onMouseDown={handleMouseDownDrag}
            title="Drag to move, corners to resize"
          >
            {element.emoji || '🙂'}
          </div>
        )
      
      case 'marker':
        // Marker creates drawing strokes - this would be implemented as SVG paths
        return (
          <svg 
            width="100%" 
            height="100%" 
            className="pointer-events-none"
            style={{ opacity: element.opacity || 0.8 }}
          >
            {element.paths && element.paths.map((path: string, index: number) => (
              <path
                key={index}
                d={path}
                stroke={element.color || '#FF6B6B'}
                strokeWidth={element.size || 4}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>
        )
      
      case 'shape':
        const width = element.width || 100
        const height = element.height || 100
        const fill = element.fillGradient || element.fill || '#3B82F6'
        const stroke = element.strokeGradient || element.strokeColor || '#1F2937'
        const strokeWidth = element.strokeWidth || 0
        const opacity = element.opacity || 1
        const shapeId = `shape-${element.id}`
        
        return (
          <svg 
            width="100%" 
            height="100%" 
            viewBox={`0 0 ${width} ${height}`}
            style={{ opacity }}
          >
            <defs>
              {/* Fill Gradient */}
              {element.fillGradient && (
                <linearGradient id={`fill-gradient-${element.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              )}
              
              {/* Stroke Gradient */}
              {element.strokeGradient && (
                <linearGradient id={`stroke-gradient-${element.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1F2937" />
                  <stop offset="100%" stopColor="#374151" />
                </linearGradient>
              )}
            </defs>
            
            {element.shapeType === 'circle' ? (
              <circle
                cx={width / 2}
                cy={height / 2}
                r={Math.min(width, height) / 2 - (strokeWidth / 2)}
                fill={element.fillGradient ? `url(#fill-gradient-${element.id})` : fill}
                stroke={element.stroke ? (element.strokeGradient ? `url(#stroke-gradient-${element.id})` : stroke) : 'none'}
                strokeWidth={element.stroke ? strokeWidth : 0}
              />
            ) : element.shapeType === 'triangle' ? (
              <polygon
                points={`${width / 2},${strokeWidth + 5} ${width - strokeWidth - 5},${height - strokeWidth - 5} ${strokeWidth + 5},${height - strokeWidth - 5}`}
                fill={element.fillGradient ? `url(#fill-gradient-${element.id})` : fill}
                stroke={element.stroke ? (element.strokeGradient ? `url(#stroke-gradient-${element.id})` : stroke) : 'none'}
                strokeWidth={element.stroke ? strokeWidth : 0}
              />
            ) : element.shapeType === 'arrow' ? (
              <g>
                {/* Arrow head */}
                <polygon
                  points={`${width / 2},${strokeWidth + 5} ${width * 0.8},${height * 0.4} ${width * 0.2},${height * 0.4}`}
                  fill={element.fillGradient ? `url(#fill-gradient-${element.id})` : fill}
                  stroke={element.stroke ? (element.strokeGradient ? `url(#stroke-gradient-${element.id})` : stroke) : 'none'}
                  strokeWidth={element.stroke ? strokeWidth : 0}
                />
                {/* Arrow shaft */}
                <rect
                  x={width * 0.35}
                  y={height * 0.4}
                  width={width * 0.3}
                  height={height * 0.5 - strokeWidth}
                  fill={element.fillGradient ? `url(#fill-gradient-${element.id})` : fill}
                  stroke={element.stroke ? (element.strokeGradient ? `url(#stroke-gradient-${element.id})` : stroke) : 'none'}
                  strokeWidth={element.stroke ? strokeWidth : 0}
                />
              </g>
            ) : (
              // Default rectangle
              <rect
                x={strokeWidth / 2}
                y={strokeWidth / 2}
                width={width - strokeWidth}
                height={height - strokeWidth}
                fill={element.fillGradient ? `url(#fill-gradient-${element.id})` : fill}
                stroke={element.stroke ? (element.strokeGradient ? `url(#stroke-gradient-${element.id})` : stroke) : 'none'}
                strokeWidth={element.stroke ? strokeWidth : 0}
              />
            )}
          </svg>
        )
      
      default:
        return null
    }
  }

  return (
    <div
      ref={elementRef}
      className={`absolute ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      } ${isDragging ? 'opacity-80' : ''} ${
        element.type === 'text' || element.type === 'emoji' || element.type === 'marker' || element.type === 'shape' ? '' : 'bg-white'
      }`}
      style={{
        transform: `translate3d(${currentPosition.x}px, ${currentPosition.y}px, 0) rotate(${element.rotation || 0}deg)`,
        left: 0,
        top: 0,
        width: element.width || (element.type === 'text' ? 'auto' : element.type === 'emoji' ? 80 : 200),
        height: element.height || (element.type === 'text' ? 'auto' : element.type === 'emoji' ? 80 : 100),
        minWidth: element.type === 'text' ? 100 : element.type === 'emoji' ? 40 : undefined,
        minHeight: element.type === 'text' ? 30 : element.type === 'emoji' ? 40 : undefined,
        cursor: isDragging ? 'grabbing' : isRotating ? 'grabbing' : 'default',
        borderRadius: element.rounded ? 8 : 0,
        boxShadow: element.shadow ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
        willChange: isDragging || isRotating ? 'transform' : 'auto',
        zIndex: element.zIndex || 0,
      }}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
    >
      {/* Header for non-text, non-emoji, non-marker elements */}
      {element.type !== 'text' && element.type !== 'emoji' && element.type !== 'marker' && (
        <div 
          className={`absolute top-0 left-0 right-0 h-8 bg-gray-900 flex items-center justify-between px-2 cursor-move rounded-t transition-all duration-200 ${
            isSelected 
              ? 'bg-opacity-90 opacity-100' 
              : (element.type === 'image' || element.type === 'gif') 
                ? 'opacity-0'
                : 'bg-opacity-70 opacity-0 hover:opacity-100'
          }`}
          onMouseDown={handleMouseDownDrag}
        >
          <div className="flex items-center gap-1">
            {element.type === 'image' || element.type === 'gif' ? <ImageIcon size={14} className="text-white" /> : <Move size={14} className="text-white" />}
            <span className="text-xs text-white capitalize">{element.type}</span>
            {(element.type === 'image' || element.type === 'gif') && (
              <span className="text-xs text-white/80 ml-1">• Drag to move</span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(element.id)
            }}
            className="p-0.5 hover:bg-red-600 rounded transition-colors text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Content */}
      <div className={element.type !== 'text' ? 'h-full' : ''}>
        {renderContent()}
      </div>

      {/* Text element drag handle */}
      {element.type === 'text' && !isEditing && (
        <div 
          className="absolute -top-6 left-0 px-2 py-1 bg-blue-500 text-white text-xs rounded cursor-move opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={handleMouseDownDrag}
        >
          <Move size={12} />
        </div>
      )}

      {/* Resize handles */}
      {isSelected && !isEditing && (
        <>
          <div
            className="absolute top-0 left-0 w-3 h-3 bg-blue-500 cursor-nw-resize rounded-tl"
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
          <div
            className="absolute top-0 right-0 w-3 h-3 bg-blue-500 cursor-ne-resize rounded-tr"
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          <div
            className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 cursor-sw-resize rounded-bl"
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
          <div
            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize rounded-br"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
          
          {/* Rotation handle */}
          {(element.type === 'emoji' || element.type === 'shape' || element.type === 'image' || element.type === 'gif') && (
            <div
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-green-500 hover:bg-green-600 cursor-grab active:cursor-grabbing rounded-full flex items-center justify-center transition-colors"
              onMouseDown={handleRotationStart}
              title="Rotate"
            >
              <RotateCw size={12} className="text-white" />
            </div>
          )}
        </>
      )}


      {/* Emoji Style Toolbar */}
      {element.type === 'emoji' && (
        <EmojiStyleToolbar
          element={element}
          isSelected={isSelected}
          onUpdate={onUpdate}
        />
      )}
    </div>
  )
}