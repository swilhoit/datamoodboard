'use client'

import dynamic from 'next/dynamic'
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface ApexChartProps {
  data: any[]
  type: string
  config: any
  width: number | string
  height: number | string
}

export default function ApexChart({ data, type, config, width, height }: ApexChartProps) {
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
  const toNum = (v: any, def: number) => {
    const n = typeof v === 'string' ? parseInt(v, 10) : v
    return Number.isFinite(n) ? n : def
  }
  const axisFontSize = toNum(config && (config.axisFontSize ?? config.fontSize), 12)
  const legendFontSize = toNum(config && (config.legendFontSize ?? config.fontSize), 12)
  const titleFontSize = toNum(config && (config.titleFontSize ?? config.fontSize), 16)

  // Prepare series data for ApexCharts
  let series: any[] = []
  let chartType = type

  switch (type) {
    case 'line':
    case 'area':
      series = yAxes.map(axis => ({
        name: axis,
        data: data.map(item => item[axis]),
      }))
      chartType = type
      break

    case 'bar':
      series = yAxes.map(axis => ({
        name: axis,
        data: data.map(item => item[axis]),
      }))
      chartType = 'bar'
      break

    case 'pie':
      series = data.map(item => item[yAxis])
      chartType = 'pie'
      break

    case 'scatter':
      series = [{
        name: yAxis,
        data: data.map(item => [item[xAxis], item[yAxis]]),
      }]
      chartType = 'scatter'
      break

    case 'heatmap':
      // Restructure data for heatmap
      const uniqueX = [...new Set(data.map(item => item[xAxis]))]
      series = uniqueX.map(x => ({
        name: x,
        data: data
          .filter(item => item[xAxis] === x)
          .map(item => ({ x: item[yAxis], y: item.value || 0 })),
      }))
      chartType = 'heatmap'
      break

    case 'radar':
      series = yAxes.map(axis => ({
        name: axis,
        data: data.map(item => item[axis]),
      }))
      chartType = 'radar'
      break

    default:
      series = [{
        name: yAxis,
        data: data.map(item => item[yAxis]),
      }]
      chartType = 'line'
  }

  // Compute Y min/max (with padding); handle stacked sums
  const computeYDomain = () => {
    if (!data?.length) return undefined as { min: number; max: number } | undefined
    if (stacked && yAxes.length > 1) {
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

  // Compute X domain if numeric (not for category xaxis like most series)
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

  const options: any = {
    chart: {
      type: chartType,
      background: background,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      animations: {
        enabled: animated,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
      stacked: stacked,
    },
    colors: colors,
    dataLabels: {
      enabled: showDataLabels,
      style: {
        colors: [textColor],
      },
    },
    stroke: {
      curve: smooth ? 'smooth' : 'straight',
      width: type === 'line' ? 3 : 1,
    },
    fill: {
      type: type === 'area' ? 'gradient' : 'solid',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100],
      },
    },
    title: {
      text: title,
      align: 'left',
      style: {
        fontSize: `${titleFontSize}px`,
        fontWeight: 'bold',
        color: textColor,
      },
    },
    grid: {
      show: showGrid,
      borderColor: gridColor,
      strokeDashArray: 0,
      position: 'back',
    },
    xaxis: type !== 'pie' ? {
      categories: isXNumeric ? undefined : data.map(item => item[xAxis]),
      type: isXNumeric ? 'numeric' : 'category',
      min: xDomain?.min,
      max: xDomain?.max,
      labels: {
        style: {
          colors: textColor,
          fontSize: `${axisFontSize}px`,
        },
      },
      axisBorder: {
        color: gridColor,
      },
      axisTicks: {
        color: gridColor,
      },
    } : undefined,
    yaxis: type !== 'pie' ? {
      labels: {
        style: {
          colors: textColor,
          fontSize: `${axisFontSize}px`,
        },
      },
      axisBorder: {
        color: gridColor,
      },
      axisTicks: {
        color: gridColor,
      },
      min: yDomain?.min,
      max: yDomain?.max,
    } : undefined,
    labels: type === 'pie' ? data.map(item => item[xAxis]) : undefined,
    legend: {
      show: showLegend,
      position: 'bottom',
      horizontalAlign: 'center',
      labels: {
        colors: textColor,
      },
      fontSize: `${legendFontSize}px`,
    },
    tooltip: {
      theme: background === '#FFFFFF' ? 'light' : 'dark',
      style: {
        fontSize: '12px',
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 8,
        dataLabels: {
          position: 'top',
        },
      },
      pie: {
        donut: {
          size: '65%',
        },
      },
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200,
        },
        legend: {
          position: 'bottom',
        },
      },
    }],
  }

  return (
    <ReactApexChart
      options={options}
      series={series}
      type={chartType as any}
      width={width}
      height={height}
    />
  )
}