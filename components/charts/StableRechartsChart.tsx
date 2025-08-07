'use client'

import { useMemo, memo, useRef, useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'

interface StableRechartsChartProps {
  data: any[]
  type: string
  config: any
  width: number | string
  height: number | string
}

// Custom hook to debounce data updates
function useStableData(data: any[], delay: number = 100) {
  const [stableData, setStableData] = useState(data)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setStableData(data)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, delay])

  return stableData
}

function StableRechartsChart({ data, type, config, width, height }: StableRechartsChartProps) {
  // Use debounced data to prevent rapid re-renders
  const stableData = useStableData(data, 100)
  
  // Memoize chart data with proper checks
  const chartData = useMemo(() => {
    if (!stableData || !Array.isArray(stableData) || stableData.length === 0) {
      return []
    }
    // Create a deep copy to prevent mutations
    return JSON.parse(JSON.stringify(stableData.slice(0, 1000))) // Limit to 1000 items for performance
  }, [stableData])

  // Memoize config with stable defaults
  const chartConfig = useMemo(() => {
    const safeConfig = config || {}
    const firstDataItem = chartData[0] || {}
    const dataKeys = Object.keys(firstDataItem)
    
    return {
      xAxis: safeConfig.xAxis || dataKeys[0] || 'name',
      yAxis: safeConfig.yAxis || dataKeys[1] || 'value',
      colors: safeConfig.colors || ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      background: safeConfig.background || '#FFFFFF',
      gridColor: safeConfig.gridColor || '#E5E7EB',
      textColor: safeConfig.textColor || '#1F2937',
      showLegend: safeConfig.showLegend !== false,
      showGrid: safeConfig.showGrid !== false,
      animated: false, // Disable animations to prevent re-render issues
      smooth: safeConfig.smooth !== false,
      showDataLabels: safeConfig.showDataLabels || false,
      stacked: safeConfig.stacked || false,
    }
  }, [config, chartData])

  const { xAxis, yAxis, colors, gridColor, textColor, showLegend, showGrid, smooth, showDataLabels, stacked } = chartConfig

  // Memoize yAxes array
  const yAxes = useMemo(() => {
    return Array.isArray(yAxis) ? yAxis : [yAxis]
  }, [yAxis])

  // Memoize tooltip component
  const CustomTooltip = useMemo(() => {
    return memo(({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
            <p className="text-sm font-medium">{label}</p>
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.name}: {entry.value}
              </p>
            ))}
          </div>
        )
      }
      return null
    })
  }, [])

  // Early return if no data
  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-gray-400">No data available</p>
      </div>
    )
  }

  // Render chart based on type
  switch (type) {
    case 'line':
      return (
        <ResponsiveContainer width={width} height={height}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}
            <XAxis dataKey={xAxis} stroke={textColor} />
            <YAxis stroke={textColor} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {yAxes.map((axis, index) => (
              <Line
                key={axis}
                type={smooth ? 'monotone' : 'linear'}
                dataKey={axis}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )

    case 'bar':
      return (
        <ResponsiveContainer width={width} height={height}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}
            <XAxis dataKey={xAxis} stroke={textColor} />
            <YAxis stroke={textColor} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {yAxes.map((axis, index) => (
              <Bar
                key={axis}
                dataKey={axis}
                fill={colors[index % colors.length]}
                isAnimationActive={false}
                stackId={stacked ? 'stack' : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )

    case 'pie':
      return (
        <ResponsiveContainer width={width} height={height}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey={yAxis}
              nameKey={xAxis}
              cx="50%"
              cy="50%"
              outerRadius={80}
              isAnimationActive={false}
              label={showDataLabels}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      )

    case 'area':
      return (
        <ResponsiveContainer width={width} height={height}>
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}
            <XAxis dataKey={xAxis} stroke={textColor} />
            <YAxis stroke={textColor} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {yAxes.map((axis, index) => (
              <Area
                key={axis}
                type={smooth ? 'monotone' : 'linear'}
                dataKey={axis}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
                isAnimationActive={false}
                stackId={stacked ? 'stack' : undefined}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )

    case 'scatter':
      return (
        <ResponsiveContainer width={width} height={height}>
          <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}
            <XAxis dataKey={xAxis} stroke={textColor} />
            <YAxis dataKey={yAxis} stroke={textColor} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Scatter
              data={chartData}
              fill={colors[0]}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      )

    case 'radar':
      return (
        <ResponsiveContainer width={width} height={height}>
          <RadarChart data={chartData}>
            <PolarGrid stroke={gridColor} />
            <PolarAngleAxis dataKey={xAxis} stroke={textColor} />
            <PolarRadiusAxis stroke={textColor} />
            <Radar
              dataKey={yAxis}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.6}
              isAnimationActive={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
          </RadarChart>
        </ResponsiveContainer>
      )

    default:
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <p className="text-gray-400">Unsupported chart type: {type}</p>
        </div>
      )
  }
}

// Export memoized component
export default memo(StableRechartsChart, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.type === nextProps.type &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
    JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config)
  )
})