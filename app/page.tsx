'use client'

import Canvas from '@/components/Canvas'
import ModeToggle from '@/components/ModeToggle'
import LayersPanel from '@/components/LayersPanel'
import ChartDesignPanel from '@/components/ChartDesignPanel'
import TextStylePanel from '@/components/TextStylePanel'
import ShapeStyleToolbar from '@/components/ShapeStyleToolbar'
import UserMenu from '@/components/auth/UserMenu'
import MyDashboardsModal from '@/components/MyDashboardsModal'
import AuthModal from '@/components/auth/AuthModal'
import { DashboardService } from '@/lib/supabase/dashboards'
import { DataTableService } from '@/lib/supabase/data-tables'
import { createClient } from '@/lib/supabase/client'
import React, { useState, useEffect, useRef } from 'react'
import PresetsLibrary from '@/components/PresetsLibrary'
import PremadeDatasetsModal from '@/components/PremadeDatasetsModal'
import DataManagerModal from '@/components/DataManagerModal'
import PublishButton from '@/components/PublishButton'
import AIFloatingChat from '@/components/AIFloatingChat'
import MainMenu from '@/components/MainMenu'

export type CanvasMode = 'design' | 'data'
export type DatabaseType = 'bigquery' | 'postgresql' | 'mysql' | 'mongodb' | 'snowflake' | 'redshift'

export default function Home() {
  const [mode, setMode] = useState<CanvasMode>('design')
  const [canvasItems, setCanvasItems] = useState<any[]>([])
  const [canvasElements, setCanvasElements] = useState<any[]>([])
  const [dataTables, setDataTables] = useState<any[]>([])
  const seenDataTableIdsRef = useRef<Set<string>>(new Set())
  const [connections, setConnections] = useState<any[]>([])
  const [dataflowTick, setDataflowTick] = useState<number>(0)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [selectedItemData, setSelectedItemData] = useState<any>(null)
  const [externalSelectedTable, setExternalSelectedTable] = useState<{
    id: string
    name: string
    source: string
    data: any[]
    schema: any[]
  } | null>(null)
  const [isLayersOpen, setIsLayersOpen] = useState(true)
  const [isChartDesignOpen, setIsChartDesignOpen] = useState(false)
  const [isTextStyleOpen, setIsTextStyleOpen] = useState(false)
  const [isShapeStyleOpen, setIsShapeStyleOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [canvasBackground, setCanvasBackground] = useState<any>({ type: 'color', value: '#F3F4F6' })
  const [showGrid, setShowGrid] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentDashboardId, setCurrentDashboardId] = useState<string | null>(null)
  const [dashboardName, setDashboardName] = useState('Untitled Dashboard')
  const [isSaving, setIsSaving] = useState(false)
  const [isPresetsOpen, setIsPresetsOpen] = useState(false)
  const [isDashboardsOpen, setIsDashboardsOpen] = useState(false)
  const [isRefreshingThumb, setIsRefreshingThumb] = useState(false)
  const [isDataManagerOpen, setIsDataManagerOpen] = useState(false)
  const [isDatasetsOpen, setIsDatasetsOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const dashboardService = new DashboardService()
  const dataTableService = new DataTableService()
  const dashboardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check for authenticated user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Ensure modals align with the current mode
  useEffect(() => {
    if (mode !== 'data') {
      setIsDataManagerOpen(false)
      setIsDatasetsOpen(false)
      setExternalSelectedTable(null)
    }
    if (mode !== 'design') {
      setIsPresetsOpen(false)
    }
  }, [mode])

  // Listen for request to open premade datasets from data source picker
  useEffect(() => {
    const handler = () => {
      setMode('data')
      setIsDatasetsOpen(true)
    }
    window.addEventListener('open-premade-datasets', handler as EventListener)
    return () => window.removeEventListener('open-premade-datasets', handler as EventListener)
  }, [])

  // Collect tables created in data mode so design charts can use them as data sources
  useEffect(() => {
    const handler = async (e: any) => {
      const t = e?.detail
      if (!t || !t.id) return
      if (seenDataTableIdsRef.current.has(t.id)) return
      const entry = {
        id: t.id,
        database: t.source || 'custom',
        tableName: t.name || 'Table',
        schema: Array.isArray(t.schema) ? t.schema : [],
        data: Array.isArray(t.data) ? t.data : [],
        rowCount: typeof t.rowCount === 'number' ? t.rowCount : (Array.isArray(t.data) ? t.data.length : 0),
      }
      setDataTables(prev => [...prev, entry])
      seenDataTableIdsRef.current.add(t.id)
      
      // Also save to Supabase if there's data
      if (entry.data && entry.data.length > 0) {
        const dataTableService = new DataTableService()
        try {
          await dataTableService.createDataTable({
            name: entry.tableName,
            source: entry.database as any,
            data: entry.data,
            schema: entry.schema,
            row_count: entry.rowCount
          })
          console.log('Saved table to Supabase:', entry.tableName)
        } catch (error) {
          console.error('Failed to save table to Supabase:', error)
        }
      }
    }
    window.addEventListener('dataflow-table-added', handler as EventListener)
    return () => window.removeEventListener('dataflow-table-added', handler as EventListener)
  }, [])

  // Listen for selection events from DataFlowCanvas
  useEffect(() => {
    const handleSelect = (e: any) => {
      const detail = e?.detail
      if (detail && detail.table) {
        setExternalSelectedTable(detail.table)
      } else {
        setExternalSelectedTable(null)
      }
    }
    window.addEventListener('dataflow-select-node', handleSelect as EventListener)
    return () => window.removeEventListener('dataflow-select-node', handleSelect as EventListener)
  }, [])

  // Listen for explicit open-table-editor requests (from legacy components)
  useEffect(() => {
    const handler = (e: any) => {
      const t = e?.detail
      if (t) {
        setExternalSelectedTable({
          id: t.id,
          name: t.tableName || t.name || 'Table',
          source: t.database || t.source || 'custom',
          data: t.data || [],
          schema: t.schema || [],
        })
        setIsDataManagerOpen(true)
      }
    }
    window.addEventListener('open-table-editor', handler as EventListener)
    return () => window.removeEventListener('open-table-editor', handler as EventListener)
  }, [])

  // Auto-save dashboard
  useEffect(() => {
    if (currentDashboardId && user) {
      const saveTimer = setTimeout(async () => {
        try {
          const stateJson = {
            mode,
            canvasItems,
            canvasElements,
            dataTables,
            connections,
            dataflow: dataflowRef.current || undefined,
          }
          await dashboardService.saveDashboardState(
            currentDashboardId,
            canvasItems,
            canvasElements,
            dataTables,
            connections,
            stateJson
          )
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }, 2000) // Save after 2 seconds of inactivity

      return () => clearTimeout(saveTimer)
    }
  }, [canvasItems, dataTables, connections, currentDashboardId, user, dataflowTick, mode])

  // Capture dataflow state via event bridge
  const dataflowRef = useRef<any>(null)
  useEffect(() => {
    const handler = (e: any) => {
      dataflowRef.current = e?.detail || null
      // Captured dataflow state
      setDataflowTick((t) => t + 1)
      // Opportunistically persist to localStorage
      try {
        const state = {
          canvasItems,
          canvasElements,
          dataTables,
          connections,
          canvasBackground,
          showGrid,
          isDarkMode,
          mode,
          dataflow: dataflowRef.current || null,
        }
        localStorage.setItem('moodboard-app-state', JSON.stringify(state))
      } catch {}
    }
    window.addEventListener('dataflow-state-changed', handler as EventListener)
    return () => window.removeEventListener('dataflow-state-changed', handler as EventListener)
  }, [canvasItems, dataTables, connections, canvasBackground, showGrid, isDarkMode, mode])

  const generateThumbnailDataUrl = async (): Promise<string | null> => {
    try {
      if (!dashboardRef.current) return null
      const node = dashboardRef.current
      // Try html-to-image first
      try {
        const htmlToImage = await import('html-to-image')
        const dataUrl = await htmlToImage.toPng(node, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
          // Avoid inlining remote webfonts to prevent CORS SecurityError from CSSStyleSheet.cssRules
          skipFonts: true,
        })
        return dataUrl
      } catch (_e) {
        // Fallback: generate a simple placeholder thumbnail via Canvas
        const canvas = document.createElement('canvas')
        const width = 800
        const height = 450
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = isDarkMode ? '#111827' : '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.fillStyle = isDarkMode ? '#E5E7EB' : '#111827'
        ctx.font = 'bold 28px Inter, Arial, sans-serif'
        ctx.fillText(dashboardName || 'Dashboard', 24, 56)
        ctx.font = '16px Inter, Arial, sans-serif'
        ctx.fillText(new Date().toLocaleString(), 24, 92)
        return canvas.toDataURL('image/png')
      }
    } catch {
      return null
    }
  }

  const uploadThumbnail = async (dataUrl: string, id: string): Promise<string | null> => {
    try {
      const dataUrlToBlob = (url: string): Blob => {
        const [header, base64] = url.split(',')
        const mimeMatch = header.match(/data:(.*?);base64/)
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
        const binary = atob(base64)
        const len = binary.length
        const bytes = new Uint8Array(len)
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
        return new Blob([bytes], { type: mime })
      }

      let blob: Blob
      if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
        blob = dataUrlToBlob(dataUrl)
      } else {
        blob = await (await fetch(dataUrl)).blob()
      }
      const path = `thumbnails/${id}.png`
      const { error: uploadError } = await supabase.storage.from('images').upload(path, blob, {
        upsert: true,
        contentType: 'image/png',
      })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('images').getPublicUrl(path)
      return data.publicUrl || null
    } catch (e) {
      console.error('Failed to upload thumbnail:', e)
      return null
    }
  }

  const handleNewDashboard = () => {
    const hasContent = canvasItems.length > 0 || dataTables.length > 0 || connections.length > 0 || canvasElements.length > 0
    if (hasContent) {
      const proceed = confirm('Start a new dashboard? Unsaved changes will be lost unless you save first.')
      if (!proceed) return
    }
    setCurrentDashboardId(null)
    setDashboardName('Untitled Dashboard')
    setCanvasItems([])
    setCanvasElements([])
    setDataTables([])
    setConnections([])
    setCanvasBackground({ type: 'color', value: '#F3F4F6' })
    setShowGrid(true)
    setMode('design')
    // Clear any dataflow state
    try {
      window.dispatchEvent(new CustomEvent('dataflow-load-state', { detail: null }))
    } catch {}
  }

  const handleSaveDashboard = async (): Promise<string | null> => {
    if (!user) {
      alert('Please sign in to save dashboards')
      return null
    }

    setIsSaving(true)
    let savedId: string | null = null
    try {
      if (currentDashboardId) {
        // Update existing dashboard
        await dashboardService.updateDashboard(currentDashboardId, {
          name: dashboardName,
          canvas_mode: mode,
          canvas_items: canvasItems,
          canvas_elements: canvasElements,
          data_tables: dataTables,
          connections: connections,
          canvas_background: canvasBackground,
          theme: isDarkMode ? 'dark' : 'light',
          state_json: {
            mode,
            canvasItems,
            canvasElements,
            dataTables,
            connections,
            dataflow: dataflowRef.current || undefined,
          },
        })
        savedId = currentDashboardId
        // Refresh thumbnail
        const dataUrl = await generateThumbnailDataUrl()
        if (dataUrl) {
          const publicUrl = await uploadThumbnail(dataUrl, currentDashboardId)
          if (publicUrl) {
            await dashboardService.updateDashboard(currentDashboardId, { thumbnail_url: publicUrl })
          }
        }
      } else {
        // Create new dashboard
        const dashboard = await dashboardService.createDashboard({
          name: dashboardName,
          canvas_mode: mode,
          canvas_items: canvasItems,
          canvas_elements: canvasElements,
          data_tables: dataTables,
          connections: connections,
          canvas_background: canvasBackground,
          theme: isDarkMode ? 'dark' : 'light',
          state_json: {
            mode,
            canvasItems,
            canvasElements,
            dataTables,
            connections,
            dataflow: dataflowRef.current || undefined,
          },
        })
        setCurrentDashboardId(dashboard.id)
        savedId = dashboard.id as string
        // Generate and upload thumbnail
        const dataUrl = await generateThumbnailDataUrl()
        if (dataUrl) {
          const publicUrl = await uploadThumbnail(dataUrl, dashboard.id as string)
          if (publicUrl) {
            await dashboardService.updateDashboard(dashboard.id as string, { thumbnail_url: publicUrl })
          }
        }
      }
      } catch (error: any) {
        const message = error?.message || error?.error_description || error?.msg || JSON.stringify(error)
        console.error('Failed to save dashboard:', message)
    } finally {
      setIsSaving(false)
    }
    return savedId
  }

  // Opportunistic thumbnail refresh shortly after content/style changes
  useEffect(() => {
    if (!user || !currentDashboardId) return
    const t = setTimeout(async () => {
      try {
        setIsRefreshingThumb(true)
        const dataUrl = await generateThumbnailDataUrl()
        if (dataUrl) {
          const publicUrl = await uploadThumbnail(dataUrl, currentDashboardId)
          if (publicUrl) {
            await dashboardService.updateDashboard(currentDashboardId, { thumbnail_url: publicUrl })
          }
        }
      } catch {
        // ignore
      } finally {
        setIsRefreshingThumb(false)
      }
    }, 2000)
    return () => clearTimeout(t)
  }, [canvasItems, dataTables, connections, canvasBackground, isDarkMode, mode, user, currentDashboardId])

  const handleLoadDashboard = async () => {
    if (!user) {
      alert('Please sign in to load dashboards')
      return
    }

    try {
      const dashboards = await dashboardService.getUserDashboards()
      // For now, just load the first dashboard
      if (dashboards && dashboards.length > 0) {
        const dashboard = dashboards[0]
        setCurrentDashboardId(dashboard.id)
        setDashboardName(dashboard.name)
          // Prefer state_json if present
        const s = (dashboard as any).state_json
        if (s) {
          setCanvasItems(Array.isArray(s.canvasItems) ? s.canvasItems : [])
          setCanvasElements(Array.isArray(s.canvasElements) ? s.canvasElements : [])
          setDataTables(Array.isArray(s.dataTables) ? s.dataTables : [])
          setConnections(Array.isArray(s.connections) ? s.connections : [])
          setMode((s as any).mode || 'design')
            // Rehydrate dataflow state on next tick
            setTimeout(() => {
              try {
                if (s.dataflow) {
                  window.dispatchEvent(new CustomEvent('dataflow-load-state', { detail: s.dataflow }))
                }
              } catch {}
            }, 0)
        } else {
          setCanvasItems(Array.isArray((dashboard as any).canvas_items) ? (dashboard as any).canvas_items : [])
          setCanvasElements(Array.isArray((dashboard as any).canvas_elements) ? (dashboard as any).canvas_elements : [])
          setDataTables(Array.isArray((dashboard as any).data_tables) ? (dashboard as any).data_tables : [])
          setConnections(Array.isArray((dashboard as any).connections) ? (dashboard as any).connections : [])
          setMode(((dashboard as any).canvas_mode as any) || 'design')
        }
        setCanvasBackground(dashboard.canvas_background || { type: 'color', value: '#F3F4F6' })
        setIsDarkMode(dashboard.theme === 'dark')
      }
    } catch (error) {
      console.error('Failed to load dashboards:', error)
    }
  }

  const handleAddVisualization = (type: string, data?: any) => {
    const newItem = {
      id: `item-${Date.now()}`,
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1).replace('Chart', ' Chart')}`,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      width: 400,
      height: 300,
      data: data || generateSampleData(type),
      style: {
        theme: 'modern',
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        background: '#FFFFFF',
        gridColor: '#E5E7EB',
        textColor: '#1F2937',
        font: 'Inter',
        fontSize: 12,
        gradients: false,
        shadow: false,
        rounded: false,
        border: false,
      }
    }
    setCanvasItems([...canvasItems, newItem])
  }

  // Apply full dashboard state returned by AI orchestrator
  const applyAIDashboardState = (state: {
    canvasItems?: any[]
    canvasElements?: any[]
    dataTables?: any[]
    connections?: any[]
    mode?: CanvasMode
    background?: any
    theme?: 'light' | 'dark'
  }) => {
    if (!state) return
    
    // IMPORTANT: Only update state that was explicitly returned by AI
    // This prevents clearing the canvas when AI returns partial updates
    
    if (Array.isArray(state.canvasItems)) {
      // AI returned canvas items - apply them
      setCanvasItems(state.canvasItems)
    }
    
    if (Array.isArray(state.canvasElements)) {
      // AI returned canvas elements (text, emoji, image, etc) - apply them
      setCanvasElements(state.canvasElements)
    }
    
    if (Array.isArray(state.dataTables)) {
      setDataTables(state.dataTables)
    }
    
    if (Array.isArray(state.connections)) {
      setConnections(state.connections)
    }
    
    // Only update background if AI explicitly sets it (not undefined)
    if (state.background !== undefined) {
      setCanvasBackground(state.background)
    }
    
    // Only change mode if explicitly set
    if (state.mode !== undefined) {
      setMode(state.mode)
    }
    
    // Only change theme if explicitly set
    if (state.theme !== undefined) {
      setIsDarkMode(state.theme === 'dark')
    }
  }

  const insertPresetItems = (
    items: Array<{ type: string; title?: string; data: any; width?: number; height?: number }>
  ) => {
    const baseX = 120
    const baseY = 140
    const gapX = 32
    const gapY = 32

    const created = items.map((it, idx) => {
      const col = idx % 2
      const row = Math.floor(idx / 2)
      const w = it.width ?? 400
      const h = it.height ?? 300
      return {
        id: `item-${Date.now()}-${idx}`,
        type: it.type,
        title: it.title ?? `New ${it.type}`,
        x: baseX + col * (Math.max(380, w) + gapX),
        y: baseY + row * (Math.max(260, h) + gapY),
        width: w,
        height: h,
        data: it.data,
        style: {
          theme: 'modern',
          colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
          background: '#FFFFFF',
          gridColor: '#E5E7EB',
          textColor: '#1F2937',
          font: 'Inter',
          fontSize: 12,
          gradients: false,
          shadow: false,
          rounded: false,
          border: false,
        },
      }
    })
    setCanvasItems((prev) => [...prev, ...created])
  }

  const handleAddDataTable = async (database: DatabaseType, tableName: string, schema?: any, data?: any[]) => {
    const newTable = {
      id: `table-${Date.now()}`,
      database,
      tableName,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      width: 300,
      height: 200,
      schema: schema || generateSampleSchema(tableName),
      data: data || []
    }
    setDataTables([...dataTables, newTable])
    
    // Save to Supabase if there's data
    if (data && data.length > 0) {
      const dataTableService = new DataTableService()
      try {
        await dataTableService.createDataTable({
          name: tableName,
          source: database as any,
          data: data,
          schema: schema || [],
          row_count: data.length
        })
        // Dispatch event so DataManagerSidebar can refresh
        window.dispatchEvent(new CustomEvent('dataflow-table-saved'))
      } catch (error) {
        console.error('Failed to save data table:', error)
      }
    }
  }

  const handleAddConnection = (sourceId: string, targetId: string, sourceField?: string, targetField?: string) => {
    const newConnection = {
      id: `conn-${Date.now()}`,
      sourceId,
      targetId,
      sourceField,
      targetField,
    }
    setConnections([...connections, newConnection])
  }

  const generateSampleSchema = (tableName: string) => {
    const schemas: any = {
      'users': [
        { name: 'id', type: 'INTEGER', isPrimary: true },
        { name: 'email', type: 'VARCHAR(255)' },
        { name: 'created_at', type: 'TIMESTAMP' },
        { name: 'name', type: 'VARCHAR(100)' },
      ],
      'orders': [
        { name: 'id', type: 'INTEGER', isPrimary: true },
        { name: 'user_id', type: 'INTEGER', isForeign: true },
        { name: 'total', type: 'DECIMAL(10,2)' },
        { name: 'status', type: 'VARCHAR(50)' },
        { name: 'created_at', type: 'TIMESTAMP' },
      ],
      'products': [
        { name: 'id', type: 'INTEGER', isPrimary: true },
        { name: 'name', type: 'VARCHAR(255)' },
        { name: 'price', type: 'DECIMAL(10,2)' },
        { name: 'category', type: 'VARCHAR(100)' },
      ],
    }
    return schemas[tableName] || [
      { name: 'id', type: 'INTEGER', isPrimary: true },
      { name: 'data', type: 'JSON' },
    ]
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
          { name: 'Product A', value: 4000 },
          { name: 'Product B', value: 3000 },
          { name: 'Product C', value: 2000 },
          { name: 'Product D', value: 2780 },
        ]
      case 'pieChart':
        return [
          { name: 'Group A', value: 400 },
          { name: 'Group B', value: 300 },
          { name: 'Group C', value: 300 },
          { name: 'Group D', value: 200 },
        ]
      default:
        return []
    }
  }

  // Update selected item data when selection changes
  React.useEffect(() => {
    if (selectedItem) {
      const items = mode === 'design' ? canvasItems : dataTables
      let selected = items.find(item => item.id === selectedItem)
      
      // If not found in main items, check canvas elements (for text, images, etc.)
      if (!selected && mode === 'design') {
        // This will be handled by the Canvas component which manages canvas elements
        selected = null
      }
      
      setSelectedItemData(selected)
    } else {
      setSelectedItemData(null)
    }
  }, [selectedItem, canvasItems, dataTables, mode])

  // Handle element selection - show appropriate style panel automatically
  React.useEffect(() => {
    if (selectedItem && selectedItemData?.type === 'text') {
      // Show text style panel for text elements
      setIsTextStyleOpen(true)
      setIsShapeStyleOpen(false)
      setIsLayersOpen(false)
      setIsChartDesignOpen(false)
    } else if (selectedItem && selectedItemData?.type === 'shape') {
      // Show shape style panel for shape elements
      setIsShapeStyleOpen(true)
      setIsTextStyleOpen(false)
      setIsLayersOpen(false)
      setIsChartDesignOpen(false)
    } else if (selectedItem && (selectedItemData?.type?.includes('Chart') || selectedItemData?.type === 'lineChart' || selectedItemData?.type === 'barChart' || selectedItemData?.type === 'pieChart' || selectedItemData?.type === 'table' || selectedItemData?.type === 'area')) {
      // Show chart design panel for charts and tables
      setIsChartDesignOpen(true)
      setIsTextStyleOpen(false)
      setIsShapeStyleOpen(false)
      setIsLayersOpen(false)
    } else if (!selectedItem) {
      // Close all style panels when nothing is selected and show layers panel
      setIsTextStyleOpen(false)
      setIsShapeStyleOpen(false)
      setIsChartDesignOpen(false)
      setIsLayersOpen(true)
    }
  }, [selectedItem, selectedItemData])


  // Persistence: Load state from localStorage on mount
  useEffect(() => {
    // Check for clear state flag
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('clear') === 'true') {
      console.log('Clearing local state as requested')
      localStorage.removeItem('moodboard-app-state')
      // Remove the clear parameter from URL
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    const savedState = localStorage.getItem('moodboard-app-state')
    if (savedState) {
      try {
        const state = JSON.parse(savedState)
        // Loading saved state from localStorage
        if (state.canvasItems) setCanvasItems(state.canvasItems)
        if (state.canvasElements) setCanvasElements(state.canvasElements)
        if (state.dataTables) setDataTables(state.dataTables)
        if (state.connections) setConnections(state.connections)
        if (state.canvasBackground) setCanvasBackground(state.canvasBackground)
        if (state.showGrid !== undefined) setShowGrid(state.showGrid)
        if (state.isDarkMode !== undefined) setIsDarkMode(state.isDarkMode)
        if (state.mode) setMode(state.mode)
        if (state.dataflow) {
          // Setting dataflow pending and dispatching load event
          try { (window as any).__dataflowPending = state.dataflow } catch {}
          setTimeout(() => {
            try { 
              window.dispatchEvent(new CustomEvent('dataflow-load-state', { detail: state.dataflow }))
              // Dispatched dataflow-load-state event
            } catch {}
          }, 0)
        }
      } catch (error) {
        console.error('Failed to restore state:', error)
      }
    }
  }, [])

  // Persistence: Save state to localStorage whenever key state changes
  useEffect(() => {
        const state = {
      canvasItems,
      dataTables,
      connections,
      canvasBackground,
      showGrid,
      isDarkMode,
      mode,
      dataflow: dataflowRef.current || null,
    }
    localStorage.setItem('moodboard-app-state', JSON.stringify(state))
  }, [canvasItems, dataTables, connections, canvasBackground, showGrid, isDarkMode, mode, dataflowTick])

  // Handle layer reordering across charts and elements by z-index
  const handleReorderLayers = (newOrder: string[]) => {
    const toZIndex = (index: number) => newOrder.length - index

    const itemById = new Map(canvasItems.map(i => [i.id, i]))
    const elementById = new Map(canvasElements.map(e => [e.id, e]))

    const nextItems: any[] = []
    const nextElements: any[] = []

    for (let i = 0; i < newOrder.length; i++) {
      const id = newOrder[i]
      const zIndex = toZIndex(i)
      if (itemById.has(id)) {
        nextItems.push({ ...itemById.get(id), zIndex })
      } else if (elementById.has(id)) {
        nextElements.push({ ...elementById.get(id), zIndex })
      }
    }

    setCanvasItems(nextItems)
    setCanvasElements(nextElements)
  }

  // Handle item deletion from layers panel
  const handleDeleteItem = (id: string) => {
    setCanvasItems(items => items.filter(item => item.id !== id))
    if (selectedItem === id) setSelectedItem(null)
  }

  const handleUpdateItemStyle = (id: string, styleUpdates: any) => {
    if (mode === 'design') {
      setCanvasItems(items => items.map(item => {
        if (item.id === id) {
          // If chart data is being updated via the design panel, set it at top-level, not inside style
          const { data: incomingData, ...styleOnly } = styleUpdates || {}

          // Apply theme presets if switching themes
          if (styleOnly.theme) {
            const theme = chartThemes[styleOnly.theme as keyof typeof chartThemes]
            if (theme) {
              return {
                ...item,
                style: {
                  ...item.style,
                  ...styleOnly,
                  colors: theme.colors,
                  background: theme.background,
                  gridColor: theme.gridColor,
                  textColor: theme.textColor,
                  font: theme.font,
                  gradients: theme.gradients,
                  glowEffect: (theme as any).glowEffect || false,
                }
                ,
                ...(incomingData !== undefined ? { data: incomingData } : {})
              }
            }
          }
          
          // Otherwise just merge the style updates
          return {
            ...item,
            style: { ...item.style, ...styleOnly },
            ...(incomingData !== undefined ? { data: incomingData } : {})
          }
        }
        return item
      }))
    }
  }

  // Handle canvas element (text, image, etc.) style updates
  const handleUpdateCanvasElement = (id: string, updates: any) => {
    // Update selected item data if it's the currently selected item
    if (selectedItem === id && selectedItemData) {
      setSelectedItemData({ ...selectedItemData, ...updates })
    }
  }

  // Import chart themes
  const chartThemes = {
    modern: {
      name: 'Modern',
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      background: '#FFFFFF',
      gridColor: '#E5E7EB',
      textColor: '#1F2937',
      font: 'Inter',
      gradients: false,
    },
    dark: {
      name: 'Dark Mode',
      colors: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'],
      background: '#1F2937',
      gridColor: '#374151',
      textColor: '#F9FAFB',
      font: 'Inter',
      gradients: false,
    },
    neon: {
      name: 'Neon Glow',
      colors: ['#00F5FF', '#FF00E4', '#FFE500', '#00FF88', '#FF5E00'],
      background: '#0F0F23',
      gridColor: '#1A1A3E',
      textColor: '#FFFFFF',
      font: 'Orbitron',
      gradients: true,
      glowEffect: true,
    },
    pastel: {
      name: 'Soft Pastel',
      colors: ['#FFB6C1', '#FFD700', '#98FB98', '#87CEEB', '#DDA0DD'],
      background: '#FFF5F5',
      gridColor: '#FFE0E0',
      textColor: '#4A5568',
      font: 'Quicksand',
      gradients: false,
    },
    gradient: {
      name: 'Gradient Dreams',
      colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'],
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      gridColor: 'rgba(255,255,255,0.1)',
      textColor: '#FFFFFF',
      font: 'Poppins',
      gradients: true,
    },
    retro: {
      name: 'Retro Wave',
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
      background: '#2C3E50',
      gridColor: '#34495E',
      textColor: '#ECF0F1',
      font: 'Space Mono',
      gradients: false,
    },
    nature: {
      name: 'Nature',
      colors: ['#2ECC71', '#27AE60', '#F39C12', '#E67E22', '#8B4513'],
      background: '#F5F3E9',
      gridColor: '#E8E4D6',
      textColor: '#2C3E50',
      font: 'Merriweather',
      gradients: false,
    },
    cyberpunk: {
      name: 'Cyberpunk',
      colors: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00AA', '#00FF00'],
      background: '#0A0A0A',
      gridColor: '#1A1A1A',
      textColor: '#00FFFF',
      font: 'Rajdhani',
      gradients: true,
      glowEffect: true,
    },
  }

  return (
    <div className="flex h-screen">
      {/* Side Panels */}
      {mode === 'design' && !isFullscreen && (
        <>
          <LayersPanel
            items={[...canvasItems, ...canvasElements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            onUpdateItem={handleUpdateItemStyle}
            onDeleteItem={handleDeleteItem}
            onReorderLayers={handleReorderLayers}
            isOpen={isLayersOpen && !isChartDesignOpen && !isTextStyleOpen && !isShapeStyleOpen}
            onToggle={() => {
              setIsLayersOpen(!isLayersOpen)
              if (isChartDesignOpen) setIsChartDesignOpen(false)
              if (isTextStyleOpen) setIsTextStyleOpen(false)
              if (isShapeStyleOpen) setIsShapeStyleOpen(false)
            }}
            canvasBackground={canvasBackground}
            onUpdateBackground={setCanvasBackground}
            showGrid={showGrid}
            onToggleGrid={setShowGrid}
            onToggleChartDesign={() => {
              setIsChartDesignOpen(true)
              setIsLayersOpen(false)
            }}
            isDarkMode={isDarkMode}
          />
          
          <ChartDesignPanel
            selectedItem={selectedItemData}
            onUpdateStyle={handleUpdateItemStyle}
            isOpen={isChartDesignOpen}
            onToggle={() => {
              setIsChartDesignOpen(false)
              setIsLayersOpen(true)
            }}
            isDarkMode={isDarkMode}
            dataTables={dataTables}
          />

          <TextStylePanel
            selectedItem={selectedItemData}
            onUpdateStyle={handleUpdateCanvasElement}
            isOpen={isTextStyleOpen}
            onToggle={() => {
              setIsTextStyleOpen(false)
              setIsLayersOpen(true)
            }}
            isDarkMode={isDarkMode}
          />

          <ShapeStyleToolbar
            element={selectedItemData}
            isOpen={isShapeStyleOpen}
            onUpdate={handleUpdateCanvasElement}
            onToggle={() => {
              setIsShapeStyleOpen(false)
              setIsLayersOpen(true)
            }}
            isDarkMode={isDarkMode}
          />
        </>
      )}

      {/* Main content */}
      <div className="flex-1 relative h-full min-h-0">
        {/* Header */}
        {!isFullscreen && (
          <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between pointer-events-none">
            {/* Left side */}
            <div className="flex items-center gap-2 pointer-events-auto">
                <ModeToggle 
                  mode={mode} 
                  setMode={setMode} 
                  isDarkMode={isDarkMode}
                  onToggleDarkMode={undefined}
                />
                <input
                  type="text"
                  value={dashboardName}
                  onChange={(e) => setDashboardName(e.target.value)}
                   className={`px-3 py-2 rounded-lg shadow-md font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-transparent border-gray-700 text-white' : 'bg-transparent border-gray-200 text-gray-900'}`}
                  placeholder="Dashboard name"
                />
            </div>
            
            {/* Right side */}
            <div className="flex items-center gap-3 pointer-events-auto">
                <MainMenu
                  isDarkMode={isDarkMode}
                  isSaving={isSaving}
                  onNew={handleNewDashboard}
                  onOpen={() => setIsDashboardsOpen(true)}
                  onSave={() => { void handleSaveDashboard() }}
                  onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                />
                {mode === 'design' && (
                  <PublishButton
                    isDarkMode={isDarkMode}
                    onPublish={async (settings) => {
                      // Autosave (create or update) before publishing
                      const savedId = await handleSaveDashboard()
                      if (!savedId) {
                        // User not signed in or save failed
                        return
                      }
                      const updated = await dashboardService.publishDashboard(savedId, {
                        visibility: settings.visibility,
                        allowComments: settings.allowComments,
                        allowDownloads: settings.allowDownloads,
                      })
                      // Optionally refresh local state
                      setCurrentDashboardId(String(updated.id))
                      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://datamoodboard.com'
                      return `${origin}/shared/${updated.share_slug}`
                    }}
                  />
                )}
                <UserMenu onOpenAuth={() => setIsAuthOpen(true)} onOpenDashboards={() => setIsDashboardsOpen(true)} />
            </div>
          </div>
        )}

        <div ref={dashboardRef} className="relative h-full min-h-0">
          <Canvas
            mode={mode}
            items={mode === 'design' ? canvasItems : dataTables}
            setItems={mode === 'design' ? setCanvasItems : setDataTables}
            connections={connections}
            setConnections={setConnections}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            selectedItemData={selectedItemData}
            onUpdateStyle={handleUpdateItemStyle}
            onSelectedItemDataChange={setSelectedItemData}
            onUpdateCanvasElement={handleUpdateCanvasElement}
            elements={canvasElements}
            setElements={setCanvasElements}
            background={canvasBackground}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid(!showGrid)}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            isDarkMode={isDarkMode}
            // Open presets from the main toolbar "Blocks" button
            // @ts-ignore - CanvasToolbar accepts onOpenBlocks
            onOpenBlocks={() => setIsPresetsOpen(true)}
          />
          {/* Floating AI Chat (bottom-right) */}
          <AIFloatingChat
            isDarkMode={isDarkMode}
            onApplyState={applyAIDashboardState}
            getContext={() => ({
              currentState: { 
                canvasItems, 
                canvasElements,
                dataTables, 
                connections,
                canvasBackground,
                canvasWidth: 1920,
                canvasHeight: 1080,
                isDarkMode,
                mode
              },
              mode,
              selectedItem,
              user: user ? { id: user.id, email: user.email } : null,
            })}
          />
        </div>

        {/* Presets modal */}
        {mode === 'design' && (
          <PresetsLibrary
            isOpen={isPresetsOpen}
            onClose={() => setIsPresetsOpen(false)}
            onInsertItems={insertPresetItems}
          />
        )}

        {mode === 'data' && (
          <DataManagerModal 
            isOpen={isDataManagerOpen} 
            onClose={() => setIsDataManagerOpen(false)}
            externalTable={externalSelectedTable}
            onUpdateExternal={(_tableId, updates) => {
              // For now, just update the externalSelectedTable object so edits are visible
              if (externalSelectedTable) {
                setExternalSelectedTable({
                  ...externalSelectedTable,
                  data: updates?.data ?? externalSelectedTable.data,
                  schema: updates?.schema ?? externalSelectedTable.schema,
                  name: updates?.name ?? externalSelectedTable.name,
                })
              }
            }}
          />
        )}

        {/* Premade Datasets modal */}
        {mode === 'data' && (
          <PremadeDatasetsModal
            isOpen={isDatasetsOpen}
            onClose={() => setIsDatasetsOpen(false)}
            isDarkMode={isDarkMode}
            onImport={({ name, schema, data, rowCount }) => {
              // Ask DataFlowCanvas to add a table node with this dataset
              try {
                window.dispatchEvent(new CustomEvent('dataflow-import-dataset', {
                  detail: { name, schema, data, rowCount }
                }))
              } catch {}
              setMode('data')
              setIsDatasetsOpen(false)
            }}
          />
        )}

        {/* My Dashboards modal */}
        <MyDashboardsModal
          isOpen={isDashboardsOpen}
          onClose={() => setIsDashboardsOpen(false)}
          isDarkMode={isDarkMode}
          onOpenDashboard={async (id: string) => {
            try {
              const d: any = await dashboardService.getDashboard(id)
              setCurrentDashboardId(d.id)
              setDashboardName(d.name)
              setCanvasItems(Array.isArray(d.canvas_items) ? d.canvas_items : [])
              setDataTables(Array.isArray(d.data_tables) ? d.data_tables : [])
              setConnections(Array.isArray(d.connections) ? d.connections : [])
              setCanvasBackground(d.canvas_background || { type: 'color', value: '#F3F4F6' })
              setMode(d.canvas_mode || 'design')
              setIsDarkMode(d.theme === 'dark')
              setIsDashboardsOpen(false)
            } catch (e) {
              console.error('Failed to open dashboard', e)
            }
          }}
        />

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={() => {
            supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
          }}
        />
      </div>
    </div>
  )
}