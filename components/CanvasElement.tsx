'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Move, Maximize2, Type, Image as ImageIcon } from 'lucide-react'

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
  }, [isDragging, isResizing, dragStart, resizeStart, resizeCorner, element, onUpdate])

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
      
      case 'shape':
        const shapeStyle = {
          backgroundColor: element.fill || '#3B82F6',
          border: element.stroke ? `2px solid ${element.strokeColor || '#1F2937'}` : 'none',
        }
        
        if (element.shapeType === 'circle') {
          return (
            <div 
              className="w-full h-full rounded-full"
              style={shapeStyle}
            />
          )
        } else if (element.shapeType === 'triangle') {
          return (
            <div 
              className="w-0 h-0"
              style={{
                borderLeft: `${(element.width || 100) / 2}px solid transparent`,
                borderRight: `${(element.width || 100) / 2}px solid transparent`,
                borderBottom: `${element.height || 100}px solid ${element.fill || '#3B82F6'}`,
              }}
            />
          )
        } else {
          return (
            <div 
              className="w-full h-full"
              style={shapeStyle}
            />
          )
        }
      
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
        element.type === 'text' ? '' : 'bg-white'
      }`}
      style={{
        transform: `translate3d(${currentPosition.x}px, ${currentPosition.y}px, 0)`,
        left: 0,
        top: 0,
        width: element.width || (element.type === 'text' ? 'auto' : 200),
        height: element.height || (element.type === 'text' ? 'auto' : 100),
        minWidth: element.type === 'text' ? 100 : undefined,
        minHeight: element.type === 'text' ? 30 : undefined,
        cursor: isDragging ? 'grabbing' : 'default',
        borderRadius: element.rounded ? 8 : 0,
        boxShadow: element.shadow ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
        willChange: isDragging ? 'transform' : 'auto',
      }}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
    >
      {/* Header for non-text elements */}
      {element.type !== 'text' && (
        <div 
          className={`absolute top-0 left-0 right-0 h-8 bg-gray-900 flex items-center justify-between px-2 cursor-move rounded-t transition-all duration-200 ${
            isSelected 
              ? 'bg-opacity-90 opacity-100' 
              : (element.type === 'image' || element.type === 'gif') 
                ? 'bg-opacity-50 opacity-70 hover:opacity-100 hover:bg-opacity-90'
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
        </>
      )}
    </div>
  )
}