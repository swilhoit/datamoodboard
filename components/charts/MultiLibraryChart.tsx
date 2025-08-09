'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, memo, useMemo } from 'react'

// Dynamically import chart libraries to avoid SSR issues
const RechartsChart = dynamic(() => import('./StableRechartsChart'), { ssr: false })
const ChartJSChart = dynamic(() => import('./ChartJSChart'), { ssr: false })
const PlotlyChart = dynamic(() => import('./PlotlyChart'), { ssr: false })
const ApexChart = dynamic(() => import('./ApexChart'), { ssr: false })
const VictoryChart = dynamic(() => import('./VictoryChart'), { ssr: false })

export type ChartLibrary = 'recharts' | 'chartjs' | 'plotly' | 'apexcharts' | 'victory'
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'radar' | 'funnel'

interface MultiLibraryChartProps {
  data: any[]
  type: ChartType
  library: ChartLibrary
  config: {
    xAxis?: string
    yAxis?: string | string[]
    colors?: string[]
    theme?: string
    title?: string
    showLegend?: boolean
    showGrid?: boolean
    animated?: boolean
    stacked?: boolean
    smooth?: boolean
    showDataLabels?: boolean
  }
  width?: number | string
  height?: number | string
}

export const chartLibraries = {
  recharts: {
    name: 'Recharts',
    description: 'Composable charting library',
    pros: ['React-friendly', 'Composable', 'Animated'],
    supportedTypes: ['line', 'bar', 'pie', 'area', 'scatter', 'radar'],
  },
  chartjs: {
    name: 'Chart.js',
    description: 'Simple yet flexible JavaScript charting',
    pros: ['Lightweight', 'Responsive', 'Wide browser support'],
    supportedTypes: ['line', 'bar', 'pie', 'area', 'scatter', 'radar'],
  },
  plotly: {
    name: 'Plotly',
    description: 'Scientific and statistical charts',
    pros: ['3D charts', 'Statistical', 'Interactive'],
    supportedTypes: ['line', 'bar', 'pie', 'area', 'scatter', 'heatmap', 'funnel'],
  },
  apexcharts: {
    name: 'ApexCharts',
    description: 'Modern & interactive charts',
    pros: ['Beautiful defaults', 'Responsive', 'Real-time updates'],
    supportedTypes: ['line', 'bar', 'pie', 'area', 'scatter', 'heatmap', 'radar'],
  },
  victory: {
    name: 'Victory',
    description: 'Modular charting for React',
    pros: ['Fully customizable', 'React Native support', 'Flexible'],
    supportedTypes: ['line', 'bar', 'pie', 'area', 'scatter'],
  },
}

export const chartThemes = {
  default: {
    name: 'Default',
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'],
    background: '#FFFFFF',
    gridColor: '#E5E7EB',
    textColor: '#1F2937',
  },
  dark: {
    name: 'Dark',
    colors: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6', '#22D3EE', '#A3E635'],
    background: '#1F2937',
    gridColor: '#374151',
    textColor: '#F9FAFB',
  },
  neon: {
    name: 'Neon',
    colors: ['#00F5FF', '#FF00E4', '#FFE500', '#00FF88', '#FF5E00', '#9D00FF', '#00FFF0', '#FF0099'],
    background: '#0A0A0A',
    gridColor: '#1A1A1A',
    textColor: '#FFFFFF',
  },
  pastel: {
    name: 'Pastel',
    colors: ['#FFB6C1', '#FFD700', '#98FB98', '#87CEEB', '#DDA0DD', '#F0E68C', '#FFE4B5', '#F5DEB3'],
    background: '#FFF5F5',
    gridColor: '#FFE0E0',
    textColor: '#4A5568',
  },
  ocean: {
    name: 'Ocean',
    colors: ['#00CED1', '#4682B4', '#5F9EA0', '#00BFFF', '#1E90FF', '#6495ED', '#4169E1', '#0000CD'],
    background: '#F0F8FF',
    gridColor: '#B0C4DE',
    textColor: '#191970',
  },
  sunset: {
    name: 'Sunset',
    colors: ['#FF6B6B', '#FF8E53', '#FFB347', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6', '#FF6B9D'],
    background: '#FFF5E6',
    gridColor: '#FFE0CC',
    textColor: '#5D4037',
  },
}

function MultiLibraryChart({
  data,
  type,
  library,
  config,
  width = '100%',
  height = 300,
}: MultiLibraryChartProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Memoize the chart type validation
  const validatedType = useMemo(() => {
    const supportedTypes = chartLibraries[library].supportedTypes
    if (!supportedTypes.includes(type)) {
      // Fallback to a supported type
      return supportedTypes[0] as ChartType
    }
    return type
  }, [library, type])

  // Memoize theme configuration
  const theme = useMemo(() => {
    return chartThemes[config.theme as keyof typeof chartThemes] || chartThemes.default
  }, [config.theme])

  // Memoize the final config
  const finalConfig = useMemo(() => {
    // Theme provides defaults; explicit config should override theme
    return { ...theme, ...config }
  }, [config, theme])

  if (!mounted || !data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ width, height }}
      >
        <p className="text-gray-400">No data available</p>
      </div>
    )
  }

  switch (library) {
    case 'recharts':
      return <RechartsChart data={data} type={validatedType} config={finalConfig} width={width} height={height} />
    case 'chartjs':
      return <ChartJSChart data={data} type={validatedType} config={finalConfig} width={width} height={height} />
    case 'plotly':
      return <PlotlyChart data={data} type={validatedType} config={finalConfig} width={width} height={height} />
    case 'apexcharts':
      return <ApexChart data={data} type={validatedType} config={finalConfig} width={width} height={height} />
    case 'victory':
      return <VictoryChart data={data} type={validatedType} config={finalConfig} width={width} height={height} />
    default:
      return <RechartsChart data={data} type={validatedType} config={finalConfig} width={width} height={height} />
  }
}

// Memoize the entire component
export default memo(MultiLibraryChart)