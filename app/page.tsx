'use client'

import Canvas from '@/components/Canvas'
import ChatPanel from '@/components/ChatPanel'
import ModeToggle from '@/components/ModeToggle'
import LayersPanel from '@/components/LayersPanel'
import ChartDesignPanel from '@/components/ChartDesignPanel'
import TextStylePanel from '@/components/TextStylePanel'
import React, { useState } from 'react'
import { MessageCircle } from 'lucide-react'

export type CanvasMode = 'dashboard' | 'data'
export type DatabaseType = 'bigquery' | 'postgresql' | 'mysql' | 'mongodb' | 'snowflake' | 'redshift'

export default function Home() {
  const [mode, setMode] = useState<CanvasMode>('dashboard')
  const [canvasItems, setCanvasItems] = useState<any[]>([])
  const [dataTables, setDataTables] = useState<any[]>([])
  const [connections, setConnections] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [selectedItemData, setSelectedItemData] = useState<any>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [taggedElement, setTaggedElement] = useState<{ id: string, name: string } | null>(null)
  const [isLayersOpen, setIsLayersOpen] = useState(true)
  const [isChartDesignOpen, setIsChartDesignOpen] = useState(false)
  const [isTextStyleOpen, setIsTextStyleOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [canvasBackground, setCanvasBackground] = useState<any>({ type: 'color', value: '#F3F4F6' })
  const [showGrid, setShowGrid] = useState(true)

  const handleAddVisualization = (type: string, data?: any) => {
    const newItem = {
      id: `item-${Date.now()}`,
      type,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      width: 400,
      height: 300,
      data: data || generateSampleData(type),
      style: {
        theme: 'modern',
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        background: '#FFFFFF',
        gridColor: '#E5E7EB',
        textColor: '#1F2937',
        font: 'Inter',
        fontSize: 12,
        gradients: false,
        shadow: false,
        rounded: false,
        border: false,
      }
    }
    setCanvasItems([...canvasItems, newItem])
  }

  const handleAddDataTable = (database: DatabaseType, tableName: string, schema?: any) => {
    const newTable = {
      id: `table-${Date.now()}`,
      database,
      tableName,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      width: 300,
      height: 200,
      schema: schema || generateSampleSchema(tableName),
    }
    setDataTables([...dataTables, newTable])
  }

  const handleAddConnection = (sourceId: string, targetId: string, sourceField?: string, targetField?: string) => {
    const newConnection = {
      id: `conn-${Date.now()}`,
      sourceId,
      targetId,
      sourceField,
      targetField,
    }
    setConnections([...connections, newConnection])
  }

  const generateSampleSchema = (tableName: string) => {
    const schemas: any = {
      'users': [
        { name: 'id', type: 'INTEGER', isPrimary: true },
        { name: 'email', type: 'VARCHAR(255)' },
        { name: 'created_at', type: 'TIMESTAMP' },
        { name: 'name', type: 'VARCHAR(100)' },
      ],
      'orders': [
        { name: 'id', type: 'INTEGER', isPrimary: true },
        { name: 'user_id', type: 'INTEGER', isForeign: true },
        { name: 'total', type: 'DECIMAL(10,2)' },
        { name: 'status', type: 'VARCHAR(50)' },
        { name: 'created_at', type: 'TIMESTAMP' },
      ],
      'products': [
        { name: 'id', type: 'INTEGER', isPrimary: true },
        { name: 'name', type: 'VARCHAR(255)' },
        { name: 'price', type: 'DECIMAL(10,2)' },
        { name: 'category', type: 'VARCHAR(100)' },
      ],
    }
    return schemas[tableName] || [
      { name: 'id', type: 'INTEGER', isPrimary: true },
      { name: 'data', type: 'JSON' },
    ]
  }

  const generateSampleData = (type: string) => {
    switch (type) {
      case 'lineChart':
        return [
          { name: 'Jan', value: 400 },
          { name: 'Feb', value: 300 },
          { name: 'Mar', value: 600 },
          { name: 'Apr', value: 800 },
          { name: 'May', value: 500 },
        ]
      case 'barChart':
        return [
          { name: 'Product A', value: 4000 },
          { name: 'Product B', value: 3000 },
          { name: 'Product C', value: 2000 },
          { name: 'Product D', value: 2780 },
        ]
      case 'pieChart':
        return [
          { name: 'Group A', value: 400 },
          { name: 'Group B', value: 300 },
          { name: 'Group C', value: 300 },
          { name: 'Group D', value: 200 },
        ]
      default:
        return []
    }
  }

  // Update selected item data when selection changes
  React.useEffect(() => {
    if (selectedItem) {
      const items = mode === 'dashboard' ? canvasItems : dataTables
      let selected = items.find(item => item.id === selectedItem)
      
      // If not found in main items, check canvas elements (for text, images, etc.)
      if (!selected && mode === 'dashboard') {
        // This will be handled by the Canvas component which manages canvas elements
        selected = null
      }
      
      setSelectedItemData(selected)
    } else {
      setSelectedItemData(null)
    }
  }, [selectedItem, canvasItems, dataTables, mode])

  // Handle text element selection - need to get text element data from Canvas
  React.useEffect(() => {
    if (selectedItem && selectedItemData?.type === 'text') {
      // Show text style panel for text elements
      setIsTextStyleOpen(true)
      setIsLayersOpen(false)
      setIsChartDesignOpen(false)
    } else if (selectedItem && (selectedItemData?.type?.includes('Chart') || selectedItemData?.type === 'table')) {
      // Show chart design panel for charts and tables
      setIsTextStyleOpen(false)
    } else if (!selectedItem) {
      // Close all style panels when nothing is selected
      setIsTextStyleOpen(false)
    }
  }, [selectedItem, selectedItemData])

  // Handle chat button click for selected item
  const handleChatButtonClick = () => {
    if (selectedItem && selectedItemData) {
      const elementName = selectedItemData.tableName || 
                          selectedItemData.type || 
                          selectedItemData.transformType ||
                          'Element'
      setTaggedElement({ id: selectedItem, name: elementName })
      setIsChatOpen(true)
    }
  }

  // Handle layer reordering
  const handleReorderLayers = (newOrder: string[]) => {
    const reorderedItems = newOrder.map((id, index) => {
      const item = canvasItems.find(i => i.id === id)
      return item ? { ...item, zIndex: newOrder.length - index } : null
    }).filter(Boolean)
    setCanvasItems(reorderedItems as any[])
  }

  // Handle item deletion from layers panel
  const handleDeleteItem = (id: string) => {
    setCanvasItems(items => items.filter(item => item.id !== id))
    if (selectedItem === id) setSelectedItem(null)
  }

  const handleUpdateItemStyle = (id: string, styleUpdates: any) => {
    if (mode === 'dashboard') {
      setCanvasItems(items => items.map(item => {
        if (item.id === id) {
          // Apply theme presets if switching themes
          if (styleUpdates.theme) {
            const theme = chartThemes[styleUpdates.theme as keyof typeof chartThemes]
            if (theme) {
              return {
                ...item,
                style: {
                  ...item.style,
                  ...styleUpdates,
                  colors: theme.colors,
                  background: theme.background,
                  gridColor: theme.gridColor,
                  textColor: theme.textColor,
                  font: theme.font,
                  gradients: theme.gradients,
                  glowEffect: (theme as any).glowEffect || false,
                }
              }
            }
          }
          
          // Otherwise just merge the style updates
          return {
            ...item,
            style: { ...item.style, ...styleUpdates }
          }
        }
        return item
      }))
    }
  }

  // Handle canvas element (text, image, etc.) style updates
  const handleUpdateCanvasElement = (id: string, updates: any) => {
    // Update selected item data if it's the currently selected item
    if (selectedItem === id && selectedItemData) {
      setSelectedItemData({ ...selectedItemData, ...updates })
    }
  }

  // Import chart themes
  const chartThemes = {
    modern: {
      name: 'Modern',
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      background: '#FFFFFF',
      gridColor: '#E5E7EB',
      textColor: '#1F2937',
      font: 'Inter',
      gradients: false,
    },
    dark: {
      name: 'Dark Mode',
      colors: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'],
      background: '#1F2937',
      gridColor: '#374151',
      textColor: '#F9FAFB',
      font: 'Inter',
      gradients: false,
    },
    neon: {
      name: 'Neon Glow',
      colors: ['#00F5FF', '#FF00E4', '#FFE500', '#00FF88', '#FF5E00'],
      background: '#0F0F23',
      gridColor: '#1A1A3E',
      textColor: '#FFFFFF',
      font: 'Orbitron',
      gradients: true,
      glowEffect: true,
    },
    pastel: {
      name: 'Soft Pastel',
      colors: ['#FFB6C1', '#FFD700', '#98FB98', '#87CEEB', '#DDA0DD'],
      background: '#FFF5F5',
      gridColor: '#FFE0E0',
      textColor: '#4A5568',
      font: 'Quicksand',
      gradients: false,
    },
    gradient: {
      name: 'Gradient Dreams',
      colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'],
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      gridColor: 'rgba(255,255,255,0.1)',
      textColor: '#FFFFFF',
      font: 'Poppins',
      gradients: true,
    },
    retro: {
      name: 'Retro Wave',
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
      background: '#2C3E50',
      gridColor: '#34495E',
      textColor: '#ECF0F1',
      font: 'Space Mono',
      gradients: false,
    },
    nature: {
      name: 'Nature',
      colors: ['#2ECC71', '#27AE60', '#F39C12', '#E67E22', '#8B4513'],
      background: '#F5F3E9',
      gridColor: '#E8E4D6',
      textColor: '#2C3E50',
      font: 'Merriweather',
      gradients: false,
    },
    cyberpunk: {
      name: 'Cyberpunk',
      colors: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00AA', '#00FF00'],
      background: '#0A0A0A',
      gridColor: '#1A1A1A',
      textColor: '#00FFFF',
      font: 'Rajdhani',
      gradients: true,
      glowEffect: true,
    },
  }

  return (
    <div className={`flex flex-col h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ModeToggle 
        mode={mode} 
        setMode={setMode} 
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Layers Panel - only show in dashboard mode */}
        {mode === 'dashboard' && (
          <>
            <LayersPanel
              items={canvasItems}
              selectedItem={selectedItem}
              onSelectItem={setSelectedItem}
              onUpdateItem={handleUpdateItemStyle}
              onDeleteItem={handleDeleteItem}
              onReorderLayers={handleReorderLayers}
              isOpen={isLayersOpen && !isChartDesignOpen}
              onToggle={() => {
                setIsLayersOpen(!isLayersOpen)
                if (isChartDesignOpen) setIsChartDesignOpen(false)
              }}
              canvasBackground={canvasBackground}
              onUpdateBackground={setCanvasBackground}
              showGrid={showGrid}
              onToggleGrid={setShowGrid}
              onToggleChartDesign={() => {
                setIsChartDesignOpen(true)
                setIsLayersOpen(false)
              }}
              isDarkMode={isDarkMode}
            />
            
            {/* Chart Design Panel */}
            <ChartDesignPanel
              selectedItem={selectedItemData}
              onUpdateStyle={handleUpdateItemStyle}
              isOpen={isChartDesignOpen}
              onToggle={() => {
                setIsChartDesignOpen(false)
                setIsLayersOpen(true)
              }}
              isDarkMode={isDarkMode}
            />

            {/* Text Style Panel */}
            <TextStylePanel
              selectedItem={selectedItemData}
              onUpdateStyle={handleUpdateCanvasElement}
              isOpen={isTextStyleOpen}
              onToggle={() => {
                setIsTextStyleOpen(false)
                setIsLayersOpen(true)
              }}
              isDarkMode={isDarkMode}
            />
          </>
        )}
        
        <div className="flex-1 relative">
          <Canvas
            mode={mode}
            items={mode === 'dashboard' ? canvasItems : dataTables}
            setItems={mode === 'dashboard' ? setCanvasItems : setDataTables}
            connections={connections}
            setConnections={setConnections}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            selectedItemData={selectedItemData}
            onUpdateStyle={handleUpdateItemStyle}
            onSelectedItemDataChange={setSelectedItemData}
            onUpdateCanvasElement={handleUpdateCanvasElement}
            background={canvasBackground}
            showGrid={showGrid}
          />
          
          {/* Chat button for selected item */}
          {selectedItem && !isChatOpen && (
            <button
              onClick={handleChatButtonClick}
              className="absolute bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2 z-20"
              title="Chat about this element"
            >
              <MessageCircle size={20} />
              <span className="text-sm font-medium">Chat about selected</span>
            </button>
          )}
        </div>
        <ChatPanel
          mode={mode}
          onAddVisualization={handleAddVisualization}
          onAddDataTable={handleAddDataTable}
          onAddConnection={handleAddConnection}
          selectedItem={selectedItem}
          canvasItems={canvasItems}
          dataTables={dataTables}
          connections={connections}
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
          taggedElement={taggedElement}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  )
}