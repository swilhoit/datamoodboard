/**
 * Dashboard Orchestrator
 * Central control system for programmatically building dashboards
 */

import { v4 as uuidv4 } from 'uuid'

export interface OrchestratorCommand {
  action: string
  params: any
}

export interface DashboardState {
  mode: 'design' | 'data'
  canvasItems: any[]
  dataTables: any[]
  connections: any[]
  background: any
  theme: 'light' | 'dark'
}

export class DashboardOrchestrator {
  private state: DashboardState = {
    mode: 'design',
    canvasItems: [],
    dataTables: [],
    connections: [],
    background: { type: 'color', value: '#F3F4F6' },
    theme: 'light'
  }

  private history: DashboardState[] = []
  private maxHistory = 50

  constructor(initialState?: Partial<DashboardState>) {
    if (initialState) {
      this.state = { ...this.state, ...initialState }
    }
  }

  // State management
  getState(): DashboardState {
    return { ...this.state }
  }

  setState(newState: Partial<DashboardState>) {
    this.saveHistory()
    this.state = { ...this.state, ...newState }
  }

  private saveHistory() {
    this.history.push({ ...this.state })
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }
  }

  undo() {
    if (this.history.length > 0) {
      this.state = this.history.pop()!
    }
  }

  // Canvas operations
  addVisualization(type: string, config?: any) {
    const id = `viz-${uuidv4()}`
    const newItem = {
      id,
      type,
      title: config?.title || `New ${type}`,
      x: config?.x ?? Math.random() * 600 + 100,
      y: config?.y ?? Math.random() * 400 + 100,
      width: config?.width ?? 400,
      height: config?.height ?? 300,
      data: config?.data || [],
      style: config?.style || this.getDefaultStyle(),
      zIndex: this.state.canvasItems.length + 1
    }
    
    this.saveHistory()
    this.state.canvasItems.push(newItem)
    return id
  }

  addDataSource(sourceType: string, config: any) {
    const id = `datasource-${uuidv4()}`
    const newTable = {
      id,
      type: 'dataSource',
      sourceType,
      name: config.name || `${sourceType} Data`,
      x: config?.x ?? 100,
      y: config?.y ?? 100,
      width: 250,
      height: 150,
      config,
      connected: false,
      lastSync: null
    }
    
    this.saveHistory()
    this.state.dataTables.push(newTable)
    return id
  }

  connectNodes(sourceId: string, targetId: string, config?: any) {
    const id = `conn-${uuidv4()}`
    const connection = {
      id,
      source: sourceId,
      target: targetId,
      sourceHandle: config?.sourceHandle,
      targetHandle: config?.targetHandle,
      type: config?.type || 'smoothstep',
      animated: config?.animated ?? true
    }
    
    this.saveHistory()
    this.state.connections.push(connection)
    return id
  }

  updateItem(itemId: string, updates: any) {
    this.saveHistory()
    const itemIndex = this.state.canvasItems.findIndex(i => i.id === itemId)
    if (itemIndex !== -1) {
      this.state.canvasItems[itemIndex] = {
        ...this.state.canvasItems[itemIndex],
        ...updates
      }
      return true
    }
    
    const tableIndex = this.state.dataTables.findIndex(t => t.id === itemId)
    if (tableIndex !== -1) {
      this.state.dataTables[tableIndex] = {
        ...this.state.dataTables[tableIndex],
        ...updates
      }
      return true
    }
    
    return false
  }

  removeItem(itemId: string) {
    this.saveHistory()
    this.state.canvasItems = this.state.canvasItems.filter(i => i.id !== itemId)
    this.state.dataTables = this.state.dataTables.filter(t => t.id !== itemId)
    this.state.connections = this.state.connections.filter(
      c => c.source !== itemId && c.target !== itemId
    )
  }

  // Layout operations
  arrangeGrid(columns: number = 2, gap: number = 20) {
    this.saveHistory()
    const items = [...this.state.canvasItems]
    const startX = 100
    const startY = 100
    
    items.forEach((item, index) => {
      const col = index % columns
      const row = Math.floor(index / columns)
      item.x = startX + col * (item.width + gap)
      item.y = startY + row * (item.height + gap)
    })
    
    this.state.canvasItems = items
  }

  centerItems() {
    this.saveHistory()
    const items = [...this.state.canvasItems]
    if (items.length === 0) return
    
    const bounds = this.getItemsBounds(items)
    const centerX = 800 // Assuming canvas width of 1600
    const centerY = 450 // Assuming canvas height of 900
    
    const offsetX = centerX - (bounds.minX + bounds.width / 2)
    const offsetY = centerY - (bounds.minY + bounds.height / 2)
    
    items.forEach(item => {
      item.x += offsetX
      item.y += offsetY
    })
    
    this.state.canvasItems = items
  }

  private getItemsBounds(items: any[]) {
    const xs = items.map(i => i.x)
    const ys = items.map(i => i.y)
    const rights = items.map(i => i.x + i.width)
    const bottoms = items.map(i => i.y + i.height)
    
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...rights)
    const maxY = Math.max(...bottoms)
    
    return {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  // Style operations
  setTheme(theme: 'light' | 'dark') {
    this.saveHistory()
    this.state.theme = theme
    
    // Update all items with theme-appropriate colors
    this.state.canvasItems.forEach(item => {
      if (item.style) {
        item.style = this.getThemedStyle(item.style, theme)
      }
    })
  }

  private getDefaultStyle() {
    return {
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
      border: false
    }
  }

  private getThemedStyle(style: any, theme: 'light' | 'dark') {
    if (theme === 'dark') {
      return {
        ...style,
        background: '#1F2937',
        gridColor: '#374151',
        textColor: '#F9FAFB',
        colors: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA']
      }
    }
    return {
      ...style,
      background: '#FFFFFF',
      gridColor: '#E5E7EB',
      textColor: '#1F2937',
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    }
  }

  // Batch operations
  executeBatch(commands: OrchestratorCommand[]) {
    this.saveHistory()
    const results: any[] = []
    
    for (const command of commands) {
      try {
        const result = this.executeCommand(command)
        results.push({ success: true, result })
      } catch (error) {
        results.push({ success: false, error: (error as Error).message })
      }
    }
    
    return results
  }

  private executeCommand(command: OrchestratorCommand): any {
    const { action, params } = command
    
    switch (action) {
      case 'addVisualization':
        return this.addVisualization(params.type, params.config)
      case 'addDataSource':
        return this.addDataSource(params.sourceType, params.config)
      case 'connectNodes':
        return this.connectNodes(params.source, params.target, params.config)
      case 'updateItem':
        return this.updateItem(params.id, params.updates)
      case 'removeItem':
        return this.removeItem(params.id)
      case 'arrangeGrid':
        return this.arrangeGrid(params.columns, params.gap)
      case 'setTheme':
        return this.setTheme(params.theme)
      default:
        throw new Error(`Unknown command: ${action}`)
    }
  }

  // Export/Import
  exportState(): string {
    return JSON.stringify(this.state, null, 2)
  }

  importState(stateJson: string) {
    try {
      const imported = JSON.parse(stateJson)
      this.saveHistory()
      this.state = imported
      return true
    } catch {
      return false
    }
  }

  clear() {
    this.saveHistory()
    this.state = {
      mode: 'design',
      canvasItems: [],
      dataTables: [],
      connections: [],
      background: { type: 'color', value: '#F3F4F6' },
      theme: 'light'
    }
  }
}