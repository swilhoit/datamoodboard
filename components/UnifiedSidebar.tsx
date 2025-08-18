'use client'

import React, { useState } from 'react'
import { 
  Layers, Database, ChevronRight, ChevronLeft, 
  FileSpreadsheet, ShoppingBag, CreditCard, Megaphone,
  Plus, Filter, Calculator, Table, Cloud,
  Eye, EyeOff, Lock, Unlock, ChevronDown, 
  Folder, Image, Type, BarChart2, PieChart, LineChart, Square,
  Trash2, Settings, Move, Grid, Palette
} from 'lucide-react'
import BackgroundSettings from './BackgroundSettings'

interface UnifiedSidebarProps {
  // Layers panel props
  items: any[]
  selectedItem: string | null
  onSelectItem: (id: string) => void
  onUpdateItem: (id: string, updates: any) => void
  onDeleteItem: (id: string) => void
  onReorderLayers: (layers: string[]) => void
  canvasBackground?: any
  onUpdateBackground?: (background: any) => void
  showGrid?: boolean
  onToggleGrid?: (show: boolean) => void
  
  // Data panel props
  onAddDataSource: (type: string) => void
  onAddTransform: () => void
  dataSources?: any[]
  
  // Common props
  isOpen: boolean
  onToggle: () => void
  isDarkMode?: boolean
}

function UnifiedSidebar({
  items,
  selectedItem,
  onSelectItem,
  onUpdateItem,
  onDeleteItem,
  onReorderLayers,
  canvasBackground,
  onUpdateBackground,
  showGrid = true,
  onToggleGrid,
  onAddDataSource,
  onAddTransform,
  dataSources = [],
  isOpen,
  onToggle,
  isDarkMode
}: UnifiedSidebarProps) {
  const [activeTab, setActiveTab] = useState<'layers' | 'data'>('layers')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null)
  const [showBackgroundSettings, setShowBackgroundSettings] = useState(false)

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
    if (draggedLayer && draggedLayer !== layerId) {
      // Visual feedback for drag over
    }
  }

  const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault()
    if (draggedLayer && draggedLayer !== targetLayerId) {
      // Reorder layers
      const currentOrder = items.map(item => item.id)
      const draggedIndex = currentOrder.indexOf(draggedLayer)
      const targetIndex = currentOrder.indexOf(targetLayerId)
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newOrder = [...currentOrder]
        newOrder.splice(draggedIndex, 1)
        newOrder.splice(targetIndex, 0, draggedLayer)
        onReorderLayers(newOrder)
      }
    }
    setDraggedLayer(null)
  }

  const dataSourceButtons = [
    { type: 'googlesheets', label: 'Google Sheets', Icon: FileSpreadsheet, color: 'text-green-600' },
    { type: 'database', label: 'Database', Icon: Database, color: 'text-blue-600' },
    { type: 'shopify', label: 'Shopify', Icon: ShoppingBag, color: 'text-green-500' },
    { type: 'stripe', label: 'Stripe', Icon: CreditCard, color: 'text-purple-600' },
    { type: 'googleads', label: 'Google Ads', Icon: Megaphone, color: 'text-blue-500' },
  ]

  if (!isOpen) {
    return (
      <div className={`fixed left-4 top-20 z-10 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        <button
          onClick={onToggle}
          className={`p-2 rounded-lg shadow-lg transition-all hover:scale-105 ${
            isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
          }`}
          title="Open sidebar"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    )
  }

  return (
    <div className={`fixed left-4 top-20 w-64 h-[calc(100vh-80px)] border shadow-lg z-10 flex flex-col animate-slideInLeft rounded-lg overflow-hidden ${
      isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-indigo-400'
    }`}>
      {/* Header with tabs */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50'}`}>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('layers')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'layers'
                  ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-white shadow-sm text-indigo-800')
                  : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
              }`}
            >
              <Layers size={14} />
              <span className="text-sm font-medium">Layers</span>
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'data'
                  ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-white shadow-sm text-indigo-800')
                  : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
              }`}
            >
              <Database size={14} />
              <span className="text-sm font-medium">Data</span>
            </button>
          </div>
          <button
            onClick={onToggle}
            className={`p-1 rounded transition-colors ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-indigo-100 text-indigo-600'
            }`}
            title="Close sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'layers' ? (
        <>
          {/* Canvas Background Settings */}
          <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setShowBackgroundSettings(!showBackgroundSettings)}
              className={`w-full flex items-center justify-between text-xs font-medium ${
                isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
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
                  onUpdateBackground={onUpdateBackground || (() => {})}
                  showGrid={showGrid}
                  onToggleGrid={onToggleGrid || (() => {})}
                  isDarkMode={isDarkMode}
                />
              </div>
            )}
          </div>

          {/* Layers List */}
          <div className="flex-1 overflow-y-auto p-2">
            {items.length === 0 ? (
              <div className={`text-center text-xs py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                No layers yet
              </div>
            ) : (
              <div className="space-y-1">
                {items
                  .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
                  .map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragOver={(e) => handleDragOver(e, item.id)}
                      onDrop={(e) => handleDrop(e, item.id)}
                      onClick={() => onSelectItem(item.id)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all ${
                        selectedItem === item.id
                          ? (isDarkMode ? 'bg-blue-900/30 border-blue-500' : 'bg-blue-50 border-blue-300')
                          : (isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50')
                      } border ${selectedItem === item.id ? '' : 'border-transparent'}`}
                    >
                      {getItemIcon(item.type)}
                      <span className={`text-xs flex-1 truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {item.name || item.type || 'Untitled'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onUpdateItem(item.id, { visible: !item.visible })
                          }}
                          className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700`}
                        >
                          {item.visible !== false ? 
                            <Eye size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} /> : 
                            <EyeOff size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                          }
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onUpdateItem(item.id, { locked: !item.locked })
                          }}
                          className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700`}
                        >
                          {item.locked ? 
                            <Lock size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} /> : 
                            <Unlock size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                          }
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteItem(item.id)
                          }}
                          className={`p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30`}
                          title="Delete layer"
                        >
                          <Trash2 size={12} className={`${isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'}`} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Layer Actions */}
          <div className={`p-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} space-y-2`}>
            <button
              className={`w-full px-3 py-1.5 text-white text-xs rounded transition-colors flex items-center justify-center gap-2 ${
                isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
              title="Group selected layers"
            >
              <Plus size={14} />
              Create Group
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Data Sources Section */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-3">
              {/* Add Data Source */}
              <div>
                <h4 className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Add Data Source
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {dataSourceButtons.map((source) => {
                    const { Icon, type, label, color } = source
                    if (!Icon) return null // Safety check
                    
                    return (
                      <button
                        key={type}
                        onClick={() => onAddDataSource(type)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all hover:scale-105 ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                            : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-md'
                        }`}
                        title={`Add ${label}`}
                      >
                        <Icon size={20} className={color} />
                        <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Transform Tools */}
              <div>
                <h4 className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Transform Data
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onAddTransform}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all hover:scale-105 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-md'
                    }`}
                    title="Add Transform"
                  >
                    <Filter size={20} className="text-purple-600" />
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Filter
                    </span>
                  </button>
                  <button
                    onClick={onAddTransform}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all hover:scale-105 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-md'
                    }`}
                    title="Add Calculator"
                  >
                    <Calculator size={20} className="text-green-600" />
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Calculate
                    </span>
                  </button>
                  <button
                    onClick={onAddTransform}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all hover:scale-105 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-md'
                    }`}
                    title="Add Aggregation"
                  >
                    <Table size={20} className="text-orange-600" />
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Aggregate
                    </span>
                  </button>
                  <button
                    onClick={onAddTransform}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all hover:scale-105 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-md'
                    }`}
                    title="Join Data"
                  >
                    <Cloud size={20} className="text-blue-600" />
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Join
                    </span>
                  </button>
                </div>
              </div>

              {/* Active Data Sources */}
              <div>
                <h4 className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Active Sources ({dataSources ? dataSources.length : 0})
                </h4>
                {dataSources && dataSources.length > 0 ? (
                  <div className="space-y-1">
                    {dataSources.map((source) => (
                      <div
                        key={source.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${
                          isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          source.connected ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <span className="flex-1 truncate">{source.label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} italic`}>
                    No data sources added yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Data Actions */}
          <div className={`p-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} space-y-2`}>
            <button
              className={`w-full px-3 py-1.5 text-xs rounded transition-colors flex items-center justify-center gap-2 ${
                isDarkMode 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              title="Import dataset"
            >
              <Plus size={14} />
              Import Dataset
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default React.memo(UnifiedSidebar)