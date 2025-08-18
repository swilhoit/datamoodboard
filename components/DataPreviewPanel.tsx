'use client'

import { useState, useMemo } from 'react'
import { 
  X, Database, Eye, Download, Search, 
  ChevronLeft, ChevronRight, Table, 
  BarChart3, Info, Copy, FileDown 
} from 'lucide-react'

interface DataPreviewPanelProps {
  nodeId: string
  nodeLabel: string
  data: any[]
  onClose: () => void
  isDarkMode?: boolean
}

export default function DataPreviewPanel({ 
  nodeId, 
  nodeLabel, 
  data, 
  onClose, 
  isDarkMode = false 
}: DataPreviewPanelProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'stats'>('table')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Get column names
  const columns = useMemo(() => {
    if (!data || data.length === 0) return []
    if (!data[0] || typeof data[0] !== 'object') return []
    return Object.keys(data[0])
  }, [data])

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm || !Array.isArray(data)) return data || []
    
    const searchLower = searchTerm.toLowerCase()
    return data.filter(row => 
      Object.values(row).some(value => {
        if (value == null) return false
        return String(value).toLowerCase().includes(searchLower)
      })
    )
  }, [data, searchTerm])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData
    
    return [...filteredData].sort((a, b) => {
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
  }, [filteredData, sortColumn, sortDirection])

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    const endIndex = startIndex + rowsPerPage
    return sortedData.slice(startIndex, endIndex)
  }, [sortedData, currentPage, rowsPerPage])

  const totalPages = Math.ceil(filteredData.length / rowsPerPage)

  // Handle column sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Calculate column statistics
  const columnStats = useMemo(() => {
    const stats: any = {}
    
    columns.forEach(col => {
      const values = data.map(row => row[col])
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '')
      
      stats[col] = {
        total: values.length,
        unique: new Set(values).size,
        nulls: values.length - nonNullValues.length,
        type: typeof values.find(v => v !== null && v !== undefined),
        sample: values.slice(0, 5).filter(v => v !== null && v !== undefined)
      }

      // Calculate numeric stats if applicable
      const numericValues = nonNullValues.filter(v => !isNaN(Number(v))).map(Number)
      if (numericValues.length > 0) {
        stats[col].min = Math.min(...numericValues)
        stats[col].max = Math.max(...numericValues)
        stats[col].avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length
        stats[col].isNumeric = true
      }
    })
    
    return stats
  }, [data, columns])

  // Export to CSV
  const exportToCSV = () => {
    const headers = columns.join(',')
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col]
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
    
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${nodeLabel.replace(/\s+/g, '_')}_data.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Copy data to clipboard
  const copyToClipboard = () => {
    const headers = columns.join('\t')
    const rows = paginatedData.map(row => 
      columns.map(col => row[col] || '').join('\t')
    )
    const text = [headers, ...rows].join('\n')
    navigator.clipboard.writeText(text)
  }

  return (
    <div className={`fixed right-0 top-20 h-[calc(100%-5rem)] w-[600px] shadow-2xl z-50 flex flex-col ${
      isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-blue-500" />
            <h2 className="text-lg font-semibold">{nodeLabel}</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : ''
            }`}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{data.length} rows</span>
          <span>•</span>
          <span>{columns.length} columns</span>
          <span>•</span>
          <span className="text-xs font-mono">{nodeId}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className={`p-3 border-b flex items-center justify-between ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1 ${
                viewMode === 'table' 
                  ? 'bg-blue-500 text-white' 
                  : isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <Table size={14} />
              Table
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1 ${
                viewMode === 'stats' 
                  ? 'bg-blue-500 text-white' 
                  : isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <BarChart3 size={14} />
              Statistics
            </button>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'
          }`}>
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none text-sm w-40"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : ''
            }`}
            title="Copy to clipboard"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={exportToCSV}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : ''
            }`}
            title="Export as CSV"
          >
            <FileDown size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'table' ? (
          <table className="w-full">
            <thead className={`sticky top-0 ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <tr>
                <th className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  #
                </th>
                {columns.map(col => (
                  <th
                    key={col}
                    className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-50 ${
                      isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{col}</span>
                      {sortColumn === col && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => (
                <tr
                  key={index}
                  className={`border-t ${
                    isDarkMode 
                      ? 'border-gray-700 hover:bg-gray-800' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <td className={`px-4 py-2 text-xs ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {(currentPage - 1) * rowsPerPage + index + 1}
                  </td>
                  {columns.map(col => (
                    <td key={col} className="px-4 py-2 text-sm">
                      {row[col] !== null && row[col] !== undefined
                        ? typeof row[col] === 'object'
                          ? JSON.stringify(row[col])
                          : String(row[col])
                        : <span className="text-gray-400 italic">null</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-4 space-y-4">
            {columns.map(col => (
              <div
                key={col}
                className={`p-4 rounded-lg border ${
                  isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{col}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${
                    columnStats[col].isNumeric 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {columnStats[col].type}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Unique:</span>
                    <span className="ml-2 font-medium">{columnStats[col].unique}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Nulls:</span>
                    <span className="ml-2 font-medium">{columnStats[col].nulls}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Fill:</span>
                    <span className="ml-2 font-medium">
                      {Math.round(((columnStats[col].total - columnStats[col].nulls) / columnStats[col].total) * 100)}%
                    </span>
                  </div>
                </div>

                {columnStats[col].isNumeric && (
                  <div className="grid grid-cols-3 gap-3 text-sm mt-2">
                    <div>
                      <span className="text-gray-500">Min:</span>
                      <span className="ml-2 font-medium">{columnStats[col].min.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Max:</span>
                      <span className="ml-2 font-medium">{columnStats[col].max.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Avg:</span>
                      <span className="ml-2 font-medium">{columnStats[col].avg.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="mt-2">
                  <span className="text-xs text-gray-500">Sample values:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {columnStats[col].sample.slice(0, 5).map((val: any, i: number) => (
                      <span
                        key={i}
                        className={`text-xs px-2 py-1 rounded ${
                          isDarkMode ? 'bg-gray-700' : 'bg-white border'
                        }`}
                      >
                        {String(val).substring(0, 20)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {viewMode === 'table' && (
        <div className={`p-3 border-t flex items-center justify-between ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className={`px-2 py-1 rounded border text-sm ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-1 rounded disabled:opacity-50 ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-1 rounded disabled:opacity-50 ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}