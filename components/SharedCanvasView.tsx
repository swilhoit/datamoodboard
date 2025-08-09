'use client'

import Canvas from '@/components/Canvas'

interface SharedCanvasViewProps {
  mode: 'design' | 'data'
  designItems: any[]
  dataTables?: any[]
  connections: any[]
  background?: any
  isDarkMode?: boolean
}

export default function SharedCanvasView({
  mode,
  designItems,
  dataTables,
  connections,
  background,
  isDarkMode,
}: SharedCanvasViewProps) {
  return (
    <Canvas
      mode={mode}
      items={mode === 'design' ? (designItems || []) : (dataTables || [])}
      setItems={() => {}}
      connections={connections || []}
      setConnections={() => {}}
      selectedItem={null}
      setSelectedItem={() => {}}
      selectedItemData={null as any}
      onUpdateStyle={() => {}}
      onSelectedItemDataChange={() => {}}
      onUpdateCanvasElement={() => {}}
      background={background || { type: 'color', value: '#F3F4F6' }}
      showGrid={false}
      onToggleGrid={() => {}}
      onToggleFullscreen={() => {}}
      isDarkMode={!!isDarkMode}
    />
  )
}


