/**
 * Canvas Intelligence System
 * Provides spatial awareness and intelligent composition for AI-driven canvas operations
 */

interface CanvasItem {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  title?: string
  data?: any
  connections?: string[]
}

interface CanvasState {
  items: CanvasItem[]
  connections: Array<{ source: string; target: string }>
  canvasWidth: number
  canvasHeight: number
}

interface Position {
  x: number
  y: number
}

interface Bounds {
  left: number
  top: number
  right: number
  bottom: number
}

/**
 * Analyzes canvas state and provides intelligent positioning
 */
export class CanvasIntelligence {
  private state: CanvasState
  private gridSize = 20 // Snap to grid
  private padding = 24 // Minimum space between items

  constructor(state: CanvasState) {
    this.state = state
  }

  /**
   * Find an empty space on the canvas for a new item
   */
  findEmptySpace(width: number, height: number): Position {
    const occupiedAreas = this.getOccupiedAreas()
    
    // Try to find space near the center first
    const centerX = this.state.canvasWidth / 2
    const centerY = this.state.canvasHeight / 2
    
    // Spiral outward from center to find empty space
    const maxRadius = Math.max(this.state.canvasWidth, this.state.canvasHeight)
    const angleStep = Math.PI / 8 // 16 positions per circle
    
    for (let radius = 100; radius < maxRadius; radius += 50) {
      for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
        const x = centerX + Math.cos(angle) * radius - width / 2
        const y = centerY + Math.sin(angle) * radius - height / 2
        
        const candidate = this.snapToGrid({ x, y })
        
        if (this.isSpaceEmpty(candidate, width, height, occupiedAreas)) {
          return candidate
        }
      }
    }
    
    // Fallback to top-left area if no space found
    return this.snapToGrid({ x: 100, y: 100 })
  }

  /**
   * Find the best position near a related item
   */
  findPositionNearItem(targetId: string, width: number, height: number, preferredSide?: 'right' | 'left' | 'top' | 'bottom'): Position {
    const target = this.state.items.find(item => item.id === targetId)
    if (!target) return this.findEmptySpace(width, height)

    const positions: { [key: string]: Position } = {
      right: { x: target.x + target.width + this.padding * 2, y: target.y },
      left: { x: target.x - width - this.padding * 2, y: target.y },
      bottom: { x: target.x, y: target.y + target.height + this.padding * 2 },
      top: { x: target.x, y: target.y - height - this.padding * 2 }
    }

    // Try preferred side first
    const sides = preferredSide 
      ? [preferredSide, ...Object.keys(positions).filter(s => s !== preferredSide)]
      : ['right', 'bottom', 'left', 'top']

    const occupiedAreas = this.getOccupiedAreas()
    
    for (const side of sides) {
      const pos = this.snapToGrid(positions[side as keyof typeof positions])
      if (this.isSpaceEmpty(pos, width, height, occupiedAreas)) {
        return pos
      }
    }

    // If no space near item, find any empty space
    return this.findEmptySpace(width, height)
  }

  /**
   * Arrange items in a grid layout
   */
  arrangeGrid(itemIds?: string[]): Array<{ id: string; position: Position }> {
    const items = itemIds 
      ? this.state.items.filter(item => itemIds.includes(item.id))
      : this.state.items

    if (items.length === 0) return []

    // Calculate optimal grid dimensions
    const cols = Math.ceil(Math.sqrt(items.length))
    const rows = Math.ceil(items.length / cols)
    
    // Find max dimensions
    const maxWidth = Math.max(...items.map(item => item.width))
    const maxHeight = Math.max(...items.map(item => item.height))
    
    const cellWidth = maxWidth + this.padding * 2
    const cellHeight = maxHeight + this.padding * 2
    
    // Center the grid on canvas
    const gridWidth = cols * cellWidth
    const gridHeight = rows * cellHeight
    const startX = (this.state.canvasWidth - gridWidth) / 2
    const startY = (this.state.canvasHeight - gridHeight) / 2

    const positions: Array<{ id: string; position: Position }> = []
    
    items.forEach((item, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      
      positions.push({
        id: item.id,
        position: this.snapToGrid({
          x: startX + col * cellWidth + (cellWidth - item.width) / 2,
          y: startY + row * cellHeight + (cellHeight - item.height) / 2
        })
      })
    })

    return positions
  }

  /**
   * Align items horizontally or vertically
   */
  alignItems(itemIds: string[], alignment: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY'): Array<{ id: string; position: Position }> {
    const items = this.state.items.filter(item => itemIds.includes(item.id))
    if (items.length === 0) return []

    const positions: Array<{ id: string; position: Position }> = []

    switch (alignment) {
      case 'left': {
        const minX = Math.min(...items.map(item => item.x))
        items.forEach(item => {
          positions.push({ id: item.id, position: { x: minX, y: item.y } })
        })
        break
      }
      case 'right': {
        const maxRight = Math.max(...items.map(item => item.x + item.width))
        items.forEach(item => {
          positions.push({ id: item.id, position: { x: maxRight - item.width, y: item.y } })
        })
        break
      }
      case 'top': {
        const minY = Math.min(...items.map(item => item.y))
        items.forEach(item => {
          positions.push({ id: item.id, position: { x: item.x, y: minY } })
        })
        break
      }
      case 'bottom': {
        const maxBottom = Math.max(...items.map(item => item.y + item.height))
        items.forEach(item => {
          positions.push({ id: item.id, position: { x: item.x, y: maxBottom - item.height } })
        })
        break
      }
      case 'centerX': {
        const avgCenterX = items.reduce((sum, item) => sum + item.x + item.width / 2, 0) / items.length
        items.forEach(item => {
          positions.push({ id: item.id, position: { x: avgCenterX - item.width / 2, y: item.y } })
        })
        break
      }
      case 'centerY': {
        const avgCenterY = items.reduce((sum, item) => sum + item.y + item.height / 2, 0) / items.length
        items.forEach(item => {
          positions.push({ id: item.id, position: { x: item.x, y: avgCenterY - item.height / 2 } })
        })
        break
      }
    }

    return positions.map(p => ({ ...p, position: this.snapToGrid(p.position) }))
  }

  /**
   * Distribute items evenly (horizontally or vertically)
   */
  distributeEvenly(itemIds: string[], direction: 'horizontal' | 'vertical'): Array<{ id: string; position: Position }> {
    const items = this.state.items.filter(item => itemIds.includes(item.id))
    if (items.length <= 1) return []

    const positions: Array<{ id: string; position: Position }> = []

    if (direction === 'horizontal') {
      // Sort by current x position
      items.sort((a, b) => a.x - b.x)
      
      const totalWidth = items.reduce((sum, item) => sum + item.width, 0)
      const totalSpace = Math.max(...items.map(item => item.x + item.width)) - Math.min(...items.map(item => item.x))
      const spacing = (totalSpace - totalWidth) / (items.length - 1)
      
      let currentX = items[0].x
      items.forEach(item => {
        positions.push({ id: item.id, position: { x: currentX, y: item.y } })
        currentX += item.width + spacing
      })
    } else {
      // Sort by current y position
      items.sort((a, b) => a.y - b.y)
      
      const totalHeight = items.reduce((sum, item) => sum + item.height, 0)
      const totalSpace = Math.max(...items.map(item => item.y + item.height)) - Math.min(...items.map(item => item.y))
      const spacing = (totalSpace - totalHeight) / (items.length - 1)
      
      let currentY = items[0].y
      items.forEach(item => {
        positions.push({ id: item.id, position: { x: item.x, y: currentY } })
        currentY += item.height + spacing
      })
    }

    return positions.map(p => ({ ...p, position: this.snapToGrid(p.position) }))
  }

  /**
   * Create a data flow pipeline layout (source -> transform -> output)
   */
  createPipelineLayout(sourceId: string, transformIds: string[], outputId: string): Array<{ id: string; position: Position }> {
    const positions: Array<{ id: string; position: Position }> = []
    const horizontalSpacing = 200
    const startX = 100
    const centerY = this.state.canvasHeight / 2

    // Position source
    const source = this.state.items.find(item => item.id === sourceId)
    if (source) {
      positions.push({
        id: sourceId,
        position: this.snapToGrid({ x: startX, y: centerY - source.height / 2 })
      })
    }

    // Position transforms
    let currentX = startX + (source?.width || 0) + horizontalSpacing
    transformIds.forEach(transformId => {
      const transform = this.state.items.find(item => item.id === transformId)
      if (transform) {
        positions.push({
          id: transformId,
          position: this.snapToGrid({ x: currentX, y: centerY - transform.height / 2 })
        })
        currentX += transform.width + horizontalSpacing
      }
    })

    // Position output
    const output = this.state.items.find(item => item.id === outputId)
    if (output) {
      positions.push({
        id: outputId,
        position: this.snapToGrid({ x: currentX, y: centerY - output.height / 2 })
      })
    }

    return positions
  }

  /**
   * Find items by type or properties
   */
  findItems(criteria: { type?: string; hasData?: boolean; connected?: boolean }): CanvasItem[] {
    return this.state.items.filter(item => {
      if (criteria.type && !item.type.toLowerCase().includes(criteria.type.toLowerCase())) return false
      if (criteria.hasData !== undefined && (!!item.data !== criteria.hasData)) return false
      if (criteria.connected !== undefined) {
        const isConnected = this.state.connections.some(
          conn => conn.source === item.id || conn.target === item.id
        )
        if (isConnected !== criteria.connected) return false
      }
      return true
    })
  }

  /**
   * Get canvas analytics for AI context
   */
  getCanvasAnalytics() {
    const items = this.state.items
    const connections = this.state.connections

    return {
      totalItems: items.length,
      itemsByType: this.groupByType(items),
      connections: connections.length,
      connectedItems: new Set([...connections.map(c => c.source), ...connections.map(c => c.target)]).size,
      unconnectedItems: items.filter(item => 
        !connections.some(c => c.source === item.id || c.target === item.id)
      ).length,
      canvasUtilization: this.calculateCanvasUtilization(),
      clusters: this.identifyClusters(),
      suggestedActions: this.getSuggestedActions()
    }
  }

  // Private helper methods
  private getOccupiedAreas(): Bounds[] {
    return this.state.items.map(item => ({
      left: item.x - this.padding,
      top: item.y - this.padding,
      right: item.x + item.width + this.padding,
      bottom: item.y + item.height + this.padding
    }))
  }

  private isSpaceEmpty(position: Position, width: number, height: number, occupiedAreas: Bounds[]): boolean {
    const newBounds: Bounds = {
      left: position.x,
      top: position.y,
      right: position.x + width,
      bottom: position.y + height
    }

    // Check canvas bounds
    if (newBounds.left < 0 || newBounds.top < 0 || 
        newBounds.right > this.state.canvasWidth || 
        newBounds.bottom > this.state.canvasHeight) {
      return false
    }

    // Check overlaps with existing items
    return !occupiedAreas.some(area => this.boundsOverlap(newBounds, area))
  }

  private boundsOverlap(a: Bounds, b: Bounds): boolean {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom)
  }

  private snapToGrid(position: Position): Position {
    return {
      x: Math.round(position.x / this.gridSize) * this.gridSize,
      y: Math.round(position.y / this.gridSize) * this.gridSize
    }
  }

  private groupByType(items: CanvasItem[]) {
    const groups: { [key: string]: number } = {}
    items.forEach(item => {
      const type = item.type.toLowerCase()
      groups[type] = (groups[type] || 0) + 1
    })
    return groups
  }

  private calculateCanvasUtilization(): number {
    const totalCanvasArea = this.state.canvasWidth * this.state.canvasHeight
    const occupiedArea = this.state.items.reduce((sum, item) => sum + item.width * item.height, 0)
    return Math.round((occupiedArea / totalCanvasArea) * 100)
  }

  private identifyClusters(): Array<{ center: Position; items: string[] }> {
    // Simple clustering based on proximity
    const clusters: Array<{ center: Position; items: string[] }> = []
    const processed = new Set<string>()
    const maxDistance = 300

    this.state.items.forEach(item => {
      if (processed.has(item.id)) return

      const cluster = { 
        center: { x: item.x + item.width / 2, y: item.y + item.height / 2 },
        items: [item.id]
      }
      processed.add(item.id)

      // Find nearby items
      this.state.items.forEach(other => {
        if (processed.has(other.id)) return
        
        const distance = Math.sqrt(
          Math.pow(other.x - item.x, 2) + Math.pow(other.y - item.y, 2)
        )
        
        if (distance < maxDistance) {
          cluster.items.push(other.id)
          processed.add(other.id)
          // Update cluster center
          cluster.center.x = (cluster.center.x + other.x + other.width / 2) / 2
          cluster.center.y = (cluster.center.y + other.y + other.height / 2) / 2
        }
      })

      if (cluster.items.length > 1) {
        clusters.push(cluster)
      }
    })

    return clusters
  }

  private getSuggestedActions(): string[] {
    const suggestions: string[] = []
    
    // Check for unconnected data sources
    const dataSources = this.findItems({ type: 'data' })
    const unconnectedSources = dataSources.filter(item => 
      !this.state.connections.some(c => c.source === item.id)
    )
    if (unconnectedSources.length > 0) {
      suggestions.push(`Connect ${unconnectedSources.length} unconnected data source(s)`)
    }

    // Check for overlapping items
    const overlaps = this.findOverlappingItems()
    if (overlaps.length > 0) {
      suggestions.push(`Rearrange ${overlaps.length} overlapping items`)
    }

    // Check for items outside visible area
    const outsideItems = this.state.items.filter(item => 
      item.x < 0 || item.y < 0 || 
      item.x + item.width > this.state.canvasWidth || 
      item.y + item.height > this.state.canvasHeight
    )
    if (outsideItems.length > 0) {
      suggestions.push(`Bring ${outsideItems.length} items into view`)
    }

    // Suggest organization if canvas is cluttered
    if (this.state.items.length > 10 && this.calculateCanvasUtilization() > 50) {
      suggestions.push('Organize items in a grid layout')
    }

    return suggestions
  }

  private findOverlappingItems(): Array<[string, string]> {
    const overlaps: Array<[string, string]> = []
    
    for (let i = 0; i < this.state.items.length; i++) {
      for (let j = i + 1; j < this.state.items.length; j++) {
        const a = this.state.items[i]
        const b = this.state.items[j]
        
        const aBounds: Bounds = { left: a.x, top: a.y, right: a.x + a.width, bottom: a.y + a.height }
        const bBounds: Bounds = { left: b.x, top: b.y, right: b.x + b.width, bottom: b.y + b.height }
        
        if (this.boundsOverlap(aBounds, bBounds)) {
          overlaps.push([a.id, b.id])
        }
      }
    }
    
    return overlaps
  }
}

/**
 * Enhanced command executor with canvas intelligence
 */
export function executeIntelligentCommand(
  command: string, 
  params: any, 
  currentState: any
): { state: any; description: string } {
  const canvasState: CanvasState = {
    items: currentState.canvasItems || [],
    connections: currentState.connections || [],
    canvasWidth: currentState.canvasWidth || 1920,
    canvasHeight: currentState.canvasHeight || 1080
  }

  const intelligence = new CanvasIntelligence(canvasState)
  let description = ''
  const newState = { ...currentState }

  switch (command.toLowerCase()) {
    case 'findspace':
    case 'findemptyspace': {
      const width = params.width || 400
      const height = params.height || 300
      const position = intelligence.findEmptySpace(width, height)
      description = `Found empty space at (${position.x}, ${position.y})`
      return { state: { ...newState, suggestedPosition: position }, description }
    }

    case 'placenear':
    case 'positionnear': {
      const targetId = params.targetId || params.target
      const width = params.width || 400
      const height = params.height || 300
      const side = params.side || 'right'
      const position = intelligence.findPositionNearItem(targetId, width, height, side)
      description = `Positioned near ${targetId} at (${position.x}, ${position.y})`
      return { state: { ...newState, suggestedPosition: position }, description }
    }

    case 'arrangegrid': {
      const itemIds = params.items || params.itemIds
      const positions = intelligence.arrangeGrid(itemIds)
      
      // Apply positions to state
      positions.forEach(({ id, position }) => {
        const item = newState.canvasItems?.find((i: any) => i.id === id)
        if (item) {
          item.x = position.x
          item.y = position.y
        }
      })
      
      description = `Arranged ${positions.length} items in a grid`
      return { state: newState, description }
    }

    case 'align': {
      const itemIds = params.items || params.itemIds || []
      const alignment = params.alignment || 'left'
      const positions = intelligence.alignItems(itemIds, alignment)
      
      // Apply positions
      positions.forEach(({ id, position }) => {
        const item = newState.canvasItems?.find((i: any) => i.id === id)
        if (item) {
          item.x = position.x
          item.y = position.y
        }
      })
      
      description = `Aligned ${positions.length} items ${alignment}`
      return { state: newState, description }
    }

    case 'distribute': {
      const itemIds = params.items || params.itemIds || []
      const direction = params.direction || 'horizontal'
      const positions = intelligence.distributeEvenly(itemIds, direction)
      
      // Apply positions
      positions.forEach(({ id, position }) => {
        const item = newState.canvasItems?.find((i: any) => i.id === id)
        if (item) {
          item.x = position.x
          item.y = position.y
        }
      })
      
      description = `Distributed ${positions.length} items evenly ${direction}ly`
      return { state: newState, description }
    }

    case 'createpipeline': {
      const sourceId = params.source
      const transformIds = params.transforms || []
      const outputId = params.output
      const positions = intelligence.createPipelineLayout(sourceId, transformIds, outputId)
      
      // Apply positions
      positions.forEach(({ id, position }) => {
        const item = newState.canvasItems?.find((i: any) => i.id === id)
        if (item) {
          item.x = position.x
          item.y = position.y
        }
      })
      
      // Create connections
      if (!newState.connections) newState.connections = []
      
      // Connect source to first transform or output
      if (sourceId && transformIds.length > 0) {
        newState.connections.push({ source: sourceId, target: transformIds[0] })
      } else if (sourceId && outputId) {
        newState.connections.push({ source: sourceId, target: outputId })
      }
      
      // Connect transforms
      for (let i = 0; i < transformIds.length - 1; i++) {
        newState.connections.push({ source: transformIds[i], target: transformIds[i + 1] })
      }
      
      // Connect last transform to output
      if (transformIds.length > 0 && outputId) {
        newState.connections.push({ source: transformIds[transformIds.length - 1], target: outputId })
      }
      
      description = `Created pipeline with ${positions.length} items`
      return { state: newState, description }
    }

    case 'findoverlaps': {
      const overlaps = intelligence['findOverlappingItems']()
      description = `Found ${overlaps.length} overlapping items`
      return { state: { ...newState, overlappingItems: overlaps }, description }
    }

    case 'getanalytics': {
      const analytics = intelligence.getCanvasAnalytics()
      description = `Canvas has ${analytics.totalItems} items, ${analytics.connections} connections, ${analytics.canvasUtilization}% utilization`
      return { state: { ...newState, canvasAnalytics: analytics }, description }
    }

    case 'finditems': {
      const criteria = {
        type: params.type,
        hasData: params.hasData,
        connected: params.connected
      }
      const items = intelligence.findItems(criteria)
      description = `Found ${items.length} items matching criteria`
      return { state: { ...newState, foundItems: items }, description }
    }

    default:
      return { state: newState, description: 'Unknown command' }
  }
}