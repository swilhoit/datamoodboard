'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, Filter, Calculator, SortAsc, GroupIcon, 
  Plus, Trash2, ChevronDown, ChevronUp,
  Shuffle, Database, Hash, Calendar, Type,
  TrendingUp, Percent, DollarSign, Users
} from 'lucide-react'

interface TransformBuilderProps {
  nodeId: string
  nodeLabel: string
  inputData: any[]
  currentConfig?: any
  onApply: (config: any, transformedData: any[]) => void
  onClose: () => void
  isDarkMode?: boolean
  layout?: 'sidebar' | 'floating' | 'inline'
  position?: { left: number; top: number }
}

type FilterCondition = {
  id: string
  field: string
  operator: string
  value: string
  type?: string
}

type Calculation = {
  id: string
  name: string
  formula: string
  type: 'sum' | 'average' | 'count' | 'custom'
  fields: string[]
}

type Aggregation = {
  groupBy: string
  calculations: Array<{
    field: string
    operation: 'sum' | 'avg' | 'count' | 'min' | 'max'
    alias: string
  }>
}

// Quick templates for common transformations
const TRANSFORM_TEMPLATES = [
  {
    key: 'remove_duplicates',
    label: 'Remove Duplicates',
    icon: Shuffle,
    description: 'Keep only unique rows',
    apply: () => ({ type: 'deduplicate', fields: 'all' })
  },
  {
    key: 'top_10',
    label: 'Top 10 Rows',
    icon: TrendingUp,
    description: 'Keep only first 10 rows',
    apply: () => ({ type: 'limit', value: 10 })
  },
  {
    key: 'calculate_total',
    label: 'Add Total Column',
    icon: Calculator,
    description: 'Sum numeric columns',
    apply: () => ({ type: 'calculate', formula: 'sum' })
  },
  {
    key: 'group_by_date',
    label: 'Group by Date',
    icon: Calendar,
    description: 'Aggregate by date field',
    apply: () => ({ type: 'aggregate', groupBy: 'date' })
  }
]

function TransformBuilder({
  nodeId,
  nodeLabel,
  inputData,
  currentConfig,
  onApply,
  onClose,
  isDarkMode = false,
  layout = 'sidebar',
  position
}: TransformBuilderProps) {
  const [activeTab, setActiveTab] = useState<'filter' | 'calculate' | 'aggregate' | 'sort'>('filter')
  const [filters, setFilters] = useState<FilterCondition[]>([
    { id: '1', field: '', operator: 'equals', value: '' }
  ])
  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [aggregation, setAggregation] = useState<Aggregation>({
    groupBy: '',
    calculations: []
  })
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: '',
    direction: 'asc'
  })
  const [previewData, setPreviewData] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Get available fields from input data
  const availableFields = inputData.length > 0 && inputData[0] && typeof inputData[0] === 'object' 
    ? Object.keys(inputData[0]) 
    : []
  
  // Detect field types for smart filtering
  const detectFieldType = (field: string): string => {
    if (!inputData.length) return 'text'
    const sample = inputData[0][field]
    if (sample === null || sample === undefined) return 'text'
    if (typeof sample === 'number') return 'number'
    if (typeof sample === 'boolean') return 'boolean'
    if (Date.parse(sample)) return 'date'
    return 'text'
  }

  // Apply filters to data
  const applyFilters = (data: any[]): any[] => {
    if (!filters.length || filters.every(f => !f.field)) return data
    
    return data.filter(row => {
      return filters.every(filter => {
        if (!filter.field || !filter.value) return true
        
        const fieldValue = row[filter.field]
        const filterValue = filter.value
        const fieldType = detectFieldType(filter.field)
        
        switch (filter.operator) {
          case 'equals':
            return String(fieldValue).toLowerCase() === String(filterValue).toLowerCase()
          case 'not_equals':
            return String(fieldValue).toLowerCase() !== String(filterValue).toLowerCase()
          case 'contains':
            return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase())
          case 'not_contains':
            return !String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase())
          case 'starts_with':
            return String(fieldValue).toLowerCase().startsWith(String(filterValue).toLowerCase())
          case 'ends_with':
            return String(fieldValue).toLowerCase().endsWith(String(filterValue).toLowerCase())
          case 'greater_than':
            return fieldType === 'number' ? Number(fieldValue) > Number(filterValue) : fieldValue > filterValue
          case 'less_than':
            return fieldType === 'number' ? Number(fieldValue) < Number(filterValue) : fieldValue < filterValue
          case 'is_empty':
            return fieldValue === null || fieldValue === undefined || fieldValue === ''
          case 'is_not_empty':
            return fieldValue !== null && fieldValue !== undefined && fieldValue !== ''
          default:
            return true
        }
      })
    })
  }

  // Apply calculations to add new columns
  const applyCalculations = (data: any[]): any[] => {
    if (!calculations.length) return data
    
    return data.map(row => {
      const newRow = { ...row }
      
      calculations.forEach(calc => {
        if (calc.type === 'sum') {
          const sum = calc.fields.reduce((acc, field) => {
            const val = Number(row[field]) || 0
            return acc + val
          }, 0)
          newRow[calc.name] = sum
        } else if (calc.type === 'average') {
          const sum = calc.fields.reduce((acc, field) => {
            const val = Number(row[field]) || 0
            return acc + val
          }, 0)
          newRow[calc.name] = calc.fields.length > 0 ? sum / calc.fields.length : 0
        } else if (calc.type === 'count') {
          newRow[calc.name] = calc.fields.filter(field => row[field] !== null && row[field] !== undefined).length
        }
      })
      
      return newRow
    })
  }

  // Apply aggregation/grouping
  const applyAggregation = (data: any[]): any[] => {
    if (!aggregation.groupBy || !aggregation.calculations.length) return data
    
    const groups: { [key: string]: any[] } = {}
    
    // Group data
    data.forEach(row => {
      const key = row[aggregation.groupBy]
      if (!groups[key]) groups[key] = []
      groups[key].push(row)
    })
    
    // Aggregate groups
    return Object.entries(groups).map(([key, rows]) => {
      const result: any = {
        [aggregation.groupBy]: key
      }
      
      aggregation.calculations.forEach(calc => {
        const values = rows.map(r => Number(r[calc.field]) || 0)
        
        switch (calc.operation) {
          case 'sum':
            result[calc.alias] = values.reduce((a, b) => a + b, 0)
            break
          case 'avg':
            result[calc.alias] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
            break
          case 'count':
            result[calc.alias] = rows.length
            break
          case 'min':
            result[calc.alias] = Math.min(...values)
            break
          case 'max':
            result[calc.alias] = Math.max(...values)
            break
        }
      })
      
      return result
    })
  }

  // Apply sorting
  const applySort = (data: any[]): any[] => {
    if (!sortConfig.field) return data
    
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.field]
      const bVal = b[sortConfig.field]
      
      if (aVal === bVal) return 0
      
      const comparison = aVal > bVal ? 1 : -1
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }

  // Apply all transformations
  const applyTransformations = () => {
    let result = [...inputData]
    
    // Apply in order: filter -> calculate -> aggregate -> sort
    result = applyFilters(result)
    result = applyCalculations(result)
    result = applyAggregation(result)
    result = applySort(result)
    
    setPreviewData(result)
    
    // Create config object
    const config = {
      filters: filters.filter(f => f.field && f.value),
      calculations,
      aggregation: aggregation.groupBy ? aggregation : null,
      sort: sortConfig.field ? sortConfig : null
    }
    
    onApply(config, result)
  }

  // Update preview when config changes
  useEffect(() => {
    let result = [...inputData]
    result = applyFilters(result)
    result = applyCalculations(result)
    result = applyAggregation(result)
    result = applySort(result)
    setPreviewData(result)
  }, [filters, calculations, aggregation, sortConfig, inputData])

  const getOperatorOptions = (fieldType: string) => {
    const textOps = [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not equals' },
      { value: 'contains', label: 'Contains' },
      { value: 'not_contains', label: "Doesn't contain" },
      { value: 'starts_with', label: 'Starts with' },
      { value: 'ends_with', label: 'Ends with' },
      { value: 'is_empty', label: 'Is empty' },
      { value: 'is_not_empty', label: 'Is not empty' }
    ]
    
    const numberOps = [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not equals' },
      { value: 'greater_than', label: 'Greater than' },
      { value: 'less_than', label: 'Less than' },
      { value: 'is_empty', label: 'Is empty' },
      { value: 'is_not_empty', label: 'Is not empty' }
    ]
    
    return fieldType === 'number' ? numberOps : textOps
  }

  return (
    <div 
      className={`${
        layout === 'sidebar' 
          ? 'fixed right-0 top-0 h-full w-[500px] shadow-2xl' 
          : layout === 'floating'
          ? 'fixed w-[500px] max-h-[80vh] shadow-2xl rounded-lg'
          : 'w-full'
      } ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      } flex flex-col z-50`}
      style={layout === 'floating' ? { left: position?.left ?? 0, top: position?.top ?? 0 } : undefined}
    >
      {/* Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Calculator className="text-purple-500" size={20} />
            <div>
              <h2 className="text-lg font-semibold">Transform Data</h2>
              <p className="text-xs text-gray-500">{nodeLabel}</p>
            </div>
          </div>
          {layout !== 'inline' && (
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
                isDarkMode ? 'hover:bg-gray-700' : ''
              }`}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Quick Templates */}
        <div className="mt-3">
          <div className="text-xs font-medium mb-2">Quick Templates</div>
          <div className="flex flex-wrap gap-2">
            {TRANSFORM_TEMPLATES.map(template => {
              const Icon = template.icon
              return (
                <button
                  key={template.key}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-all ${
                    selectedTemplate === template.key
                      ? isDarkMode 
                        ? 'bg-purple-900/40 border-purple-600'
                        : 'bg-purple-100 border-purple-400'
                      : isDarkMode
                        ? 'border-gray-700 hover:bg-gray-800'
                        : 'border-gray-300 hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    setSelectedTemplate(template.key)
                    const config = template.apply()
                    // Apply template config
                    if (config.type === 'limit') {
                      // Handle limit
                    }
                  }}
                  title={template.description}
                >
                  <Icon size={12} />
                  {template.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setActiveTab('filter')}
            className={`px-3 py-1 rounded-md text-sm border flex items-center gap-1 ${
              activeTab === 'filter'
                ? isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                : isDarkMode
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Filter size={14} />
            Filter
          </button>
          <button
            onClick={() => setActiveTab('calculate')}
            className={`px-3 py-1 rounded-md text-sm border flex items-center gap-1 ${
              activeTab === 'calculate'
                ? isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                : isDarkMode
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Calculator size={14} />
            Calculate
          </button>
          <button
            onClick={() => setActiveTab('aggregate')}
            className={`px-3 py-1 rounded-md text-sm border flex items-center gap-1 ${
              activeTab === 'aggregate'
                ? isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                : isDarkMode
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <GroupIcon size={14} />
            Group
          </button>
          <button
            onClick={() => setActiveTab('sort')}
            className={`px-3 py-1 rounded-md text-sm border flex items-center gap-1 ${
              activeTab === 'sort'
                ? isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                : isDarkMode
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <SortAsc size={14} />
            Sort
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Filter Tab */}
        {activeTab === 'filter' && (
          <div className="space-y-3">
            <div className="text-sm font-medium mb-2">Filter rows where:</div>
            {filters.map((filter, index) => (
              <div key={filter.id} className="flex gap-2 items-start">
                <select
                  value={filter.field}
                  onChange={(e) => {
                    const field = e.target.value
                    setFilters(prev => prev.map((f, i) => 
                      i === index ? { ...f, field, type: detectFieldType(field) } : f
                    ))
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">Select field</option>
                  {availableFields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
                
                <select
                  value={filter.operator}
                  onChange={(e) => {
                    setFilters(prev => prev.map((f, i) => 
                      i === index ? { ...f, operator: e.target.value } : f
                    ))
                  }}
                  className={`w-32 px-3 py-2 rounded-lg border text-sm ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                  }`}
                >
                  {getOperatorOptions(filter.type || 'text').map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                
                {!['is_empty', 'is_not_empty'].includes(filter.operator) && (
                  <input
                    type={filter.type === 'number' ? 'number' : 'text'}
                    value={filter.value}
                    onChange={(e) => {
                      setFilters(prev => prev.map((f, i) => 
                        i === index ? { ...f, value: e.target.value } : f
                      ))
                    }}
                    placeholder="Value"
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                    }`}
                  />
                )}
                
                <button
                  onClick={() => {
                    if (filters.length > 1) {
                      setFilters(prev => prev.filter((_, i) => i !== index))
                    }
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    filters.length > 1
                      ? isDarkMode 
                        ? 'hover:bg-gray-800 text-red-400'
                        : 'hover:bg-gray-100 text-red-500'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  disabled={filters.length === 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            
            <button
              onClick={() => {
                setFilters(prev => [...prev, {
                  id: String(Date.now()),
                  field: '',
                  operator: 'equals',
                  value: ''
                }])
              }}
              className={`text-sm px-3 py-2 rounded-lg border flex items-center gap-1 ${
                isDarkMode 
                  ? 'border-gray-700 hover:bg-gray-800'
                  : 'border-gray-300 hover:bg-gray-100'
              }`}
            >
              <Plus size={14} />
              Add Filter
            </button>
          </div>
        )}

        {/* Calculate Tab */}
        {activeTab === 'calculate' && (
          <div className="space-y-3">
            <div className="text-sm font-medium mb-2">Add calculated columns:</div>
            
            <div className="space-y-3">
              {/* Quick calculation buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const numericFields = availableFields.filter(f => detectFieldType(f) === 'number')
                    if (numericFields.length > 0) {
                      setCalculations(prev => [...prev, {
                        id: String(Date.now()),
                        name: 'Total',
                        formula: 'sum',
                        type: 'sum',
                        fields: numericFields
                      }])
                    }
                  }}
                  className={`p-3 rounded-lg border text-left ${
                    isDarkMode 
                      ? 'border-gray-700 hover:bg-gray-800'
                      : 'border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Plus size={16} className="text-green-500" />
                    <span className="font-medium text-sm">Sum Total</span>
                  </div>
                  <div className="text-xs text-gray-500">Add all number columns</div>
                </button>
                
                <button
                  onClick={() => {
                    const numericFields = availableFields.filter(f => detectFieldType(f) === 'number')
                    if (numericFields.length > 0) {
                      setCalculations(prev => [...prev, {
                        id: String(Date.now()),
                        name: 'Average',
                        formula: 'average',
                        type: 'average',
                        fields: numericFields
                      }])
                    }
                  }}
                  className={`p-3 rounded-lg border text-left ${
                    isDarkMode 
                      ? 'border-gray-700 hover:bg-gray-800'
                      : 'border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Percent size={16} className="text-blue-500" />
                    <span className="font-medium text-sm">Average</span>
                  </div>
                  <div className="text-xs text-gray-500">Average of number columns</div>
                </button>
              </div>
              
              {/* Existing calculations */}
              {calculations.map((calc, index) => (
                <div key={calc.id} className={`p-3 rounded-lg border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <input
                      value={calc.name}
                      onChange={(e) => {
                        setCalculations(prev => prev.map((c, i) => 
                          i === index ? { ...c, name: e.target.value } : c
                        ))
                      }}
                      placeholder="Column name"
                      className={`font-medium text-sm bg-transparent outline-none ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                    />
                    <button
                      onClick={() => {
                        setCalculations(prev => prev.filter((_, i) => i !== index))
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    {calc.type === 'sum' && 'Sum of: '}
                    {calc.type === 'average' && 'Average of: '}
                    {calc.type === 'count' && 'Count of: '}
                    {calc.fields.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aggregate Tab */}
        {activeTab === 'aggregate' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Group by</label>
              <select
                value={aggregation.groupBy}
                onChange={(e) => setAggregation(prev => ({ ...prev, groupBy: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Select field to group by</option>
                {availableFields.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </div>
            
            {aggregation.groupBy && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Calculate:</div>
                {aggregation.calculations.map((calc, index) => (
                  <div key={index} className="flex gap-2">
                    <select
                      value={calc.operation}
                      onChange={(e) => {
                        setAggregation(prev => ({
                          ...prev,
                          calculations: prev.calculations.map((c, i) => 
                            i === index ? { ...c, operation: e.target.value as any } : c
                          )
                        }))
                      }}
                      className={`w-24 px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="sum">Sum</option>
                      <option value="avg">Average</option>
                      <option value="count">Count</option>
                      <option value="min">Min</option>
                      <option value="max">Max</option>
                    </select>
                    
                    <select
                      value={calc.field}
                      onChange={(e) => {
                        setAggregation(prev => ({
                          ...prev,
                          calculations: prev.calculations.map((c, i) => 
                            i === index ? { ...c, field: e.target.value } : c
                          )
                        }))
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="">Select field</option>
                      {availableFields.filter(f => detectFieldType(f) === 'number').map(field => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>
                    
                    <input
                      value={calc.alias}
                      onChange={(e) => {
                        setAggregation(prev => ({
                          ...prev,
                          calculations: prev.calculations.map((c, i) => 
                            i === index ? { ...c, alias: e.target.value } : c
                          )
                        }))
                      }}
                      placeholder="Name"
                      className={`w-32 px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                      }`}
                    />
                    
                    <button
                      onClick={() => {
                        setAggregation(prev => ({
                          ...prev,
                          calculations: prev.calculations.filter((_, i) => i !== index)
                        }))
                      }}
                      className="text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={() => {
                    setAggregation(prev => ({
                      ...prev,
                      calculations: [...prev.calculations, {
                        field: '',
                        operation: 'sum',
                        alias: ''
                      }]
                    }))
                  }}
                  className={`text-sm px-3 py-2 rounded-lg border flex items-center gap-1 ${
                    isDarkMode 
                      ? 'border-gray-700 hover:bg-gray-800'
                      : 'border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <Plus size={14} />
                  Add Calculation
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sort Tab */}
        {activeTab === 'sort' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Sort by</label>
              <select
                value={sortConfig.field}
                onChange={(e) => setSortConfig(prev => ({ ...prev, field: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                }`}
              >
                <option value="">No sorting</option>
                {availableFields.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </div>
            
            {sortConfig.field && (
              <div>
                <label className="block text-sm font-medium mb-1">Direction</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortConfig(prev => ({ ...prev, direction: 'asc' }))}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                      sortConfig.direction === 'asc'
                        ? isDarkMode
                          ? 'bg-purple-900/40 border-purple-600'
                          : 'bg-purple-100 border-purple-400'
                        : isDarkMode
                          ? 'border-gray-700 hover:bg-gray-800'
                          : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    A → Z (Ascending)
                  </button>
                  <button
                    onClick={() => setSortConfig(prev => ({ ...prev, direction: 'desc' }))}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                      sortConfig.direction === 'desc'
                        ? isDarkMode
                          ? 'bg-purple-900/40 border-purple-600'
                          : 'bg-purple-100 border-purple-400'
                        : isDarkMode
                          ? 'border-gray-700 hover:bg-gray-800'
                          : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    Z → A (Descending)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Preview</div>
            <div className="text-xs text-gray-500">
              {previewData.length} rows
            </div>
          </div>
          <div className={`border rounded-lg overflow-auto max-h-48 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-300'
          }`}>
            {previewData.length > 0 ? (
              <table className={`min-w-full text-xs ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                  <tr>
                    {previewData[0] && typeof previewData[0] === 'object' && Object.keys(previewData[0]).map(key => (
                      <th key={key} className="px-2 py-1 text-left font-medium border-b">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 5).map((row, i) => (
                    <tr key={i} className={isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}>
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="px-2 py-1 border-b">
                          {String(val ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                No data to preview
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`p-4 border-t flex items-center justify-between ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="text-xs text-gray-500">
          {inputData.length} rows → {previewData.length} rows
        </div>
        <div className="flex gap-2">
          {layout !== 'inline' && (
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
          )}
          <button
            onClick={applyTransformations}
            className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600"
          >
            Apply Transform
          </button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(TransformBuilder)