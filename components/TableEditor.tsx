'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  X, Plus, Trash2, Edit2, Save, 
  Copy, Download, Upload, Table,
  ChevronUp, ChevronDown, ArrowUpDown,
  Type, Hash, Calendar, ToggleLeft,
  Settings, Filter, Search
} from 'lucide-react'

interface TableEditorProps {
  isOpen: boolean
  onClose: () => void
  data: any[]
  onSave: (data: any[]) => void
  title?: string
}

interface Column {
  key: string
  name: string
  type: 'text' | 'number' | 'date' | 'boolean'
  width?: number
}

export default function TableEditor({ isOpen, onClose, data: initialData, onSave, title = 'Table Editor' }: TableEditorProps) {
  const [tableData, setTableData] = useState<any[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [dimensions, setDimensions] = useState({ width: '95vw', height: '50vh' })
  const [isResizing, setIsResizing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setTableData([...initialData])
      
      // Auto-detect columns from data
      const keys = Object.keys(initialData[0])
      const cols: Column[] = keys.map(key => ({
        key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        type: detectColumnType(initialData[0][key])
      }))
      setColumns(cols)
    } else {
      // Initialize with empty table
      setColumns([
        { key: 'col1', name: 'Column 1', type: 'text' },
        { key: 'col2', name: 'Column 2', type: 'text' },
        { key: 'col3', name: 'Column 3', type: 'number' }
      ])
      setTableData([
        { col1: '', col2: '', col3: 0 },
        { col1: '', col2: '', col3: 0 }
      ])
    }
  }, [initialData])

  const detectColumnType = (value: any): Column['type'] => {
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    if (value instanceof Date || !isNaN(Date.parse(value))) return 'date'
    return 'text'
  }

  const handleCellEdit = (rowIndex: number, colKey: string, value: any) => {
    const newData = [...tableData]
    newData[rowIndex] = { ...newData[rowIndex], [colKey]: value }
    setTableData(newData)
  }

  const addRow = () => {
    const newRow: any = {}
    columns.forEach(col => {
      newRow[col.key] = col.type === 'number' ? 0 : col.type === 'boolean' ? false : ''
    })
    setTableData([...tableData, newRow])
  }

  const deleteRows = () => {
    const newData = tableData.filter((_, index) => !selectedRows.has(index))
    setTableData(newData)
    setSelectedRows(new Set())
  }

  const addColumn = () => {
    const newColKey = `col${columns.length + 1}`
    const newCol: Column = {
      key: newColKey,
      name: `Column ${columns.length + 1}`,
      type: 'text'
    }
    setColumns([...columns, newCol])
    
    const newData = tableData.map(row => ({
      ...row,
      [newColKey]: ''
    }))
    setTableData(newData)
  }

  const deleteColumn = (colKey: string) => {
    setColumns(columns.filter(col => col.key !== colKey))
    const newData = tableData.map(row => {
      const newRow = { ...row }
      delete newRow[colKey]
      return newRow
    })
    setTableData(newData)
  }

  const updateColumn = (oldKey: string, newCol: Column) => {
    const newColumns = columns.map(col => col.key === oldKey ? newCol : col)
    setColumns(newColumns)
    
    if (oldKey !== newCol.key) {
      const newData = tableData.map(row => {
        const newRow = { ...row }
        newRow[newCol.key] = newRow[oldKey]
        delete newRow[oldKey]
        return newRow
      })
      setTableData(newData)
    }
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedData = React.useMemo(() => {
    let sortableData = [...tableData]
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] === null || a[sortConfig.key] === undefined) return 1
        if (b[sortConfig.key] === null || b[sortConfig.key] === undefined) return -1
        
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    return sortableData
  }, [tableData, sortConfig])

  const filteredData = React.useMemo(() => {
    if (!searchTerm) return sortedData
    
    return sortedData.filter(row => {
      return Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }, [sortedData, searchTerm])

  const exportCSV = () => {
    const headers = columns.map(col => col.name).join(',')
    const rows = tableData.map(row => 
      columns.map(col => JSON.stringify(row[col.key] || '')).join(',')
    ).join('\n')
    
    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'table-data.csv'
    a.click()
  }

  const handleSave = () => {
    onSave(tableData)
    onClose()
  }

  if (!isOpen) return null

  const handleResize = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = parseInt(dimensions.width)
    const startHeight = parseInt(dimensions.height)
    
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(600, Math.min(window.innerWidth * 0.95, startWidth + e.clientX - startX))
      const newHeight = Math.max(400, Math.min(window.innerHeight * 0.9, startHeight + e.clientY - startY))
      setDimensions({ 
        width: `${newWidth}px`, 
        height: `${newHeight}px` 
      })
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        className="bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden relative"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {/* Resize Handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize group"
          onMouseDown={handleResize}
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-gray-400 group-hover:border-purple-600" />
        </div>
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Table className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-dm-mono font-semibold uppercase text-gray-800">{title}</h2>
            <span className="text-sm text-gray-500">
              {filteredData.length} rows × {columns.length} columns
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className="p-2 hover:bg-white/60 rounded-lg transition-colors"
              title="Column settings"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={exportCSV}
              className="p-2 hover:bg-white/60 rounded-lg transition-colors"
              title="Export CSV"
            >
              <Download size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/60 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={addRow}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-dm-mono font-medium uppercase hover:bg-gray-50 flex items-center gap-1"
            >
              <Plus size={14} />
              Add Row
            </button>
            <button
              onClick={addColumn}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-dm-mono font-medium uppercase hover:bg-gray-50 flex items-center gap-1"
            >
              <Plus size={14} />
              Add Column
            </button>
            {selectedRows.size > 0 && (
              <button
                onClick={deleteRows}
                className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-dm-mono font-medium uppercase hover:bg-red-100 flex items-center gap-1"
              >
                <Trash2 size={14} />
                Delete {selectedRows.size} Row{selectedRows.size > 1 ? 's' : ''}
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Column Settings Panel */}
        {showColumnSettings && (
          <div className="px-6 py-3 border-b bg-blue-50">
            <div className="text-sm font-dm-mono font-medium uppercase text-gray-700 mb-2">Column Settings</div>
            <div className="flex gap-2 flex-wrap">
              {columns.map((col) => (
                <div key={col.key} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border">
                  <input
                    type="text"
                    value={col.name}
                    onChange={(e) => updateColumn(col.key, { ...col, name: e.target.value })}
                    className="w-24 text-sm font-dm-mono font-medium uppercase focus:outline-none"
                  />
                  <select
                    value={col.type}
                    onChange={(e) => updateColumn(col.key, { ...col, type: e.target.value as Column['type'] })}
                    className="text-xs border rounded px-1 py-0.5"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="boolean">Boolean</option>
                  </select>
                  <button
                    onClick={() => deleteColumn(col.key)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="w-10 px-2 py-2 border-b">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === tableData.length && tableData.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(new Set(tableData.map((_, i) => i)))
                      } else {
                        setSelectedRows(new Set())
                      }
                    }}
                    className="rounded"
                  />
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-2 text-left text-xs font-dm-mono font-medium text-gray-700 uppercase tracking-wider border-b cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.type === 'text' && <Type size={12} />}
                      {col.type === 'number' && <Hash size={12} />}
                      {col.type === 'date' && <Calendar size={12} />}
                      {col.type === 'boolean' && <ToggleLeft size={12} />}
                      <span>{col.name}</span>
                      {sortConfig?.key === col.key && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`border-b hover:bg-gray-50 ${selectedRows.has(rowIndex) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(rowIndex)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedRows)
                        if (e.target.checked) {
                          newSelected.add(rowIndex)
                        } else {
                          newSelected.delete(rowIndex)
                        }
                        setSelectedRows(newSelected)
                      }}
                      className="rounded"
                    />
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-2 text-sm"
                      onClick={() => setEditingCell({ row: rowIndex, col: col.key })}
                    >
                      {editingCell?.row === rowIndex && editingCell?.col === col.key ? (
                        <input
                          ref={inputRef}
                          type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                          value={row[col.key] || ''}
                          onChange={(e) => handleCellEdit(rowIndex, col.key, 
                            col.type === 'number' ? Number(e.target.value) : 
                            col.type === 'boolean' ? e.target.value === 'true' :
                            e.target.value
                          )}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Tab') {
                              setEditingCell(null)
                            }
                          }}
                          className="w-full px-1 py-0.5 border border-purple-500 rounded focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <div className="cursor-pointer">
                          {col.type === 'boolean' 
                            ? (row[col.key] ? '✓' : '✗')
                            : (row[col.key] || '-')
                          }
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {selectedRows.size > 0 && `${selectedRows.size} row(s) selected`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}