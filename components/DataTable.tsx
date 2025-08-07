'use client'

import { useState, useRef, useEffect } from 'react'
import { Database, X, Link2, Key, Hash, Calendar, Type, ChevronRight, ChevronDown, Eye } from 'lucide-react'
import { DatabaseType } from '@/app/page'
import DataPreview from './DataPreview'

interface DataTableProps {
  table: any
  isSelected: boolean
  onSelect: () => void
  onUpdate: (id: string, updates: any) => void
  onDelete: (id: string) => void
  onConnect?: (tableId: string, field: string) => void
  onStartConnection?: (tableId: string) => void
  onEndConnection?: (tableId: string) => void
}

const getDatabaseIcon = (type: DatabaseType | 'googlesheets') => {
  const icons = {
    googlesheets: '📊',
    bigquery: '🔷',
    postgresql: '🐘',
    mysql: '🐬',
    mongodb: '🍃',
    snowflake: '❄️',
    redshift: '🔴',
  }
  return icons[type] || '💾'
}

const getDatabaseColor = (type: DatabaseType | 'googlesheets') => {
  const colors = {
    googlesheets: 'bg-green-500',
    bigquery: 'bg-blue-500',
    postgresql: 'bg-blue-600',
    mysql: 'bg-orange-500',
    mongodb: 'bg-green-600',
    snowflake: 'bg-cyan-500',
    redshift: 'bg-red-600',
  }
  return colors[type] || 'bg-gray-500'
}

const getFieldIcon = (type: string) => {
  if (type.includes('INT')) return <Hash size={12} />
  if (type.includes('VARCHAR') || type.includes('TEXT')) return <Type size={12} />
  if (type.includes('DATE') || type.includes('TIME')) return <Calendar size={12} />
  return <Database size={12} />
}

export default function DataTable({
  table,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onConnect,
  onStartConnection,
  onEndConnection
}: DataTableProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, itemX: 0, itemY: 0 })
  const [isExpanded, setIsExpanded] = useState(true)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [showPreview, setShowPreview] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)

  const handleMouseDownDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      itemX: table.x,
      itemY: table.y
    })
    onSelect()
  }

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: table.width,
      height: table.height,
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y
        onUpdate(table.id, {
          x: dragStart.itemX + deltaX,
          y: dragStart.itemY + deltaY
        })
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        onUpdate(table.id, {
          width: Math.max(250, resizeStart.width + deltaX),
          height: Math.max(150, resizeStart.height + deltaY),
        })
      }
    }

    const handleMouseUp = () => {
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
  }, [isDragging, isResizing, dragStart, resizeStart, table.id, onUpdate])

  return (
    <div
      ref={tableRef}
      className={`absolute bg-white rounded-lg shadow-lg border-2 transition-all ${
        isSelected ? 'border-blue-500 shadow-xl' : 'border-gray-300'
      } ${isDragging ? 'opacity-80' : ''}`}
      style={{
        left: table.x,
        top: table.y,
        width: table.width,
        height: isExpanded ? 'auto' : 60,
        minHeight: isExpanded ? table.height : 60,
        maxHeight: isExpanded ? table.height : 60,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      onClick={onSelect}
    >
      <div 
        className={`rounded-t-lg ${getDatabaseColor(table.database)} text-white p-3 cursor-move flex items-center justify-between`}
        onMouseDown={handleMouseDownDrag}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{getDatabaseIcon(table.database)}</span>
          <div>
            <div className="font-semibold">{table.tableName}</div>
            <div className="text-xs opacity-90">{table.database}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {table.data && table.data.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowPreview(true)
              }}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Preview data"
            >
              <Eye size={16} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(table.id)
            }}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 overflow-auto" style={{ maxHeight: table.height - 60 }}>
          <div className="space-y-1">
            {table.schema?.map((field: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded group"
              >
                <div className="flex items-center gap-2">
                  {field.isPrimary && <Key size={12} className="text-yellow-600" />}
                  {field.isForeign && <Link2 size={12} className="text-blue-600" />}
                  {!field.isPrimary && !field.isForeign && getFieldIcon(field.type)}
                  <span className="text-sm font-medium">{field.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{field.type}</span>
                  {onConnect && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onConnect(table.id, field.name)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded transition-all"
                      title="Create connection"
                    >
                      <Link2 size={12} className="text-blue-600" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSelected && isExpanded && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize rounded-br-lg"
          onMouseDown={handleResizeStart}
        />
      )}

      {/* Connection Points */}
      <div
        className="absolute w-3 h-3 bg-white border-2 border-green-500 rounded-full cursor-crosshair hover:scale-125 transition-transform"
        style={{ right: -6, top: 60 }}
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onStartConnection?.(table.id)
        }}
        title="Drag to connect"
      />
      <div
        className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full hover:scale-125 transition-transform"
        style={{ left: -6, top: 60 }}
        onMouseUp={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onEndConnection?.(table.id)
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#EFF6FF'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#FFFFFF'
        }}
        title="Drop connection here"
      />

      {/* Data Preview Modal */}
      <DataPreview
        table={table}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  )
}