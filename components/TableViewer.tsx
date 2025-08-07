'use client'

import { useState, useRef } from 'react'
import { X, Plus, Trash2, Edit3, Save, Download, Upload, Search, Filter, ChevronDown, Image as ImageIcon, ExternalLink } from 'lucide-react'

interface TableViewerProps {
  table: any
  isOpen: boolean
  onClose: () => void
  onUpdate: (tableId: string, updates: any) => void
}

interface TableCell {
  value: any
  type?: 'text' | 'number' | 'date' | 'image' | 'url'
}

export default function TableViewer({ table, isOpen, onClose, onUpdate }: TableViewerProps) {
  const [data, setData] = useState(table?.data || [])
  const [editingCell, setEditingCell] = useState<{row: number, col: string} | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filterColumn, setFilterColumn] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen || !table) return null

  const columns = table.schema || []
  const filteredData = data.filter((row: any) => {
    if (!searchTerm) return true
    return Object.values(row).some((value: any) => 
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const sortedData = [...filteredData].sort((a: any, b: any) => {
    if (!sortColumn) return 0
    const aVal = a[sortColumn]
    const bVal = b[sortColumn]
    
    if (aVal === bVal) return 0
    if (aVal === null || aVal === undefined) return sortDirection === 'asc' ? 1 : -1
    if (bVal === null || bVal === undefined) return sortDirection === 'asc' ? -1 : 1
    
    // Handle different data types
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    }
    
    // Convert to strings for comparison
    const aStr = String(aVal).toLowerCase()
    const bStr = String(bVal).toLowerCase()
    
    if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1
    if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const detectColumnType = (value: any): 'text' | 'number' | 'date' | 'image' | 'url' => {
    if (typeof value === 'number') return 'number'
    if (typeof value === 'string') {
      if (value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image'
      if (value.match(/^https?:\/\//)) return 'url'
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) return 'date'
    }
    return 'text'
  }

  const handleCellEdit = (rowIndex: number, columnName: string, newValue: any) => {
    const newData = [...data]
    newData[rowIndex] = { ...newData[rowIndex], [columnName]: newValue }
    setData(newData)
    onUpdate(table.id, { data: newData })
  }

  const addRow = () => {
    const newRow: any = {}
    columns.forEach((col: any) => {
      newRow[col.name] = ''
    })
    const newData = [...data, newRow]
    setData(newData)
    onUpdate(table.id, { data: newData })
  }

  const deleteRow = (rowIndex: number) => {
    const newData = data.filter((_: any, index: number) => index !== rowIndex)
    setData(newData)
    onUpdate(table.id, { data: newData })
  }

  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnName)
      setSortDirection('asc')
    }
  }

  const renderCell = (row: any, column: any, rowIndex: number) => {
    const value = row[column.name]
    const cellType = detectColumnType(value)
    const isEditing = editingCell?.row === rowIndex && editingCell?.col === column.name

    if (isEditing) {
      return (
        <input
          type={cellType === 'number' ? 'number' : 'text'}
          value={value || ''}
          onChange={(e) => handleCellEdit(rowIndex, column.name, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setEditingCell(null)
            if (e.key === 'Escape') setEditingCell(null)
          }}
          className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none"
          autoFocus
        />
      )
    }

    const handleCellClick = () => {
      setEditingCell({ row: rowIndex, col: column.name })
    }

    switch (cellType) {
      case 'image':
        return (
          <div className="flex items-center gap-2">
            <img 
              src={value} 
              alt="Table image" 
              className="w-8 h-8 object-cover rounded border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <span 
              className="text-xs text-blue-600 hover:underline cursor-pointer truncate flex-1"
              onClick={handleCellClick}
            >
              {value}
            </span>
          </div>
        )
      
      case 'url':
        return (
          <div className="flex items-center gap-2">
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm flex items-center gap-1"
            >
              <ExternalLink size={12} />
              <span className="truncate max-w-32">{value}</span>
            </a>
          </div>
        )
      
      default:
        return (
          <span 
            className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded text-sm block"
            onClick={handleCellClick}
          >
            {value || ''}
          </span>
        )
    }
  }

  const exportData = () => {
    const csv = [
      columns.map((col: any) => col.name).join(','),
      ...data.map((row: any) => 
        columns.map((col: any) => `"${row[col.name] || ''}"`).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${table.tableName || 'data'}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-8 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[calc(100vh-4rem)] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  {table.database === 'googlesheets' && '📊'}
                  {table.database === 'shopify' && '🛍️'}
                  {table.database === 'stripe' && '💳'}
                  {!['googlesheets', 'shopify', 'stripe'].includes(table.database) && '📄'}
                </div>
                {table.tableName}
              </h2>
              <p className="text-sm opacity-90">
                {data.length} rows • {columns.length} columns • {table.database}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search table data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            
            <button
              onClick={addRow}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Add Row
            </button>

            <button
              onClick={exportData}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="w-12 p-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                {columns.map((column: any) => (
                  <th
                    key={column.name}
                    className="p-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort(column.name)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.name}</span>
                      <div className="text-gray-400">
                        {sortColumn === column.name && (
                          <ChevronDown 
                            size={14} 
                            className={`transform transition-transform ${
                              sortDirection === 'desc' ? 'rotate-180' : ''
                            }`} 
                          />
                        )}
                      </div>
                    </div>
                    <div className="text-gray-400 text-xs normal-case font-normal">
                      {column.type}
                    </div>
                  </th>
                ))}
                <th className="w-16 p-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row: any, rowIndex: number) => (
                <tr key={rowIndex} className="hover:bg-gray-50 border-b border-gray-200">
                  <td className="p-3 text-sm text-gray-500">
                    {rowIndex + 1}
                  </td>
                  {columns.map((column: any) => (
                    <td key={column.name} className="p-3 max-w-xs">
                      {renderCell(row, column, rowIndex)}
                    </td>
                  ))}
                  <td className="p-3">
                    <button
                      onClick={() => deleteRow(rowIndex)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete row"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sortedData.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <div className="mb-4">
                {searchTerm ? (
                  <>
                    <Search size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No results found for "{searchTerm}"</p>
                  </>
                ) : (
                  <>
                    <Plus size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No data in this table</p>
                  </>
                )}
              </div>
              <button
                onClick={addRow}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Row
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <div>
              Showing {sortedData.length} of {data.length} rows
              {searchTerm && ` (filtered by "${searchTerm}")`}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ImageIcon size={14} />
                <span>Image URLs supported</span>
              </div>
              <div className="flex items-center gap-2">
                <Edit3 size={14} />
                <span>Click cells to edit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}