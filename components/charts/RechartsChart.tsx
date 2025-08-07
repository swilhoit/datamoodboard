'use client'

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'

interface RechartsChartProps {
  data: any[]
  type: string
  config: any
  width: number | string
  height: number | string
}

export default function RechartsChart({ data, type, config, width, height }: RechartsChartProps) {
  const {
    xAxis = Object.keys(data[0])[0],
    yAxis = Object.keys(data[0])[1],
    colors = ['#3B82F6'],
    background = '#FFFFFF',
    gridColor = '#E5E7EB',
    textColor = '#1F2937',
    showLegend = true,
    showGrid = true,
    animated = true,
    smooth = true,
    showDataLabels = false,
    stacked = false,
  } = config

  const CustomTooltip = ({ active, payload, label }: any) => {
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
  }

  const yAxes = Array.isArray(yAxis) ? yAxis : [yAxis]

  switch (type) {
    case 'line':
      return (
        <ResponsiveContainer width={width} height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                animationDuration={animated ? 1500 : 0}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )

    case 'bar':
      return (
        <ResponsiveContainer width={width} height={height}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                animationDuration={animated ? 1500 : 0}
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
              data={data}
              dataKey={yAxis}
              nameKey={xAxis}
              cx="50%"
              cy="50%"
              outerRadius={80}
              animationDuration={animated ? 1500 : 0}
              label={showDataLabels}
            >
              {data.map((entry, index) => (
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
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                animationDuration={animated ? 1500 : 0}
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
              data={data}
              fill={colors[0]}
              animationDuration={animated ? 1500 : 0}
            />
          </ScatterChart>
        </ResponsiveContainer>
      )

    case 'radar':
      return (
        <ResponsiveContainer width={width} height={height}>
          <RadarChart data={data}>
            <PolarGrid stroke={gridColor} />
            <PolarAngleAxis dataKey={xAxis} stroke={textColor} />
            <PolarRadiusAxis stroke={textColor} />
            <Radar
              dataKey={yAxis}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.6}
              animationDuration={animated ? 1500 : 0}
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