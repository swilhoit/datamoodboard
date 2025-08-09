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

  const isChartType = (type?: string) => {
    if (!type) return false
    return (
      type === 'lineChart' ||
      type === 'barChart' ||
      type === 'pieChart' ||
      type === 'area' ||
      type === 'scatter' ||
      type === 'table'
    )
  }

  const getItemIcon = (type: string) => {
    const iconClass = isDarkMode ? 'text-gray-400' : 'text-gray-600'
    switch (type) {
      case 'lineChart': return <LineChart size={14} className={iconClass} />
      case 'barChart': return <BarChart2 size={14} className={iconClass} />
      case 'pieChart': return <PieChart size={14} className={iconClass} />
      case 'text': return <Type size={14} className={iconClass} />
      case 'image': return <Image size={14} className={iconClass} />
      case 'shape': return <Square size={14} className={iconClass} />
      case 'group': return <Folder size={14} className={iconClass} />
      default: return <Square size={14} className={iconClass} />
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
        className={`fixed left-0 top-20 border rounded-r-lg p-3 transition-all-smooth hover-lift shadow-md z-10 button-press ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' 
            : 'bg-white border-gray-200 hover:bg-gray-50'
        }`}
        title="Open layers panel"
      >
        <Layers size={20} />
      </button>
    )
  }

  return (
    <div className={`fixed left-0 top-20 w-64 h-[calc(100vh-80px)] border-r-4 shadow-lg z-10 flex flex-col animate-slideInLeft ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-600' 
        : 'bg-white border-indigo-400'
    }`}>
      {/* Header */}
      <div className={`p-3 border-b ${
        isDarkMode 
          ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' 
          : 'border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold text-sm flex items-center gap-2 ${
            isDarkMode ? 'text-gray-200' : 'text-indigo-800'
          }`}>
            <div className={`p-1 rounded ${
              isDarkMode ? 'bg-gray-700' : 'bg-indigo-100'
            }`}>
              <Layers size={14} className={isDarkMode ? 'text-gray-400' : 'text-indigo-600'} />
            </div>
            Layer Manager
          </h3>
          <button
            onClick={onToggle}
            className={`p-1 rounded transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-indigo-100 text-indigo-600'
            }`}
            title="Close layers panel"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Background Settings */}
      <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={() => setShowBackgroundSettings(!showBackgroundSettings)}
          className={`w-full flex items-center justify-between text-xs font-medium ${
            isDarkMode 
              ? 'text-gray-300 hover:text-gray-100' 
              : 'text-gray-700 hover:text-gray-900'
          }`}
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
          <div className={`text-center text-xs py-8 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            No layers yet
          </div>
        ) : (
          <div className="space-y-1">
            {sortedItems.map((item) => {
              const chartLike = isChartType(item.type)
              const visible = item.visible !== false
              const locked = item.locked === true
              return (
              <div
                key={item.id}
                draggable={chartLike}
                onDragStart={chartLike ? (e) => handleDragStart(e, item.id) : undefined}
                onDragOver={chartLike ? (e) => handleDragOver(e, item.id) : undefined}
                onDragEnd={chartLike ? handleDragEnd : undefined}
                onDrop={chartLike ? (e) => handleDrop(e, item.id) : undefined}
                className={`
                  group flex items-center gap-2 px-2 py-1.5 rounded cursor-move transition-all-smooth
                  ${selectedItem === item.id 
                    ? (isDarkMode ? 'bg-blue-900/30 border border-blue-600' : 'bg-blue-50 border border-blue-300')
                    : (isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50')}
                  ${chartLike && dragOverLayer === item.id ? 'border-t-2 border-blue-500' : ''}
                  ${locked ? 'opacity-50' : ''}
                `}
                onClick={() => !item.locked && onSelectItem(item.id)}
              >
                <Move size={12} className={`opacity-0 group-hover:opacity-100 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                {getItemIcon(item.type)}
                <span className={`flex-1 text-xs truncate ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {item.name || (item.title ? String(item.title) : '') || item.type || 'Layer'}
                </span>
                
                {chartLike && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleVisibility(item.id)
                      }}
                      className={`p-0.5 rounded transition-colors-smooth button-press ${
                        isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                      }`}
                      title={visible ? 'Hide layer' : 'Show layer'}
                    >
                      {visible ? 
                        <Eye size={12} className={isDarkMode ? 'text-gray-400' : ''} /> : 
                        <EyeOff size={12} className={isDarkMode ? 'text-gray-400' : ''} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLock(item.id)
                      }}
                      className={`p-0.5 rounded ${
                        isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                      }`}
                      title={locked ? 'Unlock layer' : 'Lock layer'}
                    >
                      {locked ? <Lock size={12} /> : <Unlock size={12} />}
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
                )}
              </div>
            )})}
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