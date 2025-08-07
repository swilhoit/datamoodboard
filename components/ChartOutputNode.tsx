'use client'

import { useState, useRef, useEffect, memo, useMemo, useCallback } from 'react'
import { BarChart2, LineChart, PieChart, X, Maximize2, Settings, Eye, Sparkles } from 'lucide-react'
import dynamic from 'next/dynamic'
import { ChartLibrary, ChartType, chartLibraries, chartThemes } from './charts/MultiLibraryChart'

// Dynamically import the chart wrapper to prevent SSR issues and re-render loops
const ChartWrapper = dynamic(() => import('./ChartWrapper'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-gray-400">
      <div className="text-center">
        <BarChart2 size={32} className="mx-auto mb-2 animate-pulse" />
        <p className="text-xs">Loading chart...</p>
      </div>
    </div>
  )
})

interface ChartOutputNodeProps {
  node: any
  isSelected: boolean
  onSelect: () => void
  onUpdate: (id: string, updates: any) => void
  onDelete: (id: string) => void
  onEndConnection?: (nodeId: string) => void
  data?: any[]
  onPromoteToCanvas?: (node: any) => void
}

const chartTypes = {
  line: { name: 'Line Chart', icon: LineChart },
  bar: { name: 'Bar Chart', icon: BarChart2 },
  pie: { name: 'Pie Chart', icon: PieChart },
}

function ChartOutputNode({
  node,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onEndConnection,
  data = [],
  onPromoteToCanvas
}: ChartOutputNodeProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, itemX: 0, itemY: 0 })
  const [showConfig, setShowConfig] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [chartType, setChartType] = useState<ChartType>(node.chartType || 'bar')
  const [chartLibrary, setChartLibrary] = useState<ChartLibrary>(node.chartLibrary || 'recharts')
  const [config, setConfig] = useState(node.config || {
    xAxis: '',
    yAxis: '',
    theme: 'default',
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    showLegend: true,
    showGrid: true,
    animated: true,
    showDataLabels: false,
  })
  const nodeRef = useRef<HTMLDivElement>(null)

  // Memoize processed data to prevent unnecessary re-renders
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return []
    }
    // Limit data for performance in node view
    return data.slice(0, 100)
  }, [data])

  // Get available columns from data
  const columns = useMemo(() => {
    return processedData.length > 0 ? Object.keys(processedData[0]) : []
  }, [processedData])

  // Memoize chart configuration
  const chartConfig = useMemo(() => {
    return {
      ...config,
      xAxis: config.xAxis || (columns[0] || ''),
      yAxis: config.yAxis || (columns[1] || ''),
    }
  }, [config, columns])

  const handleMouseDownDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      itemX: node.x,
      itemY: node.y
    })
    onSelect()
  }, [node.x, node.y, onSelect])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y
        onUpdate(node.id, {
          x: dragStart.itemX + deltaX,
          y: dragStart.itemY + deltaY
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart, node.id, onUpdate])

  const handleConfigChange = useCallback((field: string, value: any) => {
    const newConfig = { ...config, [field]: value }
    setConfig(newConfig)
    onUpdate(node.id, { config: newConfig })
  }, [config, node.id, onUpdate])

  const handleChartTypeChange = useCallback((type: ChartType) => {
    setChartType(type)
    onUpdate(node.id, { chartType: type })
  }, [node.id, onUpdate])

  const handleLibraryChange = useCallback((library: ChartLibrary) => {
    setChartLibrary(library)
    onUpdate(node.id, { chartLibrary: library })
  }, [node.id, onUpdate])

  const ChartIcon = chartTypes[chartType as keyof typeof chartTypes]?.icon || BarChart2

  const renderChart = useCallback(() => {
    if (!processedData || processedData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <BarChart2 size={32} className="mx-auto mb-2" />
            <p className="text-xs">Connect data to visualize</p>
          </div>
        </div>
      )
    }

    return (
      <ChartWrapper
        data={processedData}
        type={chartType}
        library={chartLibrary}
        config={chartConfig}
        width="100%"
        height="100%"
      />
    )
  }, [processedData, chartType, chartLibrary, chartConfig])

  return (
    <>
      <div
        ref={nodeRef}
        className={`absolute bg-white rounded-lg shadow-lg border-2 transition-all ${
          isSelected ? 'border-purple-500 shadow-xl ring-2 ring-purple-500 ring-opacity-30' : 'border-gray-300'
        } ${isDragging ? 'opacity-80' : ''}`}
        style={{
          left: node.x,
          top: node.y,
          width: isExpanded ? 320 : 180,
          height: isExpanded ? 280 : 80,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
        onClick={onSelect}
      >
        <div 
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 rounded-t-md cursor-move flex items-center justify-between"
          onMouseDown={handleMouseDownDrag}
        >
          <div className="flex items-center gap-2">
            <ChartIcon size={14} />
            <span className="text-xs font-medium">Chart Output</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowConfig(!showConfig)
              }}
              className="p-0.5 hover:bg-white/20 rounded transition-colors"
              title="Configure"
            >
              <Settings size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              className="p-0.5 hover:bg-white/20 rounded transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <Maximize2 size={12} />
            </button>
            {onPromoteToCanvas && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onPromoteToCanvas(node)
                }}
                className="p-0.5 hover:bg-white/20 rounded transition-colors"
                title="Add to Dashboard"
              >
                <Eye size={12} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(node.id)
              }}
              className="p-0.5 hover:bg-white/20 rounded transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="p-2 h-[calc(100%-32px)]">
            {renderChart()}
          </div>
        )}

        {/* Input connection point */}
        <div
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-pointer hover:scale-125 transition-transform"
          style={{ left: -6, top: 30 }}
          onMouseUp={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onEndConnection?.(node.id)
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#EFF6FF'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF'
          }}
          title="Drop data connection here"
        />
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="absolute bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50"
          style={{
            left: node.x + (isExpanded ? 340 : 200),
            top: node.y,
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
            {/* Chart Library */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Chart Library
              </label>
              <select
                value={chartLibrary}
                onChange={(e) => handleLibraryChange(e.target.value as ChartLibrary)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                {Object.entries(chartLibraries).map(([key, lib]) => (
                  <option key={key} value={key}>{lib.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {chartLibraries[chartLibrary].description}
              </p>
            </div>

            {/* Chart Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Chart Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(chartTypes).map(([key, type]) => {
                  const Icon = type.icon
                  const isSupported = chartLibraries[chartLibrary].supportedTypes.includes(key as any)
                  return (
                    <button
                      key={key}
                      onClick={() => isSupported && handleChartTypeChange(key as ChartType)}
                      disabled={!isSupported}
                      className={`p-2 rounded border text-xs flex flex-col items-center gap-1 ${
                        !isSupported 
                          ? 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400'
                          : chartType === key 
                          ? 'border-purple-500 bg-purple-50 text-purple-700' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title={!isSupported ? `Not supported by ${chartLibraries[chartLibrary].name}` : ''}
                    >
                      <Icon size={16} />
                      <span>{type.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Theme
              </label>
              <select
                value={config.theme || 'default'}
                onChange={(e) => handleConfigChange('theme', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                {Object.entries(chartThemes).map(([key, theme]) => (
                  <option key={key} value={key}>{theme.name}</option>
                ))}
              </select>
            </div>

            {/* X Axis */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                X Axis / Categories
              </label>
              <select
                value={config.xAxis || ''}
                onChange={(e) => handleConfigChange('xAxis', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="">Select column...</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* Y Axis */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Y Axis / Values
              </label>
              <select
                value={config.yAxis || ''}
                onChange={(e) => handleConfigChange('yAxis', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="">Select column...</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* Chart Options */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Chart Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.showLegend}
                    onChange={(e) => handleConfigChange('showLegend', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs">Show Legend</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.showGrid}
                    onChange={(e) => handleConfigChange('showGrid', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs">Show Grid</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.animated}
                    onChange={(e) => handleConfigChange('animated', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs">Animated</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.showDataLabels}
                    onChange={(e) => handleConfigChange('showDataLabels', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs">Show Data Labels</span>
                </label>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowConfig(false)}
            className="mt-4 w-full px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </>
  )
}

// Memoize the component to prevent unnecessary re-renders
export default memo(ChartOutputNode)