'use client'

import { useState } from 'react'
import VisualizationItem from '@/components/StableVisualizationItem'

export default function TestChartTitles() {
  const [charts, setCharts] = useState([
    {
      id: 'test-bar-1',
      type: 'barChart',
      title: 'Sales by Quarter',
      x: 50,
      y: 50,
      width: 400,
      height: 300,
      data: [
        { name: 'Q1', value: 4000 },
        { name: 'Q2', value: 3000 },
        { name: 'Q3', value: 2000 },
        { name: 'Q4', value: 2780 },
      ],
      style: {
        theme: 'modern',
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
        background: '#FFFFFF',
        gridColor: '#E5E7EB',
        textColor: '#1F2937',
        font: 'Inter',
        fontSize: 12,
      }
    },
    {
      id: 'test-line-1',
      type: 'lineChart',
      title: 'Revenue Trend 2024',
      x: 500,
      y: 50,
      width: 400,
      height: 300,
      data: [
        { name: 'Jan', value: 400 },
        { name: 'Feb', value: 300 },
        { name: 'Mar', value: 600 },
        { name: 'Apr', value: 800 },
        { name: 'May', value: 500 },
      ],
      style: {
        theme: 'modern',
        colors: ['#10B981'],
        background: '#FFFFFF',
        gridColor: '#E5E7EB',
        textColor: '#1F2937',
        font: 'Inter',
        fontSize: 12,
      }
    },
    {
      id: 'test-pie-1',
      type: 'pieChart',
      title: 'Market Share Distribution',
      x: 50,
      y: 400,
      width: 400,
      height: 300,
      data: [
        { name: 'Product A', value: 400 },
        { name: 'Product B', value: 300 },
        { name: 'Product C', value: 300 },
        { name: 'Product D', value: 200 },
      ],
      style: {
        theme: 'modern',
        colors: ['#8B5CF6', '#F59E0B', '#EF4444', '#10B981'],
        background: '#FFFFFF',
        gridColor: '#E5E7EB',
        textColor: '#1F2937',
        font: 'Inter',
        fontSize: 12,
      }
    },
    {
      id: 'test-table-1',
      type: 'table',
      title: 'Employee Data Summary',
      x: 500,
      y: 400,
      width: 400,
      height: 300,
      data: [
        { id: 1, name: 'John Doe', department: 'Engineering', salary: 95000 },
        { id: 2, name: 'Jane Smith', department: 'Marketing', salary: 85000 },
        { id: 3, name: 'Bob Johnson', department: 'Sales', salary: 78000 },
      ],
      style: {
        theme: 'modern',
        colors: ['#3B82F6'],
        background: '#FFFFFF',
        gridColor: '#E5E7EB',
        textColor: '#1F2937',
        font: 'Inter',
        fontSize: 12,
      }
    }
  ])
  const [selectedChart, setSelectedChart] = useState<string | null>(null)

  const updateChart = (id: string, updates: any) => {
    setCharts(charts => charts.map(chart => 
      chart.id === id ? { ...chart, ...updates } : chart
    ))
  }

  const deleteChart = (id: string) => {
    setCharts(charts => charts.filter(chart => chart.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Chart Titles Test</h1>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Testing Instructions:</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• All charts below should display their titles above the chart content</li>
            <li>• Click on any chart to select it and see the selection border</li>
            <li>• Titles should be bold and centered</li>
            <li>• Font styling should match the chart's theme</li>
          </ul>
        </div>
      </div>

      <div className="relative min-h-[800px] bg-white rounded-lg shadow-lg">
        {charts.map((chart) => (
          <VisualizationItem
            key={chart.id}
            item={chart}
            isSelected={selectedChart === chart.id}
            onSelect={() => setSelectedChart(chart.id)}
            onUpdate={updateChart}
            onDelete={deleteChart}
          />
        ))}
      </div>

      <div className="mt-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Chart Titles Status:</h2>
        <div className="space-y-2 text-sm">
          {charts.map((chart) => (
            <div key={chart.id} className="flex items-center justify-between">
              <span>{chart.type}</span>
              <span className={`px-2 py-1 rounded text-xs ${
                chart.title ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {chart.title ? `"${chart.title}"` : 'No Title'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}