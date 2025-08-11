'use client'

import { useCallback, useRef, useState, useMemo, useEffect, createContext, useContext } from 'react'
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
import { Database, Table2, GitMerge, Plus, Eye, Filter, Play, Settings, X, CloudDownload, RefreshCw, FileSpreadsheet, Calculator, SortAsc, GroupIcon, AlertCircle } from 'lucide-react'
import { GoogleSheetsLogo, ShopifyLogo, StripeLogo, GoogleAdsLogo } from './brand/Logos'
const DataSourcePickerModal = dynamic(() => import('./DataSourcePickerModal'), { ssr: false })
const DataManagerSidebar = dynamic(() => import('./DataManagerSidebar'), { ssr: false })
const UpgradeLimitModal = dynamic(() => import('./billing/UpgradeLimitModal'), { ssr: false })
const UpgradePlansModal = dynamic(() => import('./billing/UpgradePlansModal'), { ssr: false })

// Dynamically import panels
const DataPreviewPanel = dynamic(() => import('./DataPreviewPanel'), { ssr: false })
const DataFilterPanel = dynamic(() => import('./DataFilterPanel'), { ssr: false })
const DataSourceConnector = dynamic(() => import('./DataSourceConnector'), { ssr: false })
const TableDetailsPanel = dynamic(() => import('./TableDetailsPanel'), { ssr: false })
const TransformBuilder = dynamic(() => import('./TransformBuilder'), { ssr: false })

// Context for sharing loading state
const DataFlowContext = createContext<{ isLoadingNode: string | null } | null>(null)

// Custom node component for tables
function TableNode({ data, selected, id }: any) {
  const { isLoadingNode } = useContext(DataFlowContext) || {}
  const isLoading = isLoadingNode === id
  
  return (
    <div className={`bg-white rounded-lg shadow-lg border-2 p-4 min-w-[200px] relative ${
      selected ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-30' : 'border-gray-300'
    }`}>
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 rounded-lg flex items-center justify-center z-10">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-blue-600 animate-spin" />
            <span className="text-sm text-blue-600 font-medium">Loading data...</span>
          </div>
        </div>
      )}
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
  const getTransformIcon = () => {
    if (data.config?.filters?.length > 0) return <Filter size={14} className="text-purple-600" />
    if (data.config?.calculations?.length > 0) return <Calculator size={14} className="text-purple-600" />
    if (data.config?.aggregation?.groupBy) return <GroupIcon size={14} className="text-purple-600" />
    if (data.config?.sort?.field) return <SortAsc size={14} className="text-purple-600" />
    return <GitMerge size={14} className="text-purple-600" />
  }

  const getTransformDescription = () => {
    const parts = []
    if (data.config?.filters?.length > 0) {
      parts.push(`${data.config.filters.length} filter${data.config.filters.length > 1 ? 's' : ''}`)
    }
    if (data.config?.calculations?.length > 0) {
      parts.push(`${data.config.calculations.length} calculation${data.config.calculations.length > 1 ? 's' : ''}`)
    }
    if (data.config?.aggregation?.groupBy) {
      parts.push(`Grouped by ${data.config.aggregation.groupBy}`)
    }
    if (data.config?.sort?.field) {
      parts.push(`Sorted by ${data.config.sort.field}`)
    }
    return parts.length > 0 ? parts.join(', ') : 'Click to configure'
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border-2 p-4 min-w-[200px] max-w-[240px] ${
      selected ? 'border-purple-500 ring-2 ring-purple-500 ring-opacity-30' : 'border-gray-300'
    }`}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />
      <div className="flex items-center gap-2 mb-2">
        {getTransformIcon()}
        <span className="font-semibold text-sm">{data.label}</span>
      </div>
      <div className="text-xs text-gray-600">
        {getTransformDescription()}
      </div>
      {data.outputRows !== undefined && (
        <div className="mt-2 text-xs text-gray-500">
          Output: {data.outputRows} rows
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

  // Custom node component for data sources
  function DataSourceNode({ data, selected, id }: any) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState<string | null>(null)
  
  const getIcon = () => {
    switch (data.sourceType) {
      case 'googlesheets':
        return <GoogleSheetsLogo size={16} className="text-[#0F9D58]" />
      case 'shopify':
        return <ShopifyLogo size={16} className="text-[#95BF47]" />
      case 'stripe':
        return <StripeLogo size={16} className="text-[#635BFF]" />
      case 'googleads':
        return <GoogleAdsLogo size={16} className="text-[#4285F4]" />
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

  const hasValidQuery = () => {
    return data.connected && data.queryInfo && Object.keys(data.queryInfo).length > 0
  }

  const getFrequencyBadge = () => {
    if (!data.config?.sync) return null
    const { mode, frequency } = data.config.sync
    if (mode === 'recurring') {
      return (
        <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
          <RefreshCw size={10} />
          <span className="capitalize">{frequency}</span>
        </div>
      )
    }
    return null
  }
  
  const handleSync = async () => {
    setIsSyncing(true)
    setSyncProgress('Connecting...')
    
    try {
      // Dispatch sync event for parent to handle
      setTimeout(() => setSyncProgress('Fetching data...'), 500)
      window.dispatchEvent(new CustomEvent('dataflow-sync-source', { 
        detail: { nodeId: id, sourceType: data.sourceType, config: data.config } 
      }))
      
      // Simulate sync process
      setTimeout(() => {
        setSyncProgress('Processing...')
      }, 1500)
      
      setTimeout(() => {
        setIsSyncing(false)
        setSyncProgress(null)
        // Update last sync time
        window.dispatchEvent(new CustomEvent('dataflow-sync-complete', { 
          detail: { nodeId: id, timestamp: new Date().toLocaleString() } 
        }))
      }, 3000)
    } catch (error) {
      console.error('Sync failed:', error)
      setIsSyncing(false)
      setSyncProgress(null)
    }
  }

    return (
      <div className={`bg-white rounded-lg shadow-lg border-2 p-4 min-w-[240px] max-w-[280px] ${
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
      
      {/* Query Information */}
      {data.queryInfo && (
        <div className="text-xs bg-gray-50 rounded p-2 mb-2 space-y-1">
          {data.queryInfo.resource && (
            <div className="flex items-center gap-1">
              <Table2 size={10} className="text-gray-500" />
              <span className="font-medium">{data.queryInfo.resource}</span>
            </div>
          )}
          {data.queryInfo.dateRange && (
            <div className="text-gray-600">{data.queryInfo.dateRange}</div>
          )}
          {data.queryInfo.filters && data.queryInfo.filters.length > 0 && (
            <div className="flex items-center gap-1">
              <Filter size={10} className="text-gray-500" />
              <span className="text-gray-600">{data.queryInfo.filters.length} filter{data.queryInfo.filters.length > 1 ? 's' : ''}</span>
            </div>
          )}
          {data.queryInfo.limit && (
            <div className="text-gray-600">Limit: {data.queryInfo.limit} rows</div>
          )}
        </div>
      )}
      
      {/* Sync Frequency */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-600">
          {data.sourceType === 'googlesheets' && 'Google Sheets'}
          {data.sourceType === 'shopify' && 'Shopify'}
          {data.sourceType === 'stripe' && 'Stripe'}
          {data.sourceType === 'googleads' && 'Google Ads'}
          {data.sourceType === 'csv' && 'CSV File'}
          {data.sourceType === 'database' && data.database}
        </div>
        {getFrequencyBadge()}
      </div>
      
      {data.details && (
        <div className="mt-1 text-xs text-gray-500 truncate" title={data.details}>
          {data.details}
        </div>
      )}
      {/* Sync status and button */}
      <div className="mt-2 flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {isSyncing && syncProgress ? (
            <span className="text-blue-600 font-medium">{syncProgress}</span>
          ) : (
            data.lastSync && `Last: ${data.lastSync}`
          )}
        </div>
        {data.connected && (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            title={isSyncing ? 'Syncing...' : 'Sync now'}
          >
            <RefreshCw 
              size={14} 
              className={`text-gray-600 ${isSyncing ? 'animate-spin' : 'hover:text-blue-600'}`} 
            />
          </button>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className={`w-3 h-3 !border-2 !border-white ${
          hasValidQuery() ? '!bg-green-500' : '!bg-red-500'
        }`}
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
  const createUniqueId = useCallback((prefix: string) => {
    const uuid = (globalThis as any).crypto?.randomUUID?.() || `${Math.random().toString(36).slice(2)}-${Date.now()}`
    return `${prefix}-${uuid}`
  }, [])
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  
  // Custom edge style based on source node status
  const getEdgeStyle = useCallback((edge: Edge) => {
    const sourceNode = nodes.find(n => n.id === edge.source)
    if (!sourceNode) return { stroke: '#3B82F6', strokeWidth: 2 }
    
    const data = sourceNode.data as any
    const hasValidQuery = data.connected && data.queryInfo && Object.keys(data.queryInfo).length > 0
    
    if (data.error || !data.connected) {
      return { stroke: '#EF4444', strokeWidth: 2 } // Red for errors
    }
    if (!hasValidQuery) {
      return { stroke: '#F97316', strokeWidth: 2 } // Orange for no query
    }
    return { stroke: '#3B82F6', strokeWidth: 2 } // Blue for valid
  }, [nodes])
  
  // Update edges with custom styles
  const styledEdges = useMemo(() => {
    return edges.map(edge => ({
      ...edge,
      animated: (() => {
        const sourceNode = nodes.find(n => n.id === edge.source)
        if (!sourceNode) return true
        const data = sourceNode.data as any
        const hasValidQuery = data.connected && data.queryInfo && Object.keys(data.queryInfo).length > 0
        return hasValidQuery && !data.error // Only animate if valid
      })(),
      style: getEdgeStyle(edge)
    }))
  }, [edges, nodes, getEdgeStyle])
  const [showNodeMenu, setShowNodeMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  const [isLoadingNode, setIsLoadingNode] = useState<string | null>(null)
  
  // Panel states
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showPreviewPanel, setShowPreviewPanel] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showConnectorPanel, setShowConnectorPanel] = useState(false)
  const [showTableDetailsPanel, setShowTableDetailsPanel] = useState(false)
  const [showTransformPanel, setShowTransformPanel] = useState(false)
  const [connectorPosition, setConnectorPosition] = useState<{ left: number; top: number } | null>(null)
  const [nodeData, setNodeData] = useState<{ [key: string]: any[] }>({})
  const [filteredNodeData, setFilteredNodeData] = useState<{ [key: string]: any[] }>({})
  const [nodeConfigs, setNodeConfigs] = useState<{ [key: string]: any }>({})
  const [showSourcePicker, setShowSourcePicker] = useState(false)
  const [showUpgradeLimit, setShowUpgradeLimit] = useState(false)
  const [showUpgradePlans, setShowUpgradePlans] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null)
  const initializedRef = useRef(false)
  const dispatchedTableIdsRef = useRef<Set<string>>(new Set())
  const pendingLoadRef = useRef<any>(null)
  const hasLoadedFromStateRef = useRef<boolean>(false)
  // Broadcast full dataflow state upward for persistence
  useEffect(() => {
    try {
      // Always broadcast state, even if empty (to ensure state is always up-to-date)
      window.dispatchEvent(new CustomEvent('dataflow-state-changed', {
        detail: { nodes, edges, nodeData, nodeConfigs }
      }))
      // Successfully broadcasting state
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
        // Ensure container has dimensions before fitting
        setTimeout(() => {
          if (!reactFlowWrapper.current) return
          const rect = reactFlowWrapper.current.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0) {
            try { 
              reactFlowInstance?.fitView?.({ padding: 0.85, duration: 300, minZoom: 0.25, maxZoom: 1.5 }) 
            } catch {}
          }
        }, 200)
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

  const handleUpgradeNow = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const json = await res.json()
      if (json?.url) {
        window.location.href = json.url
      }
    } catch (e) {
      console.error('Failed to start checkout', e)
    }
  }, [])

  const handleViewPlans = useCallback(() => {
    setShowUpgradeLimit(false)
    setShowUpgradePlans(true)
  }, [])

  // When React Flow initializes, apply any pending load state and fit view
  const handleInit = useCallback((instance: any) => {
    setReactFlowInstance(instance)
    
    // Ensure container has dimensions before fitting
    const ensureFitView = () => {
      if (!reactFlowWrapper.current) return
      const rect = reactFlowWrapper.current.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        // Container has dimensions, safe to fit
        instance?.fitView?.({ padding: 0.85, duration: 300, minZoom: 0.25, maxZoom: 1.5 })
      } else {
        // Container not ready, retry
        setTimeout(ensureFitView, 100)
      }
    }
    
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
      // Delay fit view to ensure nodes are rendered
      setTimeout(ensureFitView, 100)
    } else {
      // No pending load: do a gentle fit once the container has size
      setTimeout(ensureFitView, 100)
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
        if (response.status === 402 && result?.requiresUpgrade) {
          setUpgradeMessage(result?.error || 'Plan limit reached')
          setShowUpgradeLimit(true)
        }
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
      const id = createUniqueId('dataset')
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
      setNodes(nds => {
        // Check if node with this ID already exists
        if (nds.some(n => n.id === node.id)) {
          console.warn('Node with ID already exists:', node.id)
          return nds
        }
        return nds.concat(node)
      })
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
      const id = createUniqueId(type)
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
              label: 'Data Transform',
              config: null,
              outputRows: undefined,
            },
          }
          break
      }

      setNodes((nds) => {
        // Check if node with this ID already exists
        if (nds.some(n => n.id === newNode.id)) {
          console.warn('Node with ID already exists:', newNode.id)
          return nds
        }
        return nds.concat(newNode)
      })
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
      setShowTableDetailsPanel(false)
      setShowTransformPanel(false)
      const pos = computeConnectorPosition(node)
      if (pos) setConnectorPosition(pos)
    } else if (node.type === 'tableNode') {
      setShowTableDetailsPanel(true)
      setShowConnectorPanel(false)
      setShowPreviewPanel(false)
      setShowFilterPanel(false)
      setShowTransformPanel(false)
    } else if (node.type === 'transformNode') {
      setShowTransformPanel(true)
      setShowConnectorPanel(false)
      setShowPreviewPanel(false)
      setShowFilterPanel(false)
      setShowTableDetailsPanel(false)
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

  // Get input data for a transform node (from connected source)
  const getInputDataForTransform = useCallback((transformNodeId: string): any[] => {
    // Find edges connected to this transform node's input
    const incomingEdge = edges.find(e => e.target === transformNodeId)
    if (!incomingEdge) return []
    
    // Get data from the source node
    const sourceNodeId = incomingEdge.source
    return getNodeData(sourceNodeId)
  }, [edges, getNodeData])
  
  // Handle transform configuration apply
  const handleTransformApply = useCallback((config: any, transformedData: any[]) => {
    if (!selectedNode) return
    
    // Save config to node
    setNodeConfigs(prev => ({ ...prev, [selectedNode.id]: config }))
    
    // Update node visual with config info
    setNodes(nds => nds.map(node => 
      node.id === selectedNode.id 
        ? { 
            ...node, 
            data: { 
              ...node.data, 
              config,
              outputRows: transformedData.length
            } 
          }
        : node
    ))
    
    // Store transformed data
    setNodeData(prev => ({ ...prev, [selectedNode.id]: transformedData }))
    
    // Show preview
    setShowPreviewPanel(true)
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
    
    // Extract query information for display
    const extractQueryInfo = (cfg: any) => {
      const info: any = {}
      
      // Resource/table info
      if (cfg.resource) info.resource = cfg.resource
      if (cfg.sheetName) info.resource = cfg.sheetName
      if (cfg.tableName) info.resource = cfg.tableName
      
      // Date range
      if (cfg.dateRange) {
        info.dateRange = cfg.dateRange.replace(/_/g, ' ').replace(/^(last|this) /, (match: string) => match.charAt(0).toUpperCase() + match.slice(1))
      } else if (cfg.query?.dateRange?.preset) {
        const preset = cfg.query.dateRange.preset
        info.dateRange = preset.replace(/_/g, ' ').replace(/^(last|this) /, (match: string) => match.charAt(0).toUpperCase() + match.slice(1))
      }
      
      // Filters
      if (cfg.query?.filters && Array.isArray(cfg.query.filters)) {
        const validFilters = cfg.query.filters.filter((f: any) => f.field && f.value)
        if (validFilters.length > 0) info.filters = validFilters
      }
      
      // Limit
      if (cfg.query?.limit) info.limit = cfg.query.limit
      if (cfg.limit) info.limit = cfg.limit
      
      // Sync mode
      if (cfg.sync) info.sync = cfg.sync
      
      return info
    }
    
    // Generate descriptive name based on config
    const generateNodeName = (cfg: any) => {
      const sourceType = cfg.sourceType || (selectedNode.data as any)?.sourceType
      
      if (sourceType === 'shopify') {
        const resource = cfg.resource || 'orders'
        const dateRange = cfg.query?.dateRange?.preset || cfg.dateRange || ''
        if (dateRange && dateRange !== 'all_time') {
          const formatted = dateRange.replace(/_/g, ' ')
          return `Shopify ${resource} (${formatted})`
        }
        return `Shopify ${resource}`
      }
      
      if (sourceType === 'stripe') {
        const resource = cfg.resource || 'charges'
        const dateRange = cfg.dateRange || cfg.query?.dateRange?.preset || ''
        if (dateRange && dateRange !== 'all_time') {
          const formatted = dateRange.replace(/_/g, ' ')
          return `Stripe ${resource} (${formatted})`
        }
        return `Stripe ${resource}`
      }
      
      if (sourceType === 'googleads') {
        const resource = cfg.resource || 'campaigns'
        return `Google Ads ${resource}`
      }
      
      if (sourceType === 'googlesheets') {
        if (cfg.sheetName) return cfg.sheetName
        if (cfg.spreadsheetUrl) {
          const match = cfg.spreadsheetUrl.match(/\/([^\/]+?)(?:\?|#|$)/)
          if (match) return match[1]
        }
        return 'Google Sheet'
      }
      
      if (sourceType === 'csv') {
        if (cfg.fileName) return cfg.fileName.replace(/\.csv$/i, '')
        return 'CSV Data'
      }
      
      return (selectedNode.data as any)?.label || 'Data Source'
    }
    
    const queryInfo = extractQueryInfo(config)
    const nodeName = generateNodeName(config)

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
                details: config.spreadsheetUrl || config.spreadsheetId,
                label: nodeName,
                queryInfo,
                config
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
                      details: config.spreadsheetUrl || config.spreadsheetId,
                      label: nodeName,
                      queryInfo,
                      config
                    } 
                  }
                : node
            ))
            setShowPreviewPanel(true)
            
            // Save the table data to Supabase
            const tableName = config.spreadsheetName || config.sheetName || `Sheet_${(globalThis as any).crypto?.randomUUID?.() || Date.now()}`
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
                details: config.fileName || 'CSV',
                label: nodeName,
                queryInfo,
                config
              } 
            }
          : node
      ))
      const rows = Array.isArray(config.parsedData) ? config.parsedData : []
      const queried = applyQueryConfig(rows, config.query)
      setNodeData(prev => ({ ...prev, [selectedNode.id]: queried }))
      const tableName = config.fileName?.replace(/\.[^/.]+$/, '') || `CSV_${(globalThis as any).crypto?.randomUUID?.() || Date.now()}`
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
                details: config.store || 'Connected',
                label: nodeName,
                queryInfo,
                config
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
            id: createUniqueId('table'),
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
          setNodes((nds) => {
            // Check if node with this ID already exists
            if (nds.some(n => n.id === newNode.id)) {
              console.warn('Node with ID already exists:', newNode.id)
              return nds
            }
            return nds.concat(newNode)
          })
          setIsLoadingNode(newNode.id)
          loadTableData(parsedData.table.id, newNode.id).finally(() => {
            setIsLoadingNode(null)
          })
        } else if (parsedData.type === 'create-source') {
          const id = createUniqueId(parsedData.source)
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
          setNodes((nds) => {
            // Check if node with this ID already exists
            if (nds.some(n => n.id === sourceNode.id)) {
              console.warn('Node with ID already exists:', sourceNode.id)
              return nds
            }
            return nds.concat(sourceNode)
          })
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
      const id = createUniqueId(source)
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

  // Handle container resize to re-fit view when needed
  useEffect(() => {
    if (!reactFlowWrapper.current || !reactFlowInstance) return
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          // Container resized, refit view if we have nodes
          if (nodes.length > 0) {
            setTimeout(() => {
              reactFlowInstance?.fitView?.({ padding: 0.85, duration: 300, minZoom: 0.25, maxZoom: 1.5 })
            }, 100)
          }
        }
      }
    })
    
    resizeObserver.observe(reactFlowWrapper.current)
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [reactFlowInstance, nodes.length])

  // No default nodes; start empty and show blank-state UI

  return (
    <DataFlowContext.Provider value={{ isLoadingNode }}>
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
          const id = createUniqueId('table')
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
          setNodes(nds => {
            // Check if node with this ID already exists
            if (nds.some(n => n.id === newTable.id)) {
              console.warn('Node with ID already exists:', newTable.id)
              return nds
            }
            return nds.concat(newTable)
          })
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
        edges={styledEdges}
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
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
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

      {/* Upgrade modals */}
      <UpgradeLimitModal
        isOpen={showUpgradeLimit}
        onClose={() => setShowUpgradeLimit(false)}
        onUpgradeNow={handleUpgradeNow}
        onViewPlans={handleViewPlans}
        message={upgradeMessage || undefined}
      />
      <UpgradePlansModal
        isOpen={showUpgradePlans}
        onClose={() => setShowUpgradePlans(false)}
      />

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
            <GoogleSheetsLogo size={16} className="text-[#0F9D58]" />
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
            <ShopifyLogo size={16} className="text-[#95BF47]" />
            <span className="text-sm">Shopify</span>
          </button>
          <button
            onClick={() => addNode('stripe')}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
          >
            <StripeLogo size={16} className="text-[#635BFF]" />
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
            <Calculator size={16} className="text-purple-600" />
            <span className="text-sm">Transform & Filter</span>
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

          const id = createUniqueId(source)
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

          setNodes((nds) => {
            // Check if node with this ID already exists
            if (nds.some(n => n.id === sourceNode.id)) {
              console.warn('Node with ID already exists:', sourceNode.id)
              return nds
            }
            return nds.concat(sourceNode)
          })

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

      {/* Transform Builder Panel - right sidebar */}
      {showTransformPanel && selectedNode && selectedNode.type === 'transformNode' && (
        <TransformBuilder
          nodeId={selectedNode.id}
          nodeLabel={String((selectedNode.data as any)?.label ?? 'Transform')}
          inputData={getInputDataForTransform(selectedNode.id)}
          currentConfig={nodeConfigs[selectedNode.id]}
          onApply={handleTransformApply}
          onClose={() => setShowTransformPanel(false)}
          isDarkMode={isDarkMode}
          layout="sidebar"
        />
      )}
      {/* Table Details Panel - right sidebar */}
      {showTableDetailsPanel && selectedNode && selectedNode.type === 'tableNode' && (
        <TableDetailsPanel
          nodeId={selectedNode.id}
          nodeLabel={String((selectedNode.data as any)?.label ?? 'Table')}
          data={getNodeData(selectedNode.id)}
          schema={(selectedNode.data as any)?.schema || []}
          onClose={() => setShowTableDetailsPanel(false)}
          onRename={async (newName: string) => {
            // Update the node label
            setNodes(nds => nds.map(node => {
              if (node.id === selectedNode.id) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    label: newName
                  }
                }
              }
              return node
            }))
            
            // If this table has a tableId, update it in Supabase
            const tableId = (selectedNode.data as any)?.tableId
            if (tableId) {
              try {
                const { createClient } = await import('@/lib/supabase/client')
                const supabase = createClient()
                const { error } = await supabase
                  .from('user_data_tables')
                  .update({ 
                    name: newName, 
                    updated_at: new Date().toISOString() 
                  })
                  .eq('id', tableId)
                
                if (error) {
                  console.error('Failed to rename table in database:', error)
                  alert('Failed to save rename to database')
                } else {
                  // Dispatch event so sidebar can refresh
                  window.dispatchEvent(new CustomEvent('dataflow-table-renamed', { 
                    detail: { tableId, newName } 
                  }))
                }
              } catch (err) {
                console.error('Error renaming table:', err)
              }
            }
          }}
          onOpenEditor={() => {
            try {
              const detail = {
                id: selectedNode.id,
                tableName: (selectedNode.data as any)?.label || 'Table',
                database: (selectedNode.data as any)?.database || 'custom',
                schema: (selectedNode.data as any)?.schema || [],
                data: getNodeData(selectedNode.id) || [],
              }
              window.dispatchEvent(new CustomEvent('open-table-editor', { detail }))
            } catch {}
          }}
          onOpenFilter={() => {
            setShowFilterPanel(true)
            setShowTableDetailsPanel(false)
          }}
          onApplyColumns={(filtered, cols) => {
            // Reuse filter handler to project columns and mark node as filtered
            handleApplyFilter(filtered, cols)
          }}
          isDarkMode={isDarkMode}
        />
      )}
      </div>
    </div>
    </DataFlowContext.Provider>
  )
}