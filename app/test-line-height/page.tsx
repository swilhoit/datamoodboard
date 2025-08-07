'use client'

import { useState } from 'react'
import TextElement from '@/components/TextElement'

export default function TestLineHeight() {
  const [textElements, setTextElements] = useState([
    {
      id: 'text-tight',
      type: 'text',
      text: 'Tight Line Height\n(0.9) Example Text\nFor Testing',
      x: 50,
      y: 50,
      width: 200,
      height: 80,
      fontFamily: 'Inter',
      fontSize: 16,
      lineHeight: 0.9,
      color: '#1F2937',
    },
    {
      id: 'text-normal',
      type: 'text', 
      text: 'Normal Line Height\n(1.5) Example Text\nFor Testing',
      x: 300,
      y: 50,
      width: 200,
      height: 80,
      fontFamily: 'Inter',
      fontSize: 16,
      lineHeight: 1.5,
      color: '#1F2937',
    },
    {
      id: 'text-loose',
      type: 'text',
      text: 'Loose Line Height\n(2.5) Example Text\nFor Testing',
      x: 550,
      y: 50,
      width: 200,
      height: 80,
      fontFamily: 'Inter',
      fontSize: 16,
      lineHeight: 2.5,
      color: '#1F2937',
    }
  ])

  const [selectedElement, setSelectedElement] = useState<string | null>(null)

  const updateTextElement = (id: string, updates: any) => {
    setTextElements(elements => elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ))
  }

  const deleteElement = (id: string) => {
    setTextElements(elements => elements.filter(el => el.id !== id))
    if (selectedElement === id) setSelectedElement(null)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Line Height Adjustment Test</h1>
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold">Line Height Controls:</h2>
          
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-4">
              <span className="w-20 font-medium">Range:</span>
              <span>0.8 to 3.0 (0.1 step increments)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-20 font-medium">Controls:</span>
              <span>≡ (decrease) | Direct input | ☰ (increase)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-20 font-medium">Default:</span>
              <span>1.5 (normal spacing)</span>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
            <h3 className="font-semibold text-blue-800 mb-2">How to Test:</h3>
            <ol className="text-blue-700 space-y-1 text-sm">
              <li>1. Click on any text element below to select it</li>
              <li>2. Look for the line height controls (≡ input ☰) in the text toolbar</li>
              <li>3. Use buttons to adjust by 0.1 or type directly in the input</li>
              <li>4. Watch the text container auto-resize to fit the new line spacing</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="relative min-h-[400px] bg-white rounded-lg shadow-lg overflow-hidden">
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

        <div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-lg shadow text-xs text-gray-600">
          <p><strong>Selected:</strong> {selectedElement || 'None'}</p>
          {selectedElement && (
            <p><strong>Line Height:</strong> {textElements.find(el => el.id === selectedElement)?.lineHeight || 1.5}</p>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Tight (0.8-1.2)</h3>
          <p className="text-gray-600">Compact spacing for headings, labels, or when space is limited.</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Normal (1.2-1.8)</h3>
          <p className="text-gray-600">Standard spacing for body text and most readable content.</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Loose (1.8-3.0)</h3>
          <p className="text-gray-600">Spacious for emphasis, poetry, or artistic layouts.</p>
        </div>
      </div>
    </div>
  )
}