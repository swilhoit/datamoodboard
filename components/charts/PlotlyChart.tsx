'use client'

import dynamic from 'next/dynamic'
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

interface PlotlyChartProps {
  data: any[]
  type: string
  config: any
  width: number | string
  height: number | string
}

export default function PlotlyChart({ data, type, config, width, height }: PlotlyChartProps) {
  const {
    xAxis = (data && data[0] && typeof data[0] === 'object') ? Object.keys(data[0])[0] : 'name',
    yAxis = (data && data[0] && typeof data[0] === 'object') ? Object.keys(data[0])[1] : 'value',
    colors = ['#3B82F6'],
    background = '#FFFFFF',
    gridColor = '#E5E7EB',
    textColor = '#1F2937',
    title = '',
    showLegend = true,
    showGrid = true,
    animated = true,
    smooth = true,
    showDataLabels = false,
    stacked = false,
  } = config

  const yAxes = Array.isArray(yAxis) ? yAxis : [yAxis]
  const toNum = (v: any, def: number) => {
    const n = typeof v === 'string' ? parseInt(v, 10) : v
    return Number.isFinite(n) ? n : def
  }
  const axisFontSize = toNum(config && (config.axisFontSize ?? config.fontSize), 12)
  const legendFontSize = toNum(config && (config.legendFontSize ?? config.fontSize), 12)
  const titleFontSize = toNum(config && (config.titleFontSize ?? config.fontSize), 16)

  // Prepare data for Plotly
  const traces: any[] = []

  // Compute Y domain across all series (with padding), consider stacked sums for area/stacked bar
  const computeYDomain = () => {
    if (!data?.length) return undefined as { min: number; max: number } | undefined
    const isStackLike = (type === 'bar' && stacked) || type === 'area'
    if (isStackLike && yAxes.length > 1) {
      const sums = data.map((row) => yAxes.reduce((acc, key) => {
        const v = Number(row?.[key])
        return Number.isFinite(v) ? acc + v : acc
      }, 0))
      let min = Math.min(...sums)
      let max = Math.max(...sums)
      if (!Number.isFinite(min) || !Number.isFinite(max)) return undefined
      if (min === max) {
        const d = Math.abs(min || 1) * 0.1
        return { min: min - d, max: max + d }
      }
      const pad = (max - min) * 0.05
      return { min: min - pad, max: max + pad }
    }
    const values: number[] = []
    for (const row of data) {
      for (const axis of yAxes) {
        const v = Number(row?.[axis])
        if (Number.isFinite(v)) values.push(v)
      }
    }
    if (!values.length) return undefined
    let min = Math.min(...values)
    let max = Math.max(...values)
    if (min === max) {
      const d = Math.abs(min || 1) * 0.1
      return { min: min - d, max: max + d }
    }
    const pad = (max - min) * 0.05
    return { min: min - pad, max: max + pad }
  }

  const yDomain = computeYDomain()

  // Compute X domain if numeric
  const isXNumeric = Number.isFinite(Number(data?.[0]?.[xAxis]))
  const computeXDomain = () => {
    if (!isXNumeric) return undefined as { min: number; max: number } | undefined
    const values = data.map((row) => Number(row?.[xAxis])).filter((v) => Number.isFinite(v))
    if (!values.length) return undefined
    let min = Math.min(...values)
    let max = Math.max(...values)
    if (min === max) {
      const d = Math.abs(min || 1) * 0.1
      return { min: min - d, max: max + d }
    }
    const pad = (max - min) * 0.05
    return { min: min - pad, max: max + pad }
  }
  const xDomain = computeXDomain()

  switch (type) {
    case 'line':
    case 'scatter':
      yAxes.forEach((axis, index) => {
        traces.push({
          x: data.map(item => item[xAxis]),
          y: data.map(item => item[axis]),
          type: 'scatter',
          mode: type === 'scatter' ? 'markers' : 'lines+markers',
          name: axis,
          line: {
            color: colors[index % colors.length],
            width: 2,
            shape: smooth ? 'spline' : 'linear',
          },
          marker: {
            color: colors[index % colors.length],
            size: 8,
          },
        })
      })
      break

    case 'bar':
      yAxes.forEach((axis, index) => {
        traces.push({
          x: data.map(item => item[xAxis]),
          y: data.map(item => item[axis]),
          type: 'bar',
          name: axis,
          marker: {
            color: colors[index % colors.length],
          },
        })
      })
      break

    case 'pie':
      traces.push({
        values: data.map(item => item[yAxis]),
        labels: data.map(item => item[xAxis]),
        type: 'pie',
        marker: {
          colors: data.map((_, index) => colors[index % colors.length]),
        },
        textposition: showDataLabels ? 'auto' : 'none',
        textinfo: showDataLabels ? 'label+percent' : 'none',
      })
      break

    case 'area':
      yAxes.forEach((axis, index) => {
        traces.push({
          x: data.map(item => item[xAxis]),
          y: data.map(item => item[axis]),
          type: 'scatter',
          mode: 'lines',
          name: axis,
          fill: stacked ? 'tonexty' : 'tozeroy',
          stackgroup: stacked ? 'one' : undefined,
          line: {
            color: colors[index % colors.length],
            width: 2,
            shape: smooth ? 'spline' : 'linear',
          },
        })
      })
      break

    case 'heatmap':
      // For heatmap, we need to restructure the data
      const uniqueX = [...new Set(data.map(item => item[xAxis]))]
      const uniqueY = [...new Set(data.map(item => item[yAxis]))]
      const zValues: number[][] = []
      
      uniqueY.forEach(y => {
        const row: number[] = []
        uniqueX.forEach(x => {
          const item = data.find(d => d[xAxis] === x && d[yAxis] === y)
          row.push(item ? item.value || 0 : 0)
        })
        zValues.push(row)
      })

      traces.push({
        x: uniqueX,
        y: uniqueY,
        z: zValues,
        type: 'heatmap',
        colorscale: [
          [0, colors[0]],
          [0.5, colors[1] || '#FFFFFF'],
          [1, colors[2] || colors[0]],
        ],
      })
      break

    case 'funnel':
      traces.push({
        y: data.map(item => item[xAxis]),
        x: data.map(item => item[yAxis]),
        type: 'funnel',
        marker: {
          color: data.map((_, index) => colors[index % colors.length]),
        },
      })
      break

    default:
      // Default to scatter plot
      traces.push({
        x: data.map(item => item[xAxis]),
        y: data.map(item => item[yAxis]),
        type: 'scatter',
        mode: 'markers',
        marker: {
          color: colors[0],
          size: 10,
        },
      })
  }

  const layout: any = {
    title: {
      text: title,
      font: { color: textColor, size: titleFontSize },
    },
    paper_bgcolor: background,
    plot_bgcolor: background,
    font: { color: textColor, size: axisFontSize },
    showlegend: showLegend,
    legend: {
      orientation: 'h',
      y: -0.2,
      font: { color: textColor, size: legendFontSize },
    },
    xaxis: {
      gridcolor: gridColor,
      showgrid: showGrid,
      tickfont: { color: textColor, size: axisFontSize },
      type: isXNumeric ? 'linear' : undefined,
      range: isXNumeric && xDomain ? [xDomain.min, xDomain.max] : undefined,
    },
    yaxis: {
      gridcolor: gridColor,
      showgrid: showGrid,
      tickfont: { color: textColor, size: axisFontSize },
      range: yDomain ? [yDomain.min, yDomain.max] : undefined,
    },
    margin: {
      l: 50,
      r: 50,
      t: title ? 50 : 30,
      b: 50,
    },
    autosize: true,
    transition: animated ? {
      duration: 500,
      easing: 'cubic-in-out',
    } : undefined,
  }

  if (stacked && type === 'bar') {
    layout.barmode = 'stack'
  }

  const plotConfig: any = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
  }

  return (
    <Plot
      data={traces}
      layout={layout}
      config={plotConfig}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  )
}