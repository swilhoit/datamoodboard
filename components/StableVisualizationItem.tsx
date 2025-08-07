'use client'

import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react'
import { X, Move, Maximize2, Palette, Type, Layers, Database } from 'lucide-react'
import dynamic from 'next/dynamic'
import StyledTable from './StyledTable'
import TableViewer from './TableViewer'

// Dynamically import chart wrapper
const ChartWrapper = dynamic(() => import('./ChartWrapper'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="animate-pulse text-gray-400">Loading visualization...</div>
    </div>
  )
})

interface VisualizationItemProps {
  item: any
  isSelected: boolean
  onSelect: () => void
  onUpdate: (id: string, updates: any) => void
  onDelete: (id: string) => void
}

const DEFAULT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

function StableVisualizationItem({
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
  const [showTableViewer, setShowTableViewer] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState(item.title || 'Untitled Chart')
  const itemRef = useRef<HTMLDivElement>(null)

  const handleMouseDownDrag = useCallback((e: React.MouseEvent) => {
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
  }, [item.x, item.y, onSelect])

  const handleMouseDownResize = useCallback((e: React.MouseEvent, corner: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeCorner(corner)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: item.width,
      height: item.height
    })
    onSelect()
  }, [item.width, item.height, onSelect])

  const handleTitleSubmit = useCallback(() => {
    onUpdate(item.id, { title: tempTitle })
    setIsEditingTitle(false)
  }, [item.id, tempTitle, onUpdate])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit()
    } else if (e.key === 'Escape') {
      setTempTitle(item.title || 'Untitled Chart')
      setIsEditingTitle(false)
    }
  }, [handleTitleSubmit, item.title])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y
        const newX = dragStart.itemX + deltaX
        const newY = dragStart.itemY + deltaY
        setCurrentPosition({ x: newX, y: newY })
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        
        let newWidth = resizeStart.width
        let newHeight = resizeStart.height
        let newX = item.x
        let newY = item.y

        if (resizeCorner.includes('right')) {
          newWidth = Math.max(200, resizeStart.width + deltaX)
        }
        if (resizeCorner.includes('left')) {
          newWidth = Math.max(200, resizeStart.width - deltaX)
          newX = item.x + (resizeStart.width - newWidth)
        }
        if (resizeCorner.includes('bottom')) {
          newHeight = Math.max(150, resizeStart.height + deltaY)
        }
        if (resizeCorner.includes('top')) {
          newHeight = Math.max(150, resizeStart.height - deltaY)
          newY = item.y + (resizeStart.height - newHeight)
        }

        onUpdate(item.id, { 
          width: newWidth, 
          height: newHeight,
          ...(newX !== item.x && { x: newX }),
          ...(newY !== item.y && { y: newY })
        })
      }
    }

    const handleMouseUp = () => {
      if (isDragging) {
        onUpdate(item.id, currentPosition)
      }
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, dragStart, resizeStart, resizeCorner, item, onUpdate, currentPosition])

  useEffect(() => {
    setCurrentPosition({ x: item.x, y: item.y })
  }, [item.x, item.y])

  // Memoize chart config
  const chartConfig = useMemo(() => ({
    colors: item.style?.colors || DEFAULT_COLORS,
    background: item.style?.background || '#FFFFFF',
    gridColor: item.style?.gridColor || '#E5E7EB',
    textColor: item.style?.textColor || '#1F2937',
    showLegend: true,
    showGrid: true,
    animated: false, // Disable animations
    smooth: true,
    showDataLabels: false,
    stacked: false,
    xAxis: item.data?.[0] ? Object.keys(item.data[0])[0] : 'name',
    yAxis: item.data?.[0] ? Object.keys(item.data[0])[1] : 'value',
  }), [item.style, item.data])

  // Memoize chart type
  const chartType = useMemo(() => {
    switch (item.type) {
      case 'lineChart': return 'line'
      case 'barChart': return 'bar'
      case 'pieChart': return 'pie'
      case 'area': return 'area'
      case 'scatter': return 'scatter'
      default: return 'bar'
    }
  }, [item.type])

  const renderContent = useCallback(() => {
    if (item.type === 'table') {
      if (item.style?.type === 'styled') {
        return (
          <StyledTable 
            data={item.data} 
            style={item.style}
            compact={item.height < 300}
          />
        )
      } else {
        return (
          <TableViewer
            data={item.data}
            onClose={() => {}}
            showHeader={false}
            compact={true}
          />
        )
      }
    }

    // Render chart using ChartWrapper
    return (
      <ChartWrapper
        data={item.data || []}
        type={chartType}
        library="recharts"
        config={chartConfig}
        width="100%"
        height="100%"
      />
    )
  }, [item, chartType, chartConfig])

  return (
    <>
      <div
        ref={itemRef}
        className={`absolute group ${isSelected ? 'z-30' : 'z-10'}`}
        style={{
          left: isDragging ? currentPosition.x : item.x,
          top: isDragging ? currentPosition.y : item.y,
          width: item.width,
          height: item.height,
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        {/* Title Bar */}
        <div 
          className={`absolute -top-8 left-0 right-0 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-t-md flex items-center justify-between transition-opacity ${
            isSelected || isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleKeyDown}
              className="text-xs font-medium text-gray-700 bg-transparent border-b border-gray-300 outline-none flex-1 mr-2"
              autoFocus
            />
          ) : (
            <span 
              className="text-xs font-medium text-gray-700 cursor-text flex-1"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditingTitle(true)
              }}
            >
              {item.title || 'Untitled Chart'}
            </span>
          )}
          <div className="flex items-center gap-1">
            {item.type === 'table' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowTableViewer(true)
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="View Full Table"
              >
                <Maximize2 size={12} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(item.id)
              }}
              className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div 
          className={`w-full h-full bg-white rounded-lg shadow-lg overflow-hidden border-2 transition-all ${
            isSelected ? 'border-blue-500 shadow-xl' : 'border-gray-200 hover:border-gray-300'
          }`}
          style={{
            backgroundColor: item.style?.background || '#FFFFFF',
          }}
        >
          {/* Drag Handle */}
          <div 
            className={`absolute top-0 left-0 right-0 h-6 cursor-move bg-gradient-to-b from-gray-50 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center ${
              isDragging ? 'opacity-100' : ''
            }`}
            onMouseDown={handleMouseDownDrag}
          >
            <Move size={14} className="text-gray-400" />
          </div>

          {/* Chart/Table Content */}
          <div className="w-full h-full p-4">
            {renderContent()}
          </div>
        </div>

        {/* Resize Handles */}
        {isSelected && (
          <>
            {/* Corner handles */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize" 
                 onMouseDown={(e) => handleMouseDownResize(e, 'top-left')} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize" 
                 onMouseDown={(e) => handleMouseDownResize(e, 'top-right')} />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize" 
                 onMouseDown={(e) => handleMouseDownResize(e, 'bottom-left')} />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize" 
                 onMouseDown={(e) => handleMouseDownResize(e, 'bottom-right')} />
            
            {/* Edge handles */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-2 bg-blue-500 rounded-full cursor-n-resize" 
                 onMouseDown={(e) => handleMouseDownResize(e, 'top')} />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-2 bg-blue-500 rounded-full cursor-s-resize" 
                 onMouseDown={(e) => handleMouseDownResize(e, 'bottom')} />
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-12 bg-blue-500 rounded-full cursor-w-resize" 
                 onMouseDown={(e) => handleMouseDownResize(e, 'left')} />
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-12 bg-blue-500 rounded-full cursor-e-resize" 
                 onMouseDown={(e) => handleMouseDownResize(e, 'right')} />
          </>
        )}
      </div>

      {/* Table Viewer Modal */}
      {showTableViewer && item.type === 'table' && (
        <TableViewer
          data={item.data}
          onClose={() => setShowTableViewer(false)}
          showHeader={true}
          compact={false}
        />
      )}
    </>
  )
}

// Export memoized component
export default memo(StableVisualizationItem)