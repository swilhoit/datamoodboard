'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar, Pie, Doughnut, Radar, Scatter } from 'react-chartjs-2'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ChartJSChartProps {
  data: any[]
  type: string
  config: any
  width: number | string
  height: number | string
}

export default function ChartJSChart({ data, type, config, width, height }: ChartJSChartProps) {
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
  const labelFontSize = toNum(config && (config.labelFontSize ?? config.fontSize), 12)

  // Prepare data for Chart.js
  const chartData = {
    labels: data.map(item => item[xAxis]),
    datasets: yAxes.map((axis, index) => ({
      label: axis,
      data: data.map(item => item[axis]),
      backgroundColor: type === 'line' || type === 'radar' 
        ? `${colors[index % colors.length]}33`
        : colors[index % colors.length],
      borderColor: colors[index % colors.length],
      borderWidth: 2,
      fill: type === 'area' || type === 'radar',
      tension: smooth ? 0.4 : 0,
      pointBackgroundColor: colors[index % colors.length],
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }))
  }

  // Pie chart needs different data structure
  if (type === 'pie' || type === 'doughnut') {
    chartData.datasets = [{
      label: yAxis,
      data: data.map(item => item[yAxis]),
      backgroundColor: data.map((_, index) => colors[index % colors.length]),
      borderColor: '#fff',
      borderWidth: 2,
    } as any]  // Type assertion needed for pie/doughnut specific properties
  }

  // Compute Y min/max across datasets (with padding); handle stacked sums
  const computeYDomain = () => {
    if (!data?.length) return { min: 0, max: 1 }
    if (stacked && yAxes.length > 1) {
      const sums = data.map((row) => yAxes.reduce((acc, key) => {
        const v = Number(row?.[key])
        return Number.isFinite(v) ? acc + v : acc
      }, 0))
      let min = Math.min(...sums)
      let max = Math.max(...sums)
      if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1 }
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
    if (!values.length) return { min: 0, max: 1 }
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

  const isXNumeric = Number.isFinite(Number(data?.[0]?.[xAxis]))
  const computeXDomain = () => {
    if (!isXNumeric) return undefined
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

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: animated ? 1500 : 0,
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          color: textColor,
          font: { size: legendFontSize },
        },
      },
      title: {
        display: !!title,
        text: title,
        color: textColor,
        font: { size: titleFontSize, weight: 'bold' },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: gridColor,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: legendFontSize },
        bodyFont: { size: labelFontSize },
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null && typeof context.parsed.y === 'number') {
              label += Number.isInteger(context.parsed.y) ? context.parsed.y : context.parsed.y.toFixed(2);
            }
            return label;
          }
        }
      },
    },
    scales: type !== 'pie' && type !== 'doughnut' && type !== 'radar' ? {
      x: {
        grid: {
          display: showGrid,
          color: gridColor,
        },
        ticks: {
          color: textColor,
          font: { size: axisFontSize },
          callback: function(value: any) {
            if (typeof value === 'number' && !Number.isInteger(value)) {
              return value.toFixed(2);
            }
            return value;
          }
        },
        stacked: stacked,
        type: isXNumeric ? 'linear' : 'category',
        min: xDomain?.min,
        max: xDomain?.max,
      },
      y: {
        grid: {
          display: showGrid,
          color: gridColor,
        },
        ticks: {
          color: textColor,
          font: { size: axisFontSize },
          callback: function(value: any) {
            if (typeof value === 'number' && !Number.isInteger(value)) {
              return value.toFixed(2);
            }
            return value;
          }
        },
        stacked: stacked,
        min: yDomain.min,
        max: yDomain.max,
      },
    } : undefined,
  }

  const containerStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    position: 'relative' as const,
  }

  switch (type) {
    case 'line':
      return (
        <div style={containerStyle}>
          <Line data={chartData} options={options} />
        </div>
      )
    
    case 'bar':
      return (
        <div style={containerStyle}>
          <Bar data={chartData} options={options} />
        </div>
      )
    
    case 'pie':
      return (
        <div style={containerStyle}>
          <Pie data={chartData} options={options} />
        </div>
      )
    
    case 'doughnut':
      return (
        <div style={containerStyle}>
          <Doughnut data={chartData} options={options} />
        </div>
      )
    
    case 'area':
      // Area chart is just a filled line chart
      return (
        <div style={containerStyle}>
          <Line data={chartData} options={options} />
        </div>
      )
    
    case 'radar':
      return (
        <div style={containerStyle}>
          <Radar data={chartData} options={options} />
        </div>
      )
    
    case 'scatter':
      // Prepare scatter data
      const scatterData = {
        datasets: [{
          label: 'Data',
          data: data.map(item => ({ x: item[xAxis], y: item[yAxis] })),
          backgroundColor: colors[0],
          borderColor: colors[0],
        }]
      }
      return (
        <div style={containerStyle}>
          <Scatter data={scatterData} options={options} />
        </div>
      )
    
    default:
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <p className="text-gray-400">Unsupported chart type: {type}</p>
        </div>
      )
  }
}