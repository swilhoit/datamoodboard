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
  AlertCircle, CheckCircle2, Loader2, Move, Square,
  Type, Image, Shapes, Sparkles, Copy, Trash2, Lock, Unlock,
  Eye, EyeOff, Layers, ChevronRight, ChevronDown, Grid3X3,
  ZoomIn, ZoomOut, Maximize2, Minimize2, Download, Upload,
  MousePointer, Hand, BarChart2, LineChart, PieChart, TrendingUp,
  LayoutGrid, X
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
        return <Database size={16} className="text-[#4285F4]" />
      case 'csv':
        return <FileSpreadsheet size={16} className="text-emerald-600" />
      case 'database':
        return <Database size={16} className="text-blue-600" />
      default:
        return <CloudDownload size={16} className="text-gray-600" />
    }
  }

  const getStatusColor = () => {
    if (isSyncing) return 'bg-yellow-500 animate-pulse'
    if (data.error) return 'bg-red-500'
    if (!data.connected) return 'bg-gray-400'
    if (!data.queryInfo || Object.keys(data.queryInfo).length === 0) return 'bg-orange-500'
    if (data.queryResults && data.queryResults.length > 0) return 'bg-green-500'
    if (data.parsedData && data.parsedData.length > 0) return 'bg-green-500'
    return 'bg-orange-500'
  }

  return (
    <div className={`px-4 py-3 shadow-md rounded-lg border-2 bg-white ${
      selected ? 'border-blue-500' : 'border-gray-300'
    } min-w-[200px]`}>
      <div className={`absolute -top-2 -right-2 w-3 h-3 rounded-full ${getStatusColor()}`} />
      
      <div className="flex items-center gap-2 mb-2">
        {getIcon()}
        <span className="font-semibold text-sm">{data.label}</span>
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
          data.connected && data.queryInfo ? '!bg-green-500' : '!bg-red-500'
        }`}
      />
    </div>
  )
})

// Transform node
const TransformNode = React.memo(function TransformNode({ data, selected }: any) {
  const getTransformIcon = () => {
    switch (data.transformType) {
      case 'filter':
        return <Filter size={16} className="text-blue-600" />
      case 'aggregate':
        return <GroupIcon size={16} className="text-purple-600" />
      case 'calculate':
        return <Calculator size={16} className="text-green-600" />
      default:
        return <Sparkles size={16} className="text-orange-600" />
    }
  }

  return (
    <div className={`px-4 py-3 shadow-md rounded-lg border-2 bg-white ${
      selected ? 'border-purple-500' : 'border-gray-300'
    } min-w-[180px]`}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />
      
      <div className="flex items-center gap-2 mb-1">
        {getTransformIcon()}
        <span className="font-semibold text-sm">{data.label}</span>
      </div>
      
      <div className="text-xs text-gray-600">
        {data.description || 'Transform data'}
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-green-500 !border-2 !border-white"
      />
    </div>
  )
})

// Chart node - can receive and pass data with resize and style
const ChartNode = React.memo(function ChartNode({ data, selected, id }: any) {
  const { setNodes } = useReactFlow()
  const hasData = data.connectedData && data.connectedData.length > 0
  const [showConfig, setShowConfig] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dimensions, setDimensions] = useState({
    width: data.width || 320,
    height: data.height || 280
  })
  
  const getChartIcon = () => {
    switch (data.chartType) {
      case 'line':
        return <LineChart size={16} className="text-blue-600" />
      case 'bar':
        return <BarChart2 size={16} className="text-green-600" />
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
      connectedDataLength: data.connectedData?.length,
      connectedDataStructure: data.connectedData?.[0] ? Object.keys(data.connectedData[0]).slice(0, 5) : 'no data'
    })
    
    if (hasData && data.connectedData && data.connectedData[0]) {
      // Processing connected data for chart
      // Check for parsed data from CSV or other sources
      if (data.connectedData[0].parsedData && data.connectedData[0].parsedData.length > 0) {
        console.log('[ChartNode] Using parsedData:', {
          length: data.connectedData[0].parsedData.length,
          sample: data.connectedData[0].parsedData[0],
          keys: Object.keys(data.connectedData[0].parsedData[0] || {})
        })
        return data.connectedData[0].parsedData.slice(0, 100)
      }
      // Check for query results from data sources
      if (data.connectedData[0].queryResults && data.connectedData[0].queryResults.length > 0) {
        console.log('[ChartNode] Using queryResults:', {
          length: data.connectedData[0].queryResults.length,
          sample: data.connectedData[0].queryResults[0],
          keys: Object.keys(data.connectedData[0].queryResults[0] || {})
        })
        return data.connectedData[0].queryResults.slice(0, 100)
      }
      // Check for transformed data
      if (data.connectedData[0].transformedData && data.connectedData[0].transformedData.length > 0) {
        console.log('[ChartNode] Using transformedData:', {
          length: data.connectedData[0].transformedData.length,
          sample: data.connectedData[0].transformedData[0],
          keys: Object.keys(data.connectedData[0].transformedData[0] || {})
        })
        return data.connectedData[0].transformedData.slice(0, 100)
      }
      // Check if connected data is already an array
      if (Array.isArray(data.connectedData[0]) && data.connectedData[0].length > 0) {
        console.log('[ChartNode] Using direct array data:', {
          length: data.connectedData[0].length,
          sample: data.connectedData[0][0],
          keys: Object.keys(data.connectedData[0][0] || {})
        })
        return data.connectedData[0].slice(0, 100)
      }
    }
    // Return empty array - no sample data until connected
    console.log('[ChartNode] No data available, returning empty array')
    return []
  }, [hasData, data.connectedData, id])

  const chartConfig = React.useMemo(() => ({
    xAxis: data.config?.xAxis || 'name',
    yAxis: data.config?.yAxis || 'value',
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
  }), [data.config])

  const columns = React.useMemo(() => {
    if (chartData.length > 0) {
      return Object.keys(chartData[0])
    }
    return []
  }, [chartData])

  return (
    <>
      <div className={`shadow-lg rounded-lg border-2 bg-white overflow-hidden relative ${
        selected ? 'border-purple-500 ring-2 ring-purple-500 ring-opacity-30' : 'border-gray-300'
      }`} style={{ width: dimensions.width, height: dimensions.height }}>
        <Handle
          type="target"
          position={Position.Left}
          className={`w-3 h-3 !border-2 !border-white ${
            hasData ? '!bg-green-500' : '!bg-gray-400'
          }`}
          style={{ top: '20px' }}
        />
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getChartIcon()}
            <span className="font-semibold text-sm">{data.label || 'Chart'}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowConfig(!showConfig)
              }}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Configure"
            >
              <Settings size={12} />
            </button>
          </div>
        </div>
        
        {/* Chart Content */}
        <div className="p-2" style={{ height: 'calc(100% - 40px)' }}>
          {chartData.length > 0 ? (
            <ChartWrapper
              data={chartData}
              type={data.chartType || 'bar'}
              library={data.chartLibrary || 'recharts'}
              config={chartConfig}
              width="100%"
              height="100%"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <ChartBar size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">No data connected</p>
                <p className="text-xs mt-1 opacity-75">Connect a data source to visualize</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Resize Handle */}
        {selected && (
          <div
            onMouseDown={handleResizeStart}
            className={`nodrag absolute bottom-0 right-0 w-5 h-5 bg-purple-500 rounded-full cursor-nwse-resize ${
              isResizing ? 'bg-purple-600' : 'hover:bg-purple-600'
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
            hasData ? '!bg-blue-500' : '!bg-gray-400'
          }`}
          style={{ top: '20px' }}
        />
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="absolute bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50"
          style={{
            left: dimensions.width + 20,
            top: 0,
            width: 280,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Chart Configuration</h3>
            <button
              onClick={() => setShowConfig(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {/* Chart Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Chart Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['bar', 'line', 'pie', 'area'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setNodes((nodes) => 
                        nodes.map(node => 
                          node.id === id 
                            ? { ...node, data: { ...node.data, chartType: type } }
                            : node
                        )
                      )
                    }}
                    className={`px-2 py-1 text-xs rounded border capitalize ${
                      data.chartType === type 
                        ? 'border-purple-500 bg-purple-50 text-purple-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* X Axis */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                X Axis
              </label>
              <select
                value={data.config?.xAxis || 'name'}
                onChange={(e) => updateConfig({ xAxis: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* Y Axis */}
            {data.chartType !== 'pie' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Y Axis
                </label>
                <select
                  value={data.config?.yAxis || 'value'}
                  onChange={(e) => updateConfig({ yAxis: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Colors */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Color Scheme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['#3B82F6', '#10B981', '#F59E0B'],
                  ['#EC4899', '#8B5CF6', '#06B6D4'],
                  ['#F97316', '#84CC16', '#14B8A6'],
                ].map((colors, idx) => (
                  <button
                    key={idx}
                    onClick={() => updateConfig({ colors })}
                    className="flex gap-1 p-2 rounded border hover:border-gray-400"
                  >
                    {colors.map(color => (
                      <div key={color} className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                    ))}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Theme
              </label>
              <select
                value={data.config?.theme || 'default'}
                onChange={(e) => {
                  const themes: Record<string, any> = {
                    default: { colors: ['#3B82F6', '#10B981', '#F59E0B'], background: '#FFFFFF', gridColor: '#E5E7EB', textColor: '#1F2937' },
                    dark: { colors: ['#60A5FA', '#34D399', '#FBBF24'], background: '#1F2937', gridColor: '#374151', textColor: '#F3F4F6' },
                    vibrant: { colors: ['#EC4899', '#8B5CF6', '#06B6D4'], background: '#FFFFFF', gridColor: '#E5E7EB', textColor: '#1F2937' },
                    pastel: { colors: ['#FCA5A5', '#FDE68A', '#A7F3D0'], background: '#FEF3C7', gridColor: '#FED7AA', textColor: '#7C2D12' }
                  }
                  const selectedTheme = themes[e.target.value] || themes.default
                  updateConfig({ 
                    theme: e.target.value,
                    ...selectedTheme
                  })
                }}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="default">Default</option>
                <option value="dark">Dark</option>
                <option value="vibrant">Vibrant</option>
                <option value="pastel">Pastel</option>
              </select>
            </div>

            {/* Chart Options */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.config?.showLegend !== false}
                    onChange={(e) => updateConfig({ showLegend: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-xs">Show Legend</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.config?.showGrid !== false}
                    onChange={(e) => updateConfig({ showGrid: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-xs">Show Grid</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.config?.animated !== false}
                    onChange={(e) => updateConfig({ animated: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-xs">Animated</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
})

// Table node - can receive and pass data with resize
const TableNode = React.memo(function TableNode({ data, selected, id }: any) {
  const { setNodes } = useReactFlow()
  const hasData = data.connectedData && data.connectedData.length > 0
  const [isResizing, setIsResizing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [dimensions, setDimensions] = useState({
    width: data.width || 400,
    height: data.height || 250
  })
  
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
  
  // Get real data from connected sources
  const tableData = React.useMemo(() => {
    if (hasData && data.connectedData[0]) {
      const rowLimit = data.config?.rowLimit || 10
      // Processing connected data for table
      // Check for parsed data from CSV or other sources
      if (data.connectedData[0].parsedData && data.connectedData[0].parsedData.length > 0) {
        return data.connectedData[0].parsedData.slice(0, rowLimit)
      }
      // Check for query results from data sources
      if (data.connectedData[0].queryResults && data.connectedData[0].queryResults.length > 0) {
        return data.connectedData[0].queryResults.slice(0, rowLimit)
      }
    }
    return []
  }, [hasData, data.connectedData, data.config?.rowLimit])

  const columns = React.useMemo(() => {
    if (tableData.length > 0) {
      return Object.keys(tableData[0])
    }
    return []
  }, [tableData])
  
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
            hasData ? '!bg-green-500' : '!bg-gray-400'
          }`}
          style={{ top: '20px' }}
        />
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table size={16} />
            <span className="font-semibold text-sm">{data.label || 'Data Table'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-90">
              {tableData.length} rows × {columns.length} cols
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowSettings(!showSettings)
              }}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Settings"
            >
              <Settings size={12} />
            </button>
          </div>
        </div>
        
        {/* Table Content */}
        <div className="overflow-auto" style={{ height: 'calc(100% - 40px)' }}>
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
                  } hover:bg-blue-50 transition-colors`}>
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
        {selected && (
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
            hasData ? '!bg-blue-500' : '!bg-gray-400'
          }`}
          style={{ top: '20px' }}
        />
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50"
          style={{
            left: dimensions.width + 20,
            top: 0,
            width: 240,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Table Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {/* Row Limit */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Display Rows
              </label>
              <select
                value={data.config?.rowLimit || 10}
                onChange={(e) => updateConfig({ rowLimit: Number(e.target.value) })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="5">5 rows</option>
                <option value="10">10 rows</option>
                <option value="25">25 rows</option>
                <option value="50">50 rows</option>
                <option value="100">100 rows</option>
              </select>
            </div>

            {/* Header Style */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Header Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateConfig({ headerStyle: 'light' })}
                  className={`px-2 py-1 text-xs rounded border ${
                    data.config?.headerStyle !== 'dark'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => updateConfig({ headerStyle: 'dark' })}
                  className={`px-2 py-1 text-xs rounded border ${
                    data.config?.headerStyle === 'dark'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>

            {/* Table Options */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.config?.stripedRows === true}
                    onChange={(e) => updateConfig({ stripedRows: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-xs">Striped Rows</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.config?.compactMode === true}
                    onChange={(e) => updateConfig({ compactMode: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-xs">Compact Mode</span>
                </label>
              </div>
            </div>
          </div>
        </div>
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
      selected ? 'ring-2 ring-blue-500 ring-opacity-30' : ''
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
          className="nodrag absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-nwse-resize hover:bg-blue-600"
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
        selected ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-30' : 'border-transparent'
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
          className="nodrag absolute bottom-0 right-0 w-5 h-5 bg-blue-500 cursor-nwse-resize hover:bg-blue-600 transition-colors shadow-lg"
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

// Define node types outside component to prevent recreation
const nodeTypes: NodeTypes = {
  dataSource: DataSourceNode,
  transform: TransformNode,
  chart: ChartNode,
  table: TableNode,
  image: ImageNode,
  emoji: EmojiNode
}

interface UnifiedCanvasProps {
  items: any[]
  setItems: (items: any[]) => void
  connections: any[]
  setConnections: (connections: any[]) => void
  selectedItem: string | null
  setSelectedItem: (id: string | null) => void
  isDarkMode?: boolean
  background?: any
  showGrid?: boolean
  onOpenBlocks?: () => void
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
  onOpenBlocks,
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
  const [selectedTool, setSelectedTool] = useState<string>('pointer')
  const [dataNodes, setDataNodes] = useState<Node[]>([]) // Track data source nodes
  const [snapEnabled, setSnapEnabled] = useState(true)
  
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
        .filter(item => item.type === 'chart' || item.type === 'table' || item.type === 'image' || item.type === 'dataSource' || item.type === 'transform')
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
            connectedData: item.data?.connectedData || []
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
    const allNodes = nodes.filter(n => n.type === 'chart' || n.type === 'table' || n.type === 'image' || n.type === 'dataSource' || n.type === 'transform' || n.type === 'emoji')
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
        'Item'
      ),
      position: node.position,
      x: node.position.x,
      y: node.position.y,
      width: node.data?.width || (node.type === 'dataSource' ? 200 : node.type === 'transform' ? 180 : node.type === 'emoji' ? 80 : 300),
      height: node.data?.height || (node.type === 'dataSource' ? 80 : node.type === 'transform' ? 60 : node.type === 'emoji' ? 80 : 250),
      data: node.data,
      zIndex: node.data?.zIndex || 0,
      visible: true,
      locked: false
    }))
    
    // Update parent's items for persistence
    if (setItems) {
      setItems(prevItems => {
        // Keep non-node items (text, shapes - but NOT emoji since they're nodes now)
        const nonNodeItems = prevItems.filter(item => 
          item.type !== 'chart' && item.type !== 'table' && item.type !== 'image' && 
          item.type !== 'dataSource' && item.type !== 'transform' && item.type !== 'emoji'
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
        addDataSource(event.detail.type)
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
          // Data source can connect to transform, chart, or table
          { source: 'dataSource', targets: ['transform', 'chart', 'table'] },
          // Transform can connect to chart, table, or other transforms
          { source: 'transform', targets: ['chart', 'table', 'transform'] },
          // Chart can connect to table or other charts (for data chaining)
          { source: 'chart', targets: ['table', 'chart', 'transform'] },
          // Table can connect to chart or other tables (for data chaining)
          { source: 'table', targets: ['chart', 'table', 'transform'] },
        ]
        
        const isValidConnection = validConnections.some(
          rule => rule.source === sourceNode.type && rule.targets.includes(targetNode.type || '')
        )
        
        if (!isValidConnection) {
          // console.warn('Invalid connection type:', sourceNode.type, '->', targetNode.type)
          return
        }
        
        // Pass data to the target node
        if (targetNode.type === 'chart' || targetNode.type === 'table') {
          // Update chart/table with connected data
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
          // Pass data through transform
          const dataToPass = sourceNode.type === 'dataSource'
            ? {
                ...sourceNode.data,
                parsedData: sourceNode.data.queryResults || sourceNode.data.parsedData || [],
                fromNode: sourceNode.id,
                nodeType: sourceNode.type
              }
            : sourceNode.data
            
          const updatedTargetNode = {
            ...targetNode,
            data: {
              ...targetNode.data,
              inputData: dataToPass
            }
          }
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
  const addDataSource = (type: string) => {
    const labels: Record<string, string> = {
      googlesheets: 'Google Sheets',
      database: 'Database',
      shopify: 'Shopify Store',
      stripe: 'Stripe Payments',
      googleads: 'Google Ads',
      csv: 'CSV File'
    }
    
    const newNode: Node = {
      id: `data-${Date.now()}`,
      type: 'dataSource',
      position: { x: 50, y: 200 + nodes.filter(n => n.type === 'dataSource').length * 100 },
      data: {
        label: labels[type.toLowerCase()] || `${type} Data`,
        sourceType: type.toLowerCase(),
        connected: false,
        queryInfo: {}
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
    
    if (node.type === 'dataSource') {
      setShowDataSourcePanel(true)
    } else if (node.type === 'transform') {
      setTransformNode(node)
      setShowTransformBuilder(true)
    } else if (node.type === 'chart' || node.type === 'table') {
      // Show configuration panel for chart/table if needed
      // console.log('Selected visualization node:', node.type, node.data)
    }
  }, [setSelectedItem])

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
      return {
        backgroundImage: `url(${background.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    }
    
    return {}
  }
  
  return (
    <div className="h-full w-full relative" style={getBackgroundStyle()}>
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
          deleteKeyCode="Delete"
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
                    className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-nwse-resize"
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
                    className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-nwse-resize"
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
                    className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-nwse-resize"
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
                position: { x: 400 + nodes.filter(n => n.type === 'chart').length * 150, y: 200 },
                data: {
                  label: type.replace('Chart', '') + ' Chart',
                  chartType: type.replace('Chart', '').toLowerCase(),
                  connectedData: [],
                  width: 320,
                  height: 280
                }
              }
              setNodes(nodes => [...nodes, newNode])
            } else if (type === 'table') {
              // Add table as a node that can receive data connections
              const newNode: Node = {
                id: `table-${Date.now()}`,
                type: 'table',
                position: { x: 400 + nodes.filter(n => n.type === 'table').length * 150, y: 350 },
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
                position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 300 },
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
                position: { x: 200 + Math.random() * 300, y: 200 + Math.random() * 300 },
                data: {
                  emoji: config.emoji || '😊',
                  width: 80,
                  height: 80
                }
              }
              console.log('[UnifiedCanvas] Adding emoji node:', newNode)
              setNodes(nodes => [...nodes, newNode])
            } else if (type === 'text' || type === 'shape') {
              // Keep text and shapes as overlay items for now
              const defaultSizes = {
                text: { width: 'auto', height: 'auto' },
                shape: { width: 100, height: 100 }
              }
              
              const newItem = {
                id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type,
                position: { x: 300, y: 300 },
                ...(defaultSizes[type as keyof typeof defaultSizes] || {}),
                ...config,
                zIndex: (items || []).length
              }
              
              console.log('[UnifiedCanvas] Adding canvas element:', {
                type,
                config,
                newItem,
                hasSetItems: !!setItems,
                currentItemsCount: items?.length || 0
              })
              
              // Call parent's setItems to add the element
              if (setItems) {
                const updatedItems = [...(items || []), newItem]
                console.log('[UnifiedCanvas] Updating items array:', {
                  before: items?.length || 0,
                  after: updatedItems.length,
                  newItemId: newItem.id
                })
                setItems(updatedItems)
              } else {
                console.error('[UnifiedCanvas] setItems function not available!')
              }
            }
          }}
          mode="design"
          selectedItem={selectedItem}
          onToolChange={setSelectedTool}
          isDarkMode={isDarkMode}
          onOpenBlocks={onOpenBlocks}
      />

      {/* Side Panels */}
      {showDataSourcePanel && selectedNode && (
        <div className="absolute top-20 right-4 z-50 w-96 bg-white rounded-lg shadow-xl">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold">Configure Data Source</h3>
            <button
              onClick={() => setShowDataSourcePanel(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ×
            </button>
          </div>
          <DataSourceConnector
            sourceType={selectedNode.data?.sourceType || 'googlesheets'}
            nodeId={selectedNode.id}
            nodeLabel={selectedNode.data?.label || 'Data Source'}
            currentConfig={selectedNode.data?.queryInfo}
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
        </div>
      )}
      
      {showTransformBuilder && transformNode && (
        <div className="absolute top-20 right-4 z-50 w-96 bg-white rounded-lg shadow-xl">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold">Configure Transform</h3>
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
            inputData={[]} // TODO: Get actual input data from connected nodes
            currentConfig={transformNode.data}
            onApply={(transformConfig, transformedData) => {
              // Update the transform node with configuration
              setNodes(nodes => nodes.map(n => 
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
              ))
              setShowTransformBuilder(false)
            }}
            onClose={() => setShowTransformBuilder(false)}
            isDarkMode={isDarkMode}
            layout="inline"
          />
        </div>
      )}
      
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