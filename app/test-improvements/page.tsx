'use client'

import { useState } from 'react'
import TextElement from '@/components/TextElement'
import VisualizationItem from '@/components/StableVisualizationItem'

export default function TestImprovements() {
  const [textElements, setTextElements] = useState([
    {
      id: 'text-1',
      type: 'text',
      text: 'Sample Text with Auto-fit\nMulti-line text for testing\nline height adjustments',
      x: 50,
      y: 50,
      width: 200,
      height: 40,
      fontFamily: 'Inter',
      fontSize: 16,
      color: '#1F2937',
      letterSpacing: 0,
    }
  ])

  const [charts, setCharts] = useState([
    {
      id: 'chart-1',
      type: 'barChart',
      title: 'Revenue Chart - No Shadow',
      x: 300,
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
        background: 'transparent',
        gridColor: '#E5E7EB',
        textColor: '#1F2937',
        font: 'Inter',
        fontSize: 12,
        padding: 24,
        shadow: false,
      }
    }
  ])

  const [selectedElement, setSelectedElement] = useState<string | null>(null)

  const updateTextElement = (id: string, updates: any) => {
    setTextElements(elements => elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ))
  }

  const updateChart = (id: string, updates: any) => {
    setCharts(charts => charts.map(chart => 
      chart.id === id ? { ...chart, ...updates } : chart
    ))
  }

  const deleteElement = (id: string) => {
    setTextElements(elements => elements.filter(el => el.id !== id))
    setCharts(charts => charts.filter(chart => chart.id !== id))
    if (selectedElement === id) setSelectedElement(null)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Improvements Test Page</h1>
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold">New Features to Test:</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold text-green-700">✅ Text Improvements:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Text container auto-fits content</li>
                <li>• Editable font size input field</li>
                <li>• Kerning (letter spacing) adjustment</li>
                <li>• Line height adjustment (0.8-3.0)</li>
                <li>• Type directly into font size field</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-700">✅ Chart Improvements:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Adjustable chart padding</li>
                <li>• Background removal/adjustment</li>
                <li>• No default drop shadows</li>
                <li>• Custom background colors</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-purple-700">✅ Modal Fixes:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• GIF modal visibility fixed</li>
                <li>• Image upload modal visible</li>
                <li>• All modals use portals</li>
                <li>• Higher z-index for visibility</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-orange-700">🎯 Testing Instructions:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Select text to see new font controls</li>
                <li>• Select chart to access design panel</li>
                <li>• Try the image/GIF buttons in toolbar</li>
                <li>• Test typing in font size field</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="relative min-h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Text Elements */}
        {textElements.map((element) => (
          <TextElement
            key={element.id}
            element={element}
            isSelected={selectedElement === element.id}
            onSelect={() => setSelectedElement(element.id)}
            onUpdate={updateTextElement}
            onDelete={deleteElement}
          />
        ))}

        {/* Charts */}
        {charts.map((chart) => (
          <VisualizationItem
            key={chart.id}
            item={chart}
            isSelected={selectedElement === chart.id}
            onSelect={() => setSelectedElement(chart.id)}
            onUpdate={updateChart}
            onDelete={deleteElement}
          />
        ))}

        {/* Instructions Overlay */}
        <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow text-xs text-gray-600 max-w-xs">
          <p className="font-semibold mb-1">Quick Test:</p>
          <p>Double-click text to edit, single-click to select and see font controls with editable size, kerning, and line height.</p>
        </div>
      </div>

      {/* Status Panel */}
      <div className="mt-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Current Status:</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Selected Element:</strong> {selectedElement || 'None'}
          </div>
          <div>
            <strong>Text Auto-fit:</strong> <span className="text-green-600">Active</span>
          </div>
        </div>
      </div>
    </div>
  )
}