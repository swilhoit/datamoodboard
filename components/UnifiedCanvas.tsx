'use client'

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  Handle,
  Position,
  MarkerType,
  NodeTypes,
  getIncomers,
  getOutgoers,
  getConnectedEdges,
  ReactFlowProvider,
  useReactFlow,
  Panel
} from 'reactflow'
import 'reactflow/dist/style.css'
import { 
  Database, FileSpreadsheet, CloudDownload, Table, Filter, 
  Calculator, GroupIcon, ChartBar, Plus, Settings, RefreshCw,
  AlertCircle, CheckCircle2, Loader2, Move, Square, Edit2,
  Type, Image, Shapes, Sparkles, Copy, Trash2, Lock, Unlock,
  Eye, EyeOff, Layers, ChevronRight, ChevronDown, ChevronUp, Grid3X3,
  ZoomIn, ZoomOut, Maximize2, Minimize2, Download, Upload,
  MousePointer, Hand, BarChart2, LineChart, PieChart, TrendingUp,
  LayoutGrid, X, Check, Hash
} from 'lucide-react'
// Import necessary components
import dynamic from 'next/dynamic'
import CanvasToolbar from './CanvasToolbar'
import { useSmartGuides } from '@/hooks/useSmartGuides'

// Dynamic imports for heavy components
const DataSourceConnector = dynamic(() => import('./DataSourceConnector'), {
  ssr: false,
  loading: () => <div className="p-4">Loading data source connector...</div>
})

const TransformBuilder = dynamic(() => import('./TransformBuilder'), {
  ssr: false,
  loading: () => <div className="p-4">Loading transform builder...</div>
})

const ChartStylesPanel = dynamic(() => import('./ChartStylesPanel'), {
  ssr: false,
  loading: () => <div className="p-4">Loading chart styles...</div>
})

const PresetsLibrary = dynamic(() => import('./PresetsLibrary'), {
  ssr: false,
  loading: () => <div className="p-4">Loading presets...</div>
})

const TableEditor = dynamic(() => import('./TableEditor'), {
  ssr: false,
  loading: () => <div className="p-4">Loading editor...</div>
})

const PremadeDatasetsModal = dynamic(() => import('./PremadeDatasetsModal'), {
  ssr: false,
  loading: () => <div className="p-4">Loading datasets...</div>
})

const DatabaseConnectors = dynamic(() => import('./DatabaseConnectors'), {
  ssr: false,
  loading: () => <div className="p-4">Loading connectors...</div>
})

const ChartWrapper = dynamic(() => import('./ChartWrapper'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-gray-400">
      <BarChart2 size={20} className="animate-pulse" />
    </div>
  )
})


// Data source node (existing from DataFlowCanvas)
const DataSourceNode = React.memo(function DataSourceNode({ data, selected, id }: any) {
  const [isSyncing, setIsSyncing] = useState(false)
  
  const getIcon = () => {
    switch (data.sourceType) {
      case 'googlesheets':
        return <FileSpreadsheet size={16} className="text-[#0F9D58]" />
      case 'shopify':
        return <Database size={16} className="text-[#95BF47]" />
      case 'stripe':
        return <Database size={16} className="text-[#635BFF]" />
      case 'googleads':
        return <Database size={16} className="text-gray-600" />
      case 'csv':
        return <FileSpreadsheet size={16} className="text-gray-600" />
      case 'preset':
        return <Database size={16} className="text-gray-600" />
      case 'database':
      case 'bigquery':
      case 'azure':
      case 'redshift':
      case 'snowflake':
      case 'supabase':
      case 'firebase':
        return <Database size={16} className="text-gray-600" />
      default:
        return <CloudDownload size={16} className="text-gray-600" />
    }
  }

  const getStatusColor = () => {
    if (isSyncing) return 'bg-yellow-500 animate-pulse'
    if (data.error) return 'bg-red-500'
    if (!data.connected) return 'bg-gray-400'
    if (!data.queryInfo || Object.keys(data.queryInfo).length === 0) return 'bg-orange-500'
    if (data.queryResults && data.queryResults.length > 0) return 'bg-gray-600'
    if (data.parsedData && data.parsedData.length > 0) return 'bg-gray-600'
    return 'bg-orange-500'
  }

  return (
    <div className={`px-4 py-3 shadow-md rounded-lg border-2 bg-white ${
      selected ? 'border-gray-500' : 'border-gray-300'
    } min-w-[200px]`}>
      <div className={`absolute -top-2 -right-2 w-3 h-3 rounded-full ${getStatusColor()}`} />
      
      <div className="flex items-center gap-2 mb-2">
        {getIcon()}
        <span className="font-dm-mono font-medium text-xs uppercase tracking-wider">{data.label}</span>
      </div>
      
      {data.queryInfo && Object.keys(data.queryInfo).length > 0 && (
        <div className="text-xs text-gray-600 space-y-1">
          {data.queryInfo.resource && (
            <div>Resource: {data.queryInfo.resource}</div>
          )}
          {data.queryInfo.dateRange && (
            <div>Date: {data.queryInfo.dateRange}</div>
          )}
          {(data.queryResults?.length > 0 || data.parsedData?.length > 0) && (
            <div className="text-xs font-medium text-green-600">
              {data.queryResults?.length || data.parsedData?.length} records loaded
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className={`w-3 h-3 !border-2 !border-white ${
          (data.queryResults?.length > 0 || data.parsedData?.length > 0) ? '!bg-green-600' : '!bg-gray-300'
        }`}
        style={{
          boxShadow: (data.queryResults?.length > 0 || data.parsedData?.length > 0) 
            ? '0 0 8px rgba(34,197,94,0.5)' 
            : 'none'
        }}
      />
    </div>
  )
})

// Transform node
const TransformNode = React.memo(function TransformNode({ data, selected, id }: any) {
  const { setNodes, getEdges } = useReactFlow()
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const hasData = data.connectedData && data.connectedData.length > 0
  
  // Get available columns from connected data
  const availableColumns = React.useMemo(() => {
    if (!hasData || !data.connectedData[0]) return []
    
    const sourceData = data.connectedData[0].parsedData || 
                      data.connectedData[0].queryResults || 
                      data.connectedData[0].transformedData || []
    
    if (sourceData.length > 0 && sourceData[0]) {
      return Object.keys(sourceData[0])
    }
    return []
  }, [hasData, data.connectedData])
  
  // Apply transformation
  const transformedData = React.useMemo(() => {
    // If we have transformedData from TransformBuilder, use it directly
    if (data.transformedData && data.transformedData.length >= 0) {
      console.log('[TransformNode] Using pre-computed transformedData from TransformBuilder:', data.transformedData.length, 'rows')
      return data.transformedData
    }
    
    if (!hasData || !data.connectedData[0]) return []
    
    const sourceData = data.connectedData[0].parsedData || 
                      data.connectedData[0].queryResults || 
                      data.connectedData[0].transformedData || []
    
    let result = [...sourceData]
    
    // Note: Date range filter is now handled in TransformBuilder
    // Legacy date range filter code (keeping for backward compatibility)
    if (data.config?.dateRangeEnabled && data.config.dateColumn) {
      const startDate = data.config.startDate ? new Date(data.config.startDate) : null
      const endDate = data.config.endDate ? new Date(data.config.endDate) : null
      
      result = result.filter((row: any) => {
        const dateValue = row[data.config.dateColumn]
        if (!dateValue) return false
        
        const rowDate = new Date(dateValue)
        if (isNaN(rowDate.getTime())) return false
        
        if (startDate && rowDate < startDate) return false
        if (endDate && rowDate > endDate) return false
        
        return true
      })
    }
    
    // Apply regular filter
    if (data.config?.filter && data.config.filterColumn && data.config.filterValue) {
      result = result.filter((row: any) => {
        const value = row[data.config.filterColumn]
        const filterValue = data.config.filterValue
        
        switch (data.config.filterOperator || 'equals') {
          case 'equals':
            return value == filterValue
          case 'contains':
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase())
          case 'greater':
            return parseFloat(value) > parseFloat(filterValue)
          case 'less':
            return parseFloat(value) < parseFloat(filterValue)
          default:
            return true
        }
      })
    }
    
    // Apply aggregation
    if (data.config?.aggregate && data.config.groupByColumn) {
      const grouped: any = {}
      
      result.forEach((row: any) => {
        const key = row[data.config.groupByColumn]
        if (!grouped[key]) {
          grouped[key] = { [data.config.groupByColumn]: key, count: 0 }
        }
        grouped[key].count++
        
        // Sum numeric columns
        if (data.config.sumColumn && row[data.config.sumColumn]) {
          grouped[key][`sum_${data.config.sumColumn}`] = 
            (grouped[key][`sum_${data.config.sumColumn}`] || 0) + parseFloat(row[data.config.sumColumn])
        }
      })
      
      result = Object.values(grouped)
    }
    
    // Apply calculation
    if (data.config?.calculate && data.config.calculateColumn && data.config.calculateOperation && data.config.calculateValue !== undefined) {
      console.log('[TransformNode] Applying calculation:', {
        column: data.config.calculateColumn,
        operation: data.config.calculateOperation,
        value: data.config.calculateValue,
        rowCount: result.length
      })
      
      result = result.map((row: any) => {
        const originalValue = row[data.config.calculateColumn]
        const value = parseFloat(originalValue)
        
        // Skip if value is not a valid number
        if (isNaN(value)) {
          console.warn('[TransformNode] Skipping non-numeric value:', originalValue)
          return row
        }
        
        let calculated = value
        const calcValue = parseFloat(data.config.calculateValue) || 0
        
        switch (data.config.calculateOperation) {
          case 'multiply':
            calculated = value * calcValue
            break
          case 'divide':
            calculated = calcValue !== 0 ? value / calcValue : value
            break
          case 'add':
            calculated = value + calcValue
            break
          case 'subtract':
            calculated = value - calcValue
            break
        }
        
        console.log('[TransformNode] Calculated:', {
          original: value,
          operation: data.config.calculateOperation,
          operand: calcValue,
          result: calculated
        })
        
        return {
          ...row,
          [`${data.config.calculateColumn}_calculated`]: calculated
        }
      })
    }
    
    
    return result
  }, [hasData, data.connectedData, data.config, data.transformedData])
  
  // Store transformed data in node using useEffect to avoid setState during render
  React.useEffect(() => {
    // Only update if we computed the data locally (not from TransformBuilder)
    // This prevents overwriting data from TransformBuilder
    if (transformedData && 
        JSON.stringify(transformedData) !== JSON.stringify(data.transformedData) &&
        (!data.aggregations && !data.calculations && !data.filters)) {
      setNodes((nodes) => nodes.map(n => 
        n.id === id 
          ? { ...n, data: { ...n.data, transformedData } }
          : n
      ))
    }
  }, [transformedData, data.transformedData, data.aggregations, data.calculations, data.filters, id, setNodes])
  
  // Propagate transformed data to connected nodes when it changes
  React.useEffect(() => {
    if (transformedData && transformedData.length >= 0) {
      // Get current edges
      const edges = getEdges()
      
      // Find all edges where this transform node is the source
      const outgoingEdges = edges.filter(edge => edge.source === id)
      
      if (outgoingEdges.length > 0) {
        console.log('[TransformNode] Propagating transformed data to connected nodes:', {
          nodeId: id,
          transformedDataLength: transformedData.length,
          connectedNodes: outgoingEdges.map(e => e.target)
        })
        
        setNodes((nodes) => {
          const updatedNodes = [...nodes]
          
          outgoingEdges.forEach(edge => {
            const targetNodeIndex = updatedNodes.findIndex(n => n.id === edge.target)
            if (targetNodeIndex !== -1) {
              const targetNode = updatedNodes[targetNodeIndex]
              
              // Update the target node with the transformed data
              updatedNodes[targetNodeIndex] = {
                ...targetNode,
                data: {
                  ...targetNode.data,
                  connectedData: [{
                    ...data,
                    parsedData: transformedData,
                    queryResults: transformedData,
                    transformedData: transformedData,
                    fromNode: id,
                    nodeType: 'transform',
                    config: data.config
                  }],
                  sourceNodeId: id,
                  hasUpstreamData: true
                }
              }
            }
          })
          
          return updatedNodes
        })
      }
    }
  }, [transformedData, id, setNodes, data.config, getEdges])
  
  const getTransformIcon = () => {
    if (data.config?.filter) return <Filter size={16} className="text-gray-600" />
    if (data.config?.aggregate) return <GroupIcon size={16} className="text-gray-600" />
    if (data.config?.calculate) return <Calculator size={16} className="text-gray-600" />
    return <Sparkles size={16} className="text-gray-600" />
  }
  
  const updateConfig = (newConfig: any) => {
    setNodes((nodes) => nodes.map(n => 
      n.id === id 
        ? { ...n, data: { ...n.data, config: { ...n.data.config, ...newConfig } } }
        : n
    ))
  }

  return (
    <div className={`shadow-lg rounded-lg border-2 bg-white overflow-hidden ${
      selected ? 'border-gray-600 ring-2 ring-gray-400 ring-opacity-30' : 'border-gray-300'
    }`} style={{ width: 220, minHeight: 80 }}>
      <Handle
        type="target"
        position={Position.Left}
        className={`w-3 h-3 !border-2 !border-white ${
          hasData ? '!bg-gray-700' : '!bg-gray-300'
        }`}
        style={{
          boxShadow: hasData ? '0 0 8px rgba(0,0,0,0.2)' : 'none'
        }}
      />
      
      {/* Header */}
      <div className="bg-gray-50 text-gray-700 px-3 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTransformIcon()}
            <span className="font-dm-mono font-medium text-xs uppercase tracking-wider">
              {data.label || 'TRANSFORM'}
            </span>
          </div>
          {/* Active configuration indicator */}
          {(data.config?.filter || data.config?.aggregate || data.config?.calculate || 
            data.dateRange?.enabled || data.aggregation?.calculations?.length > 0) && (
            <div className="w-2 h-2 bg-green-500 rounded-full" title="Configuration active" />
          )}
        </div>
      </div>
      
      {/* Status */}
      <div className="px-3 py-2 bg-gray-50/50">
        {hasData ? (
          <div className="flex items-center justify-between">
            <div className="text-xs font-dm-mono text-gray-600">
              <span className="text-gray-500">IN:</span> {data.connectedData[0].parsedData?.length || 
                     data.connectedData[0].queryResults?.length || 0}
            </div>
            {transformedData && transformedData.length >= 0 && (
              <div className="text-xs font-dm-mono text-green-600">
                <span className="text-gray-500">OUT:</span> {transformedData.length}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">Connect data source</div>
        )}
        {/* Configuration hint or summary */}
        {hasData && (
          <div className="text-[10px] text-gray-500 mt-1 space-y-0.5">
            {/* Show active transformations */}
            {data.dateRange?.enabled && (
              <div>📅 Date: {data.dateRange.startDate} to {data.dateRange.endDate}</div>
            )}
            {data.filters?.length > 0 && (
              <div>🔍 Filter: {data.filters.length} condition{data.filters.length > 1 ? 's' : ''}</div>
            )}
            {data.aggregation?.calculations?.length > 0 && (
              <div>
                Σ {data.aggregation.groupBy ? `Group by ${data.aggregation.groupBy}` : 'Totals'}: 
                {' '}{data.aggregation.calculations.map((c: any) => c.alias || c.field).join(', ')}
              </div>
            )}
            {data.sort?.field && (
              <div>↕️ Sort: {data.sort.field} ({data.sort.direction})</div>
            )}
            {!data.dateRange?.enabled && !data.filters?.length && 
             !data.aggregation?.calculations?.length && !data.sort?.field && (
              <div className="text-gray-400 italic">Click to configure</div>
            )}
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className={`w-3 h-3 !border-2 !border-white ${
          transformedData && transformedData.length > 0 ? '!bg-green-600' : '!bg-gray-300'
        }`}
        style={{
          boxShadow: transformedData && transformedData.length > 0 
            ? '0 0 8px rgba(34,197,94,0.5)' 
            : 'none'
        }}
      />
    </div>
  )
})

// Chart node - can receive and pass data with resize and style
const ChartNode = React.memo(function ChartNode({ data, selected, id }: any) {
  const { setNodes } = useReactFlow()
  const hasData = data.connectedData && data.connectedData.length > 0
  const [isResizing, setIsResizing] = useState(false)
  const [dimensions, setDimensions] = useState({
    width: data.width || 320,
    height: data.height || 280
  })
  
  // Check if this node is selected based on data property
  const isSelected = selected || data.selected || false
  
  // Don't auto-open config panel - it will be handled externally
  // React.useEffect(() => {
  //   if (isSelected) {
  //     setShowConfig(true)
  //   }
  // }, [isSelected])
  
  const getChartIcon = () => {
    switch (data.chartType) {
      case 'line':
        return <LineChart size={16} className="text-gray-600" />
      case 'bar':
        return <BarChart2 size={16} className="text-gray-600" />
      case 'pie':
        return <PieChart size={16} className="text-purple-600" />
      case 'area':
        return <TrendingUp size={16} className="text-orange-600" />
      default:
        return <ChartBar size={16} className="text-gray-600" />
    }
  }

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = dimensions.width
    const startHeight = dimensions.height
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const newWidth = Math.max(200, startWidth + e.clientX - startX)
      const newHeight = Math.max(150, startHeight + e.clientY - startY)
      
      setDimensions({ width: newWidth, height: newHeight })
      
      // Update node data
      setNodes((nodes) => 
        nodes.map(node => 
          node.id === id 
            ? { ...node, data: { ...node.data, width: newWidth, height: newHeight } }
            : node
        )
      )
    }
    
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault()
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'nwse-resize'
  }

  // Update chart configuration
  const updateConfig = (newConfig: any) => {
    setNodes((nodes) => 
      nodes.map(node => 
        node.id === id 
          ? { ...node, data: { ...node.data, config: { ...node.data.config, ...newConfig } } }
          : node
      )
    )
  }

  // Get real data from connected sources
  const chartData = React.useMemo(() => {
    console.log('[ChartNode] Computing chart data:', {
      id,
      hasData,
      connectedData: data.connectedData,
      connectedDataLength: data.connectedData?.length
    })
    
    if (hasData && data.connectedData && data.connectedData[0]) {
      // Check for parsed data from CSV or other sources
      if (data.connectedData[0].parsedData && data.connectedData[0].parsedData.length > 0) {
        console.log('[ChartNode] Using parsedData:', {
          length: data.connectedData[0].parsedData.length,
          sample: data.connectedData[0].parsedData[0]
        })
        return data.connectedData[0].parsedData
      }
      // Check for query results from data sources
      if (data.connectedData[0].queryResults && data.connectedData[0].queryResults.length > 0) {
        console.log('[ChartNode] Using queryResults:', {
          length: data.connectedData[0].queryResults.length,
          sample: data.connectedData[0].queryResults[0]
        })
        return data.connectedData[0].queryResults
      }
      // Check for transformed data
      if (data.connectedData[0].transformedData && data.connectedData[0].transformedData.length > 0) {
        console.log('[ChartNode] Using transformedData:', {
          length: data.connectedData[0].transformedData.length,
          sample: data.connectedData[0].transformedData[0]
        })
        return data.connectedData[0].transformedData
      }
    }
    
    console.log('[ChartNode] No connected data available')
    return []
  }, [hasData, data.connectedData, id])

  // Auto-initialize axes when data is first connected
  React.useEffect(() => {
    if (chartData.length > 0 && (!data.config?.xAxis || !data.config?.yAxis)) {
      const columns = Object.keys(chartData[0])
      if (columns.length >= 2 && !data.config?.xAxis && !data.config?.yAxis) {
        // Auto-select first column as X and second as Y
        updateConfig({
          xAxis: columns[0],
          yAxis: columns[1]
        })
        console.log('[ChartNode] Auto-initialized axes:', { xAxis: columns[0], yAxis: columns[1] })
      } else if (columns.length >= 1) {
        // Update only missing axis
        const updates: any = {}
        if (!data.config?.xAxis) updates.xAxis = columns[0]
        if (!data.config?.yAxis && columns.length > 1) updates.yAxis = columns[1]
        if (Object.keys(updates).length > 0) {
          updateConfig(updates)
          console.log('[ChartNode] Auto-initialized missing axes:', updates)
        }
      }
    }
  }, [chartData, data.config?.xAxis, data.config?.yAxis])

  const columns = React.useMemo(() => {
    if (chartData.length > 0 && chartData[0] && typeof chartData[0] === 'object') {
      try {
        return Object.keys(chartData[0])
      } catch (e) {
        console.error('[ChartNode] Error getting columns:', e)
        return []
      }
    }
    return []
  }, [chartData])

  const chartConfig = React.useMemo(() => {
    // Use actual axis values from config, with smart defaults
    const config = {
      xAxis: data.config?.xAxis || (columns.length > 0 ? columns[0] : 'name'),
      yAxis: data.config?.yAxis || (columns.length > 1 ? columns[1] : 'value'),
      theme: data.config?.theme || 'default',
      showLegend: data.config?.showLegend !== false,
      showGrid: data.config?.showGrid !== false,
      animated: data.config?.animated !== false,
      colors: data.config?.colors || ['#3B82F6', '#10B981', '#F59E0B'],
      background: data.config?.background || '#FFFFFF',
      gridColor: data.config?.gridColor || '#E5E7EB',
      textColor: data.config?.textColor || '#1F2937',
      font: data.config?.font || 'Inter',
      fontSize: data.config?.fontSize || 12,
    }
    console.log('[ChartNode] Chart config:', { id, config })
    return config
  }, [data.config, columns, id])

  // Log when rendering with data
  React.useEffect(() => {
    if (chartData && chartData.length > 0) {
      console.log('[ChartNode] Rendering chart with data:', {
        id,
        dataLength: chartData.length,
        chartType: data.chartType || 'bar',
        library: data.chartLibrary || 'recharts',
        firstItem: chartData[0],
        dimensions: { width: dimensions.width, height: dimensions.height }
      })
    }
  }, [chartData, id, data.chartType, data.chartLibrary, dimensions])

  return (
    <>
      <div className={`shadow-lg rounded-lg border-2 bg-white overflow-hidden relative ${
        isSelected ? 'border-purple-500 ring-2 ring-purple-500 ring-opacity-30' : 'border-gray-300'
      }`} style={{ width: dimensions.width, height: dimensions.height }}>
        <Handle
          type="target"
          position={Position.Left}
          className={`w-3 h-3 !border-2 !border-white ${
            hasData ? '!bg-gray-600' : '!bg-gray-400'
          }`}
          style={{ top: '20px' }}
        />
        
        {/* Header */}
        <div className="bg-gray-100 text-gray-700 px-3 py-2 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            {getChartIcon()}
            <span className="font-dm-mono font-medium text-xs uppercase tracking-wider">{data.label || 'CHART'}</span>
          </div>
          {isSelected && (
            <div className="text-[10px] text-purple-600 font-medium">
              Configure →
            </div>
          )}
        </div>
        
        {/* Settings removed - using ChartDesignPanel instead */}
        {false && (
          <div className="absolute top-10 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50" style={{ width: '320px', maxHeight: '500px', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-dm-mono font-bold uppercase">Chart Settings</h4>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {/* Chart Type */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Chart Type</label>
                <select
                  value={data.chartType || 'bar'}
                  onChange={(e) => updateConfig({ chartType: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="scatter">Scatter Plot</option>
                </select>
              </div>
              
              {/* X-Axis Field */}
              {columns.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">X-Axis</label>
                  <select
                    value={data.config?.xAxis || ''}
                    onChange={(e) => updateConfig({ xAxis: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  >
                    <option value="">Select field</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Y-Axis Field */}
              {columns.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Y-Axis</label>
                  <select
                    value={data.config?.yAxis || ''}
                    onChange={(e) => updateConfig({ yAxis: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  >
                    <option value="">Select field</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Chart Library */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Chart Library</label>
                <select
                  value={data.chartLibrary || 'recharts'}
                  onChange={(e) => updateConfig({ chartLibrary: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="recharts">Recharts</option>
                  <option value="chartjs">Chart.js</option>
                  <option value="plotly">Plotly</option>
                  <option value="apexcharts">ApexCharts</option>
                  <option value="victory">Victory</option>
                </select>
              </div>
              
              {/* Chart Title */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Chart Title</label>
                <input
                  type="text"
                  value={data.label || ''}
                  onChange={(e) => {
                    setNodes((nodes: any[]) => nodes.map((n: any) => 
                      n.id === id ? { ...n, data: { ...n.data, label: e.target.value } } : n
                    ))
                  }}
                  placeholder="Chart"
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                />
              </div>
              
              {/* Color Theme */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Color Theme</label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { name: 'Default', colors: ['#3B82F6', '#10B981', '#F59E0B'] },
                    { name: 'Dark', colors: ['#1F2937', '#374151', '#4B5563'] },
                    { name: 'Vibrant', colors: ['#FF006E', '#FB5607', '#FFBE0B'] },
                    { name: 'Ocean', colors: ['#0077B6', '#00B4D8', '#90E0EF'] },
                    { name: 'Forest', colors: ['#2D6A4F', '#52B788', '#95D5B2'] },
                    { name: 'Sunset', colors: ['#FF6B6B', '#FFE66D', '#4ECDC4'] }
                  ].map((theme) => (
                    <button
                      key={theme.name}
                      onClick={() => updateConfig({ colors: theme.colors })}
                      className={`p-2 text-xs border rounded hover:border-gray-400 ${
                        JSON.stringify(data.config?.colors) === JSON.stringify(theme.colors) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200'
                      }`}
                      title={theme.name}
                    >
                      <div className="flex gap-1 justify-center mb-1">
                        {theme.colors.map((color, i) => (
                          <div key={i} className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                      <span className="text-[10px]">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Advanced Options */}
              <details className="border-t pt-2">
                <summary className="text-xs font-medium text-gray-700 cursor-pointer">Advanced Options</summary>
                <div className="space-y-2 mt-2">
                  {/* Show Grid */}
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={data.config?.showGrid !== false}
                      onChange={(e) => updateConfig({ showGrid: e.target.checked })}
                      className="rounded"
                    />
                    Show Grid
                  </label>
                  
                  {/* Show Legend */}
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={data.config?.showLegend !== false}
                      onChange={(e) => updateConfig({ showLegend: e.target.checked })}
                      className="rounded"
                    />
                    Show Legend
                  </label>
                  
                  {/* Animation */}
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={data.config?.animate !== false}
                      onChange={(e) => updateConfig({ animate: e.target.checked })}
                      className="rounded"
                    />
                    Enable Animation
                  </label>
                  
                  {/* Stacked (for bar/area charts) */}
                  {(data.chartType === 'bar' || data.chartType === 'area') && (
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={data.config?.stacked === true}
                        onChange={(e) => updateConfig({ stacked: e.target.checked })}
                        className="rounded"
                      />
                      Stacked
                    </label>
                  )}
                </div>
              </details>
            </div>
          </div>
        )}
        
        {/* Chart Content */}
        <div className="p-2" style={{ height: 'calc(100% - 40px)', minHeight: '200px' }}>
          {chartData && chartData.length > 0 ? (
            <div style={{ width: '100%', height: '100%' }}>
              <ChartWrapper
                data={chartData}
                type={data.chartType || 'bar'}
                library={data.chartLibrary || 'recharts'}
                config={chartConfig}
                width="100%"
                height={dimensions.height - 60} // Subtract header and padding
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <ChartBar size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">No data connected</p>
                <p className="text-xs mt-1 opacity-75">Connect a data source to visualize</p>
                <p className="text-xs mt-1 opacity-50">chartData length: {chartData?.length || 0}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Resize Handle */}
        {isSelected && (
          <div
            onMouseDown={handleResizeStart}
            className={`nodrag absolute bottom-0 right-0 w-5 h-5 bg-gray-500 rounded-full cursor-nwse-resize ${
              isResizing ? 'bg-gray-600' : 'hover:bg-gray-600'
            } transition-colors shadow-lg`}
            style={{ 
              transform: 'translate(50%, 50%)',
              border: '2px solid white',
              zIndex: 20,
              pointerEvents: 'all'
            }}
            title="Drag to resize"
          />
        )}
        
        <Handle
          type="source"
          position={Position.Right}
          className={`w-3 h-3 !border-2 !border-white ${
            hasData ? '!bg-gray-600' : '!bg-gray-400'
          }`}
          style={{ top: '20px' }}
        />
      </div>

    </>
  )
})

// Table node - can receive and pass data with resize
const TableNode = React.memo(function TableNode({ data, selected, id }: any) {
  const { setNodes } = useReactFlow()
  const hasData = data.connectedData && data.connectedData.length > 0
  const [isResizing, setIsResizing] = useState(false)
  const [showTableEditor, setShowTableEditor] = useState(false)
  const [showDataSources, setShowDataSources] = useState(false)
  const [dimensions, setDimensions] = useState({
    width: data.width || 400,
    height: data.height || 250
  })
  
  // Check if this node is selected based on data property
  const isSelected = selected || data.selected || false
  
  // Handle resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = dimensions.width
    const startHeight = dimensions.height
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const newWidth = Math.max(250, startWidth + e.clientX - startX)
      const newHeight = Math.max(150, startHeight + e.clientY - startY)
      
      setDimensions({ width: newWidth, height: newHeight })
      
      // Update node data
      setNodes((nodes) => 
        nodes.map(node => 
          node.id === id 
            ? { ...node, data: { ...node.data, width: newWidth, height: newHeight } }
            : node
        )
      )
    }
    
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault()
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'nwse-resize'
  }
  
  // Get real data from connected sources with JOIN support for multiple sources
  const tableData = React.useMemo(() => {
    if (hasData && data.connectedData && data.connectedData.length > 0) {
      const rowLimit = data.config?.rowLimit || 10
      
      // If multiple data sources are connected, attempt to join them
      if (data.connectedData.length > 1) {
        console.log('[TableNode] Multiple data sources detected, attempting join')
        
        // Extract data from all sources
        const dataSets = data.connectedData.map((source: any) => {
          if (source.parsedData && source.parsedData.length > 0) {
            return source.parsedData
          }
          if (source.queryResults && source.queryResults.length > 0) {
            return source.queryResults
          }
          if (source.transformedData && source.transformedData.length > 0) {
            return source.transformedData
          }
          return []
        }).filter((ds: any) => ds.length > 0)
        
        if (dataSets.length > 1) {
          // Find common columns between datasets
          const firstDataKeys = Object.keys(dataSets[0][0] || {})
          const commonColumns: string[] = []
          
          for (let i = 1; i < dataSets.length; i++) {
            const currentKeys = Object.keys(dataSets[i][0] || {})
            const intersection = firstDataKeys.filter(key => currentKeys.includes(key))
            if (intersection.length > 0) {
              commonColumns.push(...intersection)
            }
          }
          
          // Use the join column specified in config, or auto-detect
          const joinColumn = data.config?.joinColumn || 
            (commonColumns.length > 0 ? commonColumns[0] : null)
          
          if (joinColumn) {
            console.log(`[TableNode] Joining on column: ${joinColumn}`)
            
            // Perform inner join on the first common column
            let joinedData = dataSets[0]
            
            for (let i = 1; i < dataSets.length; i++) {
              const rightData = dataSets[i]
              const tempJoined: any[] = []
              
              joinedData.forEach((leftRow: any) => {
                rightData.forEach((rightRow: any) => {
                  if (leftRow[joinColumn] === rightRow[joinColumn]) {
                    // Merge rows, prefixing duplicate column names
                    const mergedRow = { ...leftRow }
                    Object.keys(rightRow).forEach(key => {
                      if (key !== joinColumn) {
                        if (key in mergedRow && key !== joinColumn) {
                          // Prefix with table index if column exists
                          mergedRow[`t${i + 1}_${key}`] = rightRow[key]
                        } else {
                          mergedRow[key] = rightRow[key]
                        }
                      }
                    })
                    tempJoined.push(mergedRow)
                  }
                })
              })
              
              joinedData = tempJoined.length > 0 ? tempJoined : joinedData
            }
            
            return joinedData.slice(0, rowLimit)
          } else {
            // No common columns found, concatenate horizontally if same number of rows
            const minRows = Math.min(...dataSets.map((ds: any) => ds.length))
            const concatenated: any[] = []
            
            for (let i = 0; i < minRows; i++) {
              const row: any = {}
              dataSets.forEach((dataSet: any, dsIndex: number) => {
                Object.keys(dataSet[i]).forEach(key => {
                  const prefixedKey = dsIndex > 0 ? `t${dsIndex + 1}_${key}` : key
                  row[prefixedKey] = dataSet[i][key]
                })
              })
              concatenated.push(row)
            }
            
            return concatenated.slice(0, rowLimit)
          }
        }
      }
      
      // Single data source - use as before
      const source = data.connectedData[0]
      if (source.parsedData && source.parsedData.length > 0) {
        return source.parsedData.slice(0, rowLimit)
      }
      if (source.queryResults && source.queryResults.length > 0) {
        return source.queryResults.slice(0, rowLimit)
      }
      if (source.transformedData && source.transformedData.length > 0) {
        return source.transformedData.slice(0, rowLimit)
      }
    }
    return []
  }, [hasData, data.connectedData, data.config?.rowLimit, data.config?.joinColumn])

  const columns = React.useMemo(() => {
    if (tableData.length > 0 && tableData[0] && typeof tableData[0] === 'object') {
      try {
        return Object.keys(tableData[0])
      } catch (e) {
        console.error('[TableNode] Error getting columns:', e)
        return []
      }
    }
    return []
  }, [tableData])
  
  // Find common columns between multiple data sources
  const commonColumns = React.useMemo(() => {
    if (data.connectedData && data.connectedData.length > 1) {
      const dataSets = data.connectedData.map((source: any) => {
        const sourceData = source.parsedData || source.queryResults || source.transformedData || []
        return sourceData.length > 0 ? Object.keys(sourceData[0]) : []
      }).filter((keys: string[]) => keys.length > 0)
      
      if (dataSets.length > 1) {
        const firstKeys = dataSets[0]
        const common: string[] = []
        
        for (let i = 1; i < dataSets.length; i++) {
          const intersection = firstKeys.filter((key: string) => dataSets[i].includes(key))
          if (intersection.length > 0) {
            common.push(...intersection)
          }
        }
        
        return [...new Set(common)] // Remove duplicates
      }
    }
    return []
  }, [data.connectedData])
  
  // Update table configuration
  const updateConfig = (newConfig: any) => {
    setNodes((nodes) => 
      nodes.map(node => 
        node.id === id 
          ? { ...node, data: { ...node.data, config: { ...node.data.config, ...newConfig } } }
          : node
      )
    )
  }
  
  return (
    <>
      <div className={`shadow-lg rounded-lg border-2 bg-white overflow-hidden relative ${
        selected ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-30' : 'border-gray-300'
      }`} style={{ width: dimensions.width, height: dimensions.height }}>
        <Handle
          type="target"
          position={Position.Left}
          className={`w-3 h-3 !border-2 !border-white ${
            hasData ? '!bg-gray-600' : '!bg-gray-400'
          }`}
          style={{ top: '20px' }}
        />
        
        {/* Header */}
        <div className="bg-gray-100 text-gray-700 px-3 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Table size={16} />
              <span className="font-dm-mono font-medium text-xs uppercase tracking-wider">{data.label || 'DATA TABLE'}</span>
            </div>
            <div className="flex items-center gap-2">
              {data.connectedData && data.connectedData.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDataSources(!showDataSources)
                  }}
                  className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 rounded text-xs transition-colors"
                  title="Toggle data sources"
                >
                  {data.connectedData.length} sources
                </button>
              )}
              <span className="text-xs opacity-90">
                {tableData.length} rows × {columns.length} cols
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowTableEditor(true)
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Open Table Editor"
              >
                <Edit2 size={12} />
              </button>
            </div>
          </div>
          
          {/* Data Sources Breakdown */}
          {showDataSources && data.connectedData && data.connectedData.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-300 space-y-1">
              <div className="text-xs font-dm-mono uppercase text-gray-600 mb-1">Connected Sources:</div>
              {data.connectedData.map((source: any, idx: number) => {
                const sourceData = source.parsedData || source.queryResults || source.transformedData || []
                const sourceColumns = sourceData.length > 0 ? Object.keys(sourceData[0]) : []
                return (
                  <div key={idx} className="flex items-center justify-between text-xs bg-white rounded px-2 py-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        idx === 0 ? 'bg-blue-500' : 
                        idx === 1 ? 'bg-green-500' : 
                        idx === 2 ? 'bg-purple-500' : 
                        'bg-gray-500'
                      }`} />
                      <span className="font-medium">
                        {source.label || source.type || `Source ${idx + 1}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <span>{sourceData.length} rows</span>
                      <span>{sourceColumns.length} cols</span>
                      {data.config?.joinColumn && sourceColumns.includes(data.config.joinColumn) && (
                        <span className="text-green-600">✓ {data.config.joinColumn}</span>
                      )}
                    </div>
                  </div>
                )
              })}
              {data.connectedData.length > 1 && (
                <div className="text-xs text-gray-500 italic pt-1">
                  {data.config?.joinColumn 
                    ? `Joined on: ${data.config.joinColumn}`
                    : commonColumns.length > 0 
                      ? `Auto-joined on: ${commonColumns[0]}`
                      : 'Concatenated (no common columns)'
                  }
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Table Content */}
        <div className="overflow-auto" style={{ 
          height: showDataSources && data.connectedData && data.connectedData.length > 0 
            ? `calc(100% - ${40 + (data.connectedData.length * 30) + 60}px)` 
            : 'calc(100% - 40px)' 
        }}>
          {tableData.length > 0 ? (
            <table className="w-full text-xs">
              <thead className={`border-b sticky top-0 ${
                data.config?.headerStyle === 'dark' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-50 text-gray-700'
              }`}>
                <tr>
                  {columns.map(col => (
                    <th key={col} className={`px-2 py-1.5 text-left font-medium ${
                      data.config?.compactMode ? 'py-1' : 'py-1.5'
                    }`}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row: any, idx: number) => (
                  <tr key={idx} className={`border-b ${
                    data.config?.stripedRows && idx % 2 === 1 
                      ? 'bg-gray-50' 
                      : 'bg-white'
                  } hover:bg-gray-50 transition-colors`}>
                    {columns.map(col => (
                      <td key={col} className={`px-2 text-gray-600 ${
                        data.config?.compactMode ? 'py-0.5' : 'py-1'
                      }`}>
                        {typeof row[col] === 'number' 
                          ? row[col].toLocaleString()
                          : String(row[col] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400">
              <div className="text-center">
                <Table size={32} className="mx-auto mb-2" />
                <p className="text-xs">Connect data to display</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Resize Handle */}
        {isSelected && (
          <div
            onMouseDown={handleResizeStart}
            className={`nodrag absolute bottom-0 right-0 w-5 h-5 bg-indigo-500 rounded-full cursor-nwse-resize ${
              isResizing ? 'bg-indigo-600' : 'hover:bg-indigo-600'
            } transition-colors shadow-lg`}
            style={{ 
              transform: 'translate(50%, 50%)',
              border: '2px solid white',
              zIndex: 20,
              pointerEvents: 'all'
            }}
            title="Drag to resize"
          />
        )}
        
        <Handle
          type="source"
          position={Position.Right}
          className={`w-3 h-3 !border-2 !border-white ${
            hasData ? '!bg-gray-600' : '!bg-gray-400'
          }`}
          style={{ top: '20px' }}
        />
      </div>
      
      {/* Table Editor Modal */}
      {showTableEditor && (
        <TableEditor
          isOpen={showTableEditor}
          onClose={() => setShowTableEditor(false)}
          data={tableData}
          onSave={(newData) => {
            // Update the node data with edited table data
            setNodes((nodes) => 
              nodes.map(node => 
                node.id === id 
                  ? { 
                      ...node, 
                      data: { 
                        ...node.data, 
                        connectedData: [{
                          ...node.data.connectedData[0],
                          parsedData: newData
                        }]
                      } 
                    }
                  : node
              )
            )
            setShowTableEditor(false)
          }}
          title={data.label || 'Edit Table Data'}
        />
      )}
    </>
  )
})

// Emoji node - for displaying emojis as resizable and rotatable nodes
const EmojiNode = React.memo(function EmojiNode({ data, selected, id }: any) {
  const { setNodes } = useReactFlow()
  const [dimensions, setDimensions] = useState({
    width: data.width || 80,
    height: data.height || 80
  })
  const [rotation, setRotation] = useState(data.rotation || 0)
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  
  // Handle resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    
    const startX = e.clientX
    const startY = e.clientY
    const startSize = dimensions.width // Use width since emojis are square
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY
      
      // Use the larger delta to maintain square aspect ratio
      const delta = Math.max(deltaX, deltaY)
      const newSize = Math.max(40, Math.min(200, startSize + delta))
      
      const newDimensions = { width: newSize, height: newSize }
      setDimensions(newDimensions)
      
      // Update node data
      setNodes((nodes) => 
        nodes.map(node => 
          node.id === id 
            ? { ...node, data: { ...node.data, width: newSize, height: newSize } }
            : node
        )
      )
    }
    
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault()
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'nwse-resize'
  }
  
  // Handle rotation
  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsRotating(true)
    
    const rect = e.currentTarget.parentElement?.getBoundingClientRect()
    if (!rect) return
    
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
    const startRotation = rotation
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
      const angleDiff = (currentAngle - startAngle) * (180 / Math.PI)
      const newRotation = startRotation + angleDiff
      
      setRotation(newRotation)
      
      // Update node data
      setNodes((nodes) => 
        nodes.map(node => 
          node.id === id 
            ? { ...node, data: { ...node.data, rotation: newRotation } }
            : node
        )
      )
    }
    
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault()
      setIsRotating(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'grab'
  }

  return (
    <div className={`relative ${
      selected ? 'ring-2 ring-gray-500 ring-opacity-30' : ''
    }`} style={{ width: dimensions.width, height: dimensions.height }}>
      <div className="w-full h-full flex items-center justify-center select-none" 
           style={{ 
             fontSize: dimensions.width * 0.7,
             transform: `rotate(${rotation}deg)`,
             transition: isRotating ? 'none' : 'transform 0.1s'
           }}>
        {data.emoji || '😊'}
      </div>
      
      {/* Rotation handle */}
      {selected && (
        <div
          className="nodrag absolute top-0 left-1/2 w-4 h-4 bg-green-500 cursor-grab hover:bg-green-600"
          style={{ 
            transform: 'translate(-50%, -150%)',
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            pointerEvents: 'all'
          }}
          onMouseDown={handleRotateStart}
          title="Drag to rotate"
        />
      )}
      
      {/* Resize handle */}
      {selected && (
        <div
          className="nodrag absolute bottom-0 right-0 w-4 h-4 bg-gray-500 cursor-nwse-resize hover:bg-gray-600"
          style={{ 
            transform: 'translate(50%, 50%)',
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            pointerEvents: 'all'
          }}
          onMouseDown={handleResizeStart}
          title="Drag to resize"
        />
      )}
    </div>
  )
})

// Image/Media node - for displaying images and GIFs with rotation
const ImageNode = React.memo(function ImageNode({ data, selected, id }: any) {
  const { setNodes } = useReactFlow()
  const [dimensions, setDimensions] = useState({
    width: data.width || 200,
    height: data.height || 200
  })
  const [rotation, setRotation] = useState(data.rotation || 0)
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  
  // Handle resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = dimensions.width
    const startHeight = dimensions.height
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY
      
      let newWidth = Math.max(50, startWidth + deltaX)
      let newHeight = Math.max(50, startHeight + deltaY)
      
      // Preserve aspect ratio if shift is held
      const aspectRatio = startWidth / startHeight
      if (e.shiftKey) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          newHeight = newWidth / aspectRatio
        } else {
          newWidth = newHeight * aspectRatio
        }
      }
      
      const newDimensions = { width: newWidth, height: newHeight }
      setDimensions(newDimensions)
      
      // Update node data with new dimensions
      setNodes((nodes) => 
        nodes.map(node => 
          node.id === id 
            ? { ...node, data: { ...node.data, width: newDimensions.width, height: newDimensions.height } }
            : node
        )
      )
    }
    
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault()
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'nwse-resize'
  }
  
  // Handle rotation
  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsRotating(true)
    
    const rect = e.currentTarget.parentElement?.getBoundingClientRect()
    if (!rect) return
    
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
    const startRotation = rotation
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
      const angleDiff = (currentAngle - startAngle) * (180 / Math.PI)
      const newRotation = startRotation + angleDiff
      
      setRotation(newRotation)
      
      // Update node data
      setNodes((nodes) => 
        nodes.map(node => 
          node.id === id 
            ? { ...node, data: { ...node.data, rotation: newRotation } }
            : node
        )
      )
    }
    
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault()
      setIsRotating(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'grab'
  }
  
  return (
    <div 
      className={`relative overflow-hidden rounded-lg border-2 ${
        selected ? 'border-gray-500 ring-2 ring-gray-500 ring-opacity-30' : 'border-transparent'
      }`}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <img 
        src={data.src} 
        alt={data.type || 'image'}
        className="w-full h-full object-contain"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isRotating ? 'none' : 'transform 0.1s'
        }}
        draggable={false}
        onError={(e) => {
          console.error('[ImageNode] Failed to load image:', data.src)
        }}
      />
      
      {/* Rotation handle */}
      {selected && (
        <div
          className="nodrag absolute top-0 left-1/2 w-4 h-4 bg-green-500 cursor-grab hover:bg-green-600"
          style={{ 
            transform: 'translate(-50%, -150%)',
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            pointerEvents: 'all'
          }}
          onMouseDown={handleRotateStart}
          title="Drag to rotate"
        />
      )}
      
      {/* Resize handle */}
      {selected && (
        <div
          className="nodrag absolute bottom-0 right-0 w-5 h-5 bg-gray-500 cursor-nwse-resize hover:bg-gray-600 transition-colors shadow-lg"
          style={{ 
            transform: 'translate(50%, 50%)',
            borderRadius: '50%',
            border: '2px solid white',
            zIndex: 20,
            pointerEvents: 'all'
          }}
          onMouseDown={handleResizeStart}
          title="Drag to resize (hold Shift to maintain aspect ratio)"
        />
      )}
    </div>
  )
})

// Text node component with full styling controls
const TextNode = React.memo(function TextNode({ data, selected, id }: any) {
  const { setNodes } = useReactFlow()
  const [isEditing, setIsEditing] = useState(false)
  const [showStyleMenu, setShowStyleMenu] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [text, setText] = useState(data.text || 'Double-click to edit')
  const [dimensions, setDimensions] = useState({
    width: data.width || 200,
    height: data.height || 60
  })
  const textRef = useRef<HTMLDivElement>(null)

  // Text styling state
  const [textStyle, setTextStyle] = useState({
    fontSize: data.fontSize || 16,
    fontFamily: data.fontFamily || 'Inter',
    fontWeight: data.fontWeight || 'normal',
    fontStyle: data.fontStyle || 'normal',
    textDecoration: data.textDecoration || 'none',
    textAlign: data.textAlign || 'left',
    color: data.color || '#1F2937',
    backgroundColor: data.backgroundColor || 'transparent',
    lineHeight: data.lineHeight || 1.5
  })

  const handleDoubleClick = () => {
    if (!isEditing) {
      setIsEditing(true)
      setTimeout(() => {
        if (textRef.current) {
          textRef.current.focus()
          // Select all text
          const range = document.createRange()
          range.selectNodeContents(textRef.current)
          const selection = window.getSelection()
          selection?.removeAllRanges()
          selection?.addRange(range)
        }
      }, 0)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
    // Update node data
    setNodes((nodes) => 
      nodes.map(node => 
        node.id === id 
          ? { ...node, data: { ...node.data, text } }
          : node
      )
    )
  }

  const updateStyle = (styleKey: string, value: any) => {
    const newStyle = { ...textStyle, [styleKey]: value }
    setTextStyle(newStyle)
    setNodes((nodes) => 
      nodes.map(node => 
        node.id === id 
          ? { ...node, data: { ...node.data, [styleKey]: value } }
          : node
      )
    )
  }

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = dimensions.width
    const startHeight = dimensions.height
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const newWidth = Math.max(100, startWidth + e.clientX - startX)
      const newHeight = Math.max(40, startHeight + e.clientY - startY)
      
      setDimensions({ width: newWidth, height: newHeight })
      
      // Update node data
      setNodes((nodes) => 
        nodes.map(node => 
          node.id === id 
            ? { ...node, data: { ...node.data, width: newWidth, height: newHeight } }
            : node
        )
      )
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'nwse-resize'
  }

  return (
    <div className="relative">
      <div
        className={`rounded-lg overflow-hidden ${
          selected ? 'ring-2 ring-blue-500' : ''
        }`}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          backgroundColor: textStyle.backgroundColor,
          padding: '12px',
          cursor: isEditing ? 'text' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: textStyle.textAlign === 'center' ? 'center' : 
                         textStyle.textAlign === 'right' ? 'flex-end' : 'flex-start'
        }}
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <input
            ref={textRef as any}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleBlur()
              } else if (e.key === 'Enter') {
                handleBlur()
              }
            }}
            style={{
              outline: 'none',
              width: '100%',
              border: 'none',
              background: 'transparent',
              fontSize: `${textStyle.fontSize}px`,
              fontFamily: textStyle.fontFamily,
              fontWeight: textStyle.fontWeight,
              fontStyle: textStyle.fontStyle,
              textDecoration: textStyle.textDecoration,
              textAlign: textStyle.textAlign as any,
              color: textStyle.color,
              lineHeight: textStyle.lineHeight
            }}
            autoFocus
          />
        ) : (
          <div 
            style={{
              width: '100%',
              fontSize: `${textStyle.fontSize}px`,
              fontFamily: textStyle.fontFamily,
              fontWeight: textStyle.fontWeight,
              fontStyle: textStyle.fontStyle,
              textDecoration: textStyle.textDecoration,
              textAlign: textStyle.textAlign as any,
              color: textStyle.color,
              lineHeight: textStyle.lineHeight,
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {text}
          </div>
        )}
      </div>

      {/* Style button when selected */}
      {selected && !isEditing && (
        <>
          <button
            className="nodrag absolute -top-2 -right-2 p-1 bg-white border-2 border-blue-500 rounded-full shadow-lg hover:bg-blue-50 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              // Trigger the external TextStylePanel instead of internal menu
              const event = new CustomEvent('open-text-style', { 
                detail: { 
                  node: { id, type: 'text', data: { ...data, text, ...textStyle } },
                  nodeType: 'text'
                } 
              })
              window.dispatchEvent(event)
            }}
            title="Text styling"
          >
            <Type size={14} className="text-blue-600" />
          </button>

          {/* Resize handle */}
          <div
            className="nodrag absolute -bottom-2 -right-2 w-5 h-5 bg-gray-500 cursor-nwse-resize hover:bg-gray-600 rounded-full"
            style={{ 
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            onMouseDown={handleResizeStart}
            title="Drag to resize"
          />
        </>
      )}

      {/* Style menu - disabled, using external TextStylePanel instead */}
      {false && showStyleMenu && (
        <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50" style={{ width: '280px' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Text Styling</h3>
            <button
              onClick={() => setShowStyleMenu(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {/* Font Family */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Font</label>
              <select
                value={textStyle.fontFamily}
                onChange={(e) => updateStyle('fontFamily', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="Inter">Inter</option>
                <option value="DM Mono">DM Mono</option>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
                <option value="system-ui">System UI</option>
              </select>
            </div>

            {/* Font Size */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                Size: {textStyle.fontSize}px
              </label>
              <input
                type="range"
                min="10"
                max="72"
                value={textStyle.fontSize}
                onChange={(e) => updateStyle('fontSize', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Font Weight */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Weight</label>
              <div className="grid grid-cols-3 gap-1">
                {['normal', 'bold', '300', '500', '600', '900'].map(weight => (
                  <button
                    key={weight}
                    onClick={() => updateStyle('fontWeight', weight)}
                    className={`px-2 py-1 text-xs border rounded ${
                      textStyle.fontWeight === weight
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {weight === 'normal' ? 'Regular' : weight === 'bold' ? 'Bold' : weight}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Alignment */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Alignment</label>
              <div className="flex gap-1">
                {['left', 'center', 'right', 'justify'].map(align => (
                  <button
                    key={align}
                    onClick={() => updateStyle('textAlign', align)}
                    className={`flex-1 px-2 py-1 text-xs border rounded capitalize ${
                      textStyle.textAlign === align
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Style */}
            <div className="flex gap-2">
              <button
                onClick={() => updateStyle('fontStyle', textStyle.fontStyle === 'italic' ? 'normal' : 'italic')}
                className={`flex-1 px-2 py-1 text-xs border rounded ${
                  textStyle.fontStyle === 'italic'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span style={{ fontStyle: 'italic' }}>Italic</span>
              </button>
              <button
                onClick={() => updateStyle('textDecoration', 
                  textStyle.textDecoration === 'underline' ? 'none' : 'underline')}
                className={`flex-1 px-2 py-1 text-xs border rounded ${
                  textStyle.textDecoration === 'underline'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span style={{ textDecoration: 'underline' }}>Underline</span>
              </button>
            </div>

            {/* Line Height */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                Line Height: {textStyle.lineHeight}
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={textStyle.lineHeight}
                onChange={(e) => updateStyle('lineHeight', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Text Color */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Text Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={textStyle.color}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={textStyle.color}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="#1F2937"
                />
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Background</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={textStyle.backgroundColor === 'transparent' ? '#FFFFFF' : textStyle.backgroundColor}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={textStyle.backgroundColor}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="transparent"
                />
                <button
                  onClick={() => updateStyle('backgroundColor', 'transparent')}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

// Number/Metric node component - displays a single metric value
const NumberNode = React.memo(function NumberNode({ data, selected, id }: any) {
  const { setNodes, getNodes } = useReactFlow()
  const [showSettings, setShowSettings] = React.useState(false)
  const hasData = data.connectedData && data.connectedData.length > 0
  
  // Check if connected to a date range transformer
  const isConnectedToDateTransformer = React.useMemo(() => {
    if (!hasData || !data.connectedData[0]) return false
    // Check if the source node is a transformer with date range enabled
    return data.connectedData[0].nodeType === 'transform' && 
           data.connectedData[0].config?.dateRangeEnabled
  }, [hasData, data.connectedData])
  
  // Calculate the metric value from connected data
  const metricValue = React.useMemo(() => {
    if (!hasData || !data.connectedData[0]) return null
    
    const sourceData = data.connectedData[0].parsedData || 
                      data.connectedData[0].queryResults || 
                      data.connectedData[0].transformedData || []
    
    if (sourceData.length === 0) return null
    
    // Get the specified metric field or use first numeric field
    const metricField = data.config?.metricField
    
    console.log('[NumberNode] Calculating metric:', {
      id,
      metricField,
      aggregation: data.config?.aggregation || 'sum',
      dataLength: sourceData.length,
      firstRow: sourceData[0],
      fullConfig: data.config,
      isPercentChange: data.config?.showPercentChange,
      timestamp: new Date().toISOString()
    })
    
    if (metricField && sourceData[0][metricField] !== undefined) {
      // Calculate based on aggregation type
      const values = sourceData.map((row: any) => parseFloat(row[metricField])).filter((v: number) => !isNaN(v))
      
      // If percent change is enabled and we have enough data
      if (data.config?.showPercentChange && values.length >= 2) {
        let oldValue, newValue
        
        if (data.config?.percentChangeMode === 'first-last') {
          // Compare first to last value
          oldValue = values[0]
          newValue = values[values.length - 1]
        } else {
          // Compare periods (split data in half)
          const midPoint = Math.floor(values.length / 2)
          const firstHalf = values.slice(0, midPoint)
          const secondHalf = values.slice(midPoint)
          
          // Aggregate each half based on the selected aggregation
          const aggregateValues = (vals: number[]) => {
            switch (data.config?.aggregation || 'sum') {
              case 'sum': return vals.reduce((a, b) => a + b, 0)
              case 'avg': return vals.reduce((a, b) => a + b, 0) / vals.length
              case 'min': return Math.min(...vals)
              case 'max': return Math.max(...vals)
              default: return vals[0]
            }
          }
          
          oldValue = aggregateValues(firstHalf)
          newValue = aggregateValues(secondHalf)
        }
        
        // Calculate percentage change
        if (oldValue !== 0) {
          const percentChange = ((newValue - oldValue) / Math.abs(oldValue)) * 100
          return percentChange
        }
        return 0
      }
      
      switch (data.config?.aggregation || 'sum') {
        case 'sum':
          return values.reduce((a: number, b: number) => a + b, 0)
        case 'avg':
          return values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0
        case 'min':
          return Math.min(...values)
        case 'max':
          return Math.max(...values)
        case 'count':
          return sourceData.length
        case 'latest':
          return sourceData[sourceData.length - 1][metricField]
        default:
          return values[0]
      }
    }
    
    // Auto-detect first numeric field
    const firstRow = sourceData[0]
    for (const key in firstRow) {
      if (typeof firstRow[key] === 'number') {
        return firstRow[key]
      }
    }
    
    return null
  }, [hasData, data.connectedData, data.config?.metricField, data.config?.aggregation, data.config?.showPercentChange, data.config?.percentChangeMode])
  
  const formattedValue = React.useMemo(() => {
    if (metricValue === null) return '--'
    
    const value = parseFloat(metricValue)
    
    // If showing percent change, format as percentage with + or -
    if (data.config?.showPercentChange) {
      const sign = value >= 0 ? '+' : ''
      return `${sign}${value.toFixed(data.config?.decimals || 1)}%`
    }
    
    const format = data.config?.format || 'number'
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: data.config?.currency || 'USD' 
        }).format(value)
      case 'percent':
        return (value * 100).toFixed(data.config?.decimals || 1) + '%'
      case 'compact':
        return new Intl.NumberFormat('en-US', { 
          notation: 'compact',
          maximumFractionDigits: 1
        }).format(value)
      default:
        return value.toLocaleString('en-US', {
          minimumFractionDigits: data.config?.decimals || 0,
          maximumFractionDigits: data.config?.decimals || 0
        })
    }
  }, [metricValue, data.config?.format, data.config?.currency, data.config?.decimals, data.config?.showPercentChange])
  
  return (
    <div 
      className={`shadow-lg overflow-hidden ${
        selected ? 'ring-2 ring-gray-400 ring-opacity-30' : ''
      } ${data.config?.showBorder !== false ? 'border-2' : ''} ${
        selected ? 'border-gray-600' : 'border-gray-300'
      }`} 
      style={{ 
        width: data.width || 200, 
        height: data.height || 120,
        backgroundColor: data.config?.backgroundColor || '#FFFFFF',
        borderRadius: `${data.config?.borderRadius || 8}px`
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={`w-3 h-3 !border-2 !border-white ${
          hasData ? '!bg-gray-700' : '!bg-gray-300'
        }`}
        style={{
          boxShadow: hasData ? '0 0 8px rgba(0,0,0,0.2)' : 'none'
        }}
      />
      
      {/* Header */}
      <div className="px-3 py-2 border-b" style={{ 
        backgroundColor: data.config?.backgroundColor || '#FFFFFF',
        borderColor: data.config?.showBorder !== false ? '#E5E7EB' : 'transparent'
      }}>
        <div className="flex items-center justify-between">
          <span 
            className="font-medium uppercase tracking-wider"
            style={{ 
              fontFamily: data.config?.fontFamily || 'DM Mono',
              fontSize: `${data.config?.labelFontSize || 10}px`,
              color: data.config?.labelColor || '#6B7280'
            }}
          >
            {data.label || 'METRIC'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowSettings(!showSettings)
            }}
            className="p-1 rounded transition-colors hover:bg-gray-200"
            title="Metric Settings"
          >
            <Settings size={14} className="text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10" style={{ width: '250px' }}>
          <div className="space-y-3">
            {/* Field Selection */}
            {hasData && data.connectedData[0] && (
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Metric Field</label>
                <select
                  value={data.config?.metricField || ''}
                  onChange={(e) => {
                    const newConfig = { ...data.config, metricField: e.target.value }
                    setNodes((nodes: any[]) => nodes.map((n: any) => 
                      n.id === id ? { ...n, data: { ...n.data, config: newConfig } } : n
                    ))
                  }}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="">Auto-detect</option>
                  {Object.keys(data.connectedData[0].parsedData?.[0] || data.connectedData[0].queryResults?.[0] || {}).map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Aggregation Type */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Aggregation</label>
              <select
                value={data.config?.aggregation || 'sum'}
                onChange={(e) => {
                  const newConfig = { ...data.config, aggregation: e.target.value }
                  console.log('[NumberNode] Updating aggregation:', {
                    nodeId: id,
                    oldAggregation: data.config?.aggregation,
                    newAggregation: e.target.value,
                    newConfig
                  })
                  setNodes((nodes: any[]) => nodes.map((n: any) => 
                    n.id === id ? { ...n, data: { ...n.data, config: newConfig } } : n
                  ))
                }}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="min">Minimum</option>
                <option value="max">Maximum</option>
                <option value="count">Count</option>
                <option value="latest">Latest Value</option>
              </select>
            </div>
            
            {/* Format Type */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Format</label>
              <select
                value={data.config?.format || 'number'}
                onChange={(e) => {
                  const newConfig = { ...data.config, format: e.target.value }
                  setNodes((nodes: any[]) => nodes.map((n: any) => 
                    n.id === id ? { ...n, data: { ...n.data, config: newConfig } } : n
                  ))
                }}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="number">Number</option>
                <option value="currency">Currency</option>
                <option value="percent">Percentage</option>
                <option value="compact">Compact (K, M, B)</option>
              </select>
            </div>
            
            {/* Currency Selection (if currency format) */}
            {data.config?.format === 'currency' && (
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Currency</label>
                <select
                  value={data.config?.currency || 'USD'}
                  onChange={(e) => {
                    const newConfig = { ...data.config, currency: e.target.value }
                    setNodes((nodes: any[]) => nodes.map((n: any) => 
                      n.id === id ? { ...n, data: { ...n.data, config: newConfig } } : n
                    ))
                  }}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            )}
            
            {/* Decimal Places */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Decimal Places</label>
              <input
                type="number"
                min="0"
                max="10"
                value={data.config?.decimals || 0}
                onChange={(e) => {
                  const newConfig = { ...data.config, decimals: parseInt(e.target.value) || 0 }
                  setNodes((nodes: any[]) => nodes.map((n: any) => 
                    n.id === id ? { ...n, data: { ...n.data, config: newConfig } } : n
                  ))
                }}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              />
            </div>
            
            {/* Label */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Label</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => {
                  setNodes((nodes: any[]) => nodes.map((n: any) => 
                    n.id === id ? { ...n, data: { ...n.data, label: e.target.value } } : n
                  ))
                }}
                placeholder="METRIC"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              />
            </div>
            
            {/* Subtitle */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Subtitle</label>
              <input
                type="text"
                value={data.config?.subtitle || ''}
                onChange={(e) => {
                  const newConfig = { ...data.config, subtitle: e.target.value }
                  setNodes((nodes: any[]) => nodes.map((n: any) => 
                    n.id === id ? { ...n, data: { ...n.data, config: newConfig } } : n
                  ))
                }}
                placeholder="Optional subtitle"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              />
            </div>
            
            {/* Typography Section */}
            <div className="border-t pt-3">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Typography</h3>
              
              {/* Font Family */}
              <div className="mb-2">
                <label className="text-xs font-medium text-gray-700 block mb-1">Font</label>
                <select
                  value={data.config?.fontFamily || 'DM Mono'}
                  onChange={(e) => {
                    const newConfig = { ...data.config, fontFamily: e.target.value }
                    setNodes((nodes: any[]) => nodes.map((n: any) => 
                      n.id === id ? { ...n, data: { ...n.data, config: newConfig } } : n
                    ))
                  }}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="DM Mono">DM Mono</option>
                  <option value="Inter">Inter</option>
                  <option value="system-ui">System</option>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>
              
              {/* Value Font Size */}
              <div className="mb-2">
                <label className="text-xs font-medium text-gray-700 block mb-1">Value Size</label>
                <input
                  type="range"
                  min="16"
                  max="72"
                  value={data.config?.valueFontSize || 36}
                  onChange={(e) => {
                    const newSize = parseInt(e.target.value)
                    const newConfig = { ...data.config, valueFontSize: newSize }
                    console.log('[NumberNode] Updating value font size:', {
                      nodeId: id,
                      oldSize: data.config?.valueFontSize,
                      newSize,
                      newConfig
                    })
                    setNodes((nodes: any[]) => nodes.map((n: any) => 
                      n.id === id ? { ...n, data: { ...n.data, config: newConfig } } : n
                    ))
                  }}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{data.config?.valueFontSize || 36}px</span>
              </div>
              
              {/* Label Font Size */}
              <div className="mb-2">
                <label className="text-xs font-medium text-gray-700 block mb-1">Label Size</label>
                <input
                  type="range"
                  min="8"
                  max="20"
                  value={data.config?.labelFontSize || 10}
                  onChange={(e) => {
                    const newConfig = { ...data.config, labelFontSize: parseInt(e.target.value) }
                    setNodes((nodes: any[]) => nodes.map((n: any) => 
                      n.id === id ? { ...n, data: { ...n.data, config: newConfig } } : n
                    ))
                  }}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{data.config?.labelFontSize || 10}px</span>
              </div>
            </div>
            
            {/* Style Section */}
            <div className="border-t pt-3">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Style</h3>
              
              {/* Value Color */}
              <div className="mb-2">
                <label className="text-xs font-medium text-gray-700 block mb-1">Value Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={data.config?.valueColor || '#111827'}
                    onChange={(e) => {
                      const newConfig = { ...data.config, valueColor: e.target.value }
                      setNodes((nodes: any[]) => nodes.map((n: any) => 
                        n.id === id ? { ...n, data: { ...n.data, config: newConfig } } : n
                      ))
                    }}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={data.config?.valueColor || '#111827'}
                    onChange={(e) => {
                      const newConfig = { ...data.config, valueColor: e.target.value }
                      setNodes((nodes: any[]) => nodes.map((n: any) => 
                        n.id === id ? { ...n, data: { ...n.data, config: newConfig } } : n
                      ))
                    }}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>
              
              {/* Label Color */}
              <div className="mb-2">
                <label className="text-xs font-medium text-gray-700 block mb-1">Label Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={data.config?.labelColor || '#6B7280'}
                    onChange={(e) => {
                      const newConfig = { ...data.config, labelColor: e.target.value }
                      setNodes((nodes: any[]) => nodes.map((n: any) => 
                        n.id === id ? { ...n, data: { ...n.data, config: newConfig } } : n
                      ))
                    }}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={data.config?.labelColor || '#6B7280'}
                    onChange={(e) => {
                      const newConfig = { ...data.config, labelColor: e.target.value }
                      setNodes((nodes: any[]) => nodes.map((n: any) => 
                        n.id === id ? { ...n, data: { ...n.data, config: newConfig } } : n
                      ))
                    }}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>
              
              {/* Background Color */}
              <div className="mb-2">
                <label className="text-xs font-medium text-gray-700 block mb-1">Background</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={data.config?.backgroundColor || '#FFFFFF'}
                    onChange={(e) => {
                      const newConfig = { ...data.config, backgroundColor: e.target.value }
                      setNodes((nodes: any[]) => nodes.map((n: any) => 
                        n.id === id ? { ...n, data: { ...n.data, config: newConfig } } : n
                      ))
                    }}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={data.config?.backgroundColor || '#FFFFFF'}
                    onChange={(e) => {
                      const newConfig = { ...data.config, backgroundColor: e.target.value }
                      setNodes((nodes: any[]) => nodes.map((n: any) => 
                        n.id === id ? { ...n, data: { ...n.data, config: newConfig } } : n
                      ))
                    }}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>
              
              {/* Border Radius */}
              <div className="mb-2">
                <label className="text-xs font-medium text-gray-700 block mb-1">Border Radius</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={data.config?.borderRadius || 8}
                  onChange={(e) => {
                    const newConfig = { ...data.config, borderRadius: parseInt(e.target.value) }
                    setNodes((nodes: any[]) => nodes.map((n: any) => 
                      n.id === id ? { ...n, data: { ...n.data, config: newConfig } } : n
                    ))
                  }}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{data.config?.borderRadius || 8}px</span>
              </div>
              
              {/* Show Border */}
              <div className="mb-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.config?.showBorder !== false}
                    onChange={(e) => {
                      const newConfig = { ...data.config, showBorder: e.target.checked }
                      setNodes((nodes: any[]) => nodes.map((n: any) => 
                        n.id === id ? { ...n, data: { ...n.data, config: newConfig } } : n
                      ))
                    }}
                    className="rounded text-gray-600"
                  />
                  <span className="text-xs">Show Border</span>
                </label>
              </div>
            </div>
            
            {/* Percentage Change - Only show if connected to date transformer */}
            {isConnectedToDateTransformer && (
              <div className="border-t pt-2">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={data.config?.showPercentChange || false}
                    onChange={(e) => {
                      const newConfig = { ...data.config, showPercentChange: e.target.checked }
                      setNodes((nodes: any[]) => nodes.map((n: any) => 
                        n.id === id ? { ...n, data: { ...n.data, config: newConfig } } : n
                      ))
                    }}
                    className="rounded"
                  />
                  <span className="text-xs font-medium text-gray-700">Show % Change</span>
                </label>
                
                {data.config?.showPercentChange && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Comparison Mode</label>
                    <select
                      value={data.config?.percentChangeMode || 'period-over-period'}
                      onChange={(e) => {
                        const newConfig = { ...data.config, percentChangeMode: e.target.value }
                        setNodes((nodes: any[]) => nodes.map((n: any) => 
                          n.id === id ? { ...n, data: { ...n.data, config: newConfig } } : n
                        ))
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    >
                      <option value="period-over-period">Period over Period (First Half vs Second Half)</option>
                      <option value="first-last">First Value vs Last Value</option>
                    </select>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {data.config?.percentChangeMode === 'first-last' 
                        ? 'Compares the first data point to the last data point'
                        : 'Splits the date range in half and compares the periods'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Metric Display */}
      <div className="flex flex-col items-center justify-center p-4" style={{ height: 'calc(100% - 40px)' }}>
        {hasData ? (
          <>
            <div 
              className="font-bold"
              style={{
                fontSize: `${data.config?.valueFontSize || 36}px`,
                fontFamily: data.config?.fontFamily || 'DM Mono',
                color: data.config?.showPercentChange 
                  ? (metricValue >= 0 ? '#10B981' : '#EF4444')
                  : (data.config?.valueColor || '#111827')
              }}
            >
              {formattedValue}
            </div>
            {data.config?.subtitle && (
              <div 
                className="mt-1"
                style={{
                  fontSize: `${(data.config?.labelFontSize || 10) + 2}px`,
                  color: data.config?.labelColor || '#6B7280',
                  fontFamily: data.config?.fontFamily || 'DM Mono'
                }}
              >
                {data.config.subtitle}
              </div>
            )}
            {data.config?.showPercentChange && (
              <div 
                className="mt-1"
                style={{
                  fontSize: '10px',
                  color: data.config?.labelColor || '#9CA3AF',
                  fontFamily: data.config?.fontFamily || 'DM Mono'
                }}
              >
                {data.config?.percentChangeMode === 'first-last' ? 'vs first value' : 'vs previous period'}
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-400 text-center">
            <Hash size={24} className="mx-auto mb-2" />
            <p className="text-xs">Connect data</p>
          </div>
        )}
      </div>
    </div>
  )
})

// Shape node component with resize, rotate, and color configuration
const ShapeNode = React.memo(function ShapeNode({ data, selected, id }: any) {
  const { setNodes } = useReactFlow()
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [dimensions, setDimensions] = useState({
    width: data.width || 100,
    height: data.height || 100
  })
  const [rotation, setRotation] = useState(data.rotation || 0)
  const [color, setColor] = useState(data.backgroundColor || '#3B82F6')

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = dimensions.width
    const startHeight = dimensions.height
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY
      
      let newWidth = Math.max(30, startWidth + deltaX)
      let newHeight = Math.max(30, startHeight + deltaY)
      
      // Preserve aspect ratio for circle and diamond if shift is held
      if ((data.shapeType === 'circle' || data.shapeType === 'diamond') && e.shiftKey) {
        const maxDelta = Math.max(deltaX, deltaY)
        newWidth = Math.max(30, startWidth + maxDelta)
        newHeight = Math.max(30, startHeight + maxDelta)
      }
      
      setDimensions({ width: newWidth, height: newHeight })
      
      // Update node data
      setNodes((nodes) => 
        nodes.map(node => 
          node.id === id 
            ? { ...node, data: { ...node.data, width: newWidth, height: newHeight } }
            : node
        )
      )
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'nwse-resize'
  }

  // Handle rotation
  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsRotating(true)
    
    const rect = e.currentTarget.parentElement?.getBoundingClientRect()
    if (!rect) return
    
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
    const startRotation = rotation
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
      const angleDiff = (currentAngle - startAngle) * (180 / Math.PI)
      const newRotation = startRotation + angleDiff
      
      setRotation(newRotation)
      
      // Update node data
      setNodes((nodes) => 
        nodes.map(node => 
          node.id === id 
            ? { ...node, data: { ...node.data, rotation: newRotation } }
            : node
        )
      )
    }
    
    const handleMouseUp = () => {
      setIsRotating(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'grab'
  }

  // Update color
  const handleColorChange = (newColor: string) => {
    setColor(newColor)
    setNodes((nodes) => 
      nodes.map(node => 
        node.id === id 
          ? { ...node, data: { ...node.data, backgroundColor: newColor } }
          : node
      )
    )
  }

  const shapeStyle = {
    width: dimensions.width,
    height: dimensions.height,
    backgroundColor: color,
    borderRadius: data.shapeType === 'circle' ? '50%' : 
                  data.shapeType === 'rounded' ? '8px' : '0px',
    transform: `rotate(${rotation + (data.shapeType === 'diamond' ? 45 : 0)}deg)`,
    transition: isRotating ? 'none' : 'transform 0.1s',
    border: selected ? '2px solid #1E40AF' : 'none',
    position: 'relative' as const
  }

  if (data.shapeType === 'arrow') {
    return (
      <div className="relative" style={{ transform: `rotate(${rotation}deg)`, transition: isRotating ? 'none' : 'transform 0.1s' }}>
        <svg width={dimensions.width} height={dimensions.height} style={{ display: 'block' }}>
          <defs>
            <marker
              id={`arrowhead-${id}`}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill={color}
              />
            </marker>
          </defs>
          <line
            x1="5"
            y1={dimensions.height / 2}
            x2={dimensions.width - 15}
            y2={dimensions.height / 2}
            stroke={color}
            strokeWidth="3"
            markerEnd={`url(#arrowhead-${id})`}
          />
        </svg>
        
        {/* Color picker button */}
        {selected && (
          <>
            <button
              className="nodrag absolute top-1 right-1 w-6 h-6 rounded border-2 border-white shadow-lg hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={(e) => {
                e.stopPropagation()
                setShowSettings(!showSettings)
              }}
              title="Change color"
            />
            
            {/* Rotation handle */}
            <div
              className="nodrag absolute -top-4 left-1/2 w-4 h-4 bg-green-500 cursor-grab hover:bg-green-600 rounded-full"
              style={{ 
                transform: 'translateX(-50%)',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              onMouseDown={handleRotateStart}
              title="Drag to rotate"
            />
            
            {/* Resize handle */}
            <div
              className="nodrag absolute -bottom-2 -right-2 w-5 h-5 bg-gray-500 cursor-nwse-resize hover:bg-gray-600 rounded-full"
              style={{ 
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              onMouseDown={handleResizeStart}
              title="Drag to resize"
            />
          </>
        )}
        
        {/* Color settings panel */}
        {showSettings && (
          <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50" style={{ width: '200px' }}>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 block">Shape Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="#3B82F6"
                />
              </div>
              <div className="grid grid-cols-6 gap-1 mt-2">
                {['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', 
                  '#6B7280', '#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA'].map(c => (
                  <button
                    key={c}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    onClick={() => handleColorChange(c)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <div
        className={`shadow-lg ${selected ? 'ring-2 ring-blue-500' : ''}`}
        style={shapeStyle}
      />
      
      {/* Controls when selected */}
      {selected && (
        <>
          {/* Color picker button */}
          <button
            className="nodrag absolute top-1 right-1 w-6 h-6 rounded border-2 border-white shadow-lg hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
            onClick={(e) => {
              e.stopPropagation()
              setShowSettings(!showSettings)
            }}
            title="Change color"
          />
          
          {/* Rotation handle */}
          <div
            className="nodrag absolute -top-4 left-1/2 w-4 h-4 bg-green-500 cursor-grab hover:bg-green-600 rounded-full"
            style={{ 
              transform: 'translateX(-50%)',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            onMouseDown={handleRotateStart}
            title="Drag to rotate"
          />
          
          {/* Resize handle */}
          <div
            className="nodrag absolute -bottom-2 -right-2 w-5 h-5 bg-gray-500 cursor-nwse-resize hover:bg-gray-600 rounded-full"
            style={{ 
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            onMouseDown={handleResizeStart}
            title="Drag to resize (hold Shift for uniform scaling)"
          />
        </>
      )}
      
      {/* Color settings panel */}
      {showSettings && (
        <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50" style={{ width: '200px' }}>
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 block">Shape Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="#3B82F6"
              />
            </div>
            <div className="grid grid-cols-6 gap-1 mt-2">
              {['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', 
                '#6B7280', '#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA'].map(c => (
                <button
                  key={c}
                  className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  onClick={() => handleColorChange(c)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

// Define node types outside component to prevent recreation
const nodeTypes: NodeTypes = {
  dataSource: DataSourceNode,
  transform: TransformNode,
  chart: ChartNode,
  table: TableNode,
  image: ImageNode,
  emoji: EmojiNode,
  text: TextNode,
  shape: ShapeNode,
  number: NumberNode
}

interface UnifiedCanvasProps {
  items: any[]
  setItems: React.Dispatch<React.SetStateAction<any[]>>
  connections: any[]
  setConnections: React.Dispatch<React.SetStateAction<any[]>>
  selectedItem: string | null
  setSelectedItem: (id: string | null) => void
  isDarkMode?: boolean
  background?: any
  showGrid?: boolean
  onDataNodesChange?: (nodes: any[]) => void
}

const UnifiedCanvasContent = React.memo(function UnifiedCanvasContent({
  items,
  setItems,
  connections,
  setConnections,
  selectedItem,
  setSelectedItem,
  isDarkMode = false,
  background,
  showGrid = true,
  onDataNodesChange
}: UnifiedCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { project, fitView } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChangeOriginal] = useEdgesState([])
  
  // Custom edge change handler to clear connected data when edges are removed
  const onEdgesChange = useCallback((changes: any) => {
    // Check for removed edges
    changes.forEach((change: any) => {
      if (change.type === 'remove') {
        const edge = edges.find(e => e.id === change.id)
        if (edge) {
          console.log('[UnifiedCanvas] Edge removed via delete key:', edge.id)
          // Clear connected data from the target node
          const targetNode = nodes.find(n => n.id === edge.target)
          if (targetNode && (targetNode.type === 'chart' || targetNode.type === 'table')) {
            setNodes(nodes => nodes.map(n => 
              n.id === edge.target 
                ? { 
                    ...n, 
                    data: { 
                      ...n.data, 
                      connectedData: [],
                      hasUpstreamData: false,
                      sourceNodeId: null
                    } 
                  }
                : n
            ))
          }
        }
      }
    })
    
    // Apply the original edge changes
    onEdgesChangeOriginal(changes)
  }, [edges, nodes, onEdgesChangeOriginal, setNodes])
  const [showDataSourcePanel, setShowDataSourcePanel] = useState(false)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [showTransformBuilder, setShowTransformBuilder] = useState(false)
  const [transformNode, setTransformNode] = useState<any>(null)
  // Removed duplicate chart config states - using local settings in each ChartNode instead
  const [selectedTool, setSelectedTool] = useState<string>('pointer')
  const [dataNodes, setDataNodes] = useState<Node[]>([]) // Track data source nodes
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [showPresetsLibrary, setShowPresetsLibrary] = useState(false)
  const [showPresetDatasets, setShowPresetDatasets] = useState(false)
  const [showDatabaseConnectors, setShowDatabaseConnectors] = useState(false)
  // Chart styles merged into local ChartNode settings
  
  // Marker tool state
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState<{x: number, y: number}[]>([])
  const [markerConfig, setMarkerConfig] = useState<any>({ type: 'marker', color: '#FF6B6B', size: 4, opacity: 0.8 })
  const [markerStrokes, setMarkerStrokes] = useState<any[]>([])
  
  // State for dragging and resizing canvas items
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizingItem, setResizingItem] = useState<string | null>(null)
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 })
  
  // Smart guides hook
  const { 
    guides, 
    onNodeDragStart, 
    onNodeDrag, 
    onNodeDragStop
  } = useSmartGuides(nodes, snapEnabled)

  // Initialize canvas from saved items - only once
  const itemsInitialized = useRef(false)
  useEffect(() => {
    // Only restore items once on initial load
    if (!itemsInitialized.current && items && items.length > 0) {
      const restoredNodes = items
        .filter(item => item.type === 'chart' || item.type === 'table' || item.type === 'image' || item.type === 'dataSource' || item.type === 'transform' || item.type === 'number' || item.type === 'emoji')
        .map(item => ({
          id: item.id,
          type: item.type,
          position: item.position || { x: item.x || 0, y: item.y || 0 },
          data: {
            ...item.data,
            width: item.width,
            height: item.height,
            label: item.name || item.data?.label,
            src: item.data?.src, // For images
            emoji: item.data?.emoji || item.emoji, // For emojis
            chartType: item.data?.chartType, // For charts
            sourceType: item.data?.sourceType, // For data sources
            connected: item.data?.connected, // For data sources
            queryInfo: item.data?.queryInfo, // For data sources
            queryResults: item.data?.queryResults, // For data sources
            parsedData: item.data?.parsedData, // For data sources
            transformType: item.data?.transformType, // For transforms
            description: item.data?.description, // For transforms
            connectedData: item.data?.connectedData || [],
            config: item.data?.config || {}, // For metrics and charts configuration
            metricField: item.data?.metricField, // For metrics
            aggregation: item.data?.aggregation, // For metrics
            format: item.data?.format, // For metrics
            currency: item.data?.currency, // For metrics
            decimals: item.data?.decimals, // For metrics
            subtitle: item.data?.subtitle // For metrics
          }
        }))
      
      if (restoredNodes.length > 0) {
        console.log('[UnifiedCanvas] Restoring nodes from saved items:', restoredNodes)
        itemsInitialized.current = true
        setNodes(current => {
          // Only add nodes that don't already exist
          const existingIds = new Set(current.map(n => n.id))
          const newNodes = restoredNodes.filter(n => !existingIds.has(n.id))
          return [...current, ...newNodes]
        })
      }
      
      // Also restore connections/edges
      if (connections && connections.length > 0) {
        console.log('[UnifiedCanvas] Restoring edges from saved connections:', connections)
        setEdges(connections)
      }
    }
  }, [items, connections]) // Run when items or connections change
  
  // Track data source nodes in a separate effect with proper dependencies
  useEffect(() => {
    const existingDataNodes = nodes.filter(n => n.type === 'dataSource')
    const hasChanged = JSON.stringify(dataNodes) !== JSON.stringify(existingDataNodes)
    
    if (hasChanged) {
      setDataNodes(existingDataNodes)
      // Call onDataNodesChange outside of setState to avoid warning
      if (onDataNodesChange) {
        // Map to proper format for UnifiedSidebar
        const formattedNodes = existingDataNodes.map(node => ({
          id: node.id,
          label: node.data?.label || 'Data Source',
          connected: node.data?.connected || false,
          type: node.data?.sourceType || 'unknown'
        }))
        // console.log('Updating dataSourceNodes:', formattedNodes)
        onDataNodesChange(formattedNodes)
      }
    }
  }, [nodes, dataNodes, onDataNodesChange])

  // Sync all nodes back to parent's canvasItems for layers panel and persistence
  useEffect(() => {
    const allNodes = nodes.filter(n => n.type === 'chart' || n.type === 'table' || n.type === 'image' || n.type === 'dataSource' || n.type === 'transform' || n.type === 'emoji' || n.type === 'number' || n.type === 'text' || n.type === 'shape')
    const nodeItems = allNodes.map(node => ({
      id: node.id,
      type: node.type,
      name: node.data?.label || (
        node.type === 'chart' ? 'Chart' : 
        node.type === 'table' ? 'Table' :
        node.type === 'image' ? (node.data?.type === 'gif' ? 'GIF' : 'Image') : 
        node.type === 'dataSource' ? 'Data Source' :
        node.type === 'transform' ? 'Transform' :
        node.type === 'emoji' ? `Emoji ${node.data?.emoji || ''}` :
        node.type === 'number' ? 'Metric' :
        node.type === 'text' ? 'Text' :
        node.type === 'shape' ? 'Shape' :
        'Item'
      ),
      position: node.position,
      x: node.position.x,
      y: node.position.y,
      width: node.data?.width || (node.type === 'dataSource' ? 200 : node.type === 'transform' ? 180 : node.type === 'emoji' ? 80 : node.type === 'number' ? 200 : 300),
      height: node.data?.height || (node.type === 'dataSource' ? 80 : node.type === 'transform' ? 60 : node.type === 'emoji' ? 80 : node.type === 'number' ? 120 : 250),
      data: node.data,
      // Ensure text properties are preserved
      ...(node.type === 'text' ? {
        text: node.data?.text,
        fontSize: node.data?.fontSize,
        fontFamily: node.data?.fontFamily,
        fontWeight: node.data?.fontWeight,
        fontStyle: node.data?.fontStyle,
        textDecoration: node.data?.textDecoration,
        textAlign: node.data?.textAlign,
        color: node.data?.color,
        backgroundColor: node.data?.backgroundColor,
        lineHeight: node.data?.lineHeight
      } : {}),
      zIndex: node.data?.zIndex || 0,
      visible: true,
      locked: false
    }))
    
    // Update parent's items for persistence
    if (setItems) {
      setItems((prevItems: any[]) => {
        // Keep non-node items (marker strokes, etc) - text and shapes are now nodes
        const nonNodeItems = prevItems.filter(item => 
          item.type !== 'chart' && item.type !== 'table' && item.type !== 'image' && 
          item.type !== 'dataSource' && item.type !== 'transform' && item.type !== 'emoji' && 
          item.type !== 'number' && item.type !== 'text' && item.type !== 'shape'
        )
        // Combine with updated node items
        return [...nonNodeItems, ...nodeItems]
      })
    }
  }, [nodes]) // Remove setItems from dependencies to avoid infinite loop

  // Sync edges back to parent's connections for persistence
  useEffect(() => {
    if (setConnections) {
      setConnections(edges)
    }
  }, [edges]) // Remove setConnections from dependencies to avoid infinite loop

  // Listen for custom events from UnifiedSidebar
  useEffect(() => {
    const handleAddDataSource = (event: CustomEvent) => {
      if (event.detail?.type) {
        addDataSource(event.detail.type, event.detail.config, event.detail.label)
      }
    }

    const handleAddTransform = () => {
      addTransform()
    }

    window.addEventListener('add-data-source', handleAddDataSource as any)
    window.addEventListener('add-transform', handleAddTransform)

    return () => {
      window.removeEventListener('add-data-source', handleAddDataSource as any)
      window.removeEventListener('add-transform', handleAddTransform)
    }
  }, [nodes])

  // Handle keyboard events for deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete if user is typing in an input field
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return
        }

        e.preventDefault()
        
        // Delete selected item (non-node canvas element)
        if (selectedItem) {
          console.log('[UnifiedCanvas] Deleting selected item:', selectedItem)
          
          // Check if it's a node first
          const isNode = nodes.find(n => n.id === selectedItem)
          if (isNode) {
            // Node deletion is handled by ReactFlow
            return
          }
          
          // Delete from items array
          setItems(prevItems => prevItems.filter(item => item.id !== selectedItem))
          setSelectedItem(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedItem, nodes, setItems, setSelectedItem])

  // Handle connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      console.log('[UnifiedCanvas] ========== CONNECTION ATTEMPT ==========')
      console.log('[UnifiedCanvas] Connection params:', params)
      
      // Custom logic to pass data through connections
      const sourceNode = nodes.find(n => n.id === params.source)
      const targetNode = nodes.find(n => n.id === params.target)
      
      console.log('[UnifiedCanvas] Source node:', sourceNode)
      console.log('[UnifiedCanvas] Target node:', targetNode)
      
      if (sourceNode && targetNode) {
        // Validate connection types
        const validConnections = [
          // Data source can connect to transform, chart, table, or number (metric)
          { source: 'dataSource', targets: ['transform', 'chart', 'table', 'number'] },
          // Transform can connect to chart, table, number (metric), or other transforms
          { source: 'transform', targets: ['chart', 'table', 'transform', 'number'] },
          // Chart can connect to table, number (metric), or other charts (for data chaining)
          { source: 'chart', targets: ['table', 'chart', 'transform', 'number'] },
          // Table can connect to chart, number (metric), or other tables (for data chaining)
          { source: 'table', targets: ['chart', 'table', 'transform', 'number'] },
        ]
        
        const isValidConnection = validConnections.some(
          rule => rule.source === sourceNode.type && rule.targets.includes(targetNode.type || '')
        )
        
        if (!isValidConnection) {
          // console.warn('Invalid connection type:', sourceNode.type, '->', targetNode.type)
          return
        }
        
        // Pass data to the target node
        if (targetNode.type === 'chart' || targetNode.type === 'table' || targetNode.type === 'number') {
          // Update chart/table/number (metric) with connected data
          let dataToPass
          
          if (sourceNode.type === 'dataSource') {
            // Pass actual query results from data source
            const actualData = sourceNode.data.queryResults || sourceNode.data.parsedData || []
            console.log('[UnifiedCanvas] DataSource connecting to chart:', {
              sourceNodeId: sourceNode.id,
              targetNodeId: targetNode.id,
              dataLength: actualData.length,
              dataSample: actualData.slice(0, 2),
              hasQueryResults: !!sourceNode.data.queryResults,
              hasParsedData: !!sourceNode.data.parsedData
            })
            dataToPass = {
              ...sourceNode.data,
              parsedData: actualData,
              queryResults: actualData,
              fromNode: sourceNode.id,
              nodeType: sourceNode.type
            }
            // Data is being connected from source to visualization
          } else if (sourceNode.type === 'transform') {
            // Pass transformed data
            dataToPass = {
              ...sourceNode.data,
              parsedData: sourceNode.data.transformedData || [],
              fromNode: sourceNode.id,
              nodeType: sourceNode.type
            }
          } else if (sourceNode.type === 'table') {
            // Pass data from table node - need to extract the actual data
            // Tables store their connected data, so we need to pass that along
            let tableData = []
            if (sourceNode.data.connectedData && sourceNode.data.connectedData[0]) {
              // Get the data from the table's connected source
              tableData = sourceNode.data.connectedData[0].parsedData || 
                         sourceNode.data.connectedData[0].queryResults || 
                         []
            }
            console.log('[UnifiedCanvas] Table to Chart connection - extracting data:', {
              sourceNodeId: sourceNode.id,
              targetNodeId: targetNode.id,
              tableDataLength: tableData.length,
              tableDataSample: tableData.slice(0, 2)
            })
            dataToPass = {
              ...sourceNode.data,
              parsedData: tableData,
              fromNode: sourceNode.id,
              nodeType: sourceNode.type
            }
          } else if (sourceNode.type === 'chart') {
            // Pass data from chart node - need to extract the actual data
            // Charts store their connected data, so we need to pass that along
            let chartData = []
            if (sourceNode.data.connectedData && sourceNode.data.connectedData[0]) {
              // Get the data from the chart's connected source
              chartData = sourceNode.data.connectedData[0].parsedData || 
                         sourceNode.data.connectedData[0].queryResults || 
                         []
            }
            dataToPass = {
              ...sourceNode.data,
              parsedData: chartData,
              fromNode: sourceNode.id,
              nodeType: sourceNode.type
            }
          } else {
            // Pass data from other nodes
            dataToPass = {
              ...sourceNode.data,
              fromNode: sourceNode.id,
              nodeType: sourceNode.type
            }
          }
          
          const updatedTargetNode = {
            ...targetNode,
            data: {
              ...targetNode.data,
              connectedData: [dataToPass], // Replace instead of append for cleaner data flow
              sourceNodeId: sourceNode.id,
              hasUpstreamData: true
            }
          }
          console.log('[UnifiedCanvas] Updating target node with data:', {
            targetNodeId: targetNode.id,
            targetNodeType: targetNode.type,
            dataToPassLength: dataToPass.parsedData?.length || dataToPass.queryResults?.length || 0,
            hasData: !!(dataToPass.parsedData?.length || dataToPass.queryResults?.length),
            dataKeys: dataToPass.parsedData?.[0] ? Object.keys(dataToPass.parsedData[0]) : 
                      dataToPass.queryResults?.[0] ? Object.keys(dataToPass.queryResults[0]) : []
          })
          setNodes(nodes => nodes.map(n => n.id === targetNode.id ? updatedTargetNode : n))
        } else if (targetNode.type === 'transform') {
          // Pass data through transform - using same structure as other nodes
          let dataToPass
          
          if (sourceNode.type === 'dataSource') {
            const actualData = sourceNode.data.queryResults || sourceNode.data.parsedData || []
            console.log('[UnifiedCanvas] DataSource connecting to transform:', {
              sourceNodeId: sourceNode.id,
              targetNodeId: targetNode.id,
              dataLength: actualData.length,
              dataSample: actualData.slice(0, 2)
            })
            dataToPass = {
              ...sourceNode.data,
              parsedData: actualData,
              queryResults: actualData,
              fromNode: sourceNode.id,
              nodeType: sourceNode.type
            }
          } else if (sourceNode.type === 'transform') {
            // Pass transformed data from another transform
            dataToPass = {
              ...sourceNode.data,
              parsedData: sourceNode.data.transformedData || [],
              fromNode: sourceNode.id,
              nodeType: sourceNode.type
            }
          } else if (sourceNode.type === 'table' || sourceNode.type === 'chart') {
            // Pass data from table/chart node
            let nodeData = []
            if (sourceNode.data.connectedData && sourceNode.data.connectedData[0]) {
              nodeData = sourceNode.data.connectedData[0].parsedData || 
                        sourceNode.data.connectedData[0].queryResults || []
            }
            dataToPass = {
              ...sourceNode.data,
              parsedData: nodeData,
              fromNode: sourceNode.id,
              nodeType: sourceNode.type
            }
          } else {
            dataToPass = {
              ...sourceNode.data,
              fromNode: sourceNode.id,
              nodeType: sourceNode.type
            }
          }
            
          const updatedTargetNode = {
            ...targetNode,
            data: {
              ...targetNode.data,
              connectedData: [dataToPass], // Use connectedData like other nodes
              sourceNodeId: sourceNode.id,
              hasUpstreamData: true
            }
          }
          console.log('[UnifiedCanvas] Updating transform node with data:', {
            targetNodeId: targetNode.id,
            dataLength: dataToPass.parsedData?.length || 0,
            hasData: !!(dataToPass.parsedData?.length),
            dataKeys: dataToPass.parsedData?.[0] ? Object.keys(dataToPass.parsedData[0]) : []
          })
          setNodes(nodes => nodes.map(n => n.id === targetNode.id ? updatedTargetNode : n))
        }
      }

      setEdges((eds) => addEdge({
        ...params,
        animated: true,
        style: { stroke: '#60A5FA', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#60A5FA'
        }
      }, eds))
    },
    [nodes, setNodes, setEdges]
  )


  // Add data source
  const addDataSource = (type: string, config?: any, label?: string) => {
    const labels: Record<string, string> = {
      googlesheets: 'Google Sheets',
      database: 'Database',
      shopify: 'Shopify Store',
      stripe: 'Stripe Payments',
      googleads: 'Google Ads',
      csv: 'CSV File',
      preset: 'Preset Data',
      bigquery: 'BigQuery',
      azure: 'Azure SQL',
      redshift: 'Amazon Redshift',
      snowflake: 'Snowflake',
      supabase: 'Supabase',
      firebase: 'Firebase'
    }
    
    // Handle preset data differently - open the datasets modal
    if (type.toLowerCase() === 'preset') {
      setShowPresetDatasets(true)
      return
    }
    
    const newNode: Node = {
      id: `data-${Date.now()}`,
      type: 'dataSource',
      position: { x: 50, y: 200 + nodes.filter(n => n.type === 'dataSource').length * 100 },
      data: {
        label: label || labels[type.toLowerCase()] || `${type} Data`,
        sourceType: type.toLowerCase(),
        connected: !!config,
        queryInfo: config || {}
      }
    }
    setNodes(nodes => [...nodes, newNode])
    const updatedDataNodes = [...dataNodes, newNode]
    setDataNodes(updatedDataNodes)
    // Notify parent of data nodes change outside of setState
    if (onDataNodesChange) {
      const formattedNodes = updatedDataNodes.map(node => ({
        id: node.id,
        label: node.data?.label || 'Data Source',
        connected: node.data?.connected || false,
        type: node.data?.sourceType || 'unknown'
      }))
      onDataNodesChange(formattedNodes)
    }
    setSelectedNode(newNode)
    setShowDataSourcePanel(true)
  }

  // Add transform node
  const addTransform = () => {
    const newNode: Node = {
      id: `transform-${Date.now()}`,
      type: 'transform',
      position: { x: 300, y: 300 },
      data: {
        label: 'Transform',
        transformType: 'filter',
        description: 'Filter & transform data'
      }
    }
    setNodes(nodes => [...nodes, newNode])
    setTransformNode(newNode)
    setShowTransformBuilder(true)
  }

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedItem(node.id)
    setSelectedNode(node)
    
    // Update nodes to mark the selected one
    setNodes(nodes => nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        selected: n.id === node.id
      }
    })))
    
    if (node.type === 'dataSource') {
      setShowDataSourcePanel(true)
      // Chart config handled locally in ChartNode
      setShowTransformBuilder(false)
    } else if (node.type === 'transform') {
      setTransformNode(node)
      setShowTransformBuilder(true)
      setShowDataSourcePanel(false)
      // Chart config handled locally in ChartNode
    } else if (node.type === 'chart') {
      // Trigger ChartDesignPanel through custom event
      console.log('[UnifiedCanvas] Selected chart node:', node.id, node.type)
      const event = new CustomEvent('open-chart-design', { 
        detail: { 
          node,
          nodeType: 'chart'
        } 
      })
      window.dispatchEvent(event)
      setShowDataSourcePanel(false)
      setShowTransformBuilder(false)
    } else if (node.type === 'table') {
      console.log('[UnifiedCanvas] Selected table node:', node.id, node.type)
    }
  }, [setSelectedItem, setNodes])

  // Handle node drag with smart guides
  const handleNodeDrag = useCallback((event: any, node: Node) => {
    if (!node || !node.id) return
    onNodeDragStart(node.id)
    const snappedPosition = onNodeDrag(node.id, node.position)
    // Update node position with snapped values
    setNodes(nodes => nodes.map(n => 
      n.id === node.id ? { ...n, position: snappedPosition } : n
    ))
  }, [onNodeDragStart, onNodeDrag, setNodes])
  
  const handleNodeDragStop = useCallback((event: any, node: Node) => {
    if (!node) return
    onNodeDragStop()
  }, [onNodeDragStop])
  
  
  // Handle dropping elements
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      if (!type) return

      const position = project({
        x: event.clientX,
        y: event.clientY
      })

      // Add elements directly to canvas
      if (type === 'chart' || type === 'table') {
        const newNode: Node = {
          id: `${type}-${Date.now()}`,
          type: type as 'chart' | 'table',
          position,
          data: {
            label: type === 'chart' ? 'New Chart' : 'New Table',
            chartType: type === 'chart' ? 'bar' : undefined,
            connectedData: [],
            width: type === 'chart' ? 320 : 400,
            height: type === 'chart' ? 280 : 250
          }
        }
        console.log('[UnifiedCanvas] Creating new chart/table node:', newNode)
        setNodes(nodes => [...nodes, newNode])
      }
    },
    [project, setNodes]
  )

  // Generate background style
  const getBackgroundStyle = (): React.CSSProperties => {
    if (!background) return {}
    
    if (background.type === 'color') {
      return { backgroundColor: background.value }
    } else if (background.type === 'gradient') {
      return { background: background.value }
    } else if (background.type === 'image') {
      const displayMode = background.displayMode || 'cover'
      const baseStyle = {
        backgroundImage: `url(${background.value})`,
        backgroundPosition: 'center'
      }
      
      if (displayMode === 'tile') {
        return {
          ...baseStyle,
          backgroundSize: `${background.tileSize || 100}px ${background.tileSize || 100}px`,
          backgroundRepeat: 'repeat'
        }
      } else if (displayMode === 'contain') {
        return {
          ...baseStyle,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat'
        }
      } else {
        // Default to 'cover'
        return {
          ...baseStyle,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat'
        }
      }
    }
    
    return {}
  }
  
  // Mouse event handlers for marker drawing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (selectedTool === 'marker' && e.button === 0) {
      setIsDrawing(true)
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setCurrentStroke([{ x, y }])
    }
  }, [selectedTool])
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDrawing && selectedTool === 'marker') {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setCurrentStroke(prev => [...prev, { x, y }])
    }
  }, [isDrawing, selectedTool])
  
  const handleMouseUp = useCallback(() => {
    if (isDrawing && selectedTool === 'marker' && currentStroke.length > 1) {
      // Convert stroke points to SVG path
      const pathData = `M ${currentStroke[0].x} ${currentStroke[0].y} ` +
        currentStroke.slice(1).map(point => `L ${point.x} ${point.y}`).join(' ')
      
      // Create a marker element with the stroke path
      const newMarkerStroke = {
        id: `marker-${Date.now()}`,
        type: 'marker',
        path: pathData,
        points: currentStroke,
        color: markerConfig.color,
        size: markerConfig.size,
        opacity: markerConfig.opacity,
        position: { x: 0, y: 0 },
        width: Math.max(...currentStroke.map(p => p.x)) - Math.min(...currentStroke.map(p => p.x)),
        height: Math.max(...currentStroke.map(p => p.y)) - Math.min(...currentStroke.map(p => p.y))
      }
      
      setMarkerStrokes(prev => [...prev, newMarkerStroke])
      setItems(prev => [...prev, newMarkerStroke])
      setCurrentStroke([])
    }
    
    setIsDrawing(false)
  }, [isDrawing, selectedTool, currentStroke, markerConfig, items, setItems])
  
  return (
    <div className="h-full w-full relative" style={getBackgroundStyle()}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={(e) => {
        // Deselect all nodes when clicking on background
        if (e.target === e.currentTarget && selectedTool === 'pointer') {
          setNodes(nodes => nodes.map(n => ({
            ...n,
            data: {
              ...n.data,
              selected: false
            }
          })))
          setSelectedNode(null)
          setSelectedItem(null)
        }
      }}
    >
      {/* ReactFlow Layer - For data nodes */}
      <div ref={reactFlowWrapper} className="absolute inset-0 z-[1]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDrag={handleNodeDrag}
          onNodeDragStop={handleNodeDragStop}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNodesDelete={(nodesToDelete) => {
            console.log('[UnifiedCanvas] Deleting nodes:', nodesToDelete.map(n => n.id))
            setNodes(nodes => nodes.filter(n => !nodesToDelete.find(nd => nd.id === n.id)))
          }}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          style={{ background: 'transparent' }}
          deleteKeyCode={["Delete", "Backspace"]}
          multiSelectionKeyCode="Shift"
          selectionOnDrag={true}
          selectNodesOnDrag={false}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          onEdgeClick={(event, edge) => {
            console.log('[UnifiedCanvas] Edge clicked, deleting:', edge.id)
            
            // Clear connected data from the target node when edge is removed
            const targetNode = nodes.find(n => n.id === edge.target)
            if (targetNode && (targetNode.type === 'chart' || targetNode.type === 'table')) {
              setNodes(nodes => nodes.map(n => 
                n.id === edge.target 
                  ? { 
                      ...n, 
                      data: { 
                        ...n.data, 
                        connectedData: [],
                        hasUpstreamData: false,
                        sourceNodeId: null
                      } 
                    }
                  : n
              ))
            }
            
            setEdges(edges => edges.filter(e => e.id !== edge.id))
          }}
        >
          <Background 
            variant={showGrid ? "dots" as any : undefined}
            gap={16}
            size={1}
            color={isDarkMode ? '#374151' : '#E5E7EB'}
            style={{ opacity: background?.type === 'image' ? 0.8 : 1 }}
          />
          <Controls className={isDarkMode ? 'bg-gray-800 text-white' : ''} />
          <MiniMap 
            nodeColor={n => {
              if (n.type === 'dataSource') return '#10B981'
              if (n.type === 'transform') return '#8B5CF6'
              if (n.type === 'chart') return '#EC4899'
              if (n.type === 'table') return '#6366F1'
              return '#6B7280'
            }}
            className={isDarkMode ? 'bg-gray-800' : ''}
          />
        </ReactFlow>
      </div>
      
      {/* Marker strokes layer */}
      <div className="absolute inset-0 pointer-events-none z-[5]">
        {markerStrokes.map(stroke => (
          <svg 
            key={stroke.id}
            className="absolute pointer-events-none"
            style={{ left: 0, top: 0, width: '100%', height: '100%' }}
          >
            <path
              d={stroke.path}
              stroke={stroke.color}
              strokeWidth={stroke.size}
              fill="none"
              opacity={stroke.opacity}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ))}
        
        {/* Current stroke being drawn */}
        {isDrawing && currentStroke.length > 1 && (
          <svg 
            className="absolute pointer-events-none"
            style={{ left: 0, top: 0, width: '100%', height: '100%' }}
          >
            <path
              d={`M ${currentStroke[0].x} ${currentStroke[0].y} ` +
                currentStroke.slice(1).map(point => `L ${point.x} ${point.y}`).join(' ')}
              stroke={markerConfig.color}
              strokeWidth={markerConfig.size}
              fill="none"
              opacity={markerConfig.opacity}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      
      {/* Canvas Items Layer - Design Elements - Only for text, emoji, shapes */}
      <div 
        className="absolute inset-0 pointer-events-none z-[10] overflow-hidden"
        onClick={(e) => {
          // Deselect if clicking on empty space
          if (e.target === e.currentTarget) {
            setSelectedItem && setSelectedItem(null)
          }
        }}
        onMouseMove={(e) => {
          if (draggedItem) {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left - dragOffset.x
            const y = e.clientY - rect.top - dragOffset.y
            
            setItems(items.map(item => 
              item.id === draggedItem 
                ? { ...item, position: { x, y }, x, y }
                : item
            ))
          } else if (resizingItem) {
            const rect = e.currentTarget.getBoundingClientRect()
            const deltaX = e.clientX - resizeStart.x
            const deltaY = e.clientY - resizeStart.y
            const newWidth = Math.max(50, resizeStart.width + deltaX)
            const newHeight = Math.max(50, resizeStart.height + deltaY)
            
            setItems(items.map(item => 
              item.id === resizingItem 
                ? { ...item, width: newWidth, height: newHeight }
                : item
            ))
          }
        }}
        onMouseUp={() => {
          setDraggedItem(null)
          setResizingItem(null)
        }}
        onMouseLeave={() => {
          setDraggedItem(null)
          setResizingItem(null)
        }}
        style={{ pointerEvents: draggedItem || resizingItem ? 'auto' : 'none' }}
      >
        {items && items.map((item) => {
          // Skip images/gifs as they are now ReactFlow nodes
          if (item.type === 'gif' || item.type === 'image' || item.type === 'chart' || item.type === 'table') {
            return null
          }
          
          const isSelected = selectedItem === item.id
          const style: React.CSSProperties = {
            position: 'absolute',
            left: item.position?.x || item.x || 0,
            top: item.position?.y || item.y || 0,
            width: item.width || 'auto',
            height: item.height || 'auto',
            zIndex: item.zIndex || 0,
            pointerEvents: 'auto',
            cursor: draggedItem === item.id ? 'grabbing' : 'grab',
            border: isSelected ? '2px solid #3B82F6' : 'none',
            boxSizing: 'border-box',
            ...(item.style || {})
          }
          
          // Render different types of canvas items (text, emoji, shapes only)
          if (false) { // Remove old image rendering
            return (
              <div
                key={item.id}
                style={style}
                className="canvas-item group"
                onClick={() => setSelectedItem && setSelectedItem(item.id)}
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'IMG') {
                    e.preventDefault()
                    const rect = e.currentTarget.getBoundingClientRect()
                    setDragOffset({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top
                    })
                    setDraggedItem(item.id)
                    setSelectedItem && setSelectedItem(item.id)
                  }
                }}
              >
                <img
                  src={item.src}
                  alt={item.type}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                  draggable={false}
                  onError={(e) => {
                    console.error('[UnifiedCanvas] Failed to load image/gif:', item.src)
                  }}
                />
                {/* Resize handle */}
                {isSelected && (
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 bg-gray-500 cursor-nwse-resize"
                    style={{ 
                      transform: 'translate(50%, 50%)',
                      borderRadius: '50%',
                      border: '2px solid white'
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      setResizingItem(item.id)
                      setResizeStart({
                        width: item.width || 200,
                        height: item.height || 200,
                        x: e.clientX,
                        y: e.clientY
                      })
                    }}
                  />
                )}
              </div>
            )
          } else if (item.type === 'text') {
            const isSelected = selectedItem === item.id
            return (
              <div
                key={item.id}
                style={{
                  ...style,
                  width: item.width || 'auto',
                  height: item.height || 'auto',
                  padding: '8px',
                  fontSize: item.fontSize || 16,
                  fontFamily: item.fontFamily || 'Inter',
                  color: item.color || '#1F2937',
                  fontWeight: item.fontWeight || 'normal',
                  fontStyle: item.fontStyle || 'normal',
                  textDecoration: item.textDecoration || 'none',
                  textAlign: item.textAlign || 'left',
                  overflow: 'hidden',
                  resize: 'none',
                  border: isSelected ? '2px solid #3B82F6' : 'none',
                  borderRadius: '4px'
                }}
                className="canvas-item"
                onClick={() => setSelectedItem && setSelectedItem(item.id)}
              >
                {item.text || 'Text'}
                {/* Resize handle */}
                {isSelected && (
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 bg-gray-500 cursor-nwse-resize"
                    style={{ 
                      transform: 'translate(50%, 50%)',
                      borderRadius: '50%',
                      border: '2px solid white',
                      zIndex: 1000
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      setResizingItem(item.id)
                      setResizeStart({
                        width: typeof item.width === 'number' ? item.width : 150,
                        height: typeof item.height === 'number' ? item.height : 40,
                        x: e.clientX,
                        y: e.clientY
                      })
                    }}
                  />
                )}
              </div>
            )
          } else if (item.type === 'shape') {
            const isSelected = selectedItem === item.id
            const shapeStyle = {
              ...style,
              width: item.width || 100,
              height: item.height || 100,
              backgroundColor: item.backgroundColor || '#3B82F6',
              borderRadius: item.shapeType === 'circle' ? '50%' : 
                          item.shapeType === 'rounded' ? '8px' : '0',
              border: isSelected 
                ? '2px solid #2563EB' 
                : item.borderWidth 
                  ? `${item.borderWidth}px solid ${item.borderColor || '#000'}` 
                  : 'none'
            }
            return (
              <div
                key={item.id}
                style={shapeStyle}
                className="canvas-item"
                onClick={() => setSelectedItem && setSelectedItem(item.id)}
              >
                {/* Resize handle */}
                {isSelected && (
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 bg-gray-500 cursor-nwse-resize"
                    style={{ 
                      transform: 'translate(50%, 50%)',
                      borderRadius: '50%',
                      border: '2px solid white',
                      zIndex: 1000
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      setResizingItem(item.id)
                      setResizeStart({
                        width: item.width || 100,
                        height: item.height || 100,
                        x: e.clientX,
                        y: e.clientY
                      })
                    }}
                  />
                )}
              </div>
            )
          }
          
          return null
        })}
      </div>
      
      {/* Smart Guides */}
      <svg className="absolute inset-0 pointer-events-none z-50">
        {guides.map((guide, index) => (
          <line
            key={index}
            x1={guide.type === 'vertical' ? guide.position : 0}
            y1={guide.type === 'horizontal' ? guide.position : 0}
            x2={guide.type === 'vertical' ? guide.position : '100%'}
            y2={guide.type === 'horizontal' ? guide.position : '100%'}
            stroke="#3B82F6"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.5"
          />
        ))}
      </svg>
      
      {/* Bottom Design Toolbar */}
      <CanvasToolbar
          onAddElement={(type, config) => {
            // Handle adding elements as nodes or canvas items
            if (type.includes('Chart')) {
              // Add chart as a node that can receive data connections
              const newNode: Node = {
                id: `chart-${Date.now()}`,
                type: 'chart',
                position: { 
                  x: window.innerWidth / 2 - 200, 
                  y: window.innerHeight / 2 - 150 
                },
                data: {
                  label: type.replace('Chart', '') + ' Chart',
                  chartType: type.replace('Chart', '').toLowerCase(),
                  connectedData: [],
                  width: 320,
                  height: 280
                }
              }
              setNodes(nodes => [...nodes, newNode])
            } else if (type === 'number') {
              // Add number/metric display as a node that can receive data
              const newNode: Node = {
                id: `number-${Date.now()}`,
                type: 'number',
                position: { 
                  x: window.innerWidth / 2 - 100, 
                  y: window.innerHeight / 2 - 60 
                },
                data: {
                  label: 'Metric',
                  connectedData: [],
                  width: 200,
                  height: 120,
                  config: {
                    format: 'number',
                    decimals: 0,
                    aggregation: 'sum'
                  }
                }
              }
              setNodes(nodes => [...nodes, newNode])
            } else if (type === 'table') {
              // Add table as a node that can receive data connections
              const newNode: Node = {
                id: `table-${Date.now()}`,
                type: 'table',
                position: { 
                  x: window.innerWidth / 2 - 200, 
                  y: window.innerHeight / 2 - 125 
                },
                data: {
                  label: 'Data Table',
                  connectedData: [],
                  width: 400,
                  height: 250
                }
              }
              setNodes(nodes => [...nodes, newNode])
            } else if (type === 'image' || type === 'gif') {
              // Add images/GIFs as nodes so they can move around like charts
              const newNode: Node = {
                id: `image-${Date.now()}`,
                type: 'image',
                position: { 
                  x: window.innerWidth / 2 - 150, 
                  y: window.innerHeight / 2 - 150 
                },
                data: {
                  src: config.src,
                  type: type,
                  width: type === 'gif' ? 200 : 300,
                  height: type === 'gif' ? 200 : 300
                }
              }
              console.log('[UnifiedCanvas] Adding image/gif node:', newNode)
              setNodes(nodes => [...nodes, newNode])
            } else if (type === 'emoji') {
              // Add emoji as a node so it can be moved and resized
              const newNode: Node = {
                id: `emoji-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'emoji',
                position: { 
                  x: window.innerWidth / 2 - 40, 
                  y: window.innerHeight / 2 - 40 
                },
                data: {
                  emoji: config.emoji || '😊',
                  width: 80,
                  height: 80
                }
              }
              console.log('[UnifiedCanvas] Adding emoji node:', newNode)
              setNodes(nodes => [...nodes, newNode])
            } else if (type === 'text') {
              // Add text as a React Flow node
              const newNode: Node = {
                id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'text',
                position: { 
                  x: window.innerWidth / 2 - 75, 
                  y: window.innerHeight / 2 - 20 
                },
                data: {
                  text: config.text || 'Click to edit text',
                  width: config.width || 150,
                  height: config.height || 40,
                  fontSize: config.fontSize || 16,
                  fontFamily: config.fontFamily || 'Inter',
                  color: config.color || '#1F2937',
                  fontWeight: config.fontWeight || 'normal',
                  fontStyle: config.fontStyle || 'normal',
                  textDecoration: config.textDecoration || 'none',
                  textAlign: config.textAlign || 'left'
                }
              }
              console.log('[UnifiedCanvas] Adding text node:', newNode)
              setNodes(nodes => [...nodes, newNode])
            } else if (type === 'shape') {
              // Add shape as a React Flow node
              const newNode: Node = {
                id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'shape',
                position: { 
                  x: window.innerWidth / 2 - 50, 
                  y: window.innerHeight / 2 - 50 
                },
                data: {
                  shapeType: config.shapeType || 'rectangle',
                  width: config.width || 100,
                  height: config.height || 100,
                  backgroundColor: config.backgroundColor || '#3B82F6'
                }
              }
              console.log('[UnifiedCanvas] Adding shape node:', newNode)
              setNodes(nodes => [...nodes, newNode])
            } else if (type === 'marker') {
              // Update marker configuration
              setMarkerConfig(config)
              setSelectedTool('marker')
            }
          }}
          mode="design"
          selectedItem={selectedItem}
          onToolChange={setSelectedTool}
          selectedTool={selectedTool}
          isDarkMode={isDarkMode}
      />

      {/* Side Panels */}
      {showDataSourcePanel && selectedNode && (
        <div className="absolute top-20 right-4 z-50 w-96 bg-white rounded-lg shadow-xl">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-dm-mono font-medium text-sm uppercase tracking-wider">CONFIGURE DATA SOURCE</h3>
            <button
              onClick={() => setShowDataSourcePanel(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ×
            </button>
          </div>
          
          {/* Show database connector button for database-type sources */}
          {(selectedNode.data?.sourceType === 'database' || 
            selectedNode.data?.sourceType === 'bigquery' ||
            selectedNode.data?.sourceType === 'azure' ||
            selectedNode.data?.sourceType === 'supabase' ||
            selectedNode.data?.sourceType === 'snowflake' ||
            selectedNode.data?.sourceType === 'redshift' ||
            selectedNode.data?.sourceType === 'firebase') ? (
            <div className="p-4">
              <button
                onClick={() => setShowDatabaseConnectors(true)}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <Database size={18} />
                Configure Database Connection
              </button>
              {selectedNode.data?.connected && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check size={16} />
                    <span className="text-sm font-medium">Connected to {selectedNode.data?.sourceType}</span>
                  </div>
                  {selectedNode.data?.description && (
                    <p className="text-xs text-green-600 mt-1">{selectedNode.data.description}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <DataSourceConnector
            sourceType={selectedNode.data?.sourceType || 'googlesheets'}
            nodeId={selectedNode.id}
            nodeLabel={selectedNode.data?.label || 'Data Source'}
            currentConfig={selectedNode.data?.queryInfo}
            onLabelChange={(newLabel) => {
              // Update the node label in real-time
              setNodes(nodes => nodes.map(n => 
                n.id === selectedNode.id 
                  ? { ...n, data: { ...n.data, label: newLabel } }
                  : n
              ))
            }}
            onConnect={(queryConfig) => {
              // Update the node with query configuration and data
              const updatedNode = {
                ...selectedNode,
                data: {
                  ...selectedNode.data,
                  queryInfo: queryConfig,
                  connected: true,
                  label: queryConfig.resource || queryConfig.tableName || selectedNode.data.label,
                  // Include actual data from the query
                  queryResults: queryConfig.parsedData || queryConfig.data || [],
                  parsedData: queryConfig.parsedData || []
                }
              }
              
              setNodes(nodes => nodes.map(n => 
                n.id === selectedNode.id ? updatedNode : n
              ))
              
              // Update data nodes tracking
              const updatedDataNodes = dataNodes.map(n => 
                n.id === selectedNode.id ? updatedNode : n
              )
              setDataNodes(updatedDataNodes)
              // Notify parent of data nodes change outside of setState
              if (onDataNodesChange) {
                const formattedNodes = updatedDataNodes.map(node => ({
                  id: node.id,
                  label: node.data?.label || 'Data Source',
                  connected: node.data?.connected || false,
                  type: node.data?.sourceType || 'unknown'
                }))
                onDataNodesChange(formattedNodes)
              }
              
              // Emit event to save connection to Supabase
              window.dispatchEvent(new CustomEvent('data-source-connected', {
                detail: {
                  sourceType: updatedNode.data.sourceType,
                  label: updatedNode.data.label,
                  config: queryConfig
                }
              }))
              
              // Update any connected visualization nodes with the new data
              console.log('[UnifiedCanvas] Updating connected nodes with data:', {
                sourceNodeId: selectedNode.id,
                dataLength: updatedNode.data.queryResults?.length || 0,
                parsedDataLength: updatedNode.data.parsedData?.length || 0,
                connectedEdges: edges.filter(e => e.source === selectedNode.id).map(e => e.target)
              })
              
              edges.forEach(edge => {
                if (edge.source === selectedNode.id) {
                  const targetNode = nodes.find(n => n.id === edge.target)
                  console.log('[UnifiedCanvas] Updating target node:', {
                    targetId: edge.target,
                    targetType: targetNode?.type,
                    dataToPass: updatedNode.data.queryResults?.length || updatedNode.data.parsedData?.length || 0
                  })
                  
                  setNodes(nodes => nodes.map(n => {
                    if (n.id === edge.target) {
                      return {
                        ...n,
                        data: {
                          ...n.data,
                          connectedData: [{
                            ...updatedNode.data,
                            fromNode: selectedNode.id
                          }]
                        }
                      }
                    }
                    return n
                  }))
                }
              })
              
              setShowDataSourcePanel(false)
            }}
            onClose={() => setShowDataSourcePanel(false)}
            layout="inline"
          />
          )}
        </div>
      )}
      
      {showTransformBuilder && transformNode && (
        <div className="absolute top-20 right-4 z-50 w-96 bg-white rounded-lg shadow-xl">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-dm-mono font-medium text-sm uppercase tracking-wider">CONFIGURE TRANSFORM</h3>
            <button
              onClick={() => setShowTransformBuilder(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ×
            </button>
          </div>
          <TransformBuilder
            nodeId={transformNode.id}
            nodeLabel={transformNode.data?.label || 'Transform'}
            inputData={(() => {
              // Get actual input data from connected nodes
              if (transformNode.data?.connectedData && transformNode.data.connectedData.length > 0) {
                const sourceData = transformNode.data.connectedData[0].parsedData || 
                                  transformNode.data.connectedData[0].queryResults || 
                                  transformNode.data.connectedData[0].transformedData || []
                return sourceData
              }
              return []
            })()}
            currentConfig={transformNode.data}
            onApply={(transformConfig, transformedData) => {
              console.log('[UnifiedCanvas] TransformBuilder onApply:', {
                nodeId: transformNode.id,
                transformedDataLength: transformedData?.length || 0,
                config: transformConfig
              })
              
              // Update the transform node with configuration
              setNodes(currentNodes => {
                const updatedNodes = currentNodes.map(n => 
                  n.id === transformNode.id 
                    ? {
                        ...n,
                        data: {
                          ...n.data,
                          ...transformConfig,
                          transformedData,
                          label: transformConfig.label || 'Transform'
                        }
                      }
                    : n
                )
                
                // Now propagate the transformed data to connected nodes
                const transformNodeEdges = edges.filter(e => e.source === transformNode.id)
                console.log('[UnifiedCanvas] Found edges from transform node:', transformNodeEdges)
                
                transformNodeEdges.forEach(edge => {
                  const targetNodeIndex = updatedNodes.findIndex(n => n.id === edge.target)
                  if (targetNodeIndex !== -1) {
                    const targetNode = updatedNodes[targetNodeIndex]
                    console.log('[UnifiedCanvas] Propagating transformed data to:', targetNode.id, targetNode.type)
                    
                    // Update the target node with the transformed data
                    updatedNodes[targetNodeIndex] = {
                      ...targetNode,
                      data: {
                        ...targetNode.data,
                        connectedData: [{
                          ...transformConfig,
                          parsedData: transformedData,
                          queryResults: transformedData,
                          transformedData: transformedData,
                          fromNode: transformNode.id,
                          nodeType: 'transform'
                        }],
                        sourceNodeId: transformNode.id,
                        hasUpstreamData: true
                      }
                    }
                  }
                })
                
                return updatedNodes
              })
              
              setShowTransformBuilder(false)
            }}
            onClose={() => setShowTransformBuilder(false)}
            isDarkMode={isDarkMode}
            layout="inline"
          />
        </div>
      )}

      {/* Chart Configuration Panel - Rendered outside ReactFlow for proper interaction */}
      {/* Chart config removed - using local settings in ChartNode */}
      {/* Presets Library Modal */}
      <PresetsLibrary
        isOpen={showPresetsLibrary}
        onClose={() => setShowPresetsLibrary(false)}
        onInsertItems={(items) => {
          // Add preset data items to the canvas
          items.forEach((item, index) => {
            if (item.type === 'dataSource' || item.type === 'data') {
              // Create a data source node with preset data
              const newNode: Node = {
                id: `preset-data-${Date.now()}-${index}`,
                type: 'dataSource',
                position: { 
                  x: 50 + (index % 3) * 250, 
                  y: 200 + Math.floor(index / 3) * 150 
                },
                data: {
                  label: item.title || 'Preset Data',
                  sourceType: 'preset',
                  connected: true,
                  queryResults: item.data || [],
                  parsedData: item.data || []
                }
              }
              setNodes(nodes => [...nodes, newNode])
            } else if (item.type === 'chart') {
              // Create a chart node with preset configuration
              const newNode: Node = {
                id: `preset-chart-${Date.now()}-${index}`,
                type: 'chart',
                position: { 
                  x: 400 + (index % 3) * 350, 
                  y: 200 + Math.floor(index / 3) * 250 
                },
                data: {
                  label: item.title || 'Chart',
                  chartType: item.data?.type || 'bar',
                  config: item.data?.config || {},
                  connectedData: item.data?.data ? [{
                    parsedData: item.data.data,
                    queryResults: item.data.data
                  }] : []
                }
              }
              setNodes(nodes => [...nodes, newNode])
            }
          })
        }}
      />
      
      {/* Preset Datasets Modal */}
      <PremadeDatasetsModal
        isOpen={showPresetDatasets}
        onClose={() => setShowPresetDatasets(false)}
        onImport={({ name, schema, data, rowCount }) => {
          // Create a data source node with the imported dataset
          const newNode: Node = {
            id: `preset-${Date.now()}`,
            type: 'dataSource',
            position: { x: 100, y: 100 },
            data: {
              label: name,
              sourceType: 'preset',
              connected: true,
              parsedData: data,
              queryResults: data,
              description: `${rowCount} rows imported from preset dataset`
            }
          }
          setNodes(nodes => [...nodes, newNode])
          setShowPresetDatasets(false)
        }}
        isDarkMode={false}
      />
      
      {/* Database Connectors Modal */}
      <DatabaseConnectors
        isOpen={showDatabaseConnectors}
        onClose={() => setShowDatabaseConnectors(false)}
        onConnect={(dbType, config) => {
          // Update the selected node with database connection
          if (selectedNode) {
            setNodes(nodes => nodes.map(n => 
              n.id === selectedNode.id 
                ? { 
                    ...n, 
                    data: { 
                      ...n.data, 
                      sourceType: dbType,
                      connected: true,
                      config: config,
                      description: `Connected to ${dbType}`
                    } 
                  }
                : n
            ))
            setShowDatabaseConnectors(false)
            setShowDataSourcePanel(false)
          }
        }}
        isDarkMode={false}
      />
      
      {/* Chart Styles removed - merged into local ChartNode settings */}
      
    </div>
  )
})

function UnifiedCanvas(props: UnifiedCanvasProps) {
  return (
    <ReactFlowProvider>
      <UnifiedCanvasContent {...props} />
    </ReactFlowProvider>
  )
}

export default React.memo(UnifiedCanvas)