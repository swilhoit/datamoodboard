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
    xAxis = Object.keys(data[0])[0],
    yAxis = Object.keys(data[0])[1],
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

  // Prepare data for Plotly
  const traces: any[] = []

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
      font: {
        color: textColor,
        size: 16,
      },
    },
    paper_bgcolor: background,
    plot_bgcolor: background,
    font: {
      color: textColor,
    },
    showlegend: showLegend,
    legend: {
      orientation: 'h',
      y: -0.2,
    },
    xaxis: {
      gridcolor: gridColor,
      showgrid: showGrid,
      tickfont: {
        color: textColor,
      },
    },
    yaxis: {
      gridcolor: gridColor,
      showgrid: showGrid,
      tickfont: {
        color: textColor,
      },
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