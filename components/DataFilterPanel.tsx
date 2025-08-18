'use client'

import { useState, useMemo, useCallback } from 'react'
import { 
  X, Filter, Columns, Search, Plus, 
  Trash2, ChevronDown, ChevronUp, 
  Check, Eye, EyeOff, RefreshCw 
} from 'lucide-react'

interface FilterCondition {
  id: string
  column: string
  operator: string
  value: string
  enabled: boolean
}

interface DataFilterPanelProps {
  nodeId: string
  nodeLabel: string
  data: any[]
  onApplyFilter: (filteredData: any[], selectedColumns: string[]) => void
  onClose: () => void
  isDarkMode?: boolean
}

const OPERATORS = {
  text: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  number: [
    { value: 'equals', label: '=' },
    { value: 'not_equals', label: '≠' },
    { value: 'greater', label: '>' },
    { value: 'greater_equal', label: '≥' },
    { value: 'less', label: '<' },
    { value: 'less_equal', label: '≤' },
    { value: 'between', label: 'Between' },
    { value: 'is_null', label: 'Is null' },
    { value: 'is_not_null', label: 'Is not null' },
  ],
  boolean: [
    { value: 'is_true', label: 'Is true' },
    { value: 'is_false', label: 'Is false' },
    { value: 'is_null', label: 'Is null' },
  ]
}

export default function DataFilterPanel({ 
  nodeId, 
  nodeLabel, 
  data, 
  onApplyFilter, 
  onClose, 
  isDarkMode = false 
}: DataFilterPanelProps) {
  // Get all columns
  const allColumns = useMemo(() => {
    if (!data || data.length === 0) return []
    if (!data[0] || typeof data[0] !== 'object') return []
    return Object.keys(data[0])
  }, [data])

  const [selectedColumns, setSelectedColumns] = useState<string[]>(allColumns)
  const [filters, setFilters] = useState<FilterCondition[]>([])
  const [filterLogic, setFilterLogic] = useState<'AND' | 'OR'>('AND')
  const [showColumnSection, setShowColumnSection] = useState(true)
  const [showFilterSection, setShowFilterSection] = useState(true)
  const [previewData, setPreviewData] = useState<any[]>([])

  // Detect column type
  const getColumnType = useCallback((column: string) => {
    const sampleValues = data.slice(0, 10).map(row => row[column]).filter(v => v != null)
    
    if (sampleValues.length === 0) return 'text'
    
    // Check if boolean
    if (sampleValues.every(v => typeof v === 'boolean')) return 'boolean'
    
    // Check if number
    if (sampleValues.every(v => !isNaN(Number(v)))) return 'number'
    
    return 'text'
  }, [data])

  // Toggle column selection
  const toggleColumn = (column: string) => {
    setSelectedColumns(prev => 
      prev.includes(column) 
        ? prev.filter(c => c !== column)
        : [...prev, column]
    )
  }

  // Select/deselect all columns
  const toggleAllColumns = () => {
    setSelectedColumns(prev => 
      prev.length === allColumns.length ? [] : [...allColumns]
    )
  }

  // Add new filter
  const addFilter = () => {
    const newFilter: FilterCondition = {
      id: `filter-${Date.now()}`,
      column: allColumns[0],
      operator: 'contains',
      value: '',
      enabled: true
    }
    setFilters([...filters, newFilter])
  }

  // Update filter
  const updateFilter = (id: string, updates: Partial<FilterCondition>) => {
    setFilters(filters.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ))
  }

  // Remove filter
  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id))
  }

  // Apply filter to data
  const applyFilter = useCallback((row: any, filter: FilterCondition) => {
    if (!filter.enabled) return true
    
    const value = row[filter.column]
    const filterValue = filter.value
    const columnType = getColumnType(filter.column)

    // Handle null/undefined values first
    if (filter.operator === 'is_null') {
      return value == null || value === ''
    }
    if (filter.operator === 'is_not_null') {
      return value != null && value !== ''
    }
    if (filter.operator === 'is_empty') {
      return value === '' || value == null
    }
    if (filter.operator === 'is_not_empty') {
      return value !== '' && value != null
    }

    // Skip if value is null/undefined for other operators
    if (value == null) return false

    switch (filter.operator) {
      case 'equals':
        if (columnType === 'number') {
          return Number(value) === Number(filterValue)
        }
        return String(value).toLowerCase() === String(filterValue).toLowerCase()
      case 'not_equals':
        if (columnType === 'number') {
          return Number(value) !== Number(filterValue)
        }
        return String(value).toLowerCase() !== String(filterValue).toLowerCase()
      case 'contains':
        return String(value).toLowerCase().includes(String(filterValue).toLowerCase())
      case 'not_contains':
        return !String(value).toLowerCase().includes(String(filterValue).toLowerCase())
      case 'starts_with':
        return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase())
      case 'ends_with':
        return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase())
      case 'greater':
        return Number(value) > Number(filterValue)
      case 'greater_equal':
        return Number(value) >= Number(filterValue)
      case 'less':
        return Number(value) < Number(filterValue)
      case 'less_equal':
        return Number(value) <= Number(filterValue)
      case 'between':
        const values = filterValue.split(',').map(v => v.trim())
        if (values.length !== 2) return true
        const [min, max] = values.map(Number)
        if (isNaN(min) || isNaN(max)) return true
        return Number(value) >= min && Number(value) <= max
      case 'is_true':
        return value === true || value === 'true' || value === 1
      case 'is_false':
        return value === false || value === 'false' || value === 0
      default:
        return true
    }
  }, [getColumnType])

  // Get filtered data
  const filteredData = useMemo(() => {
    if (filters.length === 0) return data
    
    return data.filter(row => {
      const enabledFilters = filters.filter(f => f.enabled)
      if (enabledFilters.length === 0) return true
      
      if (filterLogic === 'AND') {
        return enabledFilters.every(filter => applyFilter(row, filter))
      } else {
        return enabledFilters.some(filter => applyFilter(row, filter))
      }
    })
  }, [data, filters, filterLogic, applyFilter])

  // Get final data with selected columns
  const finalData = useMemo(() => {
    return filteredData.map(row => {
      const newRow: any = {}
      selectedColumns.forEach(col => {
        newRow[col] = row[col]
      })
      return newRow
    })
  }, [filteredData, selectedColumns])

  // Update preview
  const updatePreview = () => {
    setPreviewData(finalData.slice(0, 5))
  }

  // Apply filters and close
  const handleApply = () => {
    onApplyFilter(finalData, selectedColumns)
    onClose()
  }

  return (
    <div className={`fixed right-0 top-20 h-[calc(100%-5rem)] w-[500px] shadow-2xl z-50 flex flex-col ${
      isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-purple-500" />
            <h2 className="text-lg font-semibold">Filter & Select</h2>
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
          <span>{nodeLabel}</span>
          <span>•</span>
          <span>{data.length} rows → {filteredData.length} filtered</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Column Selection */}
        <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setShowColumnSection(!showColumnSection)}
            className={`w-full p-3 flex items-center justify-between hover:bg-gray-50 ${
              isDarkMode ? 'hover:bg-gray-800' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <Columns size={16} />
              <span className="font-medium">Select Columns</span>
              <span className="text-sm text-gray-500">
                ({selectedColumns.length}/{allColumns.length} selected)
              </span>
            </div>
            {showColumnSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {showColumnSection && (
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={toggleAllColumns}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {selectedColumns.length === allColumns.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {allColumns.map(column => (
                  <label
                    key={column}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                      isDarkMode ? 'hover:bg-gray-800' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(column)}
                      onChange={() => toggleColumn(column)}
                      className="rounded"
                    />
                    <span className="text-sm">{column}</span>
                    <span className={`ml-auto text-xs px-1 rounded ${
                      getColumnType(column) === 'number' 
                        ? 'bg-blue-100 text-blue-700'
                        : getColumnType(column) === 'boolean'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {getColumnType(column)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Row Filters */}
        <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setShowFilterSection(!showFilterSection)}
            className={`w-full p-3 flex items-center justify-between hover:bg-gray-50 ${
              isDarkMode ? 'hover:bg-gray-800' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <Filter size={16} />
              <span className="font-medium">Filter Rows</span>
              <span className="text-sm text-gray-500">
                ({filters.filter(f => f.enabled).length} active)
              </span>
            </div>
            {showFilterSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {showFilterSection && (
            <div className="p-3 space-y-3">
              {filters.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500">Logic:</span>
                  <div className="flex rounded overflow-hidden border">
                    <button
                      onClick={() => setFilterLogic('AND')}
                      className={`px-3 py-1 text-sm ${
                        filterLogic === 'AND' 
                          ? 'bg-blue-500 text-white' 
                          : isDarkMode ? 'bg-gray-800' : 'bg-white'
                      }`}
                    >
                      AND
                    </button>
                    <button
                      onClick={() => setFilterLogic('OR')}
                      className={`px-3 py-1 text-sm ${
                        filterLogic === 'OR' 
                          ? 'bg-blue-500 text-white' 
                          : isDarkMode ? 'bg-gray-800' : 'bg-white'
                      }`}
                    >
                      OR
                    </button>
                  </div>
                </div>
              )}

              {filters.map((filter, index) => (
                <div key={filter.id} className={`p-3 rounded-lg border ${
                  isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={filter.enabled}
                      onChange={(e) => updateFilter(filter.id, { enabled: e.target.checked })}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={filter.column}
                          onChange={(e) => updateFilter(filter.id, { column: e.target.value })}
                          className={`flex-1 px-2 py-1 rounded border text-sm ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {allColumns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                        
                        <select
                          value={filter.operator}
                          onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                          className={`px-2 py-1 rounded border text-sm ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {OPERATORS[getColumnType(filter.column) as keyof typeof OPERATORS].map(op => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      {!['is_empty', 'is_not_empty', 'is_null', 'is_not_null', 'is_true', 'is_false'].includes(filter.operator) && (
                        <input
                          type="text"
                          value={filter.value}
                          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                          placeholder={filter.operator === 'between' ? 'min,max' : 'Value...'}
                          className={`w-full px-2 py-1 rounded border text-sm ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      )}
                    </div>
                    
                    <button
                      onClick={() => removeFilter(filter.id)}
                      className="p-1 hover:bg-red-100 text-red-600 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  {index < filters.length - 1 && (
                    <div className="text-center text-xs text-gray-500 mt-2">
                      {filterLogic}
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={addFilter}
                className={`w-full p-2 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 hover:bg-gray-50 ${
                  isDarkMode 
                    ? 'border-gray-700 hover:bg-gray-800' 
                    : 'border-gray-300'
                }`}
              >
                <Plus size={16} />
                <span className="text-sm">Add Filter</span>
              </button>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Preview</h3>
            <button
              onClick={updatePreview}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <RefreshCw size={14} />
              Update
            </button>
          </div>
          
          {previewData.length > 0 ? (
            <div className={`rounded-lg border overflow-hidden ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <table className="w-full text-xs">
                <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                  <tr>
                    {selectedColumns.map(col => (
                      <th key={col} className="px-2 py-1 text-left font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, i) => (
                    <tr key={i} className={`border-t ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      {selectedColumns.map(col => (
                        <td key={col} className="px-2 py-1">
                          {row[col] != null ? String(row[col]).substring(0, 50) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={`p-8 text-center rounded-lg border-2 border-dashed ${
              isDarkMode ? 'border-gray-700' : 'border-gray-300'
            }`}>
              <p className="text-sm text-gray-500">Click "Update" to see preview</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className={`p-4 border-t flex items-center justify-between ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="text-sm text-gray-500">
          Result: {filteredData.length} rows × {selectedColumns.length} columns
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg border ${
              isDarkMode 
                ? 'border-gray-700 hover:bg-gray-800' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  )
}