'use client'

import { useCallback, useRef, useState, useMemo, useEffect } from 'react'
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
  ConnectionLineType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Database, Table2, GitMerge, Plus, Eye, Filter, Play, Settings, X, Sheet, ShoppingBag, CreditCard, CloudDownload, RefreshCw, Megaphone, FileSpreadsheet } from 'lucide-react'
const DataSourcePickerModal = dynamic(() => import('./DataSourcePickerModal'), { ssr: false })
const DataManagerSidebar = dynamic(() => import('./DataManagerSidebar'), { ssr: false })

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
      case 'googleads':
        return <Megaphone size={16} className="text-yellow-600" />
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
      <div className={`bg-white rounded-lg shadow-lg border-2 p-4 min-w-[220px] max-w-[260px] ${
      selected ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-30' : 'border-gray-300'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {getIcon()}
        <input
          value={data.label}
          onChange={() => {}}
          readOnly
          className="font-semibold text-sm bg-transparent outline-none truncate flex-1"
          title={data.label}
        />
        <div className={`ml-auto w-2 h-2 rounded-full ${getStatusColor()}`} />
      </div>
      <div className="text-xs text-gray-600">
        {data.sourceType === 'googlesheets' && 'Google Sheets'}
        {data.sourceType === 'shopify' && 'Shopify Store'}
        {data.sourceType === 'stripe' && 'Stripe Payments'}
        {data.sourceType === 'googleads' && 'Google Ads'}
        {data.sourceType === 'database' && data.database}
      </div>
      {data.details && (
        <div className="mt-2 text-xs text-gray-500 truncate" title={data.details}>
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
  background?: any
  showGrid?: boolean
}

export default function DataFlowCanvas({ isDarkMode = false, background, showGrid = true }: DataFlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [showNodeMenu, setShowNodeMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  
  // Panel states
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showPreviewPanel, setShowPreviewPanel] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showConnectorPanel, setShowConnectorPanel] = useState(false)
  const [connectorPosition, setConnectorPosition] = useState<{ left: number; top: number } | null>(null)
  const [nodeData, setNodeData] = useState<{ [key: string]: any[] }>({})
  const [filteredNodeData, setFilteredNodeData] = useState<{ [key: string]: any[] }>({})
  const [nodeConfigs, setNodeConfigs] = useState<{ [key: string]: any }>({})
  const [showSourcePicker, setShowSourcePicker] = useState(false)
  const initializedRef = useRef(false)
  const dispatchedTableIdsRef = useRef<Set<string>>(new Set())
  const pendingLoadRef = useRef<any>(null)
  const hasLoadedFromStateRef = useRef<boolean>(false)
  // Broadcast full dataflow state upward for persistence
  useEffect(() => {
    try {
      // Only broadcast if we have nodes (avoid clearing state unintentionally)
      if (nodes.length > 0 || edges.length > 0) {
        window.dispatchEvent(new CustomEvent('dataflow-state-changed', {
          detail: { nodes, edges, nodeData, nodeConfigs }
        }))
        // Successfully broadcasting state
      }
    } catch {}
  }, [nodes, edges, nodeData, nodeConfigs])

  // Allow host to load/rehydrate dataflow state
  useEffect(() => {
    const handler = (e: any) => {
      const s = e?.detail || {}
      // Received load-state event
      const apply = () => {
        if (s.nodes && s.nodes.length > 0) {
          // Setting nodes from loaded state
          setNodes(s.nodes)
          initializedRef.current = true // Mark as initialized to prevent initial table creation
        }
        if (s.edges) setEdges(s.edges)
        if (s.nodeData) setNodeData(s.nodeData)
        if (s.nodeConfigs) setNodeConfigs(s.nodeConfigs)
        hasLoadedFromStateRef.current = true
        setTimeout(() => {
          try { reactFlowInstance?.fitView?.({ padding: 0.85, duration: 300, minZoom: 0.25 }) } catch {}
        }, 50)
      }
      if (reactFlowInstance) {
        apply()
      } else {
        pendingLoadRef.current = s
      }
    }
    window.addEventListener('dataflow-load-state', handler as EventListener)
    return () => window.removeEventListener('dataflow-load-state', handler as EventListener)
  }, [setNodes, setEdges, reactFlowInstance])

  // On mount, check if host has a pending snapshot set on window and cache it
  useEffect(() => {
    try {
      const snap = (window as any).__dataflowPending
      if (snap && !pendingLoadRef.current) {
        pendingLoadRef.current = snap
      }
    } catch {}
  }, [])

  // When React Flow initializes, apply any pending load state and fit view
  const handleInit = useCallback((instance: any) => {
    setReactFlowInstance(instance)
    if (pendingLoadRef.current) {
      const s = pendingLoadRef.current
      pendingLoadRef.current = null
      if (s.nodes && s.nodes.length > 0) {
        // Applying pending state in handleInit
        setNodes(s.nodes)
        initializedRef.current = true // Mark as initialized to prevent initial table creation
      }
      if (s.edges) setEdges(s.edges)
      if (s.nodeData) setNodeData(s.nodeData)
      if (s.nodeConfigs) setNodeConfigs(s.nodeConfigs)
      hasLoadedFromStateRef.current = true
      setTimeout(() => {
        try { instance?.fitView?.({ padding: 0.85, duration: 300, minZoom: 0.25 }) } catch {}
      }, 50)
    } else {
      // No pending load: do a gentle fit once the container has size
      setTimeout(() => {
        try { instance?.fitView?.({ padding: 0.8, duration: 200, minZoom: 0.25 }) } catch {}
      }, 50)
    }
  }, [setNodes, setEdges])
  const lastComputeSignatureRef = useRef<Map<string, string>>(new Map())
  
  // Prefer filtered data, then raw, else empty
  const getEffectiveNodeData = useCallback((nodeId: string) => {
    if (filteredNodeData[nodeId]) return filteredNodeData[nodeId]
    if (nodeData[nodeId]) return nodeData[nodeId]
    return [] as any[]
  }, [filteredNodeData, nodeData])

  // Save table data to Supabase (hoisted above effects that reference it)
  const saveTableData = useCallback(async (
    nodeId: string,
    name: string,
    source: string,
    data: any[],
    schema?: any[]
  ) => {
    try {
      console.log('DataFlowCanvas: Saving table:', { name, source, rowCount: data.length })
      const response = await fetch('/api/data-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          source,
          data,
          schema,
          row_count: data.length,
        }),
      })

      const result = await response.json()
      console.log('DataFlowCanvas: Save response:', result)

      if (response.ok) {
        // Emit event so sidebar can refresh
        console.log('DataFlowCanvas: Dispatching dataflow-table-saved event')
        window.dispatchEvent(new CustomEvent('dataflow-table-saved'))
      } else {
        console.error('DataFlowCanvas: Failed to save table:', result.error)
      }
    } catch (error) {
      console.error('Error saving table:', error)
    }
  }, [])

  // When a table has incoming connections, combine its inputs
  const recomputeTableFromIncomers = useCallback((targetNodeId: string) => {
    const targetNode = nodes.find(n => n.id === targetNodeId)
    if (!targetNode || targetNode.type !== 'tableNode') return

    const incomers = getIncomers(targetNode, nodes, edges)
    if (!incomers || incomers.length === 0) return

    const incomerIds = incomers.map(n => n.id).sort()
    const datasets: any[][] = incomers.map(n => getEffectiveNodeData(n.id) || [])
    const lengths = datasets.map(d => Array.isArray(d) ? d.length : 0)
    const signature = `${incomerIds.join(',')}|${lengths.join(',')}`
    const lastSig = lastComputeSignatureRef.current.get(targetNodeId)
    if (lastSig === signature) return

    const merged: any[] = ([] as any[]).concat(...datasets)

    setNodeData(prev => {
      const current = prev[targetNodeId] || []
      // Only update when content meaningfully changed; length is a cheap proxy
      if (current.length === merged.length) return prev
      return { ...prev, [targetNodeId]: merged }
    })

    // Best-effort schema union
    try {
      const keySet = new Set<string>()
      merged.slice(0, 200).forEach(row => {
        if (row && typeof row === 'object') {
          Object.keys(row).forEach(k => keySet.add(k))
        }
      })
      const newSchema = Array.from(keySet).map(k => ({ name: k, type: 'TEXT' }))
      if (newSchema.length > 0) {
        setNodes(nds => {
          let didChange = false
          const updated = nds.map(n => {
            if (n.id !== targetNodeId) return n
            const existing: any[] = (n.data as any)?.schema || []
            const existingKeys = new Set(existing.map(f => String(f.name)))
            const newKeys = new Set(newSchema.map(f => String(f.name)))
            const sameSize = existingKeys.size === newKeys.size
            let equal = sameSize
            if (sameSize) {
              for (const k of newKeys) { if (!existingKeys.has(k)) { equal = false; break } }
            }
            if (equal) return n
            didChange = true
            return { ...n, data: { ...n.data, schema: newSchema } }
          })
          return didChange ? updated : nds
        })
      }
    } catch {}

    // Record signature to prevent infinite re-compute loops
    try { lastComputeSignatureRef.current.set(targetNodeId, signature) } catch {}
  }, [nodes, edges, getEffectiveNodeData, setNodeData, setNodes])
  // Broadcast selected table details for external consumers (e.g., Table Editor)
  useEffect(() => {
    if (!selectedNode) {
      window.dispatchEvent(new CustomEvent('dataflow-select-node', { detail: null }))
      return
    }
    if (selectedNode.type === 'tableNode') {
      const detail = {
        table: {
          id: selectedNode.id,
          name: (selectedNode.data as any)?.label || 'Table',
          source: (selectedNode.data as any)?.database || 'postgresql',
          schema: (selectedNode.data as any)?.schema || [],
          data: getNodeData(selectedNode.id) || [],
        }
      }
      window.dispatchEvent(new CustomEvent('dataflow-select-node', { detail }))
    } else {
      window.dispatchEvent(new CustomEvent('dataflow-select-node', { detail: null }))
    }
  }, [selectedNode, nodeData, filteredNodeData])

  // Allow external dataset imports to create a table node
  useEffect(() => {
    const handler = async (e: any) => {
      const { name, schema, data, rowCount } = e?.detail || {}
      const id = `dataset-${Date.now()}`
      const position = reactFlowInstance?.getViewport?.()
        ? reactFlowInstance.screenToFlowPosition({ x: 200, y: 200 })
        : { x: 200, y: 200 }
      const node: Node = {
        id,
        type: 'tableNode',
        position,
        data: {
          label: name || 'Dataset',
          database: 'dataset',
          schema: schema || [],
        },
      }
      setNodes(nds => nds.concat(node))
      setSelectedNode(node)
      setNodeData(prev => ({ ...prev, [id]: data || [] }))
      
      // Save the imported dataset to Supabase
      if (data && data.length > 0) {
        await saveTableData(
          id, 
          name || 'Dataset', 
          'dataset', 
          data, 
          schema || Object.keys(data[0]).map((col: string) => ({ name: col, type: 'TEXT' }))
        )
      }
      
      try {
        // Broadcast addition so design-mode can see it as a data source
        window.dispatchEvent(new CustomEvent('dataflow-table-added', {
          detail: {
            id,
            name: name || 'Dataset',
            source: 'dataset',
            schema: schema || [],
            data: data || [],
            rowCount: rowCount || (Array.isArray(data) ? data.length : 0),
          }
        }))
        dispatchedTableIdsRef.current.add(id)
      } catch {}
      // Fit view to include the new node
      setTimeout(() => {
        try { reactFlowInstance?.fitView?.({ padding: 0.9, duration: 400, minZoom: 0.25 }) } catch {}
      }, 0)
    }
    window.addEventListener('dataflow-import-dataset', handler as EventListener)
    return () => window.removeEventListener('dataflow-import-dataset', handler as EventListener)
  }, [reactFlowInstance, saveTableData])

  // Broadcast any table nodes that gain data so the design panel can list them
  useEffect(() => {
    try {
      nodes.forEach((n) => {
        if (n.type !== 'tableNode') return
        if (dispatchedTableIdsRef.current.has(n.id)) return
        const tableData = nodeData[n.id] || filteredNodeData[n.id]
        if (!tableData || tableData.length === 0) return
        const tableName = (n.data as any)?.label || 'Table'
        const source = (n.data as any)?.database || 'custom'
        const schema = (n.data as any)?.schema || []
        window.dispatchEvent(new CustomEvent('dataflow-table-added', {
          detail: {
            id: n.id,
            name: tableName,
            source,
            schema,
            data: tableData,
            rowCount: Array.isArray(tableData) ? tableData.length : 0,
          }
        }))
        dispatchedTableIdsRef.current.add(n.id)
      })
    } catch {}
  }, [nodes, nodeData, filteredNodeData])

  // No automatic initial table - users will add their own data sources

  // Refitting when container size changes to avoid jumbled layout
  useEffect(() => {
    if (!reactFlowWrapper.current) return
    const ResizeObs = (window as any).ResizeObserver
    if (!ResizeObs) return
    const ro = new ResizeObs(() => {
      try { reactFlowInstance?.fitView?.({ padding: 0.8, duration: 150, minZoom: 0.25 }) } catch {}
    })
    ro.observe(reactFlowWrapper.current)
    return () => ro.disconnect()
  }, [reactFlowInstance])

  // Handle connection creation with validation
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      // Add validation here if needed
      setEdges((eds) => addEdge(params, eds))
      const targetId = (params as any)?.target as string | undefined
      if (targetId) {
        // Recompute the target table after the edge is added
        setTimeout(() => recomputeTableFromIncomers(targetId), 0)
      }
    },
    [setEdges, recomputeTableFromIncomers]
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

  // Whenever edges or node data change, recompute all table targets with inputs
  useEffect(() => {
    const tableTargets = new Set<string>()
    edges.forEach(e => {
      const t = nodes.find(n => n.id === e.target)
      if (t && t.type === 'tableNode') tableTargets.add(t.id)
    })
    tableTargets.forEach(id => recomputeTableFromIncomers(id))
  }, [edges, nodeData, filteredNodeData, nodes, recomputeTableFromIncomers])

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
    (type: 'googlesheets' | 'csv' | 'shopify' | 'stripe' | 'database' | 'transform') => {
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
        case 'csv':
          newNode = {
            id,
            type: 'dataSourceNode',
            position: menuPosition,
            data: {
              label: 'CSV Upload',
              sourceType: 'csv',
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
  const computeConnectorPosition = useCallback((node: Node | null) => {
    if (!node || !reactFlowWrapper.current || !reactFlowInstance) return null
    const rect = reactFlowWrapper.current.getBoundingClientRect()
    const viewport = (reactFlowInstance as any)?.getViewport?.() || { x: 0, y: 0, zoom: 1 }
    const zoom = Number(viewport.zoom || 1)
    const translateX = Number(viewport.x || 0)
    const translateY = Number(viewport.y || 0)

    // Node visual dimensions (approx.)
    const nodeWidth = node.type === 'dataSourceNode' ? 240 : 220
    const gap = 16
    const panelWidth = 420
    const panelMaxHeight = Math.min(rect.height * 0.7, 640)

    // Node's top-left in container coordinates
    const nodeLeft = node.position.x * zoom + translateX
    const nodeTop = node.position.y * zoom + translateY

    // Prefer placing panel to the right of node; fall back to left if overflow
    let left = nodeLeft + nodeWidth + gap
    if (left + panelWidth > rect.width - 8) {
      left = Math.max(8, nodeLeft - panelWidth - gap)
    }

    // Clamp vertical position within container
    let top = Math.max(8, Math.min(nodeTop, rect.height - panelMaxHeight - 8))

    return { left, top }
  }, [reactFlowInstance])

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    // Do not auto-open Node Actions menu (removed); only open connector inline panel for data sources
    if (node.type === 'dataSourceNode') {
      setShowConnectorPanel(true)
      setShowPreviewPanel(false)
      setShowFilterPanel(false)
      const pos = computeConnectorPosition(node)
      if (pos) setConnectorPosition(pos)
    }
  }, [computeConnectorPosition])

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

  // Apply query builder config to a dataset
  const applyQueryConfig = useCallback((rows: any[], query: any) => {
    if (!Array.isArray(rows) || !query) return rows
    let result = [...rows]
    try {
      // Filters: array of { field, operator, value }
      if (Array.isArray(query.filters) && query.filters.length > 0) {
        result = result.filter((row) => {
          return query.filters.every((f: any) => {
            const field = String(f.field || '').trim()
            if (!field) return true
            const op = String(f.operator || 'equals').toLowerCase()
            const val = f.value
            const rv = (row as any)[field]
            switch (op) {
              case 'equals': return String(rv) === String(val)
              case 'contains': return String(rv ?? '').toLowerCase().includes(String(val ?? '').toLowerCase())
              case '>': return Number(rv) > Number(val)
              case '<': return Number(rv) < Number(val)
              case '>=': return Number(rv) >= Number(val)
              case '<=': return Number(rv) <= Number(val)
              case '!=': return String(rv) !== String(val)
              default: return true
            }
          })
        })
      }

      // Select: array of column names
      if (Array.isArray(query.selectColumns) && query.selectColumns.length > 0) {
        const cols = query.selectColumns.map((c: any) => String(c).trim()).filter((c: string) => c.length > 0)
        if (cols.length > 0) {
          result = result.map((row) => {
            const projected: any = {}
            cols.forEach((c: string) => { projected[c] = (row as any)[c] })
            return projected
          })
        }
      }

      // Sort: { field, direction }
      if (query.sortBy && query.sortBy.field) {
        const dir = String(query.sortBy.direction || 'asc').toLowerCase() === 'desc' ? -1 : 1
        const field = String(query.sortBy.field)
        result = result.slice().sort((a, b) => {
          const av = (a as any)[field]
          const bv = (b as any)[field]
          if (av == null && bv == null) return 0
          if (av == null) return -1 * dir
          if (bv == null) return 1 * dir
          if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
          return String(av).localeCompare(String(bv)) * dir
        })
      }

      // Limit: number
      if (typeof query.limit === 'number' && query.limit > 0) {
        result = result.slice(0, query.limit)
      }
    } catch {}
    return result
  }, [])

  

  // Handle data source connection
  const handleSourceConnect = useCallback((config: any) => {
    if (!selectedNode) return
    setNodeConfigs(prev => ({ ...prev, [selectedNode.id]: config }))

    // If Google Sheets, verify by fetching data first before marking as connected
    if (config.sourceType === 'googlesheets' && config.spreadsheetId) {
      const computedRange = config.sheetName
        ? `${config.sheetName}!${config.range || 'A:Z'}`
        : (config.range || 'A:Z')

      // Indicate pending state while verifying
      setNodes(nds => nds.map(node => 
        node.id === selectedNode.id 
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                connected: false,
                lastSync: 'Connecting…',
                error: undefined,
                details: config.spreadsheetUrl || config.spreadsheetId
              } 
            }
          : node
      ))

      ;(async () => {
        try {
          const resp = await fetch('/api/google-sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'fetchData', spreadsheetId: config.spreadsheetId, range: computedRange }),
          })
          const json = await resp.json()
          if (json.success) {
            const rawData = json.data
            const queried = applyQueryConfig(Array.isArray(rawData) ? rawData : [], config.query)
            setNodeData(prev => ({ ...prev, [selectedNode.id]: queried }))
            // Now mark as connected
            setNodes(nds => nds.map(node => 
              node.id === selectedNode.id 
                ? { 
                    ...node, 
                    data: { 
                      ...node.data, 
                      connected: true,
                      lastSync: 'Just now',
                      error: undefined,
                      details: config.spreadsheetUrl || config.spreadsheetId
                    } 
                  }
                : node
            ))
            setShowPreviewPanel(true)
            
            // Save the table data to Supabase
            const tableName = config.spreadsheetName || config.sheetName || `Sheet_${Date.now()}`
            const schema = queried.length > 0 ? Object.keys(queried[0]).map((col: string) => ({ name: col, type: 'TEXT' })) : []
            await saveTableData(selectedNode.id, tableName, 'googlesheets', queried, schema)
          } else {
            // Fetch failed: show error state and keep as not connected
            setNodeData(prev => ({ ...prev, [selectedNode.id]: [] }))
            setNodes(nds => nds.map(node => 
              node.id === selectedNode.id 
                ? { 
                    ...node, 
                    data: { 
                      ...node.data, 
                      connected: false,
                      lastSync: 'Failed',
                      error: json.error || 'Failed to fetch data'
                    } 
                  }
                : node
            ))
          }
        } catch (e: any) {
          setNodeData(prev => ({ ...prev, [selectedNode.id]: [] }))
          setNodes(nds => nds.map(node => 
            node.id === selectedNode.id 
              ? { 
                  ...node, 
                  data: { 
                    ...node.data, 
                    connected: false,
                    lastSync: 'Failed',
                    error: 'Network error while fetching data'
                  } 
                }
              : node
          ))
        }
      })()
    } else if (config.sourceType === 'csv') {
      // Mark connected and set parsed CSV data
      setNodes(nds => nds.map(node => 
        node.id === selectedNode.id 
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                connected: true,
                lastSync: 'Just now',
                error: undefined,
                details: config.fileName || 'CSV'
              } 
            }
          : node
      ))
      const rows = Array.isArray(config.parsedData) ? config.parsedData : []
      const queried = applyQueryConfig(rows, config.query)
      setNodeData(prev => ({ ...prev, [selectedNode.id]: queried }))
      const tableName = config.fileName?.replace(/\.[^/.]+$/, '') || `CSV_${Date.now()}`
      const schema = queried.length > 0 ? Object.keys(queried[0]).map((c: string) => ({ name: c, type: 'TEXT' })) : (Array.isArray(config.schema) ? config.schema : [])
      saveTableData(selectedNode.id, tableName, 'csv', queried, schema)
      setShowPreviewPanel(true)
    } else {
      // Non-sheets: mark as connected immediately and set placeholder data
      setNodes(nds => nds.map(node => 
        node.id === selectedNode.id 
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                connected: true,
                lastSync: 'Just now',
                error: undefined,
                details: config.store || 'Connected'
              } 
            }
          : node
      ))
      const sampleData = generateSampleData('tableNode', selectedNode.id)
      const queried = applyQueryConfig(sampleData, config.query)
      setNodeData(prev => ({ ...prev, [selectedNode.id]: queried }))
      
      // Save the data source to Supabase
      const sourceName = config.sourceType === 'shopify' ? `Shopify ${config.store || 'Store'}` : 
                        config.sourceType === 'stripe' ? 'Stripe Data' :
                        config.sourceType === 'googleads' ? 'Google Ads' :
                        config.sourceType || 'Data Source'
      const schema = queried.length > 0 ? Object.keys(queried[0]).map((col: string) => ({ name: col, type: 'TEXT' })) : []
      saveTableData(selectedNode.id, sourceName, config.sourceType || 'api', queried, schema)
    }
  }, [selectedNode, setNodes, saveTableData, applyQueryConfig])

  // Handle drag over to allow dropping
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  // Handle drop of tables from sidebar
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      const data = event.dataTransfer.getData('application/json')
      
      if (!data || !reactFlowBounds || !reactFlowInstance) return

      try {
        const parsedData = JSON.parse(data)
        if (parsedData.type !== 'table' && parsedData.type !== 'create-source') return

        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        })

        if (parsedData.type === 'table') {
          const newNode: Node = {
            id: `table-${parsedData.table.id}-${Date.now()}`,
            type: 'tableNode',
            position,
            data: {
              label: parsedData.table.name,
              database: parsedData.table.source,
              tableId: parsedData.table.id,
              schema: parsedData.table.schema || [],
              connected: true,
              lastSync: 'From saved',
            },
          }
          setNodes((nds) => nds.concat(newNode))
          loadTableData(parsedData.table.id, newNode.id)
        } else if (parsedData.type === 'create-source') {
          const id = `${parsedData.source}-${Date.now()}`
          const sourceNode: Node = {
            id,
            type: 'dataSourceNode',
            position,
            data: {
              label: parsedData.sourceLabel || 'Data Source',
              sourceType: parsedData.source,
              connected: false,
              details: 'Click to connect',
            },
          }
          setNodes((nds) => nds.concat(sourceNode))
          setSelectedNode(sourceNode)
          setShowConnectorPanel(true)
        }
      } catch (error) {
        console.error('Error handling drop:', error)
      }
    },
    [reactFlowInstance, setNodes]
  )

  // Listen for create-source events from the sidebar to create a source node at center
  useEffect(() => {
    const handler = (e: any) => {
      const { source, config } = e?.detail || {}
      if (!reactFlowWrapper.current || !reactFlowInstance || !source) return
      const rect = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.screenToFlowPosition({ x: rect.width / 2, y: rect.height / 2 })
      const id = `${source}-${Date.now()}`
        const labelMap: Record<string, string> = {
        googlesheets: 'Google Sheets',
          csv: 'CSV Upload',
        shopify: 'Shopify',
        stripe: 'Stripe',
        googleads: 'Google Ads',
      }
      const sourceNode: Node = {
        id,
        type: 'dataSourceNode',
        position: { x: position.x - 120, y: position.y - 60 },
        data: {
          label: labelMap[String(source)] || 'Data Source',
          sourceType: source,
          connected: false,
          details: 'Click to connect',
        },
      }
      setNodes((nds) => nds.concat(sourceNode))
      setSelectedNode(sourceNode)
      setShowConnectorPanel(true)
    }
    window.addEventListener('dataflow-create-source-on-canvas', handler as EventListener)
    return () => window.removeEventListener('dataflow-create-source-on-canvas', handler as EventListener)
  }, [reactFlowInstance, setNodes])

  // Load table data from Supabase
  const loadTableData = useCallback(async (tableId: string, nodeId: string) => {
    try {
      const response = await fetch(`/api/data-tables/${tableId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.table) {
          setNodeData(prev => ({ ...prev, [nodeId]: data.table.data || [] }))
        }
      }
    } catch (error) {
      console.error('Error loading table data:', error)
    }
  }, [])

  // Handle table deletion from sidebar
  const handleTableDeleted = useCallback((tableId: string) => {
    // Remove any nodes that reference this table
    setNodes(nds => nds.filter(node => 
      node.data?.tableId !== tableId
    ))
  }, [setNodes])

  // No default nodes; start empty and show blank-state UI

  return (
    <div
      className="w-full h-full relative"
      ref={reactFlowWrapper}
      style={{
        ...(background?.type === 'color' && { backgroundColor: background.value }),
        ...(background?.type === 'gradient' && { backgroundImage: background.value, backgroundColor: 'transparent' }),
        ...(background?.type === 'image' && {
          backgroundImage: `url(${background.value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          backgroundColor: 'transparent',
        }),
      }}
    >
      {/* Data Manager Sidebar - always visible */}
      <DataManagerSidebar
        onDragStart={() => {}}
        onTableDeleted={handleTableDeleted}
        onAddTable={() => setShowSourcePicker(true)}
        onAddDataSource={() => setShowSourcePicker(true)}
        onCreateTable={() => {
          if (!reactFlowWrapper.current || !reactFlowInstance) return
          const rect = reactFlowWrapper.current.getBoundingClientRect()
          const center = reactFlowInstance.screenToFlowPosition({ x: rect.width / 2, y: rect.height / 2 })
          const id = `table-${Date.now()}`
          const newTable: Node = {
            id,
            type: 'tableNode',
            position: { x: center.x - 120, y: center.y - 60 },
            data: {
              label: 'Empty Table',
              database: 'custom',
              schema: [],
            },
          }
          setNodes(nds => nds.concat(newTable))
          setSelectedNode(newTable)
          setTimeout(() => {
            try { reactFlowInstance?.fitView?.({ padding: 0.9, duration: 300, minZoom: 0.25 }) } catch {}
          }, 0)
        }}
      />
      
      {/* ReactFlow Canvas - full width since sidebar is absolute */}
      <div className="w-full h-full relative">
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onNodeClick={onNodeClick}
        onInit={handleInit}
        onContextMenu={onContextMenu}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.9,
          minZoom: 0.25,
          maxZoom: 2,
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.4 }}
        snapToGrid
        snapGrid={[15, 15]}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#3B82F6', strokeWidth: 2 },
        }}
        >
        {showGrid && (
          <Background 
            color={isDarkMode ? '#374151' : '#E5E7EB'} 
            gap={15} 
          />
        )}
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
              if (sourceType === 'csv') return '#059669'
              if (sourceType === 'shopify') return '#8B5CF6'
              if (sourceType === 'stripe') return '#6366F1'
              if (sourceType === 'googleads') return '#F59E0B'
              return '#3B82F6'
            }
            return '#6B7280'
          }}
          className={isDarkMode ? 'react-flow__minimap-dark' : ''}
        />
      </ReactFlow>

      {/* Floating Add Table button removed; moved into Node Actions under Add Data Source */}

      {/* Blank-state when no nodes */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`pointer-events-auto border rounded-xl shadow-md p-6 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="text-sm font-medium mb-4">Start by adding a data source</div>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                onClick={() => setShowSourcePicker(true)}
              >
                ADD DATA SOURCE
              </button>
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                onClick={() => {
                  try { window.dispatchEvent(new CustomEvent('open-premade-datasets')) } catch {}
                }}
              >
                USE SAMPLE DATA
              </button>
            </div>
          </div>
        </div>
      )}

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
            onClick={() => addNode('csv')}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            <span className="text-sm">CSV Upload</span>
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

      {/* Instructions panel removed to avoid overlapping with header/logo */}

      {/* Data Source Picker */}
      <DataSourcePickerModal
        isOpen={showSourcePicker}
        onClose={() => setShowSourcePicker(false)}
        isDarkMode={isDarkMode}
        onSelect={(source) => {
          // If user chose premade datasets, open that modal and exit
          if (source === 'preset') {
            try { window.dispatchEvent(new CustomEvent('open-premade-datasets')) } catch {}
            setShowSourcePicker(false)
            return
          }
          // Determine placement relative to a selected or existing table
          let targetTable: Node | undefined = undefined
          if (selectedNode && selectedNode.type === 'tableNode') {
            targetTable = selectedNode
          } else {
            targetTable = nodes.find(n => n.type === 'tableNode')
          }

          let position = { x: 200, y: 120 }
          if (targetTable) {
            // Place data source to the left of the table
            position = { x: targetTable.position.x - 260, y: targetTable.position.y }
          } else if (reactFlowWrapper.current && reactFlowInstance) {
            const rect = reactFlowWrapper.current.getBoundingClientRect()
            const pos = reactFlowInstance.screenToFlowPosition({ x: rect.width / 2, y: rect.height / 2 })
            position = { x: pos.x - 120, y: pos.y - 60 }
          }

          const id = `${source}-${Date.now()}`
          const labelMap: Record<string, string> = {
            googlesheets: 'Google Sheets',
            shopify: 'Shopify',
            stripe: 'Stripe',
            googleads: 'Google Ads',
          }

          const sourceNode: Node = {
            id,
            type: 'dataSourceNode',
            position,
            data: {
              label: labelMap[String(source)] || 'Data Source',
              sourceType: source,
              connected: false,
              details: 'Click to connect',
            },
          }

          setNodes((nds) => nds.concat(sourceNode))

          // Do not auto-connect. User will connect manually.

          setSelectedNode(sourceNode)
          setShowSourcePicker(false)
          setShowConnectorPanel(true)
          const pos = computeConnectorPosition(sourceNode)
          if (pos) setConnectorPosition(pos)

          // Fit view to show both nodes comfortably
          setTimeout(() => {
            try {
              reactFlowInstance?.fitView?.({ padding: 0.9, duration: 400, minZoom: 0.25 })
            } catch {}
          }, 0)
        }}
      />

      {/* Node Actions Panel removed */}

      {/* Data Preview Panel */}
      {showPreviewPanel && selectedNode && (
        <DataPreviewPanel
          nodeId={selectedNode.id}
          nodeLabel={String((selectedNode.data as any)?.label ?? 'Data Preview')}
          data={getNodeData(selectedNode.id)}
          onClose={() => setShowPreviewPanel(false)}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Data Filter Panel */}
      {showFilterPanel && selectedNode && (
        <DataFilterPanel
          nodeId={selectedNode.id}
          nodeLabel={String((selectedNode.data as any)?.label ?? 'Filter Data')}
          data={getNodeData(selectedNode.id)}
          onApplyFilter={handleApplyFilter}
          onClose={() => setShowFilterPanel(false)}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Data Source Connector Panel - right sidebar */}
      {showConnectorPanel && selectedNode && selectedNode.type === 'dataSourceNode' && (
        <DataSourceConnector
          sourceType={(selectedNode.data as any)?.sourceType}
          nodeId={selectedNode.id}
          nodeLabel={String((selectedNode.data as any)?.label ?? 'Data Source')}
          currentConfig={nodeConfigs[selectedNode.id]}
          onConnect={handleSourceConnect}
          onClose={() => setShowConnectorPanel(false)}
          isDarkMode={isDarkMode}
          layout="sidebar"
        />
      )}
      </div>
    </div>
  )
}