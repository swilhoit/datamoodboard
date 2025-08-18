'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, Database, Eye, SlidersHorizontal, Columns, Filter, Table as TableIcon, ExternalLink, Pencil, Check } from 'lucide-react'
import StyledTable from './StyledTable'

interface TableDetailsPanelProps {
  nodeId: string
  nodeLabel: string
  data: any[]
  schema?: Array<{ name: string; type?: string }>
  onClose: () => void
  onOpenEditor?: () => void
  onOpenFilter?: () => void
  onApplyColumns?: (projectedData: any[], selectedColumns: string[]) => void
  onRename?: (newName: string) => void
  isDarkMode?: boolean
}

export default function TableDetailsPanel({
  nodeId,
  nodeLabel,
  data,
  schema = [],
  onClose,
  onOpenEditor,
  onOpenFilter,
  onApplyColumns,
  onRename,
  isDarkMode = false,
}: TableDetailsPanelProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingName, setEditingName] = useState(nodeLabel)
  
  const handleStartEdit = () => {
    setIsEditingName(true)
    setEditingName(nodeLabel)
  }
  
  const handleCancelEdit = () => {
    setIsEditingName(false)
    setEditingName(nodeLabel)
  }
  
  const handleSaveEdit = () => {
    const trimmedName = editingName.trim()
    if (trimmedName && trimmedName !== nodeLabel && onRename) {
      onRename(trimmedName)
    }
    setIsEditingName(false)
  }
  const allColumns = useMemo<string[]>(() => {
    if (schema && schema.length > 0) return schema.map(s => s.name)
    if (Array.isArray(data) && data.length > 0 && data[0] && typeof data[0] === 'object') {
      return Object.keys(data[0])
    }
    return []
  }, [schema, data])

  const [selectedColumns, setSelectedColumns] = useState<string[]>(allColumns)

  useEffect(() => {
    setSelectedColumns(allColumns)
  }, [allColumns.join('|')])

  const projectedPreview = useMemo(() => {
    if (!Array.isArray(data)) return []
    if (selectedColumns.length === 0) return []
    return data.slice(0, 20).map(row => {
      const out: any = {}
      selectedColumns.forEach(col => { out[col] = row[col] })
      return out
    })
  }, [data, selectedColumns])

  const toggleColumn = (col: string) => {
    setSelectedColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])
  }

  const selectAll = () => setSelectedColumns(allColumns)
  const clearAll = () => setSelectedColumns([])

  const applyColumns = () => {
    if (!onApplyColumns) return
    const fullProjection = (Array.isArray(data) ? data : []).map(row => {
      const out: any = {}
      selectedColumns.forEach(col => { out[col] = row[col] })
      return out
    })
    onApplyColumns(fullProjection, selectedColumns)
  }

  return (
    <div className={`fixed right-6 top-24 w-[560px] z-50 flex flex-col rounded-xl overflow-hidden border backdrop-blur-sm ${
      isDarkMode 
        ? 'bg-gray-900/95 text-gray-100 border-gray-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' 
        : 'bg-white/95 border-gray-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)]'
    }`} style={{ maxHeight: 'calc(100vh - 8rem)', minHeight: 'auto' }}>
      {/* Header */}
      <div className={`group px-4 py-3 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Database size={20} className="text-blue-500 flex-shrink-0" />
            {isEditingName ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                  onBlur={handleSaveEdit}
                  autoFocus
                  className={`flex-1 px-2 py-1 text-lg font-semibold rounded border ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-blue-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <button
                  onClick={handleSaveEdit}
                  className="p-1 rounded hover:bg-blue-100 text-blue-600"
                  title="Save"
                >
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <h2 
                  className="text-lg font-semibold truncate cursor-text hover:text-blue-600" 
                  title="Click to rename"
                  onClick={handleStartEdit}
                >
                  {nodeLabel}
                </h2>
                <button
                  onClick={handleStartEdit}
                  className={`p-1 rounded transition-all opacity-0 group-hover:opacity-100 ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                  title="Rename table"
                >
                  <Pencil size={14} className="text-gray-500" />
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{Array.isArray(data) ? data.length : 0} rows</span>
          <span>•</span>
          <span>{allColumns.length} columns</span>
          <span>•</span>
          <span className="text-xs font-mono">{nodeId}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className={`p-3 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenFilter}
            className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
              isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white border border-gray-300 hover:bg-gray-50'
            }`}
            title="Open Filter & Columns"
          >
            <Filter size={16} />
            Filter Rows
          </button>
          <button
            onClick={applyColumns}
            disabled={!onApplyColumns || selectedColumns.length === allColumns.length}
            className={`px-3 py-2 rounded-lg text-sm ${
              isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Apply hidden columns"
          >
            Apply Columns
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenEditor}
            className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm flex items-center gap-2"
            title="Open Table Editor"
          >
            <SlidersHorizontal size={16} />
            Open Editor
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-auto" style={{ maxHeight: '400px' }}>
        {/* Columns section */}
        <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Columns size={16} />
              <span className="font-medium">Columns</span>
              <span className="text-xs text-gray-500">({selectedColumns.length}/{allColumns.length} visible)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <button className="text-blue-600 hover:underline" onClick={selectAll}>Select all</button>
              <button className="text-gray-600 hover:underline" onClick={clearAll}>Clear</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {allColumns.map((col) => (
              <label key={col} className={`flex items-center gap-2 p-2 rounded cursor-pointer ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(col)}
                  onChange={() => toggleColumn(col)}
                  className="rounded"
                />
                <span className="text-sm truncate" title={col}>{col}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preview section */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <TableIcon size={16} />
            <span className="font-medium">Preview</span>
            <span className="text-xs text-gray-500">(first 20 rows)</span>
          </div>
          <div className="h-48 border rounded-lg overflow-hidden">
            <StyledTable
              data={projectedPreview}
              style={{ compact: true, showSearch: false, stickyHeader: true }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`px-4 py-2 border-t flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="text-sm text-gray-500">
          Showing {projectedPreview.length} of {Array.isArray(data) ? data.length : 0} rows
        </div>
        <button
          onClick={onOpenFilter}
          className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
            isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white border border-gray-300 hover:bg-gray-50'
          }`}
          title="Open advanced filter"
        >
          <Eye size={16} />
          Advanced Filter
        </button>
      </div>
    </div>
  )
}


