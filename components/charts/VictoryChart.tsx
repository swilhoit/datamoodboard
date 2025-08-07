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
          fontSize: 10,
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
                style={{ background: { fill: background } }}
              />
            }
          >
            <VictoryAxis dependentAxis />
            <VictoryAxis />
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
                style={{ background: { fill: background } }}
              />
            }
          >
            <VictoryAxis dependentAxis />
            <VictoryAxis />
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
                style={{ background: { fill: background } }}
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
                style={{ background: { fill: background } }}
              />
            }
          >
            <VictoryAxis dependentAxis />
            <VictoryAxis />
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
                style={{ background: { fill: background } }}
              />
            }
          >
            <VictoryAxis dependentAxis />
            <VictoryAxis />
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
        <h3 className="text-center font-bold mb-2" style={{ color: textColor }}>
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
          style={{ labels: { fill: textColor, fontSize: 10 } }}
          data={yAxes.map((axis, index) => ({
            name: axis,
            symbol: { fill: colors[index % colors.length] },
          }))}
        />
      )}
    </div>
  )
}