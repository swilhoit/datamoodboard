'use client'

import {
  VictoryChart, VictoryLine, VictoryBar, VictoryPie, VictoryArea,
  VictoryScatter, VictoryAxis, VictoryTheme, VictoryTooltip,
  VictoryLabel, VictoryContainer, VictoryLegend, VictoryStack
} from 'victory'

interface VictoryChartProps {
  data: any[]
  type: string
  config: any
  width: number | string
  height: number | string
}

export default function VictoryChartComponent({ data, type, config, width, height }: VictoryChartProps) {
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
  
  // Convert width/height to numbers
  const chartWidth = typeof width === 'string' ? 400 : width
  const chartHeight = typeof height === 'string' ? 300 : height

  // Prepare data for Victory
  const victoryData = yAxes.map((axis, axisIndex) => 
    data.map((item, index) => ({
      x: item[xAxis],
      y: item[axis],
      label: showDataLabels ? item[axis] : undefined,
    }))
  )

  const toNum = (v: any, def: number) => {
    const n = typeof v === 'string' ? parseInt(v, 10) : v
    return Number.isFinite(n) ? n : def
  }
  const axisFontSize = toNum(config && (config.axisFontSize ?? config.fontSize), 12)
  const legendFontSize = toNum(config && (config.legendFontSize ?? config.fontSize), 12)
  const titleFontSize = toNum(config && (config.titleFontSize ?? config.fontSize), 16)

  // Compute Y domain with padding; handle stacked sums
  const computeYDomain = (): [number, number] | undefined => {
    if (!data?.length) return undefined
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
        return [min - d, max + d] as [number, number]
      }
      const pad = (max - min) * 0.05
      return [min - pad, max + pad] as [number, number]
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
      return [min - d, max + d] as [number, number]
    }
    const pad = (max - min) * 0.05
    return [min - pad, max + pad] as [number, number]
  }

  const yDomain = computeYDomain()

  // Compute X domain if numeric
  const isXNumeric = Number.isFinite(Number(data?.[0]?.[xAxis]))
  const computeXDomain = (): [number, number] | undefined => {
    if (!isXNumeric) return undefined
    const values = data.map((row) => Number(row?.[xAxis])).filter((v) => Number.isFinite(v))
    if (!values.length) return undefined
    let min = Math.min(...values)
    let max = Math.max(...values)
    if (min === max) {
      const d = Math.abs(min || 1) * 0.1
      return [min - d, max + d] as [number, number]
    }
    const pad = (max - min) * 0.05
    return [min - pad, max + pad] as [number, number]
  }
  const xDomain = computeXDomain()

  // Custom theme
  const customTheme = {
    ...VictoryTheme.material,
    axis: {
      style: {
        grid: {
          stroke: gridColor,
          strokeDasharray: showGrid ? undefined : 'none',
        },
        tickLabels: {
          fill: textColor,
          fontSize: axisFontSize,
        },
        axis: {
          stroke: gridColor,
        },
      },
    },
    chart: {
      padding: { left: 60, right: 40, top: 40, bottom: 60 },
    },
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <VictoryChart
            theme={customTheme}
            width={chartWidth}
            height={chartHeight}
            containerComponent={
              <VictoryContainer
                style={{ background: { fill: background } } as any}
              />
            }
          >
            <VictoryAxis dependentAxis domain={yDomain} />
            <VictoryAxis domain={xDomain} />
            {victoryData.map((seriesData, index) => (
              <VictoryLine
                key={index}
                data={seriesData}
                style={{
                  data: { stroke: colors[index % colors.length], strokeWidth: 2 },
                }}
                interpolation={smooth ? 'natural' : 'linear'}
                animate={animated ? { duration: 1500 } : undefined}
              />
            ))}
          </VictoryChart>
        )

      case 'bar':
        const BarComponent = stacked ? (
          <VictoryStack>
            {victoryData.map((seriesData, index) => (
              <VictoryBar
                key={index}
                data={seriesData}
                style={{
                  data: { fill: colors[index % colors.length] },
                }}
                animate={animated ? { duration: 1500 } : undefined}
              />
            ))}
          </VictoryStack>
        ) : (
          <>
            {victoryData.map((seriesData, index) => (
              <VictoryBar
                key={index}
                data={seriesData}
                style={{
                  data: { fill: colors[index % colors.length] },
                }}
                animate={animated ? { duration: 1500 } : undefined}
              />
            ))}
          </>
        )

        return (
          <VictoryChart
            theme={customTheme}
            width={chartWidth}
            height={chartHeight}
            domainPadding={{ x: 20 }}
            containerComponent={
              <VictoryContainer
                style={{ background: { fill: background } } as any}
              />
            }
          >
            <VictoryAxis dependentAxis domain={yDomain} />
            <VictoryAxis domain={xDomain} />
            {BarComponent}
          </VictoryChart>
        )

      case 'pie':
        return (
          <VictoryPie
            data={data.map((item, index) => ({
              x: item[xAxis],
              y: item[yAxis],
            }))}
            width={chartWidth}
            height={chartHeight}
            colorScale={colors}
            labelRadius={({ innerRadius }: any) => (chartWidth / 4) + 5 }
            innerRadius={0}
            padAngle={3}
            animate={animated ? { duration: 1500 } : undefined}
            containerComponent={
              <VictoryContainer
                style={{ background: { fill: background } } as any}
              />
            }
          />
        )

      case 'area':
        const AreaComponent = stacked ? (
          <VictoryStack>
            {victoryData.map((seriesData, index) => (
              <VictoryArea
                key={index}
                data={seriesData}
                style={{
                  data: { fill: colors[index % colors.length], fillOpacity: 0.6 },
                }}
                interpolation={smooth ? 'natural' : 'linear'}
                animate={animated ? { duration: 1500 } : undefined}
              />
            ))}
          </VictoryStack>
        ) : (
          <>
            {victoryData.map((seriesData, index) => (
              <VictoryArea
                key={index}
                data={seriesData}
                style={{
                  data: { fill: colors[index % colors.length], fillOpacity: 0.6 },
                }}
                interpolation={smooth ? 'natural' : 'linear'}
                animate={animated ? { duration: 1500 } : undefined}
              />
            ))}
          </>
        )

        return (
          <VictoryChart
            theme={customTheme}
            width={chartWidth}
            height={chartHeight}
            containerComponent={
              <VictoryContainer
                style={{ background: { fill: background } } as any}
              />
            }
          >
            <VictoryAxis dependentAxis domain={yDomain} />
            <VictoryAxis domain={xDomain} />
            {AreaComponent}
          </VictoryChart>
        )

      case 'scatter':
        return (
          <VictoryChart
            theme={customTheme}
            width={chartWidth}
            height={chartHeight}
            containerComponent={
              <VictoryContainer
                style={{ background: { fill: background } } as any}
              />
            }
          >
            <VictoryAxis dependentAxis domain={yDomain} />
            <VictoryAxis domain={xDomain} />
            {victoryData.map((seriesData, index) => (
              <VictoryScatter
                key={index}
                data={seriesData}
                style={{
                  data: { fill: colors[index % colors.length] },
                }}
                size={5}
                animate={animated ? { duration: 1500 } : undefined}
              />
            ))}
          </VictoryChart>
        )

      default:
        return (
          <div className="flex items-center justify-center" style={{ height: chartHeight }}>
            <p className="text-gray-400">Unsupported chart type: {type}</p>
          </div>
        )
    }
  }

  return (
    <div style={{ width: chartWidth, height: chartHeight }}>
      {title && (
        <h3 className="text-center font-bold mb-2" style={{ color: textColor, fontSize: titleFontSize }}>
          {title}
        </h3>
      )}
      {renderChart()}
      {showLegend && yAxes.length > 1 && type !== 'pie' && (
        <VictoryLegend
          x={50}
          y={10}
          orientation="horizontal"
          gutter={20}
          style={{ labels: { fill: textColor, fontSize: legendFontSize } }}
          data={yAxes.map((axis, index) => ({
            name: axis,
            symbol: { fill: colors[index % colors.length] },
          }))}
        />
      )}
    </div>
  )
}