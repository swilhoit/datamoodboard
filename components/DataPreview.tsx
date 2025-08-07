'use client'

import { useState } from 'react'
import { X, Table, Database, RefreshCw, Download, Filter, Search } from 'lucide-react'

interface DataPreviewProps {
  table: any
  isOpen: boolean
  onClose: () => void
  onRefresh?: () => void
}

export default function DataPreview({ table, isOpen, onClose, onRefresh }: DataPreviewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  if (!isOpen || !table) return null

  const data = table.data || []
  const headers = table.schema?.map((s: any) => s.name) || []

  // Filter data based on search term
  const filteredData = data.filter((row: any) => {
    return Object.values(row).some((value: any) => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentData = filteredData.slice(startIndex, endIndex)

  const handleExport = () => {
    // Convert data to CSV
    const csvHeaders = headers.join(',')
    const csvRows = filteredData.map((row: any) => 
      headers.map((header: string) => {
        const value = row[header]
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(value || '').replace(/"/g, '""')
        return escaped.includes(',') ? `"${escaped}"` : escaped
      }).join(',')
    )
    const csv = [csvHeaders, ...csvRows].join('\n')
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${table.tableName}_export.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[90vw] max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Table size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{table.tableName}</h2>
              <p className="text-sm text-gray-600">
                {table.database === 'googlesheets' ? 'Google Sheets' : table.database} 
                {table.rowCount && ` • ${table.rowCount} rows`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {table.database === 'googlesheets' && onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh data"
              >
                <RefreshCw size={18} />
              </button>
            )}
            <button
              onClick={handleExport}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export as CSV"
            >
              <Download size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search in data..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto">
          {data.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {headers.map((header: string, index: number) => (
                    <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((row: any, rowIndex: number) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {headers.map((header: string, colIndex: number) => (
                      <td key={colIndex} className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                        {row[header] !== null && row[header] !== undefined ? String(row[header]) : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Database size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No data available</p>
                {table.database === 'googlesheets' && (
                  <p className="text-sm mt-2">Data will appear here after importing from Google Sheets</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = currentPage > 3 ? currentPage - 2 + i : i + 1
                if (pageNum > totalPages) return null
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === pageNum ? 'bg-blue-500 text-white' : 'hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              }).filter(Boolean)}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}