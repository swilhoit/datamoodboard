'use client'

import { useState } from 'react'
import CanvasElement from '@/components/CanvasElement'

export default function TestDraggable() {
  const [elements, setElements] = useState([
    {
      id: 'image-1',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
      x: 100,
      y: 100,
      width: 250,
      height: 200,
    },
    {
      id: 'gif-1',
      type: 'gif',
      src: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
      x: 400,
      y: 100,
      width: 250,
      height: 200,
    },
    {
      id: 'image-2',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1519337265831-281ec6cc8514?w=300&h=200&fit=crop',
      x: 100,
      y: 350,
      width: 250,
      height: 200,
    },
    {
      id: 'shape-1',
      type: 'shape',
      shapeType: 'rectangle',
      fill: '#3B82F6',
      x: 400,
      y: 350,
      width: 150,
      height: 100,
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
        <h1 className="text-3xl font-bold mb-4">Draggable Media Test</h1>
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold">Enhanced Dragging Features:</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold text-green-700">✅ Images & GIFs Now Draggable:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Click and drag directly on the image/GIF content</li>
                <li>• Headers are more visible (semi-transparent by default)</li>
                <li>• Headers become fully visible on selection or hover</li>
                <li>• Clear visual indication with "Drag to move" text</li>
                <li>• Cursor changes to move cursor on hover</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-700">🎯 How to Test:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Try clicking and dragging any image or GIF</li>
                <li>• Notice the header becomes more visible</li>
                <li>• Click to select and see resize handles</li>
                <li>• Compare with shape dragging behavior</li>
                <li>• Test both header and content dragging</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
            <h3 className="font-semibold text-blue-800 mb-2">Dragging Methods:</h3>
            <ol className="text-blue-700 space-y-1 text-sm">
              <li>1. <strong>Direct drag:</strong> Click and drag anywhere on the image/GIF content</li>
              <li>2. <strong>Header drag:</strong> Use the header bar (more visible now for media)</li>
              <li>3. <strong>Visual feedback:</strong> Headers show opacity based on selection/hover state</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="relative min-h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
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
          <p>Click and drag any image or GIF - they should move smoothly. Notice the enhanced header visibility!</p>
        </div>

        <div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-lg shadow text-xs text-gray-600">
          <p><strong>Selected:</strong> {selectedElement || 'None'}</p>
          {selectedElement && (
            <>
              <p><strong>Type:</strong> {elements.find(el => el.id === selectedElement)?.type || 'Unknown'}</p>
              <p><strong>Position:</strong> x: {elements.find(el => el.id === selectedElement)?.x}, y: {elements.find(el => el.id === selectedElement)?.y}</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">🖼️ Images</h3>
          <p className="text-gray-600">Images are now directly draggable by clicking on the image content itself.</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">🎬 GIFs</h3>
          <p className="text-gray-600">GIFs work the same as images - click and drag to move around the canvas.</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">📐 Shapes</h3>
          <p className="text-gray-600">Shapes use the traditional header-only dragging for comparison.</p>
        </div>
      </div>
    </div>
  )
}