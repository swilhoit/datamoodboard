/**
 * Data Pipeline Builder
 * Constructs data processing pipelines from natural language or structured commands
 */

export interface PipelineNode {
  id: string
  type: 'source' | 'transform' | 'output'
  operation: string
  config: any
  inputs?: string[]
  position?: { x: number; y: number }
}

export interface Pipeline {
  nodes: PipelineNode[]
  edges: Array<{ source: string; target: string }>
}

export interface DataSourceConfig {
  type: 'googlesheets' | 'shopify' | 'stripe' | 'database' | 'csv'
  credentials?: any
  parameters: any
}

export interface TransformConfig {
  operation: 'filter' | 'aggregate' | 'join' | 'pivot' | 'select' | 'sort' | 'limit'
  parameters: any
}

export class DataPipelineBuilder {
  private pipeline: Pipeline = {
    nodes: [],
    edges: []
  }

  private nodeCounter = 0

  // Source operations
  addGoogleSheetsSource(spreadsheetId: string, range?: string): string {
    const nodeId = this.generateNodeId('source')
    const node: PipelineNode = {
      id: nodeId,
      type: 'source',
      operation: 'googlesheets',
      config: {
        spreadsheetId,
        range: range || 'A:Z',
        headers: true
      },
      position: this.getNextPosition()
    }
    
    this.pipeline.nodes.push(node)
    return nodeId
  }

  addShopifySource(store: string, resource: 'orders' | 'products' | 'customers'): string {
    const nodeId = this.generateNodeId('source')
    const node: PipelineNode = {
      id: nodeId,
      type: 'source',
      operation: 'shopify',
      config: {
        store,
        resource,
        limit: 100
      },
      position: this.getNextPosition()
    }
    
    this.pipeline.nodes.push(node)
    return nodeId
  }

  addDatabaseSource(table: string, database: string = 'postgresql'): string {
    const nodeId = this.generateNodeId('source')
    const node: PipelineNode = {
      id: nodeId,
      type: 'source',
      operation: 'database',
      config: {
        database,
        table,
        query: `SELECT * FROM ${table}`
      },
      position: this.getNextPosition()
    }
    
    this.pipeline.nodes.push(node)
    return nodeId
  }

  // Transform operations
  addFilter(inputNodeId: string, column: string, operator: string, value: any): string {
    const nodeId = this.generateNodeId('filter')
    const node: PipelineNode = {
      id: nodeId,
      type: 'transform',
      operation: 'filter',
      config: {
        column,
        operator,
        value
      },
      inputs: [inputNodeId],
      position: this.getNextPosition()
    }
    
    this.pipeline.nodes.push(node)
    this.pipeline.edges.push({ source: inputNodeId, target: nodeId })
    return nodeId
  }

  addAggregation(
    inputNodeId: string,
    groupBy: string[],
    aggregations: Array<{ column: string; function: 'sum' | 'avg' | 'count' | 'min' | 'max' }>
  ): string {
    const nodeId = this.generateNodeId('aggregate')
    const node: PipelineNode = {
      id: nodeId,
      type: 'transform',
      operation: 'aggregate',
      config: {
        groupBy: groupBy.join(','),
        aggregations: aggregations.map(a => `${a.function}(${a.column})`).join(',')
      },
      inputs: [inputNodeId],
      position: this.getNextPosition()
    }
    
    this.pipeline.nodes.push(node)
    this.pipeline.edges.push({ source: inputNodeId, target: nodeId })
    return nodeId
  }

  addJoin(
    leftNodeId: string,
    rightNodeId: string,
    leftKey: string,
    rightKey: string,
    joinType: 'inner' | 'left' | 'right' | 'full' = 'inner'
  ): string {
    const nodeId = this.generateNodeId('join')
    const node: PipelineNode = {
      id: nodeId,
      type: 'transform',
      operation: 'join',
      config: {
        joinType,
        leftKey,
        rightKey
      },
      inputs: [leftNodeId, rightNodeId],
      position: this.getNextPosition()
    }
    
    this.pipeline.nodes.push(node)
    this.pipeline.edges.push({ source: leftNodeId, target: nodeId })
    this.pipeline.edges.push({ source: rightNodeId, target: nodeId })
    return nodeId
  }

  addPivot(
    inputNodeId: string,
    rows: string,
    columns: string,
    values: string,
    aggregation: 'sum' | 'avg' | 'count' = 'sum'
  ): string {
    const nodeId = this.generateNodeId('pivot')
    const node: PipelineNode = {
      id: nodeId,
      type: 'transform',
      operation: 'pivot',
      config: {
        rows,
        columns,
        values,
        aggregation
      },
      inputs: [inputNodeId],
      position: this.getNextPosition()
    }
    
    this.pipeline.nodes.push(node)
    this.pipeline.edges.push({ source: inputNodeId, target: nodeId })
    return nodeId
  }

  addSelect(inputNodeId: string, columns: string[]): string {
    const nodeId = this.generateNodeId('select')
    const node: PipelineNode = {
      id: nodeId,
      type: 'transform',
      operation: 'select',
      config: {
        columns: columns.join(',')
      },
      inputs: [inputNodeId],
      position: this.getNextPosition()
    }
    
    this.pipeline.nodes.push(node)
    this.pipeline.edges.push({ source: inputNodeId, target: nodeId })
    return nodeId
  }

  addSort(inputNodeId: string, column: string, direction: 'asc' | 'desc' = 'asc'): string {
    const nodeId = this.generateNodeId('sort')
    const node: PipelineNode = {
      id: nodeId,
      type: 'transform',
      operation: 'sort',
      config: {
        column,
        direction
      },
      inputs: [inputNodeId],
      position: this.getNextPosition()
    }
    
    this.pipeline.nodes.push(node)
    this.pipeline.edges.push({ source: inputNodeId, target: nodeId })
    return nodeId
  }

  // Generic transform operation
  addTransform(
    inputNodeId: string,
    operation: string,
    config: any
  ): string {
    const nodeId = this.generateNodeId('transform')
    const node: PipelineNode = {
      id: nodeId,
      type: 'transform',
      operation,
      config: config || {},
      inputs: [inputNodeId],
      position: this.getNextPosition()
    }

    this.pipeline.nodes.push(node)
    this.pipeline.edges.push({ source: inputNodeId, target: nodeId })
    return nodeId
  }

  // Union two input streams
  addUnion(leftNodeId: string, rightNodeId: string): string {
    const nodeId = this.generateNodeId('union')
    const node: PipelineNode = {
      id: nodeId,
      type: 'transform',
      operation: 'union',
      config: {},
      inputs: [leftNodeId, rightNodeId],
      position: this.getNextPosition()
    }

    this.pipeline.nodes.push(node)
    this.pipeline.edges.push({ source: leftNodeId, target: nodeId })
    this.pipeline.edges.push({ source: rightNodeId, target: nodeId })
    return nodeId
  }

  // Stripe data source
  addStripeSource(resource: 'payments' | 'charges' | 'invoices' = 'payments'): string {
    const nodeId = this.generateNodeId('source')
    const node: PipelineNode = {
      id: nodeId,
      type: 'source',
      operation: 'stripe',
      config: {
        resource,
        limit: 100
      },
      position: this.getNextPosition()
    }

    this.pipeline.nodes.push(node)
    return nodeId
  }

  // Time-based aggregations for common patterns
  addMonthlyAggregation(
    inputNodeId: string,
    dateColumn: string,
    metrics: Array<{ column: string; function: 'sum' | 'avg' | 'count' }>
  ): string {
    // First add a transform to extract month from date
    const monthExtractId = this.generateNodeId('transform')
    const monthNode: PipelineNode = {
      id: monthExtractId,
      type: 'transform',
      operation: 'extractMonth',
      config: {
        dateColumn,
        outputColumn: 'month'
      },
      inputs: [inputNodeId],
      position: this.getNextPosition()
    }
    
    this.pipeline.nodes.push(monthNode)
    this.pipeline.edges.push({ source: inputNodeId, target: monthExtractId })
    
    // Then aggregate by month
    return this.addAggregation(monthExtractId, ['month'], metrics)
  }

  // Output operations
  addOutput(inputNodeId: string, type: 'table' | 'chart', config?: any): string {
    const nodeId = this.generateNodeId('output')
    const node: PipelineNode = {
      id: nodeId,
      type: 'output',
      operation: type,
      config: config || {},
      inputs: [inputNodeId],
      position: this.getNextPosition()
    }
    
    this.pipeline.nodes.push(node)
    this.pipeline.edges.push({ source: inputNodeId, target: nodeId })
    return nodeId
  }

  // Utility methods
  private generateNodeId(prefix: string): string {
    return `${prefix}_${++this.nodeCounter}`
  }

  private getNextPosition(): { x: number; y: number } {
    const nodeCount = this.pipeline.nodes.length
    const col = nodeCount % 3
    const row = Math.floor(nodeCount / 3)
    return {
      x: 100 + col * 250,
      y: 100 + row * 200
    }
  }

  // Builder pattern methods
  clear(): this {
    this.pipeline = { nodes: [], edges: [] }
    this.nodeCounter = 0
    return this
  }

  getPipeline(): Pipeline {
    return { ...this.pipeline }
  }

  // Generate executable pipeline
  toExecutable(): any {
    // Convert to format that can be executed by the data processor
    const executable = {
      sources: this.pipeline.nodes.filter(n => n.type === 'source'),
      transforms: this.pipeline.nodes.filter(n => n.type === 'transform'),
      outputs: this.pipeline.nodes.filter(n => n.type === 'output'),
      flow: this.pipeline.edges
    }
    
    return executable
  }

  // Create pipeline from semantic description
  static fromDescription(description: string): DataPipelineBuilder {
    const builder = new DataPipelineBuilder()
    const lower = description.toLowerCase()
    
    // Pattern matching for common requests
    if (lower.includes('google ads') && lower.includes('monthly')) {
      // "Google Ads monthly performance"
      const sourceId = builder.addGoogleSheetsSource('google_ads_data')
      const aggId = builder.addMonthlyAggregation(sourceId, 'date', [
        { column: 'impressions', function: 'sum' },
        { column: 'clicks', function: 'sum' },
        { column: 'cost', function: 'sum' },
        { column: 'conversions', function: 'sum' }
      ])
      builder.addOutput(aggId, 'table')
      builder.addOutput(aggId, 'chart', { type: 'line', x: 'month', y: ['cost', 'conversions'] })
    }
    else if (lower.includes('shopify') && lower.includes('orders')) {
      // "Shopify orders by product"
      const sourceId = builder.addShopifySource('store', 'orders')
      
      if (lower.includes('product') || lower.includes('category')) {
        const aggId = builder.addAggregation(sourceId, ['product_name'], [
          { column: 'total_price', function: 'sum' },
          { column: 'id', function: 'count' }
        ])
        builder.addOutput(aggId, 'table')
        builder.addOutput(aggId, 'chart', { type: 'bar', x: 'product_name', y: 'sum_total_price' })
      } else {
        builder.addOutput(sourceId, 'table')
      }
    }
    else if (lower.includes('compare')) {
      // "Compare X and Y"
      // This would need more sophisticated parsing
      // For now, just create two sources
      const source1 = builder.addDatabaseSource('table1')
      const source2 = builder.addDatabaseSource('table2')
      const joinId = builder.addJoin(source1, source2, 'id', 'id')
      builder.addOutput(joinId, 'table')
    }
    
    return builder
  }

  // Validate pipeline
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Check for sources
    const sources = this.pipeline.nodes.filter(n => n.type === 'source')
    if (sources.length === 0) {
      errors.push('Pipeline must have at least one data source')
    }
    
    // Check for outputs
    const outputs = this.pipeline.nodes.filter(n => n.type === 'output')
    if (outputs.length === 0) {
      errors.push('Pipeline must have at least one output')
    }
    
    // Check for disconnected nodes
    const connectedNodes = new Set<string>()
    this.pipeline.edges.forEach(edge => {
      connectedNodes.add(edge.source)
      connectedNodes.add(edge.target)
    })
    
    this.pipeline.nodes.forEach(node => {
      if (node.type !== 'source' && !connectedNodes.has(node.id)) {
        errors.push(`Node ${node.id} is not connected`)
      }
    })
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}