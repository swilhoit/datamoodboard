'use client'

import { useState } from 'react'
import { 
  Layers, Eye, EyeOff, Lock, Unlock, ChevronRight, ChevronDown, 
  Folder, Image, Type, BarChart2, PieChart, LineChart, Square,
  Trash2, Settings, Move, Plus, Grid, Palette
} from 'lucide-react'
import BackgroundSettings from './BackgroundSettings'

interface Layer {
  id: string
  name: string
  type: 'chart' | 'text' | 'image' | 'shape' | 'group'
  visible: boolean
  locked: boolean
  children?: Layer[]
  zIndex?: number
}

interface LayersPanelProps {
  items: any[]
  selectedItem: string | null
  onSelectItem: (id: string) => void
  onUpdateItem: (id: string, updates: any) => void
  onDeleteItem: (id: string) => void
  onReorderLayers: (layers: string[]) => void
  isOpen: boolean
  onToggle: () => void
  canvasBackground?: any
  onUpdateBackground?: (background: any) => void
  showGrid?: boolean
  onToggleGrid?: (show: boolean) => void
  onToggleChartDesign?: () => void
  isDarkMode?: boolean
}

export default function LayersPanel({
  items,
  selectedItem,
  onSelectItem,
  onUpdateItem,
  onDeleteItem,
  onReorderLayers,
  isOpen,
  onToggle,
  canvasBackground,
  onUpdateBackground,
  showGrid = true,
  onToggleGrid,
  onToggleChartDesign,
  isDarkMode
}: LayersPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null)
  const [dragOverLayer, setDragOverLayer] = useState<string | null>(null)
  const [showBackgroundSettings, setShowBackgroundSettings] = useState(false)

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'lineChart': return <LineChart size={14} />
      case 'barChart': return <BarChart2 size={14} />
      case 'pieChart': return <PieChart size={14} />
      case 'text': return <Type size={14} />
      case 'image': return <Image size={14} />
      case 'shape': return <Square size={14} />
      case 'group': return <Folder size={14} />
      default: return <Square size={14} />
    }
  }

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const handleDragStart = (e: React.DragEvent, layerId: string) => {
    setDraggedLayer(layerId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, layerId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverLayer(layerId)
  }

  const handleDragEnd = () => {
    setDraggedLayer(null)
    setDragOverLayer(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (draggedLayer && draggedLayer !== targetId) {
      // Reorder layers
      const currentIndex = items.findIndex(item => item.id === draggedLayer)
      const targetIndex = items.findIndex(item => item.id === targetId)
      
      if (currentIndex !== -1 && targetIndex !== -1) {
        const newOrder = [...items]
        const [movedItem] = newOrder.splice(currentIndex, 1)
        newOrder.splice(targetIndex, 0, movedItem)
        onReorderLayers(newOrder.map(item => item.id))
      }
    }
    setDraggedLayer(null)
    setDragOverLayer(null)
  }

  const toggleVisibility = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (item) {
      onUpdateItem(itemId, { visible: !item.visible })
    }
  }

  const toggleLock = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (item) {
      onUpdateItem(itemId, { locked: !item.locked })
    }
  }

  // Sort items by z-index (reverse order for display)
  const sortedItems = [...items].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-0 top-20 bg-white border border-gray-200 rounded-r-lg p-3 hover:bg-gray-50 transition-all-smooth hover-lift shadow-md z-10 button-press"
        title="Open layers panel"
      >
        <Layers size={20} />
      </button>
    )
  }

  return (
    <div className="fixed left-0 top-20 w-64 h-[calc(100vh-80px)] bg-white border-r-4 border-indigo-400 shadow-lg z-10 flex flex-col animate-slideInLeft">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-indigo-800">
            <div className="p-1 bg-indigo-100 rounded">
              <Layers size={14} className="text-indigo-600" />
            </div>
            Layer Manager
          </h3>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-indigo-100 rounded transition-colors text-indigo-600"
            title="Close layers panel"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Background Settings */}
      <div className="p-3 border-b border-gray-200">
        <button
          onClick={() => setShowBackgroundSettings(!showBackgroundSettings)}
          className="w-full flex items-center justify-between text-xs font-medium text-gray-700 hover:text-gray-900"
        >
          <span className="flex items-center gap-2">
            <Square size={14} />
            Canvas Background
          </span>
          {showBackgroundSettings ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        
        {showBackgroundSettings && onUpdateBackground && (
          <div className="mt-2">
            <BackgroundSettings
              background={canvasBackground}
              onUpdateBackground={onUpdateBackground}
              showGrid={showGrid}
              onToggleGrid={onToggleGrid || (() => {})}
              isDarkMode={isDarkMode}
            />
          </div>
        )}
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-2">
        {sortedItems.length === 0 ? (
          <div className="text-center text-gray-400 text-xs py-8">
            No layers yet
          </div>
        ) : (
          <div className="space-y-1">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, item.id)}
                className={`
                  group flex items-center gap-2 px-2 py-1.5 rounded cursor-move transition-all-smooth
                  ${selectedItem === item.id ? 'bg-blue-50 border border-blue-300' : 'hover:bg-gray-50'}
                  ${dragOverLayer === item.id ? 'border-t-2 border-blue-500' : ''}
                  ${item.locked ? 'opacity-50' : ''}
                `}
                onClick={() => !item.locked && onSelectItem(item.id)}
              >
                <Move size={12} className="text-gray-400 opacity-0 group-hover:opacity-100" />
                {getItemIcon(item.type)}
                <span className="flex-1 text-xs truncate">
                  {item.name || item.type || 'Layer'}
                </span>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleVisibility(item.id)
                    }}
                    className="p-0.5 hover:bg-gray-200 rounded transition-colors-smooth button-press"
                    title={item.visible !== false ? "Hide layer" : "Show layer"}
                  >
                    {item.visible !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleLock(item.id)
                    }}
                    className="p-0.5 hover:bg-gray-200 rounded"
                    title={item.locked ? "Unlock layer" : "Lock layer"}
                  >
                    {item.locked ? <Lock size={12} /> : <Unlock size={12} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteItem(item.id)
                    }}
                    className="p-0.5 hover:bg-red-100 text-red-600 rounded"
                    title="Delete layer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-gray-200 space-y-2">
        {selectedItem && onToggleChartDesign && (
          <button
            onClick={onToggleChartDesign}
            className="w-full px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            title="Open chart design panel"
          >
            <Palette size={14} />
            Chart Design
          </button>
        )}
        <button
          className="w-full px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          title="Group selected layers"
        >
          <Plus size={14} />
          Create Group
        </button>
      </div>
    </div>
  )
}