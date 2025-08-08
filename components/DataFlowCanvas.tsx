'use client'

import { useCallback, useRef, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useNodesState,
  useEdgesState,
  MiniMap,
  Node,
  Edge,
  Connection,
  NodeTypes,
  Handle,
  Position,
  getIncomers,
  getOutgoers,
  getConnectedEdges,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Database, Table2, GitMerge, Plus, Eye, Filter, Play, Settings, X, Sheet, ShoppingBag, CreditCard, CloudDownload, RefreshCw } from 'lucide-react'

// Dynamically import panels
const DataPreviewPanel = dynamic(() => import('./DataPreviewPanel'), { ssr: false })
const DataFilterPanel = dynamic(() => import('./DataFilterPanel'), { ssr: false })
const DataSourceConnector = dynamic(() => import('./DataSourceConnector'), { ssr: false })

// Custom node component for tables
function TableNode({ data, selected }: any) {
  return (
    <div className={`bg-white rounded-lg shadow-lg border-2 p-4 min-w-[200px] ${
      selected ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-30' : 'border-gray-300'
    }`}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />
      <div className="flex items-center gap-2 mb-2">
        <Database size={16} className="text-blue-600" />
        <span className="font-semibold text-sm">{data.label}</span>
      </div>
      <div className="text-xs text-gray-600">
        {data.database || 'postgresql'}
      </div>
      {data.schema && (
        <div className="mt-2 text-xs space-y-1">
          {data.schema.slice(0, 3).map((field: any, i: number) => (
            <div key={i} className="flex justify-between">
              <span className="text-gray-600">{field.name}</span>
              <span className="text-gray-400">{field.type}</span>
            </div>
          ))}
          {data.schema.length > 3 && (
            <div className="text-gray-400">+{data.schema.length - 3} more...</div>
          )}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-green-500 !border-2 !border-white"
      />
    </div>
  )
}

// Custom node component for transformations
function TransformNode({ data, selected }: any) {
  return (
    <div className={`bg-white rounded-lg shadow-lg border-2 p-4 min-w-[180px] ${
      selected ? 'border-purple-500 ring-2 ring-purple-500 ring-opacity-30' : 'border-gray-300'
    }`}>
      <Handle
        type="target"
        position={Position.Left}
        id="input1"
        style={{ top: '30%' }}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />
      {data.hasSecondInput && (
        <Handle
          type="target"
          position={Position.Left}
          id="input2"
          style={{ top: '70%' }}
          className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
        />
      )}
      <div className="flex items-center gap-2 mb-2">
        <GitMerge size={16} className="text-purple-600" />
        <span className="font-semibold text-sm">{data.label}</span>
      </div>
      <div className="text-xs text-gray-600">
        {data.transformType || 'Transform'}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-green-500 !border-2 !border-white"
      />
    </div>
  )
}

// Custom node component for data sources
function DataSourceNode({ data, selected }: any) {
  const getIcon = () => {
    switch (data.sourceType) {
      case 'googlesheets':
        return <Sheet size={16} className="text-green-600" />
      case 'shopify':
        return <ShoppingBag size={16} className="text-purple-600" />
      case 'stripe':
        return <CreditCard size={16} className="text-indigo-600" />
      case 'database':
        return <Database size={16} className="text-blue-600" />
      default:
        return <CloudDownload size={16} className="text-gray-600" />
    }
  }

  const getStatusColor = () => {
    if (data.connected) return 'bg-green-500'
    if (data.error) return 'bg-red-500'
    return 'bg-gray-400'
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border-2 p-4 min-w-[220px] ${
      selected ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-30' : 'border-gray-300'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {getIcon()}
        <span className="font-semibold text-sm">{data.label}</span>
        <div className={`ml-auto w-2 h-2 rounded-full ${getStatusColor()}`} />
      </div>
      <div className="text-xs text-gray-600">
        {data.sourceType === 'googlesheets' && 'Google Sheets'}
        {data.sourceType === 'shopify' && 'Shopify Store'}
        {data.sourceType === 'stripe' && 'Stripe Payments'}
        {data.sourceType === 'database' && data.database}
      </div>
      {data.details && (
        <div className="mt-2 text-xs text-gray-500">
          {data.details}
        </div>
      )}
      {data.lastSync && (
        <div className="mt-1 text-xs text-gray-400">
          Last sync: {data.lastSync}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-green-500 !border-2 !border-white"
      />
    </div>
  )
}

const nodeTypes: NodeTypes = {
  tableNode: TableNode,
  transformNode: TransformNode,
  dataSourceNode: DataSourceNode,
}

interface DataFlowCanvasProps {
  isDarkMode?: boolean
}

export default function DataFlowCanvas({ isDarkMode = false }: DataFlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([])
  const [showNodeMenu, setShowNodeMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  
  // Panel states
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showPreviewPanel, setShowPreviewPanel] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showConnectorPanel, setShowConnectorPanel] = useState(false)
  const [nodeData, setNodeData] = useState<{ [key: string]: any[] }>({})
  const [filteredNodeData, setFilteredNodeData] = useState<{ [key: string]: any[] }>({})
  const [nodeConfigs, setNodeConfigs] = useState<{ [key: string]: any }>({})

  // Handle connection creation with validation
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      // Add validation here if needed
      setEdges((eds) => addEdge({
        ...params,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#3B82F6', strokeWidth: 2 },
      }, eds))
    },
    [setEdges]
  )

  // Handle node deletion
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      setEdges(
        deleted.reduce((acc, node) => {
          const incomers = getIncomers(node, nodes, edges)
          const outgoers = getOutgoers(node, nodes, edges)
          const connectedEdges = getConnectedEdges([node], edges)

          const remainingEdges = acc.filter((edge) => !connectedEdges.includes(edge))

          const createdEdges = incomers.flatMap(({ id: source }) =>
            outgoers.map(({ id: target }) => ({ id: `${source}->${target}`, source, target }))
          )

          return [...remainingEdges, ...createdEdges]
        }, edges)
      )
    },
    [nodes, edges, setEdges]
  )

  // Handle right-click to show add node menu
  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()

      const rect = reactFlowWrapper.current?.getBoundingClientRect()
      if (rect && reactFlowInstance) {
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        })

        setMenuPosition(position)
        setShowNodeMenu(true)
      }
    },
    [reactFlowInstance]
  )

  // Add new node at position
  const addNode = useCallback(
    (type: 'googlesheets' | 'shopify' | 'stripe' | 'database' | 'transform') => {
      const id = `${type}-${Date.now()}`
      let newNode: Node

      switch (type) {
        case 'googlesheets':
          newNode = {
            id,
            type: 'dataSourceNode',
            position: menuPosition,
            data: {
              label: 'Google Sheets',
              sourceType: 'googlesheets',
              connected: false,
              details: 'Click to connect',
            },
          }
          break
        case 'shopify':
          newNode = {
            id,
            type: 'dataSourceNode',
            position: menuPosition,
            data: {
              label: 'Shopify Store',
              sourceType: 'shopify',
              connected: false,
              details: 'Click to connect',
            },
          }
          break
        case 'stripe':
          newNode = {
            id,
            type: 'dataSourceNode',
            position: menuPosition,
            data: {
              label: 'Stripe',
              sourceType: 'stripe',
              connected: false,
              details: 'Click to connect',
            },
          }
          break
        case 'database':
          newNode = {
            id,
            type: 'tableNode',
            position: menuPosition,
            data: {
              label: 'Database Table',
              database: 'postgresql',
              schema: [
                { name: 'id', type: 'INTEGER' },
                { name: 'created_at', type: 'TIMESTAMP' },
                { name: 'data', type: 'JSON' },
              ],
            },
          }
          break
        case 'transform':
          newNode = {
            id,
            type: 'transformNode',
            position: menuPosition,
            data: {
              label: 'Transform',
              transformType: 'Filter',
              hasSecondInput: false,
            },
          }
          break
      }

      setNodes((nds) => nds.concat(newNode))
      setShowNodeMenu(false)
    },
    [menuPosition, setNodes]
  )

  // Handle node click to show options
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    
    // Auto-open connector for unconnected data sources
    if (node.type === 'dataSourceNode' && !node.data?.connected) {
      setShowConnectorPanel(true)
    }
  }, [])

  // Generate sample data for nodes
  const generateSampleData = (nodeType: string, nodeId: string) => {
    if (nodeType === 'tableNode') {
      return [
        { id: 1, name: 'John Doe', email: 'john@example.com', age: 28, status: 'active', created_at: '2024-01-15' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 32, status: 'active', created_at: '2024-01-16' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 45, status: 'inactive', created_at: '2024-01-17' },
        { id: 4, name: 'Alice Brown', email: 'alice@example.com', age: 29, status: 'active', created_at: '2024-01-18' },
        { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', age: 38, status: 'pending', created_at: '2024-01-19' },
        { id: 6, name: 'Diana Prince', email: 'diana@example.com', age: 26, status: 'active', created_at: '2024-01-20' },
        { id: 7, name: 'Eve Adams', email: 'eve@example.com', age: 31, status: 'active', created_at: '2024-01-21' },
        { id: 8, name: 'Frank Miller', email: 'frank@example.com', age: 42, status: 'inactive', created_at: '2024-01-22' },
      ]
    }
    return []
  }

  // Get data for a node
  const getNodeData = useCallback((nodeId: string) => {
    // Check if we have filtered data for this node
    if (filteredNodeData[nodeId]) {
      return filteredNodeData[nodeId]
    }
    
    // Check if we have cached data
    if (nodeData[nodeId]) {
      return nodeData[nodeId]
    }
    
    // Generate sample data
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      const data = generateSampleData(node.type || '', nodeId)
      setNodeData(prev => ({ ...prev, [nodeId]: data }))
      return data
    }
    
    return []
  }, [nodes, nodeData, filteredNodeData])

  // Handle filter apply
  const handleApplyFilter = useCallback((filteredData: any[], selectedColumns: string[]) => {
    if (selectedNode) {
      setFilteredNodeData(prev => ({ ...prev, [selectedNode.id]: filteredData }))
      
      // Update node visual to show it's filtered
      setNodes(nds => nds.map(node => 
        node.id === selectedNode.id 
          ? { ...node, data: { ...node.data, isFiltered: true, columnCount: selectedColumns.length } }
          : node
      ))
    }
  }, [selectedNode, setNodes])

  // Handle data source connection
  const handleSourceConnect = useCallback((config: any) => {
    if (selectedNode) {
      setNodeConfigs(prev => ({ ...prev, [selectedNode.id]: config }))
      
      // Update node to show it's connected
      setNodes(nds => nds.map(node => 
        node.id === selectedNode.id 
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                connected: true,
                lastSync: 'Just now',
                details: config.spreadsheetId || config.store || 'Connected'
              } 
            }
          : node
      ))
      
      // Generate sample data for the connected source
      const sampleData = generateSampleData('tableNode', selectedNode.id)
      setNodeData(prev => ({ ...prev, [selectedNode.id]: sampleData }))
    }
  }, [selectedNode, setNodes])

  // Initialize with sample nodes
  useMemo(() => {
    const initialNodes: Node[] = [
      {
        id: '1',
        type: 'dataSourceNode',
        position: { x: 50, y: 100 },
        data: {
          label: 'Sales Data',
          sourceType: 'googlesheets',
          connected: true,
          details: 'Monthly Sales Report',
          lastSync: '5 mins ago',
        },
      },
      {
        id: '2',
        type: 'dataSourceNode',
        position: { x: 50, y: 250 },
        data: {
          label: 'Store Orders',
          sourceType: 'shopify',
          connected: true,
          details: 'mystore.myshopify.com',
          lastSync: '2 hours ago',
        },
      },
      {
        id: '3',
        type: 'transformNode',
        position: { x: 350, y: 175 },
        data: {
          label: 'Merge Data',
          transformType: 'Join',
          hasSecondInput: true,
        },
      },
      {
        id: '4',
        type: 'tableNode',
        position: { x: 600, y: 175 },
        data: {
          label: 'Combined Report',
          database: 'postgresql',
          schema: [
            { name: 'order_id', type: 'VARCHAR' },
            { name: 'customer', type: 'VARCHAR' },
            { name: 'amount', type: 'DECIMAL' },
            { name: 'status', type: 'VARCHAR' },
          ],
        },
      },
    ]

    const initialEdges: Edge[] = [
      {
        id: 'e1-3',
        source: '1',
        target: '3',
        targetHandle: 'input1',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#3B82F6', strokeWidth: 2 },
      },
      {
        id: 'e2-3',
        source: '2',
        target: '3',
        targetHandle: 'input2',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#3B82F6', strokeWidth: 2 },
      },
      {
        id: 'e3-4',
        source: '3',
        target: '4',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#3B82F6', strokeWidth: 2 },
      },
    ]

    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [])

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onNodeClick={onNodeClick}
        onInit={setReactFlowInstance}
        onContextMenu={onContextMenu}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.5,
          minZoom: 0.3,
          maxZoom: 2,
        }}
        defaultViewport={{ x: 100, y: 100, zoom: 0.6 }}
        snapToGrid
        snapGrid={[15, 15]}
        connectionLineType="smoothstep"
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#3B82F6', strokeWidth: 2 },
        }}
      >
        <Background 
          color={isDarkMode ? '#374151' : '#E5E7EB'} 
          gap={15} 
        />
        <Controls 
          className={isDarkMode ? 'react-flow__controls-dark' : ''}
        />
        <MiniMap 
          nodeColor={n => {
            if (n.type === 'tableNode') return '#3B82F6'
            if (n.type === 'transformNode') return '#8B5CF6'
            if (n.type === 'dataSourceNode') {
              const sourceType = n.data?.sourceType
              if (sourceType === 'googlesheets') return '#10B981'
              if (sourceType === 'shopify') return '#8B5CF6'
              if (sourceType === 'stripe') return '#6366F1'
              return '#3B82F6'
            }
            return '#6B7280'
          }}
          className={isDarkMode ? 'react-flow__minimap-dark' : ''}
        />
      </ReactFlow>

      {/* Context Menu for adding nodes */}
      {showNodeMenu && (
        <div
          className="absolute bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
          style={{ left: menuPosition.x, top: menuPosition.y }}
        >
          <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">Data Sources</div>
          <button
            onClick={() => addNode('googlesheets')}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
          >
            <Sheet size={16} className="text-green-600" />
            <span className="text-sm">Google Sheets</span>
          </button>
          <button
            onClick={() => addNode('shopify')}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
          >
            <ShoppingBag size={16} className="text-purple-600" />
            <span className="text-sm">Shopify</span>
          </button>
          <button
            onClick={() => addNode('stripe')}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
          >
            <CreditCard size={16} className="text-indigo-600" />
            <span className="text-sm">Stripe</span>
          </button>
          <button
            onClick={() => addNode('database')}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
          >
            <Database size={16} className="text-blue-600" />
            <span className="text-sm">Database</span>
          </button>
          <hr className="my-1" />
          <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">Operations</div>
          <button
            onClick={() => addNode('transform')}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
          >
            <GitMerge size={16} className="text-purple-600" />
            <span className="text-sm">Transform</span>
          </button>
          <hr className="my-1" />
          <button
            onClick={() => setShowNodeMenu(false)}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-gray-500"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Info panel */}
      <div className={`absolute top-4 left-4 p-3 rounded-lg shadow-lg ${
        isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white'
      }`}>
        <h3 className="font-semibold text-sm mb-2">Data Flow Builder</h3>
        <ul className="text-xs space-y-1">
          <li>• Right-click to add nodes</li>
          <li>• Click node to select</li>
          <li>• Drag from handles to connect</li>
          <li>• Select and press Delete to remove</li>
        </ul>
      </div>

      {/* Node Actions Panel */}
      {selectedNode && (
        <div className={`absolute top-4 right-4 p-3 rounded-lg shadow-lg ${
          isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Node Actions</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="text-xs text-gray-500 mb-2">
              {selectedNode.data?.label || 'Unnamed Node'}
            </div>
            
            {selectedNode.type === 'dataSourceNode' && (
              <>
                <button
                  onClick={() => {
                    setShowConnectorPanel(true)
                    setShowPreviewPanel(false)
                    setShowFilterPanel(false)
                  }}
                  className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
                    selectedNode.data?.connected
                      ? 'bg-gray-500 text-white hover:bg-gray-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  <Settings size={14} />
                  {selectedNode.data?.connected ? 'Configure' : 'Connect'}
                </button>
                
                {selectedNode.data?.connected && (
                  <>
                    <button
                      onClick={() => {
                        setShowPreviewPanel(true)
                        setShowFilterPanel(false)
                        setShowConnectorPanel(false)
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2 text-sm"
                    >
                      <Eye size={14} />
                      Preview Data
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowFilterPanel(true)
                        setShowPreviewPanel(false)
                        setShowConnectorPanel(false)
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 flex items-center gap-2 text-sm"
                    >
                      <Filter size={14} />
                      Filter & Select
                    </button>
                    
                    <button
                      className="w-full px-3 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 flex items-center gap-2 text-sm"
                      onClick={() => {
                        // Simulate data refresh
                        const node = nodes.find(n => n.id === selectedNode.id)
                        if (node) {
                          setNodes(nds => nds.map(n => 
                            n.id === selectedNode.id 
                              ? { ...n, data: { ...n.data, lastSync: 'Refreshing...' } }
                              : n
                          ))
                          setTimeout(() => {
                            setNodes(nds => nds.map(n => 
                              n.id === selectedNode.id 
                                ? { ...n, data: { ...n.data, lastSync: 'Just now' } }
                                : n
                            ))
                          }, 1000)
                        }
                      }}
                    >
                      <RefreshCw size={14} />
                      Refresh
                    </button>
                  </>
                )}
              </>
            )}
            
            {selectedNode.type === 'tableNode' && (
              <>
                <button
                  onClick={() => {
                    setShowPreviewPanel(true)
                    setShowFilterPanel(false)
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2 text-sm"
                >
                  <Eye size={14} />
                  Preview Data
                </button>
                
                <button
                  onClick={() => {
                    setShowFilterPanel(true)
                    setShowPreviewPanel(false)
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 flex items-center gap-2 text-sm"
                >
                  <Filter size={14} />
                  Filter & Select
                </button>
                
                <button
                  className="w-full px-3 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 flex items-center gap-2 text-sm opacity-50 cursor-not-allowed"
                  disabled
                >
                  <Play size={14} />
                  Run Query
                </button>
              </>
            )}
            
            {selectedNode.type === 'transformNode' && (
              <>
                <button
                  onClick={() => setShowPreviewPanel(true)}
                  className="w-full px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2 text-sm"
                >
                  <Eye size={14} />
                  Preview Output
                </button>
                
                <button
                  className="w-full px-3 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 flex items-center gap-2 text-sm"
                >
                  <Settings size={14} />
                  Configure
                </button>
              </>
            )}
            
          </div>
        </div>
      )}

      {/* Data Preview Panel */}
      {showPreviewPanel && selectedNode && (
        <DataPreviewPanel
          nodeId={selectedNode.id}
          nodeLabel={selectedNode.data?.label || 'Data Preview'}
          data={getNodeData(selectedNode.id)}
          onClose={() => setShowPreviewPanel(false)}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Data Filter Panel */}
      {showFilterPanel && selectedNode && (
        <DataFilterPanel
          nodeId={selectedNode.id}
          nodeLabel={selectedNode.data?.label || 'Filter Data'}
          data={getNodeData(selectedNode.id)}
          onApplyFilter={handleApplyFilter}
          onClose={() => setShowFilterPanel(false)}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Data Source Connector Panel */}
      {showConnectorPanel && selectedNode && selectedNode.type === 'dataSourceNode' && (
        <DataSourceConnector
          sourceType={selectedNode.data?.sourceType}
          nodeId={selectedNode.id}
          nodeLabel={selectedNode.data?.label || 'Data Source'}
          currentConfig={nodeConfigs[selectedNode.id]}
          onConnect={handleSourceConnect}
          onClose={() => setShowConnectorPanel(false)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  )
}