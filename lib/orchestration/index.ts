/**
 * Dashboard Orchestration System
 * Main entry point for AI-driven dashboard creation
 */

export { DashboardOrchestrator } from './dashboard-orchestrator'
export type { DashboardState, OrchestratorCommand } from './dashboard-orchestrator'

export { DataPipelineBuilder } from './data-pipeline-builder'
export type { Pipeline, PipelineNode, DataSourceConfig, TransformConfig } from './data-pipeline-builder'

export { VisualizationFactory } from './visualization-factory'
export type { DataSchema, VisualizationConfig } from './visualization-factory'

export { LayoutEngine } from './layout-engine'
export type { LayoutItem, LayoutConstraints, Position } from './layout-engine'

export { SemanticTemplates } from './semantic-templates'
export type { SemanticTemplate, DashboardDefinition } from './semantic-templates'

import { DashboardOrchestrator } from './dashboard-orchestrator'
import { DataPipelineBuilder } from './data-pipeline-builder'
import { VisualizationFactory } from './visualization-factory'
import { LayoutEngine } from './layout-engine'
import { SemanticTemplates } from './semantic-templates'

/**
 * Main orchestration class that coordinates all components
 */
export class DashboardBuilder {
  private orchestrator: DashboardOrchestrator
  private pipelineBuilder: DataPipelineBuilder
  private layoutEngine: LayoutEngine

  constructor() {
    this.orchestrator = new DashboardOrchestrator()
    this.pipelineBuilder = new DataPipelineBuilder()
    this.layoutEngine = new LayoutEngine()
  }

  /**
   * Build a dashboard from a natural language description
   * This is the main entry point for AI-driven dashboard creation
   */
  async buildFromDescription(description: string, context?: any): Promise<any> {
    const lower = description.toLowerCase()
    
    // Parse intent and extract key information
    const intent = this.parseIntent(description)
    
    // Find matching template
    const templates = SemanticTemplates.find(description)
    if (templates.length > 0) {
      // Use the best matching template
      const template = templates[0]
      const success = SemanticTemplates.buildDashboard(
        template.name,
        context,
        this.orchestrator
      )
      
      if (success) {
        return this.orchestrator.getState()
      }
    }
    
    // If no template matches, build custom dashboard
    return this.buildCustomDashboard(intent, context)
  }

  /**
   * Parse user intent from description
   */
  private parseIntent(description: string): any {
    const lower = description.toLowerCase()
    const intent: any = {
      dataSources: [],
      metrics: [],
      dimensions: [],
      timeframe: null,
      visualizations: [],
      layout: 'dashboard'
    }
    
    // Detect data sources
    if (lower.includes('google ads') || lower.includes('adwords')) {
      intent.dataSources.push('googleads')
    }
    if (lower.includes('shopify') || lower.includes('store') || lower.includes('orders')) {
      intent.dataSources.push('shopify')
    }
    if (lower.includes('stripe') || lower.includes('payment')) {
      intent.dataSources.push('stripe')
    }
    if (lower.includes('sheets') || lower.includes('spreadsheet')) {
      intent.dataSources.push('googlesheets')
    }
    
    // Detect metrics
    const metricKeywords = {
      revenue: ['revenue', 'sales', 'income'],
      cost: ['cost', 'spend', 'expense'],
      profit: ['profit', 'margin', 'earnings'],
      conversions: ['conversion', 'convert', 'purchase'],
      traffic: ['traffic', 'visits', 'sessions'],
      users: ['users', 'customers', 'clients']
    }
    
    Object.entries(metricKeywords).forEach(([metric, keywords]) => {
      if (keywords.some(kw => lower.includes(kw))) {
        intent.metrics.push(metric)
      }
    })
    
    // Detect time frames
    if (lower.includes('monthly')) intent.timeframe = 'monthly'
    else if (lower.includes('weekly')) intent.timeframe = 'weekly'
    else if (lower.includes('daily')) intent.timeframe = 'daily'
    else if (lower.includes('yearly')) intent.timeframe = 'yearly'
    else if (lower.includes('quarterly')) intent.timeframe = 'quarterly'
    
    // Detect visualization preferences
    if (lower.includes('table')) intent.visualizations.push('table')
    if (lower.includes('chart') || lower.includes('graph')) {
      if (lower.includes('line')) intent.visualizations.push('lineChart')
      else if (lower.includes('bar')) intent.visualizations.push('barChart')
      else if (lower.includes('pie')) intent.visualizations.push('pieChart')
      else intent.visualizations.push('chart') // Generic
    }
    
    // Detect layout preference
    if (lower.includes('report')) intent.layout = 'report'
    else if (lower.includes('comparison') || lower.includes('compare')) intent.layout = 'comparison'
    else if (lower.includes('analytics')) intent.layout = 'analytics'
    
    return intent
  }

  /**
   * Build a custom dashboard based on parsed intent
   */
  private async buildCustomDashboard(intent: any, context?: any): Promise<any> {
    // Clear existing state
    this.orchestrator.clear()
    
    // Step 1: Set up data sources
    const sourceNodes: string[] = []
    
    if (intent.dataSources.includes('googlesheets') && context?.spreadsheetId) {
      const sourceId = this.pipelineBuilder.addGoogleSheetsSource(
        context.spreadsheetId,
        context.range
      )
      sourceNodes.push(sourceId)
      
      // Add to orchestrator
      this.orchestrator.addDataSource('googlesheets', {
        name: 'Google Sheets Data',
        spreadsheetId: context.spreadsheetId
      })
    }
    
    if (intent.dataSources.includes('shopify') && context?.store) {
      const sourceId = this.pipelineBuilder.addShopifySource(
        context.store,
        'orders'
      )
      sourceNodes.push(sourceId)
      
      this.orchestrator.addDataSource('shopify', {
        name: 'Shopify Orders',
        store: context.store
      })
    }
    
    // Step 2: Apply transformations based on timeframe
    let processedNodeId = sourceNodes[0]
    
    if (intent.timeframe && sourceNodes.length > 0) {
      if (intent.timeframe === 'monthly') {
        const metrics = intent.metrics.map((m: string) => ({
          column: m,
          function: 'sum' as const
        }))
        
        processedNodeId = this.pipelineBuilder.addMonthlyAggregation(
          sourceNodes[0],
          'date',
          metrics.length > 0 ? metrics : [{ column: 'value', function: 'sum' }]
        )
      }
    }
    
    // Step 3: Generate visualizations
    const sampleData = this.generateSampleData(intent)
    const recommendations = VisualizationFactory.recommendVisualizations(
      sampleData,
      intent.visualizations[0]
    )
    
    // Step 4: Layout visualizations
    const layoutItems = recommendations.slice(0, 6).map((viz, index) => ({
      id: `viz-${index}`,
      type: this.getLayoutType(viz.type),
      priority: 10 - index,
      width: 400,
      height: 300
    }))
    
    const positions = this.layoutEngine.arrangeItems(layoutItems)
    
    // Step 5: Add to orchestrator
    recommendations.slice(0, 6).forEach((viz, index) => {
      const pos = positions.get(`viz-${index}`)
      if (pos) {
        this.orchestrator.addVisualization(viz.type, {
          title: viz.title,
          x: pos.x,
          y: pos.y,
          width: pos.width,
          height: pos.height,
          data: sampleData,
          style: viz.style
        })
      }
    })
    
    // Step 6: Apply theme
    this.orchestrator.setTheme(context?.theme || 'light')
    
    return this.orchestrator.getState()
  }

  /**
   * Generate sample data based on intent
   */
  private generateSampleData(intent: any): any[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const data: any[] = []
    
    months.forEach(month => {
      const row: any = { month }
      
      intent.metrics.forEach((metric: string) => {
        switch (metric) {
          case 'revenue':
            row[metric] = Math.random() * 100000 + 50000
            break
          case 'cost':
            row[metric] = Math.random() * 50000 + 20000
            break
          case 'conversions':
            row[metric] = Math.floor(Math.random() * 1000 + 100)
            break
          default:
            row[metric] = Math.random() * 1000
        }
      })
      
      data.push(row)
    })
    
    return data
  }

  /**
   * Convert visualization type to layout type
   */
  private getLayoutType(vizType: string): 'chart' | 'table' | 'kpi' | 'filter' | 'title' | 'text' {
    if (vizType.includes('Card')) return 'kpi'
    if (vizType.includes('table') || vizType.includes('Table')) return 'table'
    return 'chart'
  }

  /**
   * Execute a series of orchestration commands
   */
  executeCommands(commands: any[]): any {
    return this.orchestrator.executeBatch(commands)
  }

  /**
   * Get current dashboard state
   */
  getState(): any {
    return this.orchestrator.getState()
  }

  /**
   * Export dashboard as JSON
   */
  export(): string {
    return this.orchestrator.exportState()
  }

  /**
   * Import dashboard from JSON
   */
  import(json: string): boolean {
    return this.orchestrator.importState(json)
  }
}

// Default export for convenience
export default DashboardBuilder