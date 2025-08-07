'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import VisualizationItem from './VisualizationItem'
import DataTable from './DataTable'
import TransformNode from './TransformNode'
import ChartOutputNode from './ChartOutputNode'
import ConnectionLines from './ConnectionLines'
import DesignToolbar from './DesignToolbar'
import DataNodePanel from './DataNodePanel'
import DatabaseConnector from './DatabaseConnector'
import GoogleSheetsConnector from './GoogleSheetsConnector'
import CanvasToolbar from './CanvasToolbar'
import CanvasElement from './CanvasElement'
import TextElement from './TextElement'
import { Move, ZoomIn, ZoomOut, Maximize2, Database, Grid3X3, Minimize2 } from 'lucide-react'
import { CanvasMode } from '@/app/page'
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
  background?: any
  showGrid?: boolean
  onToggleGrid?: () => void
  onToggleFullscreen?: () => void
}

export default function Canvas({ mode, items, setItems, connections = [], setConnections, selectedItem, setSelectedItem, selectedItemData, onUpdateStyle, onSelectedItemDataChange, onUpdateCanvasElement, background, showGrid = true, onToggleGrid, onToggleFullscreen }: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })
  const [transformNodes, setTransformNodes] = useState<any[]>([])
  const [chartNodes, setChartNodes] = useState<any[]>([])
  const [canvasElements, setCanvasElements] = useState<any[]>([])
  const [showConnector, setShowConnector] = useState(false)
  const [showGoogleSheets, setShowGoogleSheets] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<any>(null)
  const [draggedConnection, setDraggedConnection] = useState<any>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [selectedTool, setSelectedTool] = useState('pointer')
  const [isFullscreen, setIsFullscreen] = useState(false)


  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey) || (e.button === 0 && selectedTool === 'hand')) {
      setIsPanning(true)
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      e.preventDefault()
    }
  }, [pan, selectedTool])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      })
    }
  }, [isPanning, startPan])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only unselect if clicking on the canvas background (not on items)
    if (e.target === e.currentTarget && selectedItem) {
      setSelectedItem(null)
    }
  }, [selectedItem, setSelectedItem])

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
    setCanvasElements(elements => elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ))
    // Also notify parent if callback is provided
    if (onUpdateCanvasElement) {
      onUpdateCanvasElement(id, updates)
    }
  }

  const deleteCanvasElement = (id: string) => {
    setCanvasElements(elements => elements.filter(el => el.id !== id))
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
      if (mode === 'dashboard') {
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
            const chart = chartNodes.find(c => c.id === selectedItem)
            if (chart) {
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

  // Pass selected canvas element data (especially text elements) to parent
  useEffect(() => {
    if (selectedItem && onSelectedItemDataChange) {
      const selectedTextElement = canvasElements.find(el => el.id === selectedItem)
      if (selectedTextElement) {
        onSelectedItemDataChange(selectedTextElement)
      }
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
      const newChart = {
        id: `chart-${Date.now()}`,
        chartType: subType || 'bar',
        title: `New ${(subType || 'bar').charAt(0).toUpperCase() + (subType || 'bar').slice(1)} Chart`,
        x: Math.random() * 400 + 300,
        y: Math.random() * 300 + 100,
        config: {
          xAxis: '',
          yAxis: '',
          colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
        },
      }
      setChartNodes([...chartNodes, newChart])
    }
  }

  const handleDatabaseConnect = (config: any) => {
    if (config.type === 'googlesheets') {
      // Open Google Sheets connector
      setShowGoogleSheets(true)
      setShowConnector(false)
    } else {
      // Simulate adding tables from connected database
      const tables = ['users', 'orders', 'products'].map((name, i) => ({
        id: `table-${Date.now()}-${i}`,
        database: config.type,
        tableName: name,
        x: 100 + i * 350,
        y: 100,
        width: 300,
        height: 250,
        schema: [
          { name: 'id', type: 'INTEGER', isPrimary: true },
          { name: `${name}_name`, type: 'VARCHAR(255)' },
          { name: 'created_at', type: 'TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP' },
        ],
      }))
      setItems([...items, ...tables])
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

    return []
  }

  // Get data for a chart node based on connections
  const getChartData = (chartId: string) => {
    const connection = connections.find(conn => conn.targetId === chartId)
    if (!connection) return []

    return getNodeData(connection.sourceId)
  }

  // Promote chart from data mode to dashboard
  const promoteChartToCanvas = (chartNode: any) => {
    const data = getChartData(chartNode.id)
    const newItem = {
      id: `item-${Date.now()}`,
      type: chartNode.chartType === 'line' ? 'lineChart' : 
            chartNode.chartType === 'pie' ? 'pieChart' : 'barChart',
      title: chartNode.title || `${chartNode.chartType.charAt(0).toUpperCase() + chartNode.chartType.slice(1)} Chart`,
      x: 100,
      y: 100,
      width: 400,
      height: 300,
      data: data.length > 0 ? data : generateSampleData(chartNode.chartType),
      style: {
        theme: 'modern',
        colors: chartNode.config.colors || ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        background: '#FFFFFF',
        gridColor: '#E5E7EB',
        textColor: '#1F2937',
        font: 'Inter',
        fontSize: 12,
      }
    }
    setItems([...items, newItem])
    alert('Chart added to dashboard! Switch to Dashboard Mode to see it.')
  }


  const handleAddCanvasElement = (type: string, config?: any) => {
    if (type === 'lineChart' || type === 'barChart' || type === 'pieChart' || type === 'scatter' || type === 'area' || type === 'table') {
      // Add as visualization
      const newItem = {
        id: `item-${Date.now()}`,
        type,
        title: `New ${type.charAt(0).toUpperCase() + type.slice(1).replace('Chart', ' Chart')}`,
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
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
        }
      }
      setItems([...items, newItem])
    } else {
      // Add as canvas element (text, image, shape, gif)
      const newElement = {
        id: `element-${Date.now()}`,
        type: config?.type || type,
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
        width: type === 'text' ? 150 : (type === 'gif' ? 250 : 200),
        height: type === 'text' ? 40 : (type === 'gif' ? 250 : 100),
        ...config
      }
      setCanvasElements([...canvasElements, newElement])
    }
  }

  const handleAddMedia = (src: string, type: 'image' | 'gif') => {
    const newElement = {
      id: `element-${Date.now()}`,
      type: type,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      width: type === 'gif' ? 250 : 300,
      height: type === 'gif' ? 250 : 200,
      src: src
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
  const handleStartConnection = (sourceId: string, sourceType: 'table' | 'node' | 'chart', e: React.MouseEvent, outputIndex: number = 0) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsConnecting(true)
    setConnectionStart({ id: sourceId, type: sourceType, outputIndex })

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const startX = (e.clientX - rect.left - pan.x) / zoom
      const startY = (e.clientY - rect.top - pan.y) / zoom
      
      setDraggedConnection({
        sourceId: sourceId,
        sourceX: startX,
        sourceY: startY,
        targetX: startX,
        targetY: startY,
      })
    }
  }

  const handleEndConnection = (targetId: string, targetType: 'table' | 'node' | 'chart', inputIndex: number = 0) => {
    if (isConnecting && connectionStart && setConnections) {
      // Don't allow self-connections
      if (connectionStart.id === targetId) {
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
        setConnections([...connections, newConnection])
      }
      
      setIsConnecting(false)
      setConnectionStart(null)
      setDraggedConnection(null)
    }
  }

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (isConnecting && draggedConnection && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const mouseX = (e.clientX - rect.left - pan.x) / zoom
      const mouseY = (e.clientY - rect.top - pan.y) / zoom
      
      setDraggedConnection({
        ...draggedConnection,
        targetX: mouseX,
        targetY: mouseY,
      })
    }
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100">
      {/* Canvas Toolbar for Dashboard Mode */}
      {!isFullscreen && (
        <CanvasToolbar 
        mode={mode}
        onAddElement={handleAddCanvasElement}
        onAddMedia={handleAddMedia}
        selectedItem={selectedItem}
        onDelete={() => {
          if (selectedItem) {
            // Find and delete the selected item
            if (mode === 'dashboard') {
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
                }
              }
            }
          }
        }}
      />
      )}

      {mode === 'data' && !isFullscreen && (
        <>
          <DataNodePanel
            onAddNode={handleAddNode}
            onOpenConnector={() => setShowConnector(true)}
          />
          <DatabaseConnector
            isOpen={showConnector}
            onClose={() => setShowConnector(false)}
            onConnect={handleDatabaseConnect}
          />
          <GoogleSheetsConnector
            isOpen={showGoogleSheets}
            onClose={() => setShowGoogleSheets(false)}
            onConnect={handleGoogleSheetsConnect}
          />
        </>
      )}

      
      {!isFullscreen && (
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 animate-fadeIn">
          <div className="flex gap-2">
            <button
              onClick={handleZoomIn}
              className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all-smooth hover-lift button-press"
              title="Zoom In"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all-smooth hover-lift button-press"
              title="Zoom Out"
            >
              <ZoomOut size={20} />
            </button>
            <button
              onClick={handleResetView}
              className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all-smooth hover-lift button-press"
              title="Reset View"
            >
              <Maximize2 size={20} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onToggleGrid}
              className={`p-2 rounded-lg shadow-md hover:shadow-lg transition-all-smooth hover-lift button-press ${
                showGrid 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title={showGrid ? 'Hide Grid' : 'Show Grid'}
            >
              <Grid3X3 size={20} />
            </button>
            <button
              onClick={handleToggleFullscreen}
              className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all-smooth hover-lift button-press"
              title="Enter Fullscreen Presentation Mode"
            >
              <Maximize2 size={20} />
            </button>
          </div>
          <div className="px-3 py-2 bg-white rounded-lg shadow-md">
            <span className="text-sm font-medium">Zoom: {Math.round(zoom * 100)}%</span>
          </div>
          <div className="px-3 py-2 bg-white rounded-lg shadow-md flex items-center gap-2">
            <Move size={16} />
            <span className="text-sm">{selectedTool === 'hand' ? 'Hand tool active - Click & drag to pan' : 'Hold Shift + Drag to pan'}</span>
          </div>
        </div>
      )}

      {/* Fullscreen Mode Controls */}
      {isFullscreen && (
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
        className="w-full h-full"
        style={{
          cursor: isPanning ? 'grabbing' : selectedTool === 'hand' ? 'grab' : 'default',
          ...(background?.type === 'color' && {
            backgroundColor: background.value
          }),
          ...(background?.type === 'gradient' && {
            background: background.value
          }),
          ...(background?.type === 'image' && {
            backgroundImage: `url(${background.value})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }),
          ...(showGrid && {
            backgroundImage: `
              ${background?.type === 'image' ? `url(${background.value}), ` : ''}
              linear-gradient(0deg, rgba(0,0,0,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
            `,
            backgroundSize: background?.type === 'image' 
              ? `cover, ${20 * zoom}px ${20 * zoom}px, ${20 * zoom}px ${20 * zoom}px`
              : `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: background?.type === 'image'
              ? `center, ${pan.x}px ${pan.y}px, ${pan.x}px ${pan.y}px`
              : `${pan.x}px ${pan.y}px`,
          }),
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => {
          handleMouseMove(e)
          handleMouseMoveCanvas(e)
        }}
        onMouseUp={() => {
          handleMouseUp()
          if (isConnecting) {
            setIsConnecting(false)
            setConnectionStart(null)
            setDraggedConnection(null)
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
          }}
        >
          {mode === 'data' && connections && (
            <ConnectionLines
              connections={connections}
              tables={items}
              nodes={[...transformNodes, ...chartNodes]}
              zoom={zoom}
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
                  } else if (connectionStart.type === 'chart') {
                    const chart = chartNodes.find(c => c.id === connectionStart.id)
                    return chart ? chart.x + 320 - 6 : 0
                  } else {
                    const node = transformNodes.find(n => n.id === connectionStart.id)
                    return node ? node.x + 180 - 6 : 0
                  }
                })()}
                y1={(() => {
                  if (connectionStart.type === 'table') {
                    const table = items.find(i => i.id === connectionStart.id)
                    return table ? table.y + 60 : 0
                  } else if (connectionStart.type === 'chart') {
                    const chart = chartNodes.find(c => c.id === connectionStart.id)
                    return chart ? chart.y + 30 : 0
                  } else {
                    const node = transformNodes.find(n => n.id === connectionStart.id)
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
          {mode === 'dashboard' ? (
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
                  onEndConnection={(id) => handleEndConnection(id, 'chart')}
                  data={getChartData(node.id)}
                  onPromoteToCanvas={promoteChartToCanvas}
                />
              ))}
            </>
          )}
        </div>
      </div>

    </div>
  )
}