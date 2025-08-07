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
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: !!title,
        text: title,
        color: textColor,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: gridColor,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
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
        },
        stacked: stacked,
      },
      y: {
        grid: {
          display: showGrid,
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
        stacked: stacked,
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