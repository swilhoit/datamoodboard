'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import VisualizationItem from './StableVisualizationItem'
import DataTable from './DataTable'
import TransformNode from './TransformNode'
import ChartOutputNode from './ChartOutputNode'
import ConnectionLines from './ConnectionLines'

  // Dynamically import React Flow canvas for data mode
  const DataFlowCanvas = dynamic(() => import('./DataFlowCanvas'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <div className="text-gray-400">Loading data flow canvas...</div>
    </div>
  )
 })
import DesignToolbar from './DesignToolbar'
import DataNodePanel from './DataNodePanel'
import DatabaseConnector from './DatabaseConnector'
import GoogleSheetsConnector from './GoogleSheetsConnector'
import ShopifyConnector from './ShopifyConnector'
import StripeConnector from './StripeConnector'
import GoogleAdsConnector from './GoogleAdsConnector'
import CanvasToolbar from './CanvasToolbar'
import CanvasElement from './CanvasElement'
import TextElement from './TextElement'
import ContextMenu from './ContextMenu'
import { Move, ZoomIn, ZoomOut, Maximize2, Database, Grid3X3, Minimize2, RotateCcw, Type } from 'lucide-react'
// CanvasMode removed - unified canvas
type CanvasMode = 'design' | 'data' // Legacy type for compatibility
import { processTransformNode } from '@/lib/dataProcessor'

interface CanvasProps {
  mode: CanvasMode
  items: any[]
  setItems: (items: any[]) => void
  connections?: any[]
  setConnections?: (connections: any[]) => void
  selectedItem: string | null
  setSelectedItem: (id: string | null) => void
  selectedItemData?: any
  onUpdateStyle?: (id: string, style: any) => void
  onSelectedItemDataChange?: (data: any) => void
  onUpdateCanvasElement?: (id: string, updates: any) => void
  elements?: any[]
  setElements?: (elements: any[]) => void
  background?: any
  showGrid?: boolean
  onToggleGrid?: () => void
  onToggleFullscreen?: () => void
  isDarkMode?: boolean
  onOpenBlocks?: () => void
  hideToolbar?: boolean
  scrollable?: boolean
}

export default function Canvas({ mode, items, setItems, connections = [], setConnections, selectedItem, setSelectedItem, selectedItemData, onUpdateStyle, onSelectedItemDataChange, onUpdateCanvasElement, elements, setElements, background, showGrid = true, onToggleGrid, onToggleFullscreen, isDarkMode = false, onOpenBlocks, hideToolbar = false, scrollable = false }: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })
  const [transformNodes, setTransformNodes] = useState<any[]>([])
  const [chartNodes, setChartNodes] = useState<any[]>([])
  const [internalCanvasElements, setInternalCanvasElements] = useState<any[]>([])
  const canvasElements = elements ?? internalCanvasElements
  const setCanvasElements = setElements ?? setInternalCanvasElements
  const [showConnector, setShowConnector] = useState(false)
  const [showGoogleSheets, setShowGoogleSheets] = useState(false)
  const [showShopify, setShowShopify] = useState(false)
  const [showStripe, setShowStripe] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<any>(null)
  const [draggedConnection, setDraggedConnection] = useState<any>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [selectedTool, setSelectedTool] = useState('pointer')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState<{x: number, y: number}[]>([])
  const [markerConfig, setMarkerConfig] = useState<any>({ color: '#FF6B6B', size: 4, opacity: 0.8 })
  const [pendingText, setPendingText] = useState<any>(null)
  const lastSelectedElementRef = useRef<any>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item?: any } | null>(null)


  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only handle mouse events in design mode
    if (mode !== 'design') return
    
    if (e.button === 1 || (e.button === 0 && e.shiftKey) || (e.button === 0 && selectedTool === 'hand')) {
      setIsPanning(true)
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      e.preventDefault()
    } else if (selectedTool === 'marker' && e.button === 0) {
      setIsDrawing(true)
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left - pan.x) / zoom
        const y = (e.clientY - rect.top - pan.y) / zoom
        setCurrentStroke([{ x, y }])
      }
      e.preventDefault()
    } else if (selectedTool === 'text' && pendingText && e.button === 0) {
      // Place the text at click position
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left - pan.x) / zoom
        const y = (e.clientY - rect.top - pan.y) / zoom
        
        const newTextElement = {
          id: `text-${Date.now()}`,
          type: 'text',
          x: x,
          y: y,
          ...pendingText,
          zIndex: Math.max(0, ...items.map(i => i.zIndex || 0), ...canvasElements.map(e => e.zIndex || 0)) + 1
        }
        
        setCanvasElements([...canvasElements, newTextElement])
        setPendingText(null)
        setSelectedTool('pointer')
        setSelectedItem(newTextElement.id)
      }
      e.preventDefault()
    }
  }, [mode, pan, selectedTool, zoom, pendingText, items, canvasElements, setSelectedItem])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Only handle mouse events in design mode with canvasRef
    if (mode !== 'design') return
    
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      })
    } else if (isDrawing && selectedTool === 'marker' && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / zoom
      const y = (e.clientY - rect.top - pan.y) / zoom
      setCurrentStroke(prev => [...prev, { x, y }])
    }
    
    // Update mouse position for connection dragging
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const mouseX = (e.clientX - rect.left - pan.x) / zoom
      const mouseY = (e.clientY - rect.top - pan.y) / zoom
      setMousePosition({ x: mouseX, y: mouseY })
    }
  }, [mode, isPanning, startPan, isDrawing, selectedTool, pan, zoom])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
    
    if (isDrawing && selectedTool === 'marker' && currentStroke.length > 1) {
      // Convert stroke points to SVG path
      const pathData = `M ${currentStroke[0].x} ${currentStroke[0].y} ` +
        currentStroke.slice(1).map(point => `L ${point.x} ${point.y}`).join(' ')
      
      // Create a marker element with the stroke path
      const newMarker = {
        id: `marker-${Date.now()}`,
        type: 'marker',
        x: Math.min(...currentStroke.map(p => p.x)) - 10,
        y: Math.min(...currentStroke.map(p => p.y)) - 10,
        width: Math.max(...currentStroke.map(p => p.x)) - Math.min(...currentStroke.map(p => p.x)) + 20,
        height: Math.max(...currentStroke.map(p => p.y)) - Math.min(...currentStroke.map(p => p.y)) + 20,
        paths: [pathData],
        color: markerConfig.color,
        size: markerConfig.size,
        opacity: markerConfig.opacity,
        zIndex: Math.max(0, ...items.map(i => i.zIndex || 0), ...canvasElements.map(e => e.zIndex || 0)) + 1
      }
      setCanvasElements([...canvasElements, newMarker])
      setCurrentStroke([])
    }
    
    setIsDrawing(false)
  }, [isDrawing, selectedTool, currentStroke, markerConfig])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only unselect if clicking on the canvas background (not on items)
    if (e.target === e.currentTarget && selectedItem && selectedTool === 'pointer') {
      setSelectedItem(null)
    }
  }, [selectedItem, setSelectedItem, selectedTool])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    if (mode !== 'design') return
    
    // Find if we clicked on an item
    const clickedItem = [...items, ...canvasElements].find(item => {
      const el = document.getElementById(`item-${item.id}`)
      if (el && el.contains(e.target as Node)) return true
      return false
    })
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item: clickedItem || (selectedItem ? items.find(i => i.id === selectedItem) || canvasElements.find(e => e.id === selectedItem) : null)
    })
  }, [mode, items, canvasElements, selectedItem])

  const handleContextMenuAction = useCallback((action: string, data?: any) => {
    const targetItem = contextMenu?.item || (selectedItem ? [...items, ...canvasElements].find(i => i.id === selectedItem) : null)
    
    switch (action) {
      case 'delete':
        if (targetItem) {
          if (items.find(i => i.id === targetItem.id)) {
            deleteItem(targetItem.id)
          } else {
            deleteCanvasElement(targetItem.id)
          }
        }
        break
      
      case 'duplicate':
        if (targetItem) {
          const newItem = {
            ...targetItem,
            id: `${targetItem.type}-${Date.now()}`,
            x: (targetItem.x || 0) + 20,
            y: (targetItem.y || 0) + 20,
            zIndex: Math.max(0, ...items.map(i => i.zIndex || 0), ...canvasElements.map(e => e.zIndex || 0)) + 1
          }
          if (items.find(i => i.id === targetItem.id)) {
            setItems([...items, newItem])
          } else {
            setCanvasElements([...canvasElements, newItem])
          }
          setSelectedItem(newItem.id)
        }
        break
        
      case 'bringToFront':
        if (targetItem) {
          const maxZ = Math.max(0, ...items.map(i => i.zIndex || 0), ...canvasElements.map(e => e.zIndex || 0))
          updateZIndex(targetItem.id, maxZ + 1)
        }
        break
        
      case 'sendToBack':
        if (targetItem) {
          const minZ = Math.min(0, ...items.map(i => i.zIndex || 0), ...canvasElements.map(e => e.zIndex || 0))
          updateZIndex(targetItem.id, minZ - 1)
        }
        break
        
      case 'bringForward':
        if (targetItem) {
          updateZIndex(targetItem.id, (targetItem.zIndex || 0) + 1)
        }
        break
        
      case 'sendBackward':
        if (targetItem) {
          updateZIndex(targetItem.id, (targetItem.zIndex || 0) - 1)
        }
        break
        
      case 'addText':
        const textElement = {
          id: `text-${Date.now()}`,
          type: 'text',
          x: data.x,
          y: data.y,
          text: 'New Text',
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#000000',
          zIndex: Math.max(0, ...items.map(i => i.zIndex || 0), ...canvasElements.map(e => e.zIndex || 0)) + 1
        }
        setCanvasElements([...canvasElements, textElement])
        setSelectedItem(textElement.id)
        break
        
      case 'addShape':
        const shapeElement = {
          id: `shape-${Date.now()}`,
          type: 'shape',
          shapeType: data.type,
          x: data.x,
          y: data.y,
          width: 100,
          height: 100,
          fill: '#3B82F6',
          stroke: '#1E40AF',
          strokeWidth: 2,
          zIndex: Math.max(0, ...items.map(i => i.zIndex || 0), ...canvasElements.map(e => e.zIndex || 0)) + 1
        }
        setCanvasElements([...canvasElements, shapeElement])
        setSelectedItem(shapeElement.id)
        break
        
      case 'addChart':
        const chartItem = {
          id: `${data.type}-${Date.now()}`,
          type: data.type,
          x: data.x,
          y: data.y,
          width: data.type === 'pieChart' ? 300 : 400,
          height: 300,
          data: generateSampleData(data.type),
          zIndex: Math.max(0, ...items.map(i => i.zIndex || 0), ...canvasElements.map(e => e.zIndex || 0)) + 1
        }
        setItems([...items, chartItem])
        setSelectedItem(chartItem.id)
        break
        
      case 'changeBackground':
        // This should trigger the background change panel
        // You might want to emit an event or callback to the parent
        break
        
      case 'showLayers':
        // This should show the layers panel
        // You might want to emit an event or callback to the parent
        break
    }
    
    setContextMenu(null)
  }, [contextMenu, selectedItem, items, canvasElements, setItems, setSelectedItem])

  const updateZIndex = (id: string, zIndex: number) => {
    if (items.find(i => i.id === id)) {
      setItems(items.map(item => item.id === id ? { ...item, zIndex } : item))
    } else {
      const updated = canvasElements.map(el => (el.id === id ? { ...el, zIndex } : el))
      setCanvasElements(updated)
    }
  }


  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoom(prevZoom => Math.min(Math.max(0.1, prevZoom * delta), 5))
    }
  }, [])

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 5))
  const handleZoomOut = () => setZoom(z => Math.max(z * 0.8, 0.1))
  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    if (onToggleFullscreen) {
      onToggleFullscreen()
    }
  }

  const updateItem = (id: string, updates: any) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item))
  }

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
    if (selectedItem === id) setSelectedItem(null)
  }

  const updateCanvasElement = (id: string, updates: any) => {
    const updated = canvasElements.map(el => (el.id === id ? { ...el, ...updates } : el))
    setCanvasElements(updated)
    // Also notify parent if callback is provided
    if (onUpdateCanvasElement) {
      onUpdateCanvasElement(id, updates)
    }
  }

  const deleteCanvasElement = (id: string) => {
    const filtered = canvasElements.filter(el => el.id !== id)
    setCanvasElements(filtered)
  }

  const updateTransformNode = (id: string, updates: any) => {
    setTransformNodes(nodes => nodes.map(node => 
      node.id === id ? { ...node, ...updates } : node
    ))
  }

  const deleteTransformNode = (id: string) => {
    setTransformNodes(nodes => nodes.filter(node => node.id !== id))
    // Also remove connections involving this node
    if (setConnections) {
      setConnections(connections.filter(conn => 
        conn.sourceId !== id && conn.targetId !== id
      ))
    }
  }

  const updateChartNode = (id: string, updates: any) => {
    setChartNodes(nodes => nodes.map(node => 
      node.id === id ? { ...node, ...updates } : node
    ))
  }

  const deleteChartNode = (id: string) => {
    setChartNodes(nodes => nodes.filter(node => node.id !== id))
    // Also remove connections involving this node
    if (setConnections) {
      setConnections(connections.filter(conn => 
        conn.sourceId !== id && conn.targetId !== id
      ))
    }
  }


  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts if user is typing in an input or textarea
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement)?.contentEditable === 'true') {
      return
    }

    // Tool shortcuts
    switch (e.key.toLowerCase()) {
      case 'v':
        setSelectedTool('pointer')
        return
      case 'h':
        setSelectedTool('hand')
        return
      case 't':
        setSelectedTool('text')
        return
    }

    // Delete selected item
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItem) {
      e.preventDefault()
      
      // Find and delete the selected item
      if (mode === 'design') {
        // Check if it's a canvas item (chart/visualization)
        const item = items.find(i => i.id === selectedItem)
        if (item) {
          deleteItem(selectedItem)
        } else {
          // Check if it's a canvas element (text/image/shape)
          const element = canvasElements.find(el => el.id === selectedItem)
          if (element) {
            deleteCanvasElement(selectedItem)
          }
        }
      } else if (mode === 'data') {
        // Check if it's a data table
        const table = items.find(i => i.id === selectedItem)
        if (table) {
          deleteItem(selectedItem)
        } else {
          // Check if it's a transform node
          const node = transformNodes.find(n => n.id === selectedItem)
          if (node) {
            deleteTransformNode(selectedItem)
          } else {
            // Check if it's a chart node
            const chartNode = chartNodes.find(n => n.id === selectedItem)
            if (chartNode) {
              deleteChartNode(selectedItem)
            }
          }
        }
      }
    }
  }, [selectedItem, mode, items, canvasElements, transformNodes, chartNodes, deleteItem, deleteCanvasElement, deleteTransformNode, deleteChartNode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false })
      return () => canvas.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])


  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Pass selected canvas element data to parent when element changes
  useEffect(() => {
    if (selectedItem && onSelectedItemDataChange) {
      const selectedCanvasElement = canvasElements.find(el => el.id === selectedItem)
      if (selectedCanvasElement) {
        // Only update if the element has actually changed
        if (JSON.stringify(selectedCanvasElement) !== JSON.stringify(lastSelectedElementRef.current)) {
          lastSelectedElementRef.current = selectedCanvasElement
          onSelectedItemDataChange(selectedCanvasElement)
        }
      }
    } else if (!selectedItem && onSelectedItemDataChange) {
      lastSelectedElementRef.current = null
      onSelectedItemDataChange(null)
    }
  }, [selectedItem, canvasElements, onSelectedItemDataChange])

  const handleAddNode = (type: 'table' | 'transform' | 'chart', subType?: any) => {
    if (type === 'table') {
      const newTable = {
        id: `table-${Date.now()}`,
        database: subType?.database || 'postgresql',
        tableName: subType?.name || 'new_table',
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
        width: 300,
        height: 200,
        schema: [
          { name: 'id', type: 'INTEGER', isPrimary: true },
          { name: 'created_at', type: 'TIMESTAMP' },
          { name: 'data', type: 'JSON' },
        ],
      }
      setItems([...items, newTable])
    } else if (type === 'transform') {
      const newNode = {
        id: `node-${Date.now()}`,
        transformType: subType,
        x: Math.random() * 400 + 200,
        y: Math.random() * 300 + 200,
        config: {},
      }
      setTransformNodes([...transformNodes, newNode])
    } else if (type === 'chart') {
      const newChartNode = {
        id: `chart-${Date.now()}`,
        chartType: subType || 'bar',
        chartLibrary: 'recharts',
        x: Math.random() * 400 + 300,
        y: Math.random() * 300 + 100,
        config: {
          xAxis: '',
          yAxis: '',
          theme: 'default',
          colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
          showLegend: true,
          showGrid: true,
          animated: true,
          showDataLabels: false,
        },
      }
      setChartNodes([...chartNodes, newChartNode])
    }
  }

  const handleDatabaseConnect = (config: any) => {
    setShowConnector(false)
    
    if (config.type === 'googlesheets') {
      setShowGoogleSheets(true)
    } else if (config.type === 'shopify') {
      setShowShopify(true)
    } else if (config.type === 'stripe') {
      setShowStripe(true)
    }
  }

  const handleGoogleSheetsConnect = (data: any) => {
    // Create a table with the imported Google Sheets data
    const newTable = {
      id: `table-${Date.now()}`,
      database: 'googlesheets',
      tableName: data.name,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 350,
      height: Math.min(400, 150 + data.schema.length * 30),
      schema: data.schema,
      data: data.data,
      spreadsheetId: data.spreadsheetId,
      range: data.range,
      rowCount: data.rowCount,
    }
    setItems([...items, newTable])
    setShowGoogleSheets(false)
  }

  const handleShopifyConnect = (data: any) => {
    const newTable = {
      id: `table-${Date.now()}`,
      database: 'shopify',
      tableName: data.name,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 350,
      height: Math.min(400, 150 + data.schema.length * 30),
      schema: data.schema,
      data: data.data,
      rowCount: data.rowCount,
    }
    setItems([...items, newTable])
    setShowShopify(false)
  }

  const handleStripeConnect = (data: any) => {
    const newTable = {
      id: `table-${Date.now()}`,
      database: 'stripe',
      tableName: data.name,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 350,
      height: Math.min(400, 150 + data.schema.length * 30),
      schema: data.schema,
      data: data.data,
      rowCount: data.rowCount,
    }
    setItems([...items, newTable])
    setShowStripe(false)
  }

  // Get data for a node based on connections and transformations
  const getNodeData = (nodeId: string): any[] => {
    // Check if it's a table with data
    const table = items.find(item => item.id === nodeId)
    if (table && table.data) {
      return table.data
    }

    // Check if it's a transform node
    const transformNode = transformNodes.find(n => n.id === nodeId)
    if (transformNode) {
      // Find input connections
      const inputConnections = connections.filter(conn => conn.targetId === nodeId)
      
      if (inputConnections.length === 0) return []
      
      // Get primary input data
      const primaryData = getNodeData(inputConnections[0].sourceId)
      
      // Get secondary input data (for joins, unions, etc.)
      let secondaryData: any[] | undefined
      if (inputConnections.length > 1) {
        secondaryData = getNodeData(inputConnections[1].sourceId)
      }
      
      // Process the transformation
      return processTransformNode(
        transformNode.transformType,
        transformNode.config,
        primaryData,
        secondaryData
      )
    }

    // Check if it's a chart node (charts can also be data sources if they transform data)
    const chartNode = chartNodes.find(n => n.id === nodeId)
    if (chartNode) {
      // Find input connections
      const inputConnections = connections.filter(conn => conn.targetId === nodeId)
      
      if (inputConnections.length === 0) return []
      
      // Get input data - charts just pass through data
      return getNodeData(inputConnections[0].sourceId)
    }

    return []
  }



  const handleAddCanvasElement = (type: string, config?: any) => {
    // Handle text tool specially - set pending text and activate text tool
    if (type === 'text') {
      setPendingText(config || { 
        text: 'Click to place text', 
        fontSize: 16, 
        fontFamily: 'Inter',
        color: isDarkMode ? '#F9FAFB' : '#1F2937',
        width: 150,
        height: 40
      })
      setSelectedTool('text')
      return
    }

    // Get viewport center for positioning new elements
    const getViewportCenter = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const centerX = (rect.width / 2 - pan.x) / zoom
        const centerY = (rect.height / 2 - pan.y) / zoom
        return { x: centerX, y: centerY }
      }
      return { x: 400, y: 300 }
    }

    const center = getViewportCenter()
    
    if (type === 'lineChart' || type === 'barChart' || type === 'pieChart' || type === 'scatter' || type === 'area' || type === 'table') {
      // Add as visualization
      const newItem = {
        id: `item-${Date.now()}`,
        type,
        title: `New ${type.charAt(0).toUpperCase() + type.slice(1).replace('Chart', ' Chart')}`,
        x: center.x - 200, // Center horizontally (width is 400)
        y: center.y - 150, // Center vertically (height is 300)
        width: 400,
        height: 300,
        data: generateSampleData(type),
        style: {
          theme: 'modern',
          colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
          background: '#FFFFFF',
          gridColor: '#E5E7EB',
          textColor: '#1F2937',
          font: 'Inter',
          fontSize: 12,
        },
        zIndex: Math.max(0, ...items.map(i => i.zIndex || 0), ...canvasElements.map(e => e.zIndex || 0)) + 1
      }
      setItems([...items, newItem])
    } else if (type === 'marker') {
      // Handle marker tool - just set the tool and config, drawing will happen on mouse interactions
      setSelectedTool('marker')
      if (config) {
        setMarkerConfig(config)
      }
    } else {
      // Add as canvas element (text, image, shape, gif, emoji)
      const elementWidth = type === 'text' ? 150 : (type === 'gif' ? 250 : (type === 'emoji' ? 80 : 200))
      const elementHeight = type === 'text' ? 40 : (type === 'gif' ? 250 : (type === 'emoji' ? 80 : 100))
      
      const newElement = {
        id: `element-${Date.now()}`,
        type: config?.type || type,
        x: config?.x !== undefined ? config.x : center.x - elementWidth / 2,
        y: config?.y !== undefined ? config.y : center.y - elementHeight / 2,
        width: elementWidth,
        height: elementHeight,
        zIndex: Math.max(0, ...items.map(i => i.zIndex || 0), ...canvasElements.map(e => e.zIndex || 0)) + 1,
        ...config
      }
      setCanvasElements([...canvasElements, newElement])
    }
  }

  const handleAddMedia = (src: string, type: 'image' | 'gif') => {
    // Get viewport center for positioning new elements
    const getViewportCenter = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const centerX = (rect.width / 2 - pan.x) / zoom
        const centerY = (rect.height / 2 - pan.y) / zoom
        return { x: centerX, y: centerY }
      }
      return { x: 400, y: 300 }
    }

    const center = getViewportCenter()
    const elementWidth = type === 'gif' ? 250 : 300
    const elementHeight = type === 'gif' ? 250 : 200
    
    const newElement = {
      id: `element-${Date.now()}`,
      type: type,
      x: center.x - elementWidth / 2,
      y: center.y - elementHeight / 2,
      width: elementWidth,
      height: elementHeight,
      src: src,
      zIndex: Math.max(0, ...items.map(i => i.zIndex || 0), ...canvasElements.map(e => e.zIndex || 0)) + 1
    }
    setCanvasElements([...canvasElements, newElement])
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
          { name: 'A', value: 4000 },
          { name: 'B', value: 3000 },
          { name: 'C', value: 2000 },
          { name: 'D', value: 2780 },
        ]
      case 'pieChart':
        return [
          { name: 'Group A', value: 400 },
          { name: 'Group B', value: 300 },
          { name: 'Group C', value: 300 },
          { name: 'Group D', value: 200 },
        ]
      case 'table':
        return [
          { id: 1, name: 'John Doe', department: 'Engineering', salary: 95000, status: 'Active' },
          { id: 2, name: 'Jane Smith', department: 'Marketing', salary: 85000, status: 'Active' },
          { id: 3, name: 'Bob Johnson', department: 'Sales', salary: 78000, status: 'On Leave' },
          { id: 4, name: 'Alice Brown', department: 'Engineering', salary: 105000, status: 'Active' },
          { id: 5, name: 'Charlie Wilson', department: 'HR', salary: 72000, status: 'Active' },
          { id: 6, name: 'Diana Prince', department: 'Marketing', salary: 88000, status: 'Active' },
          { id: 7, name: 'Eve Adams', department: 'Engineering', salary: 98000, status: 'Active' },
          { id: 8, name: 'Frank Miller', department: 'Sales', salary: 82000, status: 'Active' },
          { id: 9, name: 'Grace Lee', department: 'Finance', salary: 92000, status: 'Active' },
          { id: 10, name: 'Henry Ford', department: 'Operations', salary: 87000, status: 'Active' },
        ]
      default:
        return []
    }
  }

  // Handle connection creation in data mode
  const handleStartConnection = (sourceId: string, sourceType: 'table' | 'node', e: React.MouseEvent, outputIndex: number = 0) => {
    console.log('Starting connection from:', sourceId, sourceType)
    e.preventDefault()
    e.stopPropagation()
    
    setIsConnecting(true)
    setConnectionStart({ id: sourceId, type: sourceType, outputIndex })

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const startX = (e.clientX - rect.left - pan.x) / zoom
      const startY = (e.clientY - rect.top - pan.y) / zoom
      
      // Get the actual position of the source element
      let sourceX = startX
      let sourceY = startY
      
      if (sourceType === 'table') {
        const table = items.find(i => i.id === sourceId)
        if (table) {
          sourceX = table.x + table.width - 6
          sourceY = table.y + 60
        }
      }
      
      setDraggedConnection({
        sourceId: sourceId,
        sourceX,
        sourceY,
        targetX: startX,
        targetY: startY,
      })
      setMousePosition({ x: startX, y: startY })
    }
  }

  const handleEndConnection = (targetId: string, targetType: 'table' | 'node', inputIndex: number = 0) => {
    console.log('Ending connection at:', targetId, targetType, 'isConnecting:', isConnecting, 'connectionStart:', connectionStart)
    if (isConnecting && connectionStart && setConnections) {
      // Don't allow self-connections
      if (connectionStart.id === targetId) {
        console.log('Rejecting self-connection')
        setIsConnecting(false)
        setConnectionStart(null)
        setDraggedConnection(null)
        return
      }

      // Check if connection already exists
      const existingConnection = connections.find(conn => 
        conn.sourceId === connectionStart.id && 
        conn.targetId === targetId &&
        conn.sourceIndex === connectionStart.outputIndex &&
        conn.targetIndex === inputIndex
      )

      if (!existingConnection) {
        const newConnection = {
          id: `conn-${Date.now()}`,
          sourceId: connectionStart.id,
          targetId: targetId,
          sourceIndex: connectionStart.outputIndex,
          targetIndex: inputIndex,
          sourceType: connectionStart.type,
          targetType: targetType,
          type: 'data'
        }
        console.log('Creating new connection:', newConnection)
        setConnections([...connections, newConnection])
      } else {
        console.log('Connection already exists')
      }
      
      setIsConnecting(false)
      setConnectionStart(null)
      setDraggedConnection(null)
    }
  }

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (isConnecting && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const mouseX = (e.clientX - rect.left - pan.x) / zoom
      const mouseY = (e.clientY - rect.top - pan.y) / zoom
      
      setMousePosition({ x: mouseX, y: mouseY })
      
      if (draggedConnection) {
        setDraggedConnection({
          ...draggedConnection,
          targetX: mouseX,
          targetY: mouseY,
        })
      }
    }
  }

  // Use React Flow canvas for data mode
  if (mode === 'data') {
    return (
      <div className="relative w-full h-full overflow-hidden">
        <DataFlowCanvas isDarkMode={isDarkMode} background={background} showGrid={showGrid} />
      </div>
    )
  }

  // Original canvas for design mode
  return (
    <div className={`relative w-full h-full ${scrollable ? 'overflow-auto' : 'overflow-hidden'} bg-gray-100`} onContextMenu={handleContextMenu}>
      {/* Show text placement indicator */}
      {selectedTool === 'text' && pendingText && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Type size={16} />
          <span className="text-sm">Click anywhere on the canvas to place text</span>
        </div>
      )}

      {/* Canvas Toolbar for Design Mode */}
      {!hideToolbar && !isFullscreen && (
        <CanvasToolbar 
        mode={mode}
        onAddElement={handleAddCanvasElement}
        onAddMedia={handleAddMedia}
        selectedItem={selectedItem}
        onToolChange={setSelectedTool}
        isDarkMode={isDarkMode}
        onOpenBlocks={onOpenBlocks}
        onDelete={() => {
          if (selectedItem) {
            // Check if it's a canvas item (chart/visualization)
            const item = items.find(i => i.id === selectedItem)
            if (item) {
              deleteItem(selectedItem)
            } else {
              // Check if it's a canvas element (text/image/shape)
              const element = canvasElements.find(el => el.id === selectedItem)
              if (element) {
                deleteCanvasElement(selectedItem)
              }
            }
          }
        }}
      />
      )}

      {/* Data mode side panels would render here, but this component returns early when mode === 'data' */}

      
      {!hideToolbar && !isFullscreen && (
        <div className="absolute bottom-24 right-4 z-10 flex flex-col items-end gap-2 animate-fadeIn">
          <button
            onClick={handleZoomIn}
            className={`p-2 rounded-lg shadow-md hover:shadow-lg transition-all-smooth hover-lift button-press ${
              isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700'
            }`}
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={handleZoomOut}
            className={`p-2 rounded-lg shadow-md hover:shadow-lg transition-all-smooth hover-lift button-press ${
              isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700'
            }`}
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={handleResetView}
            className={`p-2 rounded-lg shadow-md hover:shadow-lg transition-all-smooth hover-lift button-press ${
              isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700'
            }`}
            title="Reset Zoom & Pan"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={onToggleGrid}
            className={`p-2 rounded-lg shadow-md hover:shadow-lg transition-all-smooth hover-lift button-press ${
              showGrid 
                ? 'bg-blue-500 text-white' 
                : (isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50')
            }`}
            title={showGrid ? 'Hide Grid' : 'Show Grid'}
          >
            <Grid3X3 size={20} />
          </button>
          <button
            onClick={handleToggleFullscreen}
            className={`p-2 rounded-lg shadow-md hover:shadow-lg transition-all-smooth hover-lift button-press ${
              isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700'
            }`}
            title="Enter Fullscreen Presentation Mode"
          >
            <Maximize2 size={20} />
          </button>
          <div className={`px-3 py-2 rounded-lg shadow-md ${
            isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
          }`}>
            <span className="text-sm font-medium">Zoom: {Math.round(zoom * 100)}%</span>
          </div>
          <div className={`px-3 py-2 rounded-lg shadow-md flex items-center gap-2 ${
            isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
          }`}>
            <Move size={16} />
            <span className="text-sm">{selectedTool === 'hand' ? 'Hand tool active - Click & drag to pan' : 'Hold Shift + Drag to pan'}</span>
          </div>
        </div>
      )}

      {/* Fullscreen Mode Controls */}
      {!hideToolbar && isFullscreen && (
        <div className="absolute top-4 right-4 z-50 flex gap-2 animate-fadeIn">
          <button
            onClick={handleToggleFullscreen}
            className="p-3 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors backdrop-blur-sm"
            title="Exit Fullscreen"
          >
            <Minimize2 size={24} />
          </button>
        </div>
      )}

      <div
        ref={canvasRef}
        className="w-full h-full relative"
        style={{
          cursor: isPanning ? 'grabbing' : selectedTool === 'hand' ? 'grab' : selectedTool === 'marker' ? 'crosshair' : (selectedTool === 'text' && pendingText ? 'text' : 'default'),
          ...(background?.type === 'color' && {
            backgroundColor: background.value
          }),
          ...(background?.type === 'gradient' && {
            backgroundImage: background.value,
            backgroundColor: 'transparent'
          }),
          ...(background?.type === 'image' && {
            backgroundImage: `url(${background.value})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            backgroundColor: 'transparent'
          }),
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => {
          handleMouseMove(e)
          handleMouseMoveCanvas(e)
        }}
        onMouseUp={() => {
          handleMouseUp()
          // Reset connection state if no target was hit (with small delay)
          if (isConnecting) {
            setTimeout(() => {
              if (isConnecting) {
                setIsConnecting(false)
                setConnectionStart(null)
                setDraggedConnection(null)
              }
            }, 100)
          }
        }}
        onClick={handleCanvasClick}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 2,
          }}
        >
          {/* Grid Background - render behind canvas elements */}
          {showGrid && (
            <div
              className="absolute pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(0deg, rgba(0,0,0,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                `,
                backgroundSize: `${20}px ${20}px`,
                width: '5000px',
                height: '5000px',
                left: '-1000px',
                top: '-1000px',
                zIndex: -1,
              }}
            />
          )}
          
          {/* Render dragged connection line in data mode */}
          {isConnecting && connectionStart && (
            <svg 
              className="absolute top-0 left-0 pointer-events-none" 
              style={{ 
                width: '5000px', 
                height: '5000px',
                overflow: 'visible'
              }}
            >
              <line
                x1={(() => {
                  if (connectionStart.type === 'table') {
                    const table = items.find(i => i.id === connectionStart.id)
                    return table ? table.x + table.width - 6 : 0
                  } else {
                    const node = transformNodes.find(n => n.id === connectionStart.id) || 
                                 chartNodes.find(n => n.id === connectionStart.id)
                    return node ? node.x + 180 - 6 : 0
                  }
                })()}
                y1={(() => {
                  if (connectionStart.type === 'table') {
                    const table = items.find(i => i.id === connectionStart.id)
                    return table ? table.y + 60 : 0
                  } else {
                    const node = transformNodes.find(n => n.id === connectionStart.id) || 
                                 chartNodes.find(n => n.id === connectionStart.id)
                    const outputIndex = connectionStart.outputIndex || 0
                    return node ? node.y + 30 + (outputIndex * 20) : 0
                  }
                })()}
                x2={mousePosition.x}
                y2={mousePosition.y}
                stroke="#3B82F6"
                strokeWidth="2"
                strokeDasharray="5,5"
                markerEnd="url(#arrowhead)"
              />
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#3B82F6"
                  />
                </marker>
              </defs>
            </svg>
          )}

          {/* Render items based on mode */}
          {mode === 'design' ? (
            <>
              {/* Canvas Elements (text, images, shapes, gifs) */}
              {canvasElements.map((element) => (
                element.type === 'text' ? (
                  <TextElement
                    key={element.id}
                    element={element}
                    isSelected={selectedItem === element.id}
                    onSelect={() => setSelectedItem(element.id)}
                    onUpdate={updateCanvasElement}
                    onDelete={deleteCanvasElement}
                  />
                ) : (
                  <CanvasElement
                    key={element.id}
                    element={element}
                    isSelected={selectedItem === element.id}
                    onSelect={() => setSelectedItem(element.id)}
                    onUpdate={updateCanvasElement}
                    onDelete={deleteCanvasElement}
                  />
                )
              ))}
              
              {/* Drawing Overlay - Current stroke being drawn */}
              {isDrawing && currentStroke.length > 1 && (
                <svg 
                  className="absolute pointer-events-none"
                  style={{ 
                    left: 0, 
                    top: 0, 
                    width: '5000px', 
                    height: '5000px',
                    overflow: 'visible'
                  }}
                >
                  <path
                    d={`M ${currentStroke[0].x} ${currentStroke[0].y} ` +
                      currentStroke.slice(1).map(point => `L ${point.x} ${point.y}`).join(' ')}
                    stroke={markerConfig.color}
                    strokeWidth={markerConfig.size}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={markerConfig.opacity}
                  />
                </svg>
              )}
              
              {/* Visualizations */}
              {items.map((item) => (
                <VisualizationItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItem === item.id}
                  onSelect={() => setSelectedItem(item.id)}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                />
              ))}
            </>
          ) : (
            <>
              {/* Connection lines in data mode */}
              {connections && (
                <ConnectionLines
                  connections={connections}
                  tables={items}
                  nodes={[...transformNodes, ...chartNodes]}
                  zoom={zoom}
                />
              )}
              
              {/* Render data tables */}
              {items.map((item) => (
                <DataTable
                  key={item.id}
                  table={item}
                  isSelected={selectedItem === item.id}
                  onSelect={() => setSelectedItem(item.id)}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                  onStartConnection={(id, e) => handleStartConnection(id, 'table', e)}
                  onEndConnection={(id) => handleEndConnection(id, 'table')}
                />
              ))}
              
              {/* Render transform nodes */}
              {transformNodes.map((node) => (
                <TransformNode
                  key={node.id}
                  node={node}
                  isSelected={selectedItem === node.id}
                  onSelect={() => setSelectedItem(node.id)}
                  onUpdate={updateTransformNode}
                  onDelete={deleteTransformNode}
                  onStartConnection={(id, outputIndex, e) => handleStartConnection(id, 'node', e, outputIndex)}
                  onEndConnection={(id, inputIndex) => handleEndConnection(id, 'node', inputIndex)}
                />
              ))}
              
              {/* Render chart output nodes */}
              {chartNodes.map((node) => (
                <ChartOutputNode
                  key={node.id}
                  node={node}
                  isSelected={selectedItem === node.id}
                  onSelect={() => setSelectedItem(node.id)}
                  onUpdate={updateChartNode}
                  onDelete={deleteChartNode}
                  onEndConnection={(id) => handleEndConnection(id, 'node')}
                  data={getNodeData(node.id)}
                />
              ))}

            </>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          selectedItem={contextMenu.item}
          onClose={() => setContextMenu(null)}
          onAction={handleContextMenuAction}
        />
      )}
    </div>
  )
}