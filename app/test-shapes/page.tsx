'use client'

import { useState } from 'react'
import CanvasElement from '@/components/CanvasElement'

export default function TestShapes() {
  const [elements, setElements] = useState([
    {
      id: 'rectangle-1',
      type: 'shape',
      shapeType: 'rectangle',
      fill: '#3B82F6',
      stroke: false,
      strokeColor: '#1F2937',
      strokeWidth: 2,
      opacity: 1,
      x: 50,
      y: 50,
      width: 150,
      height: 100,
    },
    {
      id: 'circle-1',
      type: 'shape',
      shapeType: 'circle',
      fill: '#10B981',
      stroke: true,
      strokeColor: '#059669',
      strokeWidth: 3,
      opacity: 0.8,
      x: 250,
      y: 50,
      width: 120,
      height: 120,
    },
    {
      id: 'triangle-1',
      type: 'shape',
      shapeType: 'triangle',
      fill: '#F59E0B',
      stroke: false,
      strokeColor: '#D97706',
      strokeWidth: 2,
      opacity: 1,
      x: 420,
      y: 50,
      width: 100,
      height: 120,
    },
    {
      id: 'arrow-1',
      type: 'shape',
      shapeType: 'arrow',
      fill: '#EF4444',
      stroke: true,
      strokeColor: '#DC2626',
      strokeWidth: 2,
      opacity: 0.9,
      x: 50,
      y: 250,
      width: 80,
      height: 150,
    },
    {
      id: 'arrow-2',
      type: 'shape',
      shapeType: 'arrow',
      fill: '#8B5CF6',
      stroke: false,
      strokeColor: '#7C3AED',
      strokeWidth: 1,
      opacity: 0.7,
      x: 200,
      y: 250,
      width: 120,
      height: 200,
    }
  ])

  const [selectedElement, setSelectedElement] = useState<string | null>(null)

  const updateElement = (id: string, updates: any) => {
    setElements(elements => elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ))
  }

  const deleteElement = (id: string) => {
    setElements(elements => elements.filter(el => el.id !== id))
    if (selectedElement === id) setSelectedElement(null)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Enhanced Shapes Test</h1>
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold">New Shape Features:</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold text-green-700">✅ New Arrow Shape:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Added to shapes dropdown</li>
                <li>• Dynamic proportions based on size</li>
                <li>• Supports all styling options</li>
                <li>• Professional arrow design</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-700">✅ Advanced Shape Styling:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Fill color with presets and custom picker</li>
                <li>• Stroke toggle with color and width controls</li>
                <li>• Opacity slider (10% to 100%)</li>
                <li>• Live preview of changes</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
            <h3 className="font-semibold text-blue-800 mb-2">How to Test:</h3>
            <ol className="text-blue-700 space-y-1 text-sm">
              <li>1. Click on any shape to select it</li>
              <li>2. Use the shape style toolbar that appears above the shape</li>
              <li>3. Try different fill colors, stroke options, and opacity</li>
              <li>4. Test the new arrow shapes with various sizes</li>
              <li>5. Notice how styling applies consistently across all shapes</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="relative min-h-[500px] bg-white rounded-lg shadow-lg overflow-hidden">
        {elements.map((element) => (
          <CanvasElement
            key={element.id}
            element={element}
            isSelected={selectedElement === element.id}
            onSelect={() => setSelectedElement(element.id)}
            onUpdate={updateElement}
            onDelete={deleteElement}
          />
        ))}

        <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow text-xs text-gray-600 max-w-xs">
          <p className="font-semibold mb-1">Quick Test:</p>
          <p>Click any shape to see the enhanced style toolbar with fill, stroke, and opacity controls!</p>
        </div>

        <div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-lg shadow text-xs text-gray-600">
          <p><strong>Selected:</strong> {selectedElement || 'None'}</p>
          {selectedElement && (
            <>
              <p><strong>Type:</strong> {elements.find(el => el.id === selectedElement)?.shapeType || 'Unknown'} shape</p>
              <p><strong>Fill:</strong> {elements.find(el => el.id === selectedElement)?.fill}</p>
              <p><strong>Stroke:</strong> {elements.find(el => el.id === selectedElement)?.stroke ? 'Yes' : 'No'}</p>
              <p><strong>Opacity:</strong> {Math.round((elements.find(el => el.id === selectedElement)?.opacity || 1) * 100)}%</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">📐 Rectangle</h3>
          <p className="text-gray-600">Basic rectangle with full styling support including rounded corners.</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">⭕ Circle</h3>
          <p className="text-gray-600">Perfect circles with stroke and fill options.</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">🔺 Triangle</h3>
          <p className="text-gray-600">Triangular shapes pointing upward with styling.</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">⬆️ Arrow</h3>
          <p className="text-gray-600">New! Dynamic arrows with proportional head and shaft.</p>
        </div>
      </div>
    </div>
  )
}