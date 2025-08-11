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
  ZoomIn, ZoomOut, Maximize2, Minimize2, Download, Upload
} from 'lucide-react'
import DataSourceConnector from './DataSourceConnector'
import TransformBuilder from './TransformBuilder'
import ChartDesignPanel from './ChartDesignPanel'
import TextElement from './TextElement'
import CanvasElement from './CanvasElement'
import VisualizationItem from './StableVisualizationItem'
import { processTransformNode } from '@/lib/dataProcessor'

// Frame node component - acts as an artboard/report container
function FrameNode({ data, selected, id }: any) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [connectedData, setConnectedData] = useState<any[]>([])
  
  // Get connected data from incoming connections
  useEffect(() => {
    if (data.incomingData) {
      setConnectedData(data.incomingData)
    }
  }, [data.incomingData])

  return (
    <div
      className={`bg-white rounded-lg shadow-lg border-2 ${
        selected ? 'border-blue-500' : 'border-gray-300'
      } ${data.width ? `w-[${data.width}px]` : 'w-[800px]'} ${
        data.height ? `h-[${data.height}px]` : 'h-[600px]'
      } relative overflow-hidden`}
      style={{
        width: data.width || 800,
        height: data.height || 600,
        background: data.background || '#ffffff'
      }}
    >
      {/* Frame Header */}
      <div className="absolute top-0 left-0 right-0 bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Frame size={14} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">{data.label || 'Report Frame'}</span>
          {connectedData.length > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
              {connectedData.length} data source{connectedData.length > 1 ? 's' : ''} connected
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-200 rounded"
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Frame Content Area */}
      <div className="pt-10 p-4 h-full overflow-auto">
        {data.elements && data.elements.map((element: any) => {
          // Render different element types within the frame
          if (element.type === 'chart') {
            return (
              <div key={element.id} className="mb-4">
                <VisualizationItem
                  item={element}
                  isSelected={false}
                  onSelect={() => {}}
                  availableData={connectedData}
                  isDarkMode={false}
                />
              </div>
            )
          }
          if (element.type === 'text') {
            return (
              <TextElement
                key={element.id}
                id={element.id}
                text={element.text}
                style={element.style}
                position={element.position}
                size={element.size}
                isSelected={false}
                onSelect={() => {}}
                onUpdate={() => {}}
                isDragging={false}
                isResizing={false}
                canvasRef={{ current: null }}
                zoom={1}
              />
            )
          }
          if (element.type === 'shape') {
            return (
              <CanvasElement
                key={element.id}
                element={element}
                isSelected={false}
                onSelect={() => {}}
                onUpdate={() => {}}
                canvasRef={{ current: null }}
                zoom={1}
              />
            )
          }
          return null
        })}
        
        {(!data.elements || data.elements.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Frame size={48} className="mb-2" />
            <p className="text-sm">Drop elements here to build your report</p>
            <p className="text-xs mt-1">Connect data sources to enable charts</p>
          </div>
        )}
      </div>

      {/* Input handle for data connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
        style={{ top: '50%' }}
      />
    </div>
  )
}

// Data source node (existing from DataFlowCanvas)
function DataSourceNode({ data, selected, id }: any) {
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
}

// Transform node
function TransformNode({ data, selected }: any) {
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
}

const nodeTypes: NodeTypes = {
  frame: FrameNode,
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
  showGrid = true
}: UnifiedCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { project, fitView } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [showDataSourcePanel, setShowDataSourcePanel] = useState(false)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [showTransformBuilder, setShowTransformBuilder] = useState(false)
  const [transformNode, setTransformNode] = useState<any>(null)

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
          background: '#ffffff'
        }
      }
      setNodes([initialFrame])
    }
  }, [])

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

  // Add new frame
  const addFrame = () => {
    const newFrame: Node = {
      id: `frame-${Date.now()}`,
      type: 'frame',
      position: { x: 100 + nodes.length * 50, y: 100 + nodes.length * 50 },
      data: {
        label: `Report ${nodes.filter(n => n.type === 'frame').length + 1}`,
        width: 800,
        height: 600,
        elements: [],
        background: '#ffffff'
      }
    }
    setNodes(nodes => [...nodes, newFrame])
  }

  // Add data source
  const addDataSource = (type: string) => {
    const newNode: Node = {
      id: `data-${Date.now()}`,
      type: 'dataSource',
      position: { x: 50, y: 200 + nodes.filter(n => n.type === 'dataSource').length * 100 },
      data: {
        label: `${type} Data`,
        sourceType: type.toLowerCase(),
        connected: false,
        queryInfo: {}
      }
    }
    setNodes(nodes => [...nodes, newNode])
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

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedItem(node.id)
    setSelectedNode(node)
    
    if (node.type === 'dataSource') {
      setShowDataSourcePanel(true)
    } else if (node.type === 'transform') {
      setTransformNode(node)
      setShowTransformBuilder(true)
    }
  }, [setSelectedItem])

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
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
          className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}
        >
          <Background 
            variant={showGrid ? "dots" : undefined}
            gap={16}
            size={1}
            color={isDarkMode ? '#374151' : '#E5E7EB'}
          />
          <Controls className={isDarkMode ? 'bg-gray-800 text-white' : ''} />
          <MiniMap 
            nodeColor={n => {
              if (n.type === 'frame') return '#3B82F6'
              if (n.type === 'dataSource') return '#10B981'
              if (n.type === 'transform') return '#8B5CF6'
              return '#6B7280'
            }}
            className={isDarkMode ? 'bg-gray-800' : ''}
          />
          
          {/* Toolbar */}
          <Panel position="top-left" className="flex gap-2 bg-white rounded-lg shadow-lg p-2">
            <button
              onClick={addFrame}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Frame size={16} />
              Add Frame
            </button>
            
            <div className="border-l border-gray-300 mx-1" />
            
            <button
              onClick={() => addDataSource('Database')}
              className="flex items-center gap-1 px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
              title="Add Data Source"
            >
              <Database size={16} />
            </button>
            
            <button
              onClick={() => addDataSource('CSV')}
              className="flex items-center gap-1 px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
              title="Add CSV"
            >
              <FileSpreadsheet size={16} />
            </button>
            
            <button
              onClick={addTransform}
              className="flex items-center gap-1 px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
              title="Add Transform"
            >
              <Filter size={16} />
            </button>
            
            <div className="border-l border-gray-300 mx-1" />
            
            <button
              className="flex items-center gap-1 px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
              title="Add Text"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow', 'text')
                e.dataTransfer.effectAllowed = 'move'
              }}
            >
              <Type size={16} />
            </button>
            
            <button
              className="flex items-center gap-1 px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
              title="Add Chart"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow', 'chart')
                e.dataTransfer.effectAllowed = 'move'
              }}
            >
              <ChartBar size={16} />
            </button>
            
            <button
              className="flex items-center gap-1 px-2 py-2 bg-gray-100 rounded hover:bg-gray-200"
              title="Add Shape"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow', 'shape')
                e.dataTransfer.effectAllowed = 'move'
              }}
            >
              <Square size={16} />
            </button>
          </Panel>

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
      </div>

      {/* Data Source Configuration Panel */}
      {showDataSourcePanel && selectedNode && selectedNode.type === 'dataSource' && (
        <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl z-50">
          <DataSourceConnector
            nodeId={selectedNode.id}
            nodeLabel={selectedNode.data.label}
            sourceType={selectedNode.data.sourceType}
            currentConfig={selectedNode.data.config}
            onApply={(config: any) => {
              setNodes(nodes => nodes.map(n => 
                n.id === selectedNode.id 
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        config,
                        connected: true,
                        queryInfo: config.query || {}
                      }
                    }
                  : n
              ))
              setShowDataSourcePanel(false)
            }}
            onClose={() => setShowDataSourcePanel(false)}
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      {/* Transform Builder */}
      {showTransformBuilder && transformNode && (
        <TransformBuilder
          nodeId={transformNode.id}
          nodeLabel={transformNode.data.label}
          inputData={[]}
          currentConfig={transformNode.data.config}
          onApply={(config: any, transformedData: any[]) => {
            setNodes(nodes => nodes.map(n => 
              n.id === transformNode.id 
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      config,
                      outputData: transformedData
                    }
                  }
                : n
            ))
            setShowTransformBuilder(false)
          }}
          onClose={() => setShowTransformBuilder(false)}
          isDarkMode={isDarkMode}
          layout="sidebar"
        />
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