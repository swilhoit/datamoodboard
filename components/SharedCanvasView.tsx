'use client'

import { useState } from 'react'
import UnifiedCanvas from '@/components/UnifiedCanvas'

interface SharedCanvasViewProps {
  mode: 'design' | 'data'
  designItems: any[]
  designElements?: any[]
  dataTables?: any[]
  connections: any[]
  background?: any
  isDarkMode?: boolean
}

export default function SharedCanvasView({
  mode,
  designItems,
  designElements,
  dataTables,
  connections,
  background,
  isDarkMode,
}: SharedCanvasViewProps) {
  const [items, setItems] = useState(designItems || [])
  const [connectionState, setConnectionState] = useState(connections || [])
  
  // Create a wrapper div that allows scrolling
  return (
    <div className="w-full h-full overflow-auto bg-gray-100">
      <div style={{ width: '5000px', height: '5000px', position: 'relative' }}>
        <UnifiedCanvas
          items={items}
          setItems={setItems}
          connections={connectionState}
          setConnections={setConnectionState}
          selectedItem={null}
          setSelectedItem={() => {}}
          isDarkMode={!!isDarkMode}
          background={background || { type: 'color', value: '#F3F4F6' }}
          showGrid={false}
        />
      </div>
    </div>
  )
}


