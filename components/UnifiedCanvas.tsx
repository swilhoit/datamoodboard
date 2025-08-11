'use client'

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  Handle,
  Position,
  MarkerType,
  NodeTypes,
  getIncomers,
  getOutgoers,
  getConnectedEdges,
  ReactFlowProvider,
  useReactFlow,
  Panel
} from 'reactflow'
import 'reactflow/dist/style.css'
import { 
  Database, FileSpreadsheet, CloudDownload, Table, Filter, 
  Calculator, GroupIcon, ChartBar, Plus, Settings, RefreshCw,
  AlertCircle, CheckCircle2, Loader2, Frame, Move, Square,
  Type, Image, Shapes, Sparkles, Copy, Trash2, Lock, Unlock,
  Eye, EyeOff, Layers, ChevronRight, ChevronDown, Grid3X3,
  ZoomIn, ZoomOut, Maximize2, Minimize2, Download, Upload,
  MousePointer, Hand, BarChart2, LineChart, PieChart, TrendingUp,
  LayoutGrid
} from 'lucide-react'
// Import necessary components
import dynamic from 'next/dynamic'
import CanvasToolbar from './CanvasToolbar'
import DesignToolbar from './DesignToolbar'
import FrameNode from './FrameNode'
import FrameAlignmentTools from './FrameAlignmentTools'
import { useSmartGuides } from '@/hooks/useSmartGuides'

// Dynamic imports for heavy components
const DataSourceConnector = dynamic(() => import('./DataSourceConnector'), {
  ssr: false,
  loading: () => <div className="p-4">Loading data source connector...</div>
})

const TransformBuilder = dynamic(() => import('./TransformBuilder'), {
  ssr: false,
  loading: () => <div className="p-4">Loading transform builder...</div>
})

// Custom Frame Node with onDataChange handler
const CustomFrameNode = React.memo(function CustomFrameNode({ data, selected, id }: any) {
  const { setNodes } = useReactFlow()
  
  const handleDataChange = useCallback((newData: any) => {
    setNodes((nodes) => 
      nodes.map(node => 
        node.id === id ? { ...node, data: newData } : node
      )
    )
  }, [id, setNodes])
  
  return <FrameNode data={data} selected={selected} id={id} onDataChange={handleDataChange} />
})

// Data source node (existing from DataFlowCanvas)
const DataSourceNode = React.memo(function DataSourceNode({ data, selected, id }: any) {
  const [isSyncing, setIsSyncing] = useState(false)
  
  const getIcon = () => {
    switch (data.sourceType) {
      case 'googlesheets':
        return <FileSpreadsheet size={16} className="text-[#0F9D58]" />
      case 'shopify':
        return <Database size={16} className="text-[#95BF47]" />
      case 'stripe':
        return <Database size={16} className="text-[#635BFF]" />
      case 'googleads':
        return <Database size={16} className="text-[#4285F4]" />
      case 'csv':
        return <FileSpreadsheet size={16} className="text-emerald-600" />
      case 'database':
        return <Database size={16} className="text-blue-600" />
      default:
        return <CloudDownload size={16} className="text-gray-600" />
    }
  }

  const getStatusColor = () => {
    if (isSyncing) return 'bg-yellow-500 animate-pulse'
    if (data.error) return 'bg-red-500'
    if (!data.connected) return 'bg-gray-400'
    if (!data.queryInfo || Object.keys(data.queryInfo).length === 0) return 'bg-orange-500'
    return 'bg-green-500'
  }

  return (
    <div className={`px-4 py-3 shadow-md rounded-lg border-2 bg-white ${
      selected ? 'border-blue-500' : 'border-gray-300'
    } min-w-[200px]`}>
      <div className={`absolute -top-2 -right-2 w-3 h-3 rounded-full ${getStatusColor()}`} />
      
      <div className="flex items-center gap-2 mb-2">
        {getIcon()}
        <span className="font-semibold text-sm">{data.label}</span>
      </div>
      
      {data.queryInfo && Object.keys(data.queryInfo).length > 0 && (
        <div className="text-xs text-gray-600 space-y-1">
          {data.queryInfo.resource && (
            <div>Resource: {data.queryInfo.resource}</div>
          )}
          {data.queryInfo.dateRange && (
            <div>Date: {data.queryInfo.dateRange}</div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className={`w-3 h-3 !border-2 !border-white ${
          data.connected && data.queryInfo ? '!bg-green-500' : '!bg-red-500'
        }`}
      />
    </div>
  )
})

// Transform node
const TransformNode = React.memo(function TransformNode({ data, selected }: any) {
  const getTransformIcon = () => {
    switch (data.transformType) {
      case 'filter':
        return <Filter size={16} className="text-blue-600" />
      case 'aggregate':
        return <GroupIcon size={16} className="text-purple-600" />
      case 'calculate':
        return <Calculator size={16} className="text-green-600" />
      default:
        return <Sparkles size={16} className="text-orange-600" />
    }
  }

  return (
    <div className={`px-4 py-3 shadow-md rounded-lg border-2 bg-white ${
      selected ? 'border-purple-500' : 'border-gray-300'
    } min-w-[180px]`}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />
      
      <div className="flex items-center gap-2 mb-1">
        {getTransformIcon()}
        <span className="font-semibold text-sm">{data.label}</span>
      </div>
      
      <div className="text-xs text-gray-600">
        {data.description || 'Transform data'}
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-green-500 !border-2 !border-white"
      />
    </div>
  )
})

const nodeTypes: NodeTypes = {
  frame: CustomFrameNode,
  dataSource: DataSourceNode,
  transform: TransformNode
}

interface UnifiedCanvasProps {
  items: any[]
  setItems: (items: any[]) => void
  connections: any[]
  setConnections: (connections: any[]) => void
  selectedItem: string | null
  setSelectedItem: (id: string | null) => void
  isDarkMode?: boolean
  background?: any
  showGrid?: boolean
  onOpenBlocks?: () => void
  onDataNodesChange?: (nodes: any[]) => void
}

function UnifiedCanvasContent({
  items,
  setItems,
  connections,
  setConnections,
  selectedItem,
  setSelectedItem,
  isDarkMode = false,
  background,
  showGrid = true,
  onOpenBlocks,
  onDataNodesChange
}: UnifiedCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { project, fitView } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [showDataSourcePanel, setShowDataSourcePanel] = useState(false)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [showTransformBuilder, setShowTransformBuilder] = useState(false)
  const [transformNode, setTransformNode] = useState<any>(null)
  const [selectedTool, setSelectedTool] = useState<string>('pointer')
  const [showDesignPanel, setShowDesignPanel] = useState(false)
  const [dataNodes, setDataNodes] = useState<Node[]>([]) // Track data source nodes
  const [selectedFrames, setSelectedFrames] = useState<string[]>([])
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [frameSpacing, setFrameSpacing] = useState(16)
  
  // Smart guides hook
  const { 
    guides, 
    onNodeDragStart, 
    onNodeDrag, 
    onNodeDragStop,
    alignFrames,
    distributeFrames
  } = useSmartGuides(nodes, snapEnabled)

  // Initialize with a default frame
  useEffect(() => {
    if (nodes.length === 0) {
      const initialFrame: Node = {
        id: 'frame-1',
        type: 'frame',
        position: { x: 250, y: 100 },
        data: {
          label: 'Dashboard 1',
          width: 800,
          height: 600,
          elements: [],
          background: '#ffffff',
          autoLayout: {
            enabled: false,
            direction: 'horizontal',
            gap: 16,
            padding: 16,
            alignment: 'start'
          },
          constraints: {
            minWidth: 200,
            minHeight: 200
          }
        }
      }
      setNodes([initialFrame])
    } else {
      // Track existing data source nodes
      const existingDataNodes = nodes.filter(n => n.type === 'dataSource')
      if (existingDataNodes.length > 0) {
        setDataNodes(existingDataNodes)
        if (onDataNodesChange) {
          onDataNodesChange(existingDataNodes)
        }
      }
    }
  }, [])

  // Listen for custom events from UnifiedSidebar
  useEffect(() => {
    const handleAddDataSource = (event: CustomEvent) => {
      if (event.detail?.type) {
        addDataSource(event.detail.type)
      }
    }

    const handleAddTransform = () => {
      addTransform()
    }

    window.addEventListener('add-data-source', handleAddDataSource as any)
    window.addEventListener('add-transform', handleAddTransform)

    return () => {
      window.removeEventListener('add-data-source', handleAddDataSource as any)
      window.removeEventListener('add-transform', handleAddTransform)
    }
  }, [nodes])

  // Handle connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      // Custom logic to pass data through connections
      const sourceNode = nodes.find(n => n.id === params.source)
      const targetNode = nodes.find(n => n.id === params.target)
      
      if (sourceNode && targetNode) {
        // If connecting to a frame, pass the data
        if (targetNode.type === 'frame') {
          const updatedTargetNode = {
            ...targetNode,
            data: {
              ...targetNode.data,
              incomingData: [...(targetNode.data.incomingData || []), sourceNode.data]
            }
          }
          setNodes(nodes => nodes.map(n => n.id === targetNode.id ? updatedTargetNode : n))
        }
      }

      setEdges((eds) => addEdge({
        ...params,
        animated: true,
        style: { stroke: '#60A5FA', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#60A5FA'
        }
      }, eds))
    },
    [nodes, setNodes, setEdges]
  )

  // Add new frame with enhanced options
  const addFrame = (preset?: { width: number; height: number; name: string }) => {
    const frameCount = nodes.filter(n => n.type === 'frame').length
    const newFrame: Node = {
      id: `frame-${Date.now()}`,
      type: 'frame',
      position: { 
        x: 100 + (frameCount % 3) * 250, 
        y: 100 + Math.floor(frameCount / 3) * 200 
      },
      data: {
        label: preset?.name || `Frame ${frameCount + 1}`,
        width: preset?.width || 800,
        height: preset?.height || 600,
        elements: [],
        background: '#ffffff',
        autoLayout: {
          enabled: false,
          direction: 'horizontal',
          gap: 16,
          padding: 16,
          alignment: 'start'
        },
        constraints: {
          minWidth: 200,
          minHeight: 200
        }
      }
    }
    setNodes(nodes => [...nodes, newFrame])
  }

  // Add data source
  const addDataSource = (type: string) => {
    const labels: Record<string, string> = {
      googlesheets: 'Google Sheets',
      database: 'Database',
      shopify: 'Shopify Store',
      stripe: 'Stripe Payments',
      googleads: 'Google Ads',
      csv: 'CSV File'
    }
    
    const newNode: Node = {
      id: `data-${Date.now()}`,
      type: 'dataSource',
      position: { x: 50, y: 200 + nodes.filter(n => n.type === 'dataSource').length * 100 },
      data: {
        label: labels[type.toLowerCase()] || `${type} Data`,
        sourceType: type.toLowerCase(),
        connected: false,
        queryInfo: {}
      }
    }
    setNodes(nodes => [...nodes, newNode])
    setDataNodes(prevNodes => {
      const updatedNodes = [...prevNodes, newNode]
      // Notify parent of data nodes change
      if (onDataNodesChange) {
        onDataNodesChange(updatedNodes)
      }
      return updatedNodes
    })
    setSelectedNode(newNode)
    setShowDataSourcePanel(true)
  }

  // Add transform node
  const addTransform = () => {
    const newNode: Node = {
      id: `transform-${Date.now()}`,
      type: 'transform',
      position: { x: 300, y: 300 },
      data: {
        label: 'Transform',
        transformType: 'filter',
        description: 'Filter & transform data'
      }
    }
    setNodes(nodes => [...nodes, newNode])
    setTransformNode(newNode)
    setShowTransformBuilder(true)
  }

  // Handle node selection with multi-select support
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (event.shiftKey && node.type === 'frame') {
      // Multi-select frames with shift key
      setSelectedFrames(prev => 
        prev.includes(node.id) 
          ? prev.filter(id => id !== node.id)
          : [...prev, node.id]
      )
    } else {
      setSelectedItem(node.id)
      setSelectedNode(node)
      setSelectedFrames([node.id])
      
      if (node.type === 'dataSource') {
        setShowDataSourcePanel(true)
      } else if (node.type === 'transform') {
        setTransformNode(node)
        setShowTransformBuilder(true)
      }
    }
  }, [setSelectedItem])

  // Handle node drag with smart guides
  const handleNodeDrag = useCallback((event: any, node: Node) => {
    onNodeDragStart(node.id)
    const snappedPosition = onNodeDrag(node.id, node.position)
    // Update node position with snapped values
    setNodes(nodes => nodes.map(n => 
      n.id === node.id ? { ...n, position: snappedPosition } : n
    ))
  }, [onNodeDragStart, onNodeDrag, setNodes])
  
  const handleNodeDragStop = useCallback((event: any, node: Node) => {
    onNodeDragStop()
  }, [onNodeDragStop])
  
  // Handle frame alignment
  const handleAlign = useCallback((type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const updatedNodes = alignFrames(selectedFrames, type)
    if (updatedNodes) {
      setNodes(updatedNodes)
    }
  }, [selectedFrames, alignFrames, setNodes])
  
  // Handle frame distribution
  const handleDistribute = useCallback((type: 'horizontal' | 'vertical') => {
    const updatedNodes = distributeFrames(selectedFrames, type, frameSpacing)
    if (updatedNodes) {
      setNodes(updatedNodes)
    }
  }, [selectedFrames, distributeFrames, frameSpacing, setNodes])
  
  // Duplicate selected frame
  const duplicateFrame = useCallback(() => {
    if (selectedFrames.length === 1) {
      const originalFrame = nodes.find(n => n.id === selectedFrames[0])
      if (originalFrame && originalFrame.type === 'frame') {
        const newFrame: Node = {
          ...originalFrame,
          id: `frame-${Date.now()}`,
          position: {
            x: originalFrame.position.x + 50,
            y: originalFrame.position.y + 50
          },
          data: {
            ...originalFrame.data,
            label: `${originalFrame.data.label} (Copy)`
          }
        }
        setNodes(nodes => [...nodes, newFrame])
        setSelectedFrames([newFrame.id])
      }
    }
  }, [selectedFrames, nodes, setNodes])
  
  // Handle dropping elements into frames
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      if (!type) return

      const position = project({
        x: event.clientX,
        y: event.clientY
      })

      // Check if dropped on a frame
      const frameNode = nodes.find(n => 
        n.type === 'frame' &&
        position.x >= n.position.x &&
        position.x <= n.position.x + (n.data.width || 800) &&
        position.y >= n.position.y &&
        position.y <= n.position.y + (n.data.height || 600)
      )

      if (frameNode && type === 'chart') {
        // Add chart to frame
        const newElement = {
          id: `element-${Date.now()}`,
          type: 'chart',
          position: {
            x: position.x - frameNode.position.x,
            y: position.y - frameNode.position.y
          },
          chartType: 'bar',
          data: frameNode.data.incomingData?.[0] || []
        }

        setNodes(nodes => nodes.map(n => 
          n.id === frameNode.id 
            ? {
                ...n,
                data: {
                  ...n.data,
                  elements: [...(n.data.elements || []), newElement]
                }
              }
            : n
        ))
      }
    },
    [nodes, project, setNodes]
  )

  return (
    <div className="h-full w-full relative">
      <div ref={reactFlowWrapper} className="h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDrag={handleNodeDrag}
          onNodeDragStop={handleNodeDragStop}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
          className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}
        >
          <Background 
            variant={showGrid ? "dots" as any : undefined}
            gap={16}
            size={1}
            color={isDarkMode ? '#374151' : '#E5E7EB'}
          />
          <Controls className={isDarkMode ? 'bg-gray-800 text-white' : ''} />
          <MiniMap 
            nodeColor={n => {
              if (selectedFrames.includes(n.id)) return '#3B82F6'
              if (n.type === 'frame') return '#93C5FD'
              if (n.type === 'dataSource') return '#10B981'
              if (n.type === 'transform') return '#8B5CF6'
              return '#6B7280'
            }}
            className={isDarkMode ? 'bg-gray-800' : ''}
          />
          
          {/* Smart Guides */}
          <svg className="absolute inset-0 pointer-events-none z-50">
            {guides.map((guide, index) => (
              <line
                key={index}
                x1={guide.type === 'vertical' ? guide.position : 0}
                y1={guide.type === 'horizontal' ? guide.position : 0}
                x2={guide.type === 'vertical' ? guide.position : '100%'}
                y2={guide.type === 'horizontal' ? guide.position : '100%'}
                stroke="#3B82F6"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.5"
              />
            ))}
          </svg>
          
          {/* Top toolbar - Enhanced frame controls */}
          <Panel position="top-left" className="flex gap-2 bg-white rounded-lg shadow-lg p-2">
            <div className="relative group">
              <button
                onClick={() => addFrame()}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all"
                title="Add a new frame"
              >
                <Frame size={16} />
                <span className="text-sm font-medium">Add Frame</span>
              </button>
              
              {/* Frame preset dropdown */}
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 p-2 hidden group-hover:block z-50 min-w-[200px]">
                <div className="text-xs font-semibold text-gray-600 mb-2 px-2">Quick Presets</div>
                <button
                  onClick={() => addFrame({ width: 1440, height: 900, name: 'Desktop' })}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded text-left"
                >
                  <span>🖥️</span>
                  <div className="flex-1">
                    <div className="text-xs font-medium">Desktop</div>
                    <div className="text-xs text-gray-500">1440 × 900</div>
                  </div>
                </button>
                <button
                  onClick={() => addFrame({ width: 768, height: 1024, name: 'Tablet' })}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded text-left"
                >
                  <span>📱</span>
                  <div className="flex-1">
                    <div className="text-xs font-medium">Tablet</div>
                    <div className="text-xs text-gray-500">768 × 1024</div>
                  </div>
                </button>
                <button
                  onClick={() => addFrame({ width: 375, height: 812, name: 'Mobile' })}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded text-left"
                >
                  <span>📱</span>
                  <div className="flex-1">
                    <div className="text-xs font-medium">Mobile</div>
                    <div className="text-xs text-gray-500">375 × 812</div>
                  </div>
                </button>
                <button
                  onClick={() => addFrame({ width: 1200, height: 800, name: 'Dashboard' })}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded text-left"
                >
                  <span>📊</span>
                  <div className="flex-1">
                    <div className="text-xs font-medium">Dashboard</div>
                    <div className="text-xs text-gray-500">1200 × 800</div>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="border-l border-gray-300 mx-1" />
            
            {/* Snap Toggle */}
            <button
              onClick={() => setSnapEnabled(!snapEnabled)}
              className={`flex items-center gap-1 px-2 py-2 rounded transition-all ${
                snapEnabled 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={snapEnabled ? 'Disable snapping' : 'Enable snapping'}
            >
              <Grid3X3 size={16} />
            </button>
            
            <div className="border-l border-gray-300 mx-1" />
            
            <button
              onClick={() => fitView()}
              className="flex items-center gap-1 px-2 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-all"
              title="Fit to view"
            >
              <Maximize2 size={16} />
            </button>
            
            <button
              onClick={() => {
                const currentZoom = (window as any).reactFlowZoom || 1
                const newZoom = Math.min(currentZoom * 1.2, 2)
                ;(window as any).reactFlowZoom = newZoom
              }}
              className="flex items-center gap-1 px-2 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-all"
              title="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
            
            <button
              onClick={() => {
                const currentZoom = (window as any).reactFlowZoom || 1
                const newZoom = Math.max(currentZoom * 0.8, 0.5)
                ;(window as any).reactFlowZoom = newZoom
              }}
              className="flex items-center gap-1 px-2 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-all"
              title="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
          </Panel>
          
          {/* Frame Alignment Tools - Show when frames are selected */}
          {selectedFrames.length > 0 && (
            <Panel position="top-center" className="mt-2">
              <FrameAlignmentTools
                selectedFrames={selectedFrames}
                onAlign={handleAlign}
                onDistribute={handleDistribute}
                onDuplicate={duplicateFrame}
                onGroup={() => console.log('Group frames')}
                onUngroup={() => console.log('Ungroup frames')}
                spacing={frameSpacing}
                onSpacingChange={setFrameSpacing}
              />
            </Panel>
          )}

          {/* Element Library Panel */}
          <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Layers size={14} />
              Elements
            </h3>
            <div className="space-y-2">
              <div className="text-xs text-gray-500">Drag elements into frames</div>
              <div className="grid grid-cols-3 gap-2">
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow', 'chart')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  className="flex flex-col items-center p-2 border rounded cursor-move hover:bg-gray-50"
                >
                  <ChartBar size={20} className="text-blue-500" />
                  <span className="text-xs mt-1">Chart</span>
                </div>
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow', 'text')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  className="flex flex-col items-center p-2 border rounded cursor-move hover:bg-gray-50"
                >
                  <Type size={20} className="text-gray-600" />
                  <span className="text-xs mt-1">Text</span>
                </div>
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow', 'table')
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  className="flex flex-col items-center p-2 border rounded cursor-move hover:bg-gray-50"
                >
                  <Table size={20} className="text-green-500" />
                  <span className="text-xs mt-1">Table</span>
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
        
        {/* Bottom Design Toolbar */}
        <CanvasToolbar
          onAddElement={(type, config) => {
            // Handle adding elements to frames or as nodes
            if (type === 'text' || type === 'shape' || type === 'emoji' || type === 'image') {
              // Find if there's a selected frame to add to
              const selectedFrame = nodes.find(n => n.type === 'frame' && selectedItem === n.id)
              if (selectedFrame) {
                const newElement = {
                  id: `element-${Date.now()}`,
                  type,
                  ...config,
                  position: { x: 100, y: 100 }
                }
                setNodes(nodes => nodes.map(n => 
                  n.id === selectedFrame.id 
                    ? {
                        ...n,
                        data: {
                          ...n.data,
                          elements: [...(n.data.elements || []), newElement]
                        }
                      }
                    : n
                ))
              }
            } else if (type.includes('Chart')) {
              // Add chart as a draggable element
              const newNode: Node = {
                id: `chart-${Date.now()}`,
                type: 'frame',
                position: { x: 200, y: 200 },
                data: {
                  label: type,
                  width: 400,
                  height: 300,
                  elements: [{
                    id: `element-${Date.now()}`,
                    type: 'chart',
                    chartType: type.replace('Chart', '').toLowerCase()
                  }]
                }
              }
              setNodes(nodes => [...nodes, newNode])
            }
          }}
          mode="design"
          selectedItem={selectedItem}
          onToolChange={setSelectedTool}
          isDarkMode={isDarkMode}
          onOpenBlocks={onOpenBlocks}
        />
      </div>

      {/* Side Panels */}
      {showDataSourcePanel && selectedNode && (
        <div className="absolute top-20 right-4 z-50 w-96 bg-white rounded-lg shadow-xl">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold">Configure Data Source</h3>
            <button
              onClick={() => setShowDataSourcePanel(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ×
            </button>
          </div>
          <DataSourceConnector
            sourceType={selectedNode.data?.sourceType || 'googlesheets'}
            nodeId={selectedNode.id}
            nodeLabel={selectedNode.data?.label || 'Data Source'}
            currentConfig={selectedNode.data?.queryInfo}
            onConnect={(queryConfig) => {
              // Update the node with query configuration
              setNodes(nodes => nodes.map(n => 
                n.id === selectedNode.id 
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        queryInfo: queryConfig,
                        connected: true,
                        label: queryConfig.resource || queryConfig.tableName || n.data.label
                      }
                    }
                  : n
              ))
              // Update data nodes tracking
              setDataNodes(prevNodes => {
                const updatedNodes = prevNodes.map(n => 
                  n.id === selectedNode.id 
                    ? {
                        ...n,
                        data: {
                          ...n.data,
                          queryInfo: queryConfig,
                          connected: true,
                          label: queryConfig.resource || queryConfig.tableName || n.data.label
                        }
                      }
                    : n
                )
                if (onDataNodesChange) {
                  onDataNodesChange(updatedNodes)
                }
                return updatedNodes
              })
              setShowDataSourcePanel(false)
            }}
            onClose={() => setShowDataSourcePanel(false)}
            layout="inline"
          />
        </div>
      )}
      
      {showTransformBuilder && transformNode && (
        <div className="absolute top-20 right-4 z-50 w-96 bg-white rounded-lg shadow-xl">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold">Configure Transform</h3>
            <button
              onClick={() => setShowTransformBuilder(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ×
            </button>
          </div>
          <TransformBuilder
            nodeId={transformNode.id}
            nodeLabel={transformNode.data?.label || 'Transform'}
            inputData={[]} // TODO: Get actual input data from connected nodes
            currentConfig={transformNode.data}
            onApply={(transformConfig, transformedData) => {
              // Update the transform node with configuration
              setNodes(nodes => nodes.map(n => 
                n.id === transformNode.id 
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        ...transformConfig,
                        transformedData,
                        label: transformConfig.label || 'Transform'
                      }
                    }
                  : n
              ))
              setShowTransformBuilder(false)
            }}
            onClose={() => setShowTransformBuilder(false)}
            isDarkMode={isDarkMode}
            layout="inline"
          />
        </div>
      )}
      
      {showDesignPanel && selectedNode && selectedNode.type === 'frame' && (
        <div className="absolute top-20 left-4 z-50">
          <DesignToolbar
            selectedItem={selectedNode}
            onUpdateStyle={(id, style) => {
              setNodes(nodes => nodes.map(n => 
                n.id === id 
                  ? { ...n, data: { ...n.data, style } }
                  : n
              ))
            }}
            onClose={() => setShowDesignPanel(false)}
          />
        </div>
      )}
    </div>
  )
}

export default function UnifiedCanvas(props: UnifiedCanvasProps) {
  return (
    <ReactFlowProvider>
      <UnifiedCanvasContent {...props} />
    </ReactFlowProvider>
  )
}