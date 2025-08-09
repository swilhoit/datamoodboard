/**
 * Layout Engine
 * Automatically arranges dashboard components based on content and relationships
 */

export interface LayoutItem {
  id: string
  type: 'chart' | 'table' | 'kpi' | 'filter' | 'title' | 'text'
  priority: number // 1-10, higher = more important
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}

export interface LayoutConstraints {
  canvasWidth: number
  canvasHeight: number
  padding: number
  gap: number
  columns?: number
  responsive?: boolean
}

export interface Position {
  x: number
  y: number
  width: number
  height: number
}

export class LayoutEngine {
  private constraints: LayoutConstraints = {
    canvasWidth: 1600,
    canvasHeight: 900,
    padding: 20,
    gap: 20,
    columns: 12,
    responsive: true
  }

  constructor(constraints?: Partial<LayoutConstraints>) {
    if (constraints) {
      this.constraints = { ...this.constraints, ...constraints }
    }
  }

  // Main layout methods
  arrangeItems(items: LayoutItem[]): Map<string, Position> {
    // Sort by priority (highest first)
    const sorted = [...items].sort((a, b) => b.priority - a.priority)
    
    // Determine layout strategy based on items
    const hasKPIs = items.some(i => i.type === 'kpi')
    const hasFilters = items.some(i => i.type === 'filter')
    const hasTitle = items.some(i => i.type === 'title')
    
    if (hasKPIs || hasFilters || hasTitle) {
      return this.createDashboardLayout(sorted)
    } else {
      return this.createGridLayout(sorted)
    }
  }

  // Dashboard-style layout (KPIs on top, filters on side, main content in center)
  private createDashboardLayout(items: LayoutItem[]): Map<string, Position> {
    const positions = new Map<string, Position>()
    const { canvasWidth, canvasHeight, padding, gap } = this.constraints
    
    let currentY = padding
    const contentWidth = canvasWidth - (padding * 2)
    
    // Place title if exists
    const titleItems = items.filter(i => i.type === 'title')
    if (titleItems.length > 0) {
      titleItems.forEach(item => {
        positions.set(item.id, {
          x: padding,
          y: currentY,
          width: contentWidth,
          height: 60
        })
        currentY += 60 + gap
      })
    }
    
    // Place KPIs in a row at top
    const kpiItems = items.filter(i => i.type === 'kpi')
    if (kpiItems.length > 0) {
      const kpiWidth = Math.floor((contentWidth - (gap * (kpiItems.length - 1))) / kpiItems.length)
      kpiItems.forEach((item, index) => {
        positions.set(item.id, {
          x: padding + (index * (kpiWidth + gap)),
          y: currentY,
          width: kpiWidth,
          height: 100
        })
      })
      currentY += 100 + gap
    }
    
    // Check for filters
    const filterItems = items.filter(i => i.type === 'filter')
    let mainContentX = padding
    let mainContentWidth = contentWidth
    
    if (filterItems.length > 0) {
      // Place filters on the left side
      const filterWidth = 250
      filterItems.forEach((item, index) => {
        positions.set(item.id, {
          x: padding,
          y: currentY + (index * (80 + gap)),
          width: filterWidth,
          height: 80
        })
      })
      mainContentX = padding + filterWidth + gap
      mainContentWidth = contentWidth - filterWidth - gap
    }
    
    // Place remaining items in main content area
    const mainItems = items.filter(i => 
      !['kpi', 'filter', 'title'].includes(i.type)
    )
    
    if (mainItems.length > 0) {
      const layout = this.packItems(
        mainItems,
        mainContentX,
        currentY,
        mainContentWidth,
        canvasHeight - currentY - padding
      )
      
      layout.forEach((pos, id) => positions.set(id, pos))
    }
    
    return positions
  }

  // Grid-based layout
  private createGridLayout(items: LayoutItem[]): Map<string, Position> {
    const positions = new Map<string, Position>()
    const { canvasWidth, canvasHeight, padding, gap, columns } = this.constraints
    
    const contentWidth = canvasWidth - (padding * 2)
    const columnWidth = (contentWidth - (gap * (columns! - 1))) / columns!
    
    // Create a grid
    const grid: boolean[][] = []
    const rows = Math.ceil(canvasHeight / 100) // Approximate row height
    
    for (let i = 0; i < rows; i++) {
      grid[i] = new Array(columns!).fill(false)
    }
    
    // Place items using best-fit algorithm
    items.forEach(item => {
      const colsNeeded = Math.ceil(item.width / columnWidth)
      const rowsNeeded = Math.ceil(item.height / 100)
      
      // Find best position
      const pos = this.findBestPosition(grid, colsNeeded, rowsNeeded)
      
      if (pos) {
        // Mark grid cells as occupied
        for (let r = pos.row; r < pos.row + rowsNeeded && r < rows; r++) {
          for (let c = pos.col; c < pos.col + colsNeeded && c < columns!; c++) {
            grid[r][c] = true
          }
        }
        
        // Calculate actual position
        positions.set(item.id, {
          x: padding + (pos.col * (columnWidth + gap)),
          y: padding + (pos.row * 100),
          width: (colsNeeded * columnWidth) + ((colsNeeded - 1) * gap),
          height: rowsNeeded * 100
        })
      }
    })
    
    return positions
  }

  // Pack items into a specific area
  private packItems(
    items: LayoutItem[],
    startX: number,
    startY: number,
    maxWidth: number,
    maxHeight: number
  ): Map<string, Position> {
    const positions = new Map<string, Position>()
    const { gap } = this.constraints
    
    // Simple packing algorithm - could be improved with bin packing
    let currentX = startX
    let currentY = startY
    let rowHeight = 0
    
    items.forEach(item => {
      // Check if item fits in current row
      if (currentX + item.width > startX + maxWidth) {
        // Move to next row
        currentX = startX
        currentY += rowHeight + gap
        rowHeight = 0
      }
      
      // Place item
      positions.set(item.id, {
        x: currentX,
        y: currentY,
        width: Math.min(item.width, maxWidth),
        height: item.height
      })
      
      currentX += item.width + gap
      rowHeight = Math.max(rowHeight, item.height)
    })
    
    return positions
  }

  // Find best position in grid
  private findBestPosition(
    grid: boolean[][],
    colsNeeded: number,
    rowsNeeded: number
  ): { row: number; col: number } | null {
    const rows = grid.length
    const cols = grid[0].length
    
    for (let r = 0; r <= rows - rowsNeeded; r++) {
      for (let c = 0; c <= cols - colsNeeded; c++) {
        // Check if area is free
        let canPlace = true
        for (let dr = 0; dr < rowsNeeded && canPlace; dr++) {
          for (let dc = 0; dc < colsNeeded && canPlace; dc++) {
            if (grid[r + dr][c + dc]) {
              canPlace = false
            }
          }
        }
        
        if (canPlace) {
          return { row: r, col: c }
        }
      }
    }
    
    return null
  }

  // Responsive layout adjustments
  makeResponsive(
    positions: Map<string, Position>,
    viewportWidth: number
  ): Map<string, Position> {
    const scale = viewportWidth / this.constraints.canvasWidth
    const responsive = new Map<string, Position>()
    
    positions.forEach((pos, id) => {
      responsive.set(id, {
        x: pos.x * scale,
        y: pos.y * scale,
        width: pos.width * scale,
        height: pos.height * scale
      })
    })
    
    return responsive
  }

  // Layout templates
  static getTemplate(type: 'dashboard' | 'report' | 'comparison' | 'analytics'): LayoutItem[] {
    switch (type) {
      case 'dashboard':
        return [
          { id: 'title', type: 'title', priority: 10, width: 1600, height: 60 },
          { id: 'kpi1', type: 'kpi', priority: 9, width: 380, height: 100 },
          { id: 'kpi2', type: 'kpi', priority: 9, width: 380, height: 100 },
          { id: 'kpi3', type: 'kpi', priority: 9, width: 380, height: 100 },
          { id: 'kpi4', type: 'kpi', priority: 9, width: 380, height: 100 },
          { id: 'chart1', type: 'chart', priority: 8, width: 760, height: 400 },
          { id: 'chart2', type: 'chart', priority: 7, width: 760, height: 400 },
          { id: 'table1', type: 'table', priority: 6, width: 1560, height: 300 }
        ]
      
      case 'report':
        return [
          { id: 'title', type: 'title', priority: 10, width: 1600, height: 80 },
          { id: 'summary', type: 'text', priority: 9, width: 1600, height: 120 },
          { id: 'chart1', type: 'chart', priority: 8, width: 1600, height: 400 },
          { id: 'table1', type: 'table', priority: 7, width: 1600, height: 500 },
          { id: 'chart2', type: 'chart', priority: 6, width: 780, height: 350 },
          { id: 'chart3', type: 'chart', priority: 6, width: 780, height: 350 }
        ]
      
      case 'comparison':
        return [
          { id: 'title', type: 'title', priority: 10, width: 1600, height: 60 },
          { id: 'filter1', type: 'filter', priority: 9, width: 250, height: 80 },
          { id: 'filter2', type: 'filter', priority: 9, width: 250, height: 80 },
          { id: 'chart1', type: 'chart', priority: 8, width: 650, height: 400 },
          { id: 'chart2', type: 'chart', priority: 8, width: 650, height: 400 },
          { id: 'table1', type: 'table', priority: 7, width: 1300, height: 400 }
        ]
      
      case 'analytics':
        return [
          { id: 'kpi1', type: 'kpi', priority: 10, width: 300, height: 120 },
          { id: 'kpi2', type: 'kpi', priority: 10, width: 300, height: 120 },
          { id: 'kpi3', type: 'kpi', priority: 10, width: 300, height: 120 },
          { id: 'kpi4', type: 'kpi', priority: 10, width: 300, height: 120 },
          { id: 'kpi5', type: 'kpi', priority: 10, width: 300, height: 120 },
          { id: 'chart1', type: 'chart', priority: 9, width: 800, height: 450 },
          { id: 'chart2', type: 'chart', priority: 8, width: 750, height: 450 },
          { id: 'chart3', type: 'chart', priority: 7, width: 500, height: 350 },
          { id: 'chart4', type: 'chart', priority: 7, width: 500, height: 350 },
          { id: 'chart5', type: 'chart', priority: 7, width: 500, height: 350 }
        ]
    }
  }

  // Optimize layout for specific goals
  optimizeFor(
    positions: Map<string, Position>,
    items: LayoutItem[],
    goal: 'density' | 'readability' | 'flow'
  ): Map<string, Position> {
    switch (goal) {
      case 'density':
        // Minimize whitespace
        return this.compactLayout(positions, items)
      
      case 'readability':
        // Add more spacing, align items
        return this.spaciousLayout(positions, items)
      
      case 'flow':
        // Arrange by priority and relationships
        return this.flowLayout(positions, items)
      
      default:
        return positions
    }
  }

  private compactLayout(
    positions: Map<string, Position>,
    items: LayoutItem[]
  ): Map<string, Position> {
    // Reduce gaps and pack tighter
    const compact = new Map<string, Position>()
    const minGap = 10
    
    // Sort by Y then X position
    const sorted = Array.from(positions.entries())
      .sort((a, b) => a[1].y - b[1].y || a[1].x - b[1].x)
    
    let lastY = this.constraints.padding
    let currentRowItems: Array<[string, Position]> = []
    
    sorted.forEach(([id, pos]) => {
      if (currentRowItems.length === 0 || 
          Math.abs(pos.y - currentRowItems[0][1].y) < 10) {
        currentRowItems.push([id, pos])
      } else {
        // Process current row
        let x = this.constraints.padding
        currentRowItems.forEach(([itemId, itemPos]) => {
          compact.set(itemId, {
            ...itemPos,
            x,
            y: lastY
          })
          x += itemPos.width + minGap
        })
        
        // Update lastY
        const maxHeight = Math.max(...currentRowItems.map(([, p]) => p.height))
        lastY += maxHeight + minGap
        
        // Start new row
        currentRowItems = [[id, pos]]
      }
    })
    
    // Process last row
    if (currentRowItems.length > 0) {
      let x = this.constraints.padding
      currentRowItems.forEach(([itemId, itemPos]) => {
        compact.set(itemId, {
          ...itemPos,
          x,
          y: lastY
        })
        x += itemPos.width + minGap
      })
    }
    
    return compact
  }

  private spaciousLayout(
    positions: Map<string, Position>,
    items: LayoutItem[]
  ): Map<string, Position> {
    // Add more spacing for better readability
    const spacious = new Map<string, Position>()
    const extraGap = 40
    
    positions.forEach((pos, id) => {
      spacious.set(id, {
        x: pos.x * 1.1,
        y: pos.y * 1.2,
        width: pos.width,
        height: pos.height
      })
    })
    
    return spacious
  }

  private flowLayout(
    positions: Map<string, Position>,
    items: LayoutItem[]
  ): Map<string, Position> {
    // Arrange in reading order by priority
    const flow = new Map<string, Position>()
    const { canvasWidth, padding, gap } = this.constraints
    
    // Group by priority
    const byPriority = new Map<number, LayoutItem[]>()
    items.forEach(item => {
      const priority = Math.floor(item.priority)
      if (!byPriority.has(priority)) {
        byPriority.set(priority, [])
      }
      byPriority.get(priority)!.push(item)
    })
    
    // Sort priorities descending
    const priorities = Array.from(byPriority.keys()).sort((a, b) => b - a)
    
    let currentY = padding
    
    priorities.forEach(priority => {
      const priorityItems = byPriority.get(priority)!
      let currentX = padding
      let rowHeight = 0
      
      priorityItems.forEach(item => {
        if (currentX + item.width > canvasWidth - padding) {
          currentX = padding
          currentY += rowHeight + gap
          rowHeight = 0
        }
        
        flow.set(item.id, {
          x: currentX,
          y: currentY,
          width: item.width,
          height: item.height
        })
        
        currentX += item.width + gap
        rowHeight = Math.max(rowHeight, item.height)
      })
      
      currentY += rowHeight + gap * 1.5 // Extra gap between priority groups
    })
    
    return flow
  }
}