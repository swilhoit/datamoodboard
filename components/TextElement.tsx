'use client'

import { useState, useRef, useEffect } from 'react'
import { Move, Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Palette, Minus, Plus } from 'lucide-react'
import FontSelector from './FontSelector'
import FontWeightSelector from './FontWeightSelector'

interface TextElementProps {
  element: any
  isSelected: boolean
  onSelect: () => void
  onUpdate: (id: string, updates: any) => void
  onDelete: (id: string) => void
}

import { googleFonts } from './FontSelector'

export default function TextElement({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete
}: TextElementProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, itemX: 0, itemY: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [resizeCorner, setResizeCorner] = useState<string>('')
  const [currentPosition, setCurrentPosition] = useState({ x: element.x, y: element.y })
  const textRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load Google Fonts dynamically with proper weights
  useEffect(() => {
    if (element.fontFamily && !document.querySelector(`link[href*="${element.fontFamily}"]`)) {
      const fontData = googleFonts.find(font => font.name === element.fontFamily)
      const weights = fontData?.weights || ['400']
      const weightsQuery = weights.join(';')
      
      const link = document.createElement('link')
      link.href = `https://fonts.googleapis.com/css2?family=${element.fontFamily.replace(/\s+/g, '+')}:wght@${weightsQuery}&display=swap`
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
  }, [element.fontFamily])

  const handleMouseDownDrag = (e: React.MouseEvent) => {
    if (isEditing) return
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
    if (isEditing) return
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    setResizeCorner(corner)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.width || 150,
      height: element.height || 40,
    })
  }

  const handleDoubleClick = () => {
    setIsEditing(true)
    setTimeout(() => {
      if (textRef.current) {
        textRef.current.focus()
        const selection = window.getSelection()
        const range = document.createRange()
        range.selectNodeContents(textRef.current)
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    }, 0)
  }

  const autoFitText = () => {
    if (textRef.current) {
      // Create temporary element to measure text
      const tempElement = document.createElement('div')
      tempElement.style.position = 'absolute'
      tempElement.style.visibility = 'hidden'
      tempElement.style.fontSize = `${element.fontSize || 16}px`
      tempElement.style.fontFamily = element.fontFamily || 'Inter'
      tempElement.style.fontWeight = element.fontWeight || (element.bold ? 'bold' : 'normal')
      tempElement.style.fontStyle = element.italic ? 'italic' : 'normal'
      tempElement.style.letterSpacing = `${element.letterSpacing || 0}px`
      tempElement.style.lineHeight = String(element.lineHeight || 1.5)
      tempElement.style.whiteSpace = 'pre-wrap'
      tempElement.style.padding = '4px'
      tempElement.innerHTML = textRef.current.innerHTML || 'Double-click to edit'
      
      document.body.appendChild(tempElement)
      const rect = tempElement.getBoundingClientRect()
      document.body.removeChild(tempElement)
      
      onUpdate(element.id, {
        width: Math.max(50, rect.width + 8),
        height: Math.max(20, rect.height + 8)
      })
    }
  }

  const handleTextInput = () => {
    autoFitText()
  }

  const handleTextBlur = () => {
    setIsEditing(false)
    if (textRef.current) {
      onUpdate(element.id, { text: textRef.current.innerText })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleTextBlur()
    }
  }

  // Sync currentPosition with element position when not dragging
  useEffect(() => {
    if (!isDragging && !isResizing) {
      setCurrentPosition({ x: element.x, y: element.y })
    }
  }, [element.x, element.y, isDragging, isResizing])

  // Auto-fit when font properties change
  useEffect(() => {
    if (!isEditing && !isDragging && !isResizing) {
      autoFitText()
    }
  }, [element.fontSize, element.fontFamily, element.fontWeight, element.letterSpacing, element.lineHeight, element.text])

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
          updates.height = Math.max(20, resizeStart.height + deltaY)
        }
        if (resizeCorner.includes('n')) {
          updates.height = Math.max(20, resizeStart.height - deltaY)
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

  const updateStyle = (styleUpdate: any) => {
    onUpdate(element.id, styleUpdate)
  }

  return (
    <>
      {/* Text Style Toolbar */}
      {isSelected && !isEditing && (
        <div 
          className="absolute z-30 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex items-center gap-1 animate-fadeIn"
          style={{
            left: element.x,
            top: element.y - 50,
            minWidth: 'max-content'
          }}
        >
          {/* Font Family */}
          <FontSelector
            selectedFont={element.fontFamily || 'Inter'}
            onFontChange={(font) => updateStyle({ fontFamily: font })}
          />

          {/* Font Weight */}
          <FontWeightSelector
            selectedFont={element.fontFamily || 'Inter'}
            selectedWeight={element.fontWeight || '400'}
            onWeightChange={(weight) => updateStyle({ fontWeight: weight })}
          />

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Font Size */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateStyle({ fontSize: Math.max(8, (element.fontSize || 16) - 2) })}
              className="p-1 hover:bg-gray-100 rounded"
              title="Decrease font size"
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              value={element.fontSize || 16}
              onChange={(e) => updateStyle({ fontSize: Math.max(8, Math.min(256, parseInt(e.target.value) || 16)) })}
              className="w-12 px-1 py-1 text-xs text-center border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              min="8"
              max="256"
            />
            <button
              onClick={() => updateStyle({ fontSize: Math.min(256, (element.fontSize || 16) + 2) })}
              className="p-1 hover:bg-gray-100 rounded"
              title="Increase font size"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Text Style */}
          <button
            onClick={() => updateStyle({ bold: !element.bold })}
            className={`p-1 rounded transition-colors-smooth button-press ${element.bold ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Bold"
          >
            <Bold size={14} />
          </button>
          <button
            onClick={() => updateStyle({ italic: !element.italic })}
            className={`p-1 rounded transition-colors-smooth button-press ${element.italic ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Italic"
          >
            <Italic size={14} />
          </button>
          <button
            onClick={() => updateStyle({ underline: !element.underline })}
            className={`p-1 rounded transition-colors-smooth button-press ${element.underline ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Underline"
          >
            <Underline size={14} />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Text Alignment */}
          <button
            onClick={() => updateStyle({ align: 'left' })}
            className={`p-1 rounded ${element.align === 'left' || !element.align ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Align left"
          >
            <AlignLeft size={14} />
          </button>
          <button
            onClick={() => updateStyle({ align: 'center' })}
            className={`p-1 rounded ${element.align === 'center' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Align center"
          >
            <AlignCenter size={14} />
          </button>
          <button
            onClick={() => updateStyle({ align: 'right' })}
            className={`p-1 rounded ${element.align === 'right' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title="Align right"
          >
            <AlignRight size={14} />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Color Picker */}
          <div className="relative">
            <input
              type="color"
              value={element.color || '#1F2937'}
              onChange={(e) => updateStyle({ color: e.target.value })}
              className="absolute opacity-0 w-8 h-8 cursor-pointer"
            />
            <button className="p-1 hover:bg-gray-100 rounded flex items-center gap-1">
              <Palette size={14} />
              <div 
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: element.color || '#1F2937' }}
              />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Kerning (Letter Spacing) */}
          <div className="flex items-center gap-1" title="Letter spacing (kerning)">
            <button
              onClick={() => updateStyle({ letterSpacing: Math.max(-2, (element.letterSpacing || 0) - 0.1) })}
              className="p-1 hover:bg-gray-100 rounded text-xs"
              title="Decrease letter spacing"
            >
              A↔
            </button>
            <input
              type="number"
              value={element.letterSpacing || 0}
              onChange={(e) => updateStyle({ letterSpacing: Math.max(-2, Math.min(5, parseFloat(e.target.value) || 0)) })}
              className="w-12 px-1 py-1 text-xs text-center border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              min="-2"
              max="5"
              step="0.1"
            />
            <button
              onClick={() => updateStyle({ letterSpacing: Math.min(5, (element.letterSpacing || 0) + 0.1) })}
              className="p-1 hover:bg-gray-100 rounded text-xs"
              title="Increase letter spacing"
            >
              A ↔
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Line Height */}
          <div className="flex items-center gap-1" title="Line height">
            <button
              onClick={() => updateStyle({ lineHeight: Math.max(0.8, (element.lineHeight || 1.5) - 0.1) })}
              className="p-1 hover:bg-gray-100 rounded text-xs"
              title="Decrease line height"
            >
              ≡
            </button>
            <input
              type="number"
              value={element.lineHeight || 1.5}
              onChange={(e) => updateStyle({ lineHeight: Math.max(0.8, Math.min(3, parseFloat(e.target.value) || 1.5)) })}
              className="w-12 px-1 py-1 text-xs text-center border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              min="0.8"
              max="3"
              step="0.1"
            />
            <button
              onClick={() => updateStyle({ lineHeight: Math.min(3, (element.lineHeight || 1.5) + 0.1) })}
              className="p-1 hover:bg-gray-100 rounded text-xs"
              title="Increase line height"
            >
              ☰
            </button>
          </div>
        </div>
      )}

      {/* Text Element */}
      <div
        ref={containerRef}
        className={`absolute transition-all-smooth canvas-item-enter ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        } ${isDragging ? 'opacity-80' : ''} ${
          isEditing ? 'z-20' : ''
        }`}
        style={{
          transform: `translate3d(${currentPosition.x}px, ${currentPosition.y}px, 0)`,
          width: element.width || 'auto',
          height: element.height || 'auto',
          minWidth: 50,
          minHeight: 20,
          cursor: isDragging ? 'grabbing' : isEditing ? 'text' : 'move',
          willChange: isDragging ? 'transform' : 'auto',
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: element.zIndex || 0,
        }}
        onClick={onSelect}
        onDoubleClick={handleDoubleClick}
        onMouseDown={!isEditing ? handleMouseDownDrag : undefined}
      >
        <div
          ref={textRef}
          contentEditable={isEditing}
          onInput={handleTextInput}
          onBlur={handleTextBlur}
          onKeyDown={handleKeyDown}
          className={`outline-none ${isEditing ? 'cursor-text' : 'cursor-move select-none'} whitespace-pre-wrap`}
          style={{
            fontSize: `${element.fontSize || 16}px`,
            fontFamily: element.fontFamily || 'Inter',
            ...(element.gradient ? {
              backgroundImage: element.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            } : {
              color: element.color || '#1F2937'
            }),
            fontWeight: element.fontWeight || (element.bold ? 'bold' : 'normal'),
            fontStyle: element.italic ? 'italic' : 'normal',
            textDecoration: element.underline ? 'underline' : 'none',
            textAlign: element.align as any || 'left',
            letterSpacing: `${element.letterSpacing || 0}px`,
            lineHeight: element.lineHeight || 1.5,
            padding: '4px',
          }}
          suppressContentEditableWarning={true}
        >
          {element.text || 'Double-click to edit'}
        </div>

        {/* Drag Handle (visible on hover when not editing) */}
        {!isEditing && (
          <div 
            className="absolute -top-6 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-blue-500 text-white rounded text-xs opacity-0 hover:opacity-100 transition-opacity cursor-move flex items-center gap-1"
            onMouseDown={handleMouseDownDrag}
          >
            <Move size={12} />
            <span>Drag</span>
          </div>
        )}
        
        {/* Resize Handles (visible when selected and not editing) */}
        {isSelected && !isEditing && (
          <>
            {/* Corner resize handles */}
            <div
              className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded cursor-nw-resize"
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
            />
            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded cursor-ne-resize"
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
            />
            <div
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded cursor-sw-resize"
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
            />
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded cursor-se-resize"
              onMouseDown={(e) => handleResizeStart(e, 'se')}
            />
            
            {/* Edge resize handles */}
            <div
              className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white rounded cursor-n-resize"
              onMouseDown={(e) => handleResizeStart(e, 'n')}
            />
            <div
              className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white rounded cursor-s-resize"
              onMouseDown={(e) => handleResizeStart(e, 's')}
            />
            <div
              className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded cursor-w-resize"
              onMouseDown={(e) => handleResizeStart(e, 'w')}
            />
            <div
              className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded cursor-e-resize"
              onMouseDown={(e) => handleResizeStart(e, 'e')}
            />
          </>
        )}
      </div>
    </>
  )
}