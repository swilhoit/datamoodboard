'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, Search, Filter, Download } from 'lucide-react'

interface StyledTableProps {
  data: any[]
  style?: {
    theme?: 'modern' | 'minimal' | 'striped' | 'dark' | 'colorful' | 'bordered'
    colors?: string[]
    background?: string
    headerBackground?: string
    textColor?: string
    borderColor?: string
    hoverColor?: string
    compact?: boolean
    showSearch?: boolean
    showFilters?: boolean
    stickyHeader?: boolean
  }
  width?: number | string
  height?: number | string
}

export default function StyledTable({ data, style = {}, width = '100%', height = '100%' }: StyledTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  const {
    theme = 'modern',
    colors = ['#3B82F6', '#10B981', '#F59E0B'],
    background = '#FFFFFF',
    headerBackground = '#F3F4F6',
    textColor = '#1F2937',
    borderColor = '#E5E7EB',
    hoverColor = '#F9FAFB',
    compact = false,
    showSearch = true,
    showFilters = false,
    stickyHeader = true
  } = style

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>No data available</p>
      </div>
    )
  }

  // Get columns from first data item
  const columns = Object.keys(data[0])

  // Filter data based on search
  const filteredData = data.filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
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

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / rowsPerPage)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getThemeStyles = () => {
    const baseStyles = {
      container: 'rounded-lg overflow-hidden',
      table: 'w-full',
      header: `${compact ? 'px-3 py-1.5' : 'px-4 py-3'} text-left font-semibold text-xs uppercase tracking-wider`,
      cell: `${compact ? 'px-3 py-1.5' : 'px-4 py-3'} text-sm`,
      row: 'transition-colors'
    }

    const themes = {
      modern: {
        container: `${baseStyles.container} shadow-lg border`,
        table: baseStyles.table,
        header: `${baseStyles.header} bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-700 border-b-2 border-gray-200`,
        cell: `${baseStyles.cell}`,
        row: `${baseStyles.row} hover:bg-blue-50 border-b border-gray-100`
      },
      minimal: {
        container: baseStyles.container,
        table: baseStyles.table,
        header: `${baseStyles.header} text-gray-600 border-b`,
        cell: `${baseStyles.cell}`,
        row: `${baseStyles.row} hover:bg-gray-50`
      },
      striped: {
        container: `${baseStyles.container} border`,
        table: baseStyles.table,
        header: `${baseStyles.header} bg-gray-100 text-gray-700 border-b-2`,
        cell: `${baseStyles.cell}`,
        row: `${baseStyles.row} odd:bg-gray-50 even:bg-white hover:bg-blue-50 border-b`
      },
      dark: {
        container: `${baseStyles.container} bg-gray-900`,
        table: baseStyles.table,
        header: `${baseStyles.header} bg-gray-800 text-gray-100 border-b border-gray-700`,
        cell: `${baseStyles.cell} text-gray-300`,
        row: `${baseStyles.row} hover:bg-gray-800 border-b border-gray-800`
      },
      colorful: {
        container: `${baseStyles.container} shadow-xl border-2 border-purple-200`,
        table: baseStyles.table,
        header: `${baseStyles.header} bg-gradient-to-r from-purple-500 to-pink-500 text-white`,
        cell: `${baseStyles.cell}`,
        row: `${baseStyles.row} hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-b border-purple-100`
      },
      bordered: {
        container: `${baseStyles.container} border-2 border-gray-300`,
        table: `${baseStyles.table} border-collapse`,
        header: `${baseStyles.header} bg-gray-100 border-2 border-gray-300`,
        cell: `${baseStyles.cell} border border-gray-300`,
        row: baseStyles.row
      }
    }

    return themes[theme] || themes.modern
  }

  const styles = getThemeStyles()

  return (
    <div 
      className="flex flex-col h-full"
      style={{ 
        width, 
        height,
        backgroundColor: theme === 'dark' ? '#111827' : background 
      }}
    >
      {/* Search Bar */}
      {showSearch && (
        <div className="p-3 border-b border-gray-200 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <div className={styles.container}>
          <table className={styles.table}>
            <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className={`${styles.header} cursor-pointer select-none`}
                    onClick={() => handleSort(column)}
                    style={{ 
                      backgroundColor: theme === 'dark' ? '#1F2937' : headerBackground,
                      color: theme === 'dark' ? '#F3F4F6' : textColor
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{column}</span>
                      <div className="flex flex-col">
                        <ChevronUp 
                          size={10} 
                          className={`${
                            sortColumn === column && sortDirection === 'asc' 
                              ? 'text-blue-600' 
                              : 'text-gray-400'
                          }`}
                        />
                        <ChevronDown 
                          size={10} 
                          className={`-mt-1 ${
                            sortColumn === column && sortDirection === 'desc' 
                              ? 'text-blue-600' 
                              : 'text-gray-400'
                          }`}
                        />
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={styles.row}
                  style={{ 
                    backgroundColor: theme === 'dark' ? '#1F2937' : undefined 
                  }}
                >
                  {columns.map((column, colIndex) => (
                    <td 
                      key={column} 
                      className={styles.cell}
                      style={{ 
                        color: theme === 'dark' ? '#E5E7EB' : textColor,
                        borderColor: theme === 'dark' ? '#374151' : borderColor
                      }}
                    >
                      {(() => {
                        const value = row[column]

                        // Render images for likely image columns or URL values
                        const lowerCol = column.toLowerCase()
                        const isLikelyImageColumn = ['image', 'img', 'thumbnail', 'photo', 'picture'].some((k) => lowerCol.includes(k))
                        const isImageUrl = typeof value === 'string' && /^(https?:\/\/|data:)/.test(value) && /(\.png|\.jpg|\.jpeg|\.gif|\.webp)(\?.*)?$/i.test(value)
                        if (isLikelyImageColumn || isImageUrl) {
                          const src = typeof value === 'string' ? value : ''
                          return (
                            <div className="flex items-center">
                              <img
                                src={src}
                                alt={row['name'] || 'image'}
                                className="w-10 h-10 rounded-md object-cover border border-gray-200"
                              />
                            </div>
                          )
                        }

                        // Currency formatting heuristics
                        const isCurrencyCol = ['price', 'revenue', 'sales', 'amount', 'cost'].some((k) => lowerCol.includes(k))
                        if (typeof value === 'number' && isCurrencyCol) {
                          try {
                            return value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
                          } catch {
                            return `$${value.toLocaleString()}`
                          }
                        }

                        // Generic number formatting
                        if (typeof value === 'number') {
                          return value.toLocaleString()
                        }

                        return String(value)
                      })()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-gray-200 bg-white flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, sortedData.length)} of {sortedData.length} rows
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2 py-1 text-sm rounded ${
                      currentPage === pageNum 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              {totalPages > 5 && <span className="px-2">...</span>}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}