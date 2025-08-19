'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  X, GitMerge, Filter, Calculator, Table2, Code, FileJson, 
  Download, Upload, Shuffle, Database, Layers, Sigma, 
  ArrowUpDown, Scissors, Copy, Play, Settings
} from 'lucide-react'

export type TransformType = 'sql' | 'join' | 'filter' | 'aggregate' | 'pivot' | 'select' | 'union' | 'export' | 'import' | 'merge'

interface TransformNodeProps {
  node: any
  isSelected: boolean
  onSelect: () => void
  onUpdate: (id: string, updates: any) => void
  onDelete: (id: string) => void
  onExecute?: (id: string) => void
  onStartConnection?: (nodeId: string, outputIndex: number, e: React.MouseEvent) => void
  onEndConnection?: (nodeId: string, inputIndex: number) => void
}

const transformConfigs = {
  sql: {
    name: 'SQL Query',
    icon: Code,
    color: 'bg-purple-500',
    inputs: 1,
    outputs: 1,
    fields: [
      { name: 'query', label: 'SQL Query', type: 'textarea', placeholder: 'SELECT * FROM input_1' }
    ]
  },
  join: {
    name: 'Join Tables',
    icon: GitMerge,
    color: 'bg-blue-500',
    inputs: 2,
    outputs: 1,
    fields: [
      { name: 'joinType', label: 'Join Type', type: 'select', options: ['INNER', 'LEFT', 'RIGHT', 'FULL'] },
      { name: 'leftKey', label: 'Left Key', type: 'text' },
      { name: 'rightKey', label: 'Right Key', type: 'text' }
    ]
  },
  filter: {
    name: 'Filter',
    icon: Filter,
    color: 'bg-green-500',
    inputs: 1,
    outputs: 1,
    fields: [
      { name: 'column', label: 'Column', type: 'text' },
      { name: 'operator', label: 'Operator', type: 'select', options: ['=', '!=', '>', '<', '>=', '<=', 'contains', 'starts with', 'ends with'] },
      { name: 'value', label: 'Value', type: 'text' }
    ]
  },
  aggregate: {
    name: 'Aggregate',
    icon: Sigma,
    color: 'bg-orange-500',
    inputs: 1,
    outputs: 1,
    fields: [
      { name: 'groupBy', label: 'Group By', type: 'text', placeholder: 'column1, column2' },
      { name: 'aggregations', label: 'Aggregations', type: 'textarea', placeholder: 'SUM(amount) as total, AVERAGE(price) as avg_price, COUNT(*) as count' }
    ]
  },
  pivot: {
    name: 'Pivot Table',
    icon: Table2,
    color: 'bg-pink-500',
    inputs: 1,
    outputs: 1,
    fields: [
      { name: 'rows', label: 'Row Fields', type: 'text' },
      { name: 'columns', label: 'Column Fields', type: 'text' },
      { name: 'values', label: 'Value Field', type: 'text' },
      { name: 'aggregation', label: 'Aggregation', type: 'select', options: ['SUM', 'AVERAGE', 'COUNT', 'MIN', 'MAX'] }
    ]
  },
  select: {
    name: 'Select Columns',
    icon: Layers,
    color: 'bg-indigo-500',
    inputs: 1,
    outputs: 1,
    fields: [
      { name: 'columns', label: 'Columns', type: 'textarea', placeholder: 'column1, column2, column3' }
    ]
  },
  union: {
    name: 'Union',
    icon: Copy,
    color: 'bg-teal-500',
    inputs: 2,
    outputs: 1,
    fields: [
      { name: 'type', label: 'Union Type', type: 'select', options: ['UNION', 'UNION ALL'] }
    ]
  },
  export: {
    name: 'Export Data',
    icon: Download,
    color: 'bg-gray-600',
    inputs: 1,
    outputs: 0,
    fields: [
      { name: 'format', label: 'Format', type: 'select', options: ['CSV', 'JSON', 'Excel', 'Parquet'] },
      { name: 'filename', label: 'Filename', type: 'text' }
    ]
  },
  import: {
    name: 'Import Data',
    icon: Upload,
    color: 'bg-gray-600',
    inputs: 0,
    outputs: 1,
    fields: [
      { name: 'source', label: 'Source', type: 'file' },
      { name: 'format', label: 'Format', type: 'select', options: ['CSV', 'JSON', 'Excel'] }
    ]
  },
  merge: {
    name: 'Merge Tables',
    icon: GitMerge,
    color: 'bg-yellow-500',
    inputs: 2,
    outputs: 1,
    fields: [
      { name: 'mergeType', label: 'Merge Type', type: 'select', options: ['inner', 'outer'] }
    ]
  },
}

export default function TransformNode({
  node,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onExecute,
  onStartConnection,
  onEndConnection
}: TransformNodeProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, itemX: 0, itemY: 0 })
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState(node.config || {})
  const nodeRef = useRef<HTMLDivElement>(null)

  const transformConfig = transformConfigs[node.transformType as TransformType]
  const Icon = transformConfig.icon

  const handleMouseDownDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      itemX: node.x,
      itemY: node.y
    })
    onSelect()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y
        onUpdate(node.id, {
          x: dragStart.itemX + deltaX,
          y: dragStart.itemY + deltaY
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart, node.id, onUpdate])

  const handleConfigChange = (field: string, value: any) => {
    let processedValue = value
    
    // Parse aggregations text into structured format for aggregate transform
    if (node.transformType === 'aggregate' && field === 'aggregations') {
      const aggregationText = value as string
      if (aggregationText) {
        // Parse text like "SUM(amount) as total, AVERAGE(price) as avg_price"
        const parsedAggregations = aggregationText.split(',').map(agg => {
          const trimmed = agg.trim()
          const match = trimmed.match(/^(SUM|AVERAGE|AVG|COUNT|MIN|MAX)\s*\(\s*([^)]+)\s*\)\s*(?:as\s+(.+))?$/i)
          if (match) {
            const [, operation, field, alias] = match
            const op = operation.toUpperCase() === 'AVERAGE' ? 'avg' : operation.toLowerCase()
            return {
              field: field.trim(),
              operation: op as 'sum' | 'avg' | 'count' | 'min' | 'max',
              alias: alias ? alias.trim() : `${op}_${field.trim()}`
            }
          }
          return null
        }).filter(Boolean)
        
        processedValue = parsedAggregations
      }
    }
    
    // Convert pivot table aggregation to lowercase for consistency
    if (node.transformType === 'pivot' && field === 'aggregation') {
      if (value === 'AVERAGE') {
        processedValue = 'avg'
      } else if (value) {
        processedValue = value.toLowerCase()
      }
    }
    
    const newConfig = { ...config, [field]: processedValue }
    setConfig(newConfig)
    onUpdate(node.id, { config: newConfig })
  }

  const renderConnectionPoints = () => {
    const points = []
    
    // Input connection points
    for (let i = 0; i < transformConfig.inputs; i++) {
      const top = 30 + (i * 20)
      points.push(
        <div
          key={`input-${i}`}
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-pointer hover:scale-125 transition-transform"
          style={{ left: -6, top }}
          data-connection-type="input"
          data-connection-index={i}
          onMouseUp={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onEndConnection?.(node.id, i)
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#EFF6FF'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF'
          }}
          title="Drop connection here"
        />
      )
    }
    
    // Output connection points
    for (let i = 0; i < transformConfig.outputs; i++) {
      const top = 30 + (i * 20)
      points.push(
        <div
          key={`output-${i}`}
          className="absolute w-3 h-3 bg-white border-2 border-green-500 rounded-full cursor-crosshair hover:scale-125 transition-transform"
          style={{ right: -6, top }}
          data-connection-type="output"
          data-connection-index={i}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onStartConnection?.(node.id, i, e)
          }}
          title="Drag to connect"
        />
      )
    }
    
    return points
  }

  return (
    <>
      <div
        ref={nodeRef}
        className={`absolute bg-white rounded-lg shadow-lg border-2 transition-all ${
          isSelected ? 'border-blue-500 shadow-xl ring-2 ring-blue-500 ring-opacity-30' : 'border-gray-300'
        } ${isDragging ? 'opacity-80' : ''}`}
        style={{
          left: node.x,
          top: node.y,
          width: 180,
          minHeight: 80,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
        onClick={onSelect}
      >
        <div 
          className={`${transformConfig.color} text-white p-2 rounded-t-md cursor-move flex items-center justify-between`}
          onMouseDown={handleMouseDownDrag}
        >
          <div className="flex items-center gap-2">
            <Icon size={14} />
            <span className="text-xs font-medium">{transformConfig.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowConfig(!showConfig)
              }}
              className="p-0.5 hover:bg-white/20 rounded transition-colors"
            >
              <Settings size={12} />
            </button>
            {onExecute && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onExecute(node.id)
                }}
                className="p-0.5 hover:bg-white/20 rounded transition-colors"
              >
                <Play size={12} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(node.id)
              }}
              className="p-0.5 hover:bg-white/20 rounded transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        <div className="p-2">
          <div className="text-xs text-gray-600">
            {transformConfig.inputs > 0 && (
              <div>Inputs: {transformConfig.inputs}</div>
            )}
            {transformConfig.outputs > 0 && (
              <div>Outputs: {transformConfig.outputs}</div>
            )}
          </div>
        </div>

        {renderConnectionPoints()}
      </div>

      {showConfig && (
        <div className="absolute bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50"
          style={{
            left: node.x + 200,
            top: node.y,
            width: 300,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Configure {transformConfig.name}</h3>
            <button
              onClick={() => setShowConfig(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {transformConfig.fields.map((field: any) => (
              <div key={field.name}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={config[field.name] || ''}
                    onChange={(e) => handleConfigChange(field.name, e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white text-black"
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt: any) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={config[field.name] || ''}
                    onChange={(e) => handleConfigChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded resize-none"
                    rows={3}
                  />
                ) : field.type === 'file' ? (
                  <input
                    type="file"
                    onChange={(e) => handleConfigChange(field.name, e.target.files?.[0])}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={config[field.name] || ''}
                    onChange={(e) => handleConfigChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowConfig(false)}
            className="mt-4 w-full px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            Apply Configuration
          </button>
        </div>
      )}
    </>
  )
}