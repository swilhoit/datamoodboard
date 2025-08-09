'use client'

import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react'
import { X, Move, Maximize2, Palette, Type, Layers, Database } from 'lucide-react'
import dynamic from 'next/dynamic'
import StyledTable from './StyledTable'
 

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
    // Auto-size based on content with sensible limits
    const isTable = item.type === 'table'
    const isChart = ['lineChart', 'barChart', 'pieChart', 'area', 'areaChart', 'scatter', 'scatterPlot'].includes(item.type)

    // Avoid fighting user while dragging/resizing
    if (isDragging || isResizing) return

    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 720

    const MAX_WIDTH = Math.max(520, Math.min(900, Math.round(viewportWidth * 0.6)))
    const MAX_HEIGHT = Math.max(320, Math.min(600, Math.round(viewportHeight * 0.6)))
    const MIN_WIDTH = 320
    const MIN_HEIGHT = 200

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(val)))

    const approxEquals = (a: number, b: number, tol = 12) => Math.abs(a - b) <= tol

    let recommendedWidth = item.width || 400
    let recommendedHeight = item.height || 300

    if (isTable) {
      const data = Array.isArray(item.data) ? item.data : []
      const first = data.length > 0 ? data[0] : null
      const columns = first ? Object.keys(first) : []
      // Width: estimate column widths; image-like column narrower
      const estColWidth = (col: string) => {
        const c = col.toLowerCase()
        const isImage = ['image', 'img', 'thumbnail', 'photo', 'picture'].some(k => c.includes(k))
        return isImage ? 80 : 140
      }
      const basePadding = 64 // padding + borders
      const estimatedWidth = columns.reduce((acc, col) => acc + estColWidth(col), 0) + basePadding

      // Height: search(56) + header(44) + rows*rowHeight + pagination(56 if needed)
      const totalRows = data.length
      const maxVisibleRows = totalRows <= 8 ? totalRows : 8
      const hasPagination = totalRows > maxVisibleRows
      const searchBar = 56
      const header = 44
      const rowHeight = 44
      const pagination = hasPagination ? 56 : 0
      const estimatedHeight = searchBar + header + maxVisibleRows * rowHeight + pagination + 16

      recommendedWidth = clamp(estimatedWidth, MIN_WIDTH, MAX_WIDTH)
      recommendedHeight = clamp(estimatedHeight, MIN_HEIGHT, MAX_HEIGHT)
    } else if (isChart) {
      const dataLen = Array.isArray(item.data) ? item.data.length : 0
      // Base heights by chart type
      switch (item.type) {
        case 'pieChart':
          recommendedHeight = 260
          break
        case 'scatter':
        case 'scatterPlot':
          recommendedHeight = 320
          break
        case 'area':
        case 'areaChart':
        case 'lineChart':
        case 'barChart':
        default: {
          const base = 280
          // Slightly increase height with more categories to reduce crowding
          const extra = dataLen > 10 ? 60 : dataLen > 6 ? 30 : 0
          recommendedHeight = base + extra
          break
        }
      }
      // Width: keep current or ensure a reasonable minimum
      recommendedWidth = clamp(item.width || 420, MIN_WIDTH + 60, MAX_WIDTH)
      recommendedHeight = clamp(recommendedHeight, MIN_HEIGHT + 40, MAX_HEIGHT)
    }

    const needsWidthUpdate = !approxEquals(item.width || 0, recommendedWidth)
    const needsHeightUpdate = !approxEquals(item.height || 0, recommendedHeight)

    if ((isTable || isChart) && (needsWidthUpdate || needsHeightUpdate)) {
      onUpdate(item.id, {
        width: needsWidthUpdate ? recommendedWidth : item.width,
        height: needsHeightUpdate ? recommendedHeight : item.height,
      })
    }
  }, [item.id, item.type, item.data, item.width, item.height, isDragging, isResizing, onUpdate])

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
    // Font sizes (allow numbers or numeric strings)
    fontSize: item.style?.fontSize,
    axisFontSize: item.style?.axisFontSize ?? item.style?.fontSize,
    legendFontSize: item.style?.legendFontSize ?? item.style?.fontSize,
    titleFontSize: item.style?.titleFontSize ?? (item.style?.fontSize ? Number(item.style?.fontSize) + 2 : undefined),
    labelFontSize: item.style?.labelFontSize ?? item.style?.fontSize,
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
      case 'area':
      case 'areaChart':
        return 'area'
      case 'scatter':
      case 'scatterPlot':
        return 'scatter'
      case 'kpiCard':
        return 'bar' // simple fallback visualization; could render custom KPI component later
      default: return 'bar'
    }
  }, [item.type])

  const tableForViewer = useMemo(() => {
    const first = Array.isArray(item.data) && item.data.length > 0 ? item.data[0] : null
    const schema = first
      ? Object.keys(first).map((key) => ({ name: key, type: typeof (first as any)[key] }))
      : []
    return {
      id: item.id,
      tableName: item.title || 'Data',
      database: item.database || 'custom',
      schema,
      data: item.data || [],
    }
  }, [item])

  const renderContent = useCallback(() => {
    if (item.type === 'table') {
      if (item.style?.type === 'styled') {
        return (
          <StyledTable 
            data={item.data} 
            style={{ ...item.style, compact: item.height < 300 }}
          />
        )
      } else {
        return (
          <StyledTable
            data={item.data}
            style={{ theme: 'minimal' }}
          />
        )
      }
    }

    // Basic KPI fallback: render big number when KPI card
    if (item.type === 'kpiCard') {
      const metric = item.metric || (Array.isArray(item.data) && item.data[0] && Object.keys(item.data[0])[1])
      const value = Array.isArray(item.data) && item.data.length > 0 && metric ? item.data[item.data.length - 1][metric] : null
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-xs uppercase tracking-wide text-gray-400">{item.title || 'Metric'}</div>
            <div className="text-3xl font-bold" style={{ color: item.style?.textColor || '#1F2937' }}>
              {value ?? '—'}
            </div>
          </div>
        </div>
      )
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
          className={`w-full h-full bg-white rounded-lg overflow-hidden border-2 transition-all ${
            isSelected ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
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

      
    </>
  )
}

// Export memoized component
export default memo(StableVisualizationItem)