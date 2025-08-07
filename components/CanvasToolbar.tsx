'use client'

import { useState } from 'react'
import { 
  Type, BarChart2, LineChart, PieChart, MousePointer, Hand,
  Grid3x3, TrendingUp, Table
} from 'lucide-react'
import MediaToolbar from './MediaToolbar'
import ShapesDropdown from './ShapesDropdown'

interface CanvasToolbarProps {
  onAddElement: (type: string, config?: any) => void
  mode: 'dashboard' | 'data'
  selectedItem?: string | null
  onDelete?: () => void
  onAddMedia?: (src: string, type: 'image' | 'gif') => void
  onToolChange?: (tool: string) => void
}

export default function CanvasToolbar({ onAddElement, mode, selectedItem, onDelete, onAddMedia, onToolChange }: CanvasToolbarProps) {
  const [selectedTool, setSelectedTool] = useState<string>('pointer')

  const tools = [
    { id: 'pointer', icon: MousePointer, label: 'Select', shortcut: 'V' },
    { id: 'hand', icon: Hand, label: 'Pan', shortcut: 'H' },
    { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  ]

  const chartTypes = [
    { type: 'lineChart', icon: LineChart, label: 'Line Chart' },
    { type: 'barChart', icon: BarChart2, label: 'Bar Chart' },
    { type: 'pieChart', icon: PieChart, label: 'Pie Chart' },
    { type: 'scatter', icon: Grid3x3, label: 'Scatter Plot' },
    { type: 'area', icon: TrendingUp, label: 'Area Chart' },
    { type: 'table', icon: Table, label: 'Data Table' },
  ]


  if (mode === 'data') return null // Don't show in data mode

  return (
    <>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-white rounded-xl shadow-lg border border-gray-200 px-2 py-2 flex items-center gap-1 animate-fadeIn">
        {/* Main Tools */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                setSelectedTool(tool.id)
                if (onToolChange) onToolChange(tool.id)
                if (tool.id === 'text') {
                  onAddElement('text', { 
                    text: 'Double click to edit', 
                    fontSize: 16, 
                    fontFamily: 'Inter',
                    color: '#1F2937'
                  })
                }
              }}
              className={`p-2 rounded-lg transition-all-smooth button-press relative group ${
                selectedTool === tool.id 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <tool.icon size={18} />
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {tool.label} ({tool.shortcut})
              </span>
            </button>
          ))}
        </div>

        {/* Charts */}
        <div className="flex items-center gap-1 px-2 border-r border-gray-200">
          <span className="text-xs text-gray-500 mr-1">Charts</span>
          {chartTypes.map((chart) => (
            <button
              key={chart.type}
              onClick={() => onAddElement(chart.type)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-all-smooth button-press relative group"
              title={chart.label}
            >
              <chart.icon size={18} />
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {chart.label}
              </span>
            </button>
          ))}
        </div>

        {/* Shapes */}
        <div className="flex items-center gap-1 pl-2 border-l border-gray-200">
          <ShapesDropdown onAddShape={(shapeType) => onAddElement('shape', { type: shapeType })} />
        </div>

        {/* Media Tools */}
        <div className="flex items-center gap-1 pl-2 border-l border-gray-200">
          <MediaToolbar 
            onAddImage={(src, type) => {
              if (onAddMedia) {
                onAddMedia(src, type)
              } else {
                onAddElement(type === 'gif' ? 'gif' : 'image', { src })
              }
            }}
          />
        </div>

      </div>

    </>
  )
}