/**
 * Semantic Templates
 * Pre-defined templates for common dashboard patterns and use cases
 */

import { DataPipelineBuilder } from './data-pipeline-builder'
import { VisualizationFactory } from './visualization-factory'
import { LayoutEngine } from './layout-engine'
import { DashboardOrchestrator } from './dashboard-orchestrator'

export interface SemanticTemplate {
  name: string
  description: string
  keywords: string[]
  requiredDataSources: string[]
  optionalDataSources?: string[]
  build: (params: any) => DashboardDefinition
}

export interface DashboardDefinition {
  pipeline: any
  visualizations: any[]
  layout: any
  theme?: string
  title?: string
}

export class SemanticTemplates {
  private static templates: Map<string, SemanticTemplate> = new Map()

  static {
    // Initialize built-in templates
    this.registerBuiltInTemplates()
  }

  private static registerBuiltInTemplates() {
    // Google Ads Performance Dashboard
    this.register({
      name: 'google-ads-performance',
      description: 'Monthly performance metrics for Google Ads campaigns',
      keywords: ['google ads', 'adwords', 'ppc', 'advertising', 'campaigns'],
      requiredDataSources: ['googlesheets'],
      build: (params) => {
        const pipeline = new DataPipelineBuilder()
        
        // Data pipeline
        const sourceId = pipeline.addGoogleSheetsSource(
          params.spreadsheetId || 'google_ads_data',
          params.range
        )
        
        // Monthly aggregation
        const monthlyId = pipeline.addMonthlyAggregation(sourceId, 'date', [
          { column: 'impressions', function: 'sum' },
          { column: 'clicks', function: 'sum' },
          { column: 'cost', function: 'sum' },
          { column: 'conversions', function: 'sum' }
        ])
        
        // Calculate CTR and CPC
        const metricsId = pipeline.addTransform(monthlyId, 'calculate', {
          ctr: 'clicks / impressions * 100',
          cpc: 'cost / clicks',
          cpa: 'cost / conversions'
        })
        
        // Outputs
        pipeline.addOutput(metricsId, 'table')
        pipeline.addOutput(metricsId, 'chart')
        
        return {
          pipeline: pipeline.getPipeline(),
          visualizations: [
            {
              type: 'kpiCard',
              title: 'Total Spend',
              metric: 'cost',
              aggregation: 'sum',
              format: 'currency'
            },
            {
              type: 'kpiCard',
              title: 'Conversions',
              metric: 'conversions',
              aggregation: 'sum',
              showTrend: true
            },
            {
              type: 'kpiCard',
              title: 'Avg CTR',
              metric: 'ctr',
              aggregation: 'avg',
              format: 'percentage'
            },
            {
              type: 'kpiCard',
              title: 'Avg CPC',
              metric: 'cpc',
              aggregation: 'avg',
              format: 'currency'
            },
            {
              type: 'lineChart',
              title: 'Performance Trends',
              xAxis: 'month',
              yAxis: ['impressions', 'clicks', 'conversions'],
              style: { smooth: true }
            },
            {
              type: 'barChart',
              title: 'Monthly Spend',
              xAxis: 'month',
              yAxis: 'cost',
              style: { color: '#3B82F6' }
            },
            {
              type: 'table',
              title: 'Detailed Metrics',
              columns: ['month', 'impressions', 'clicks', 'cost', 'conversions', 'ctr', 'cpc']
            }
          ],
          layout: 'dashboard',
          theme: 'modern',
          title: 'Google Ads Performance Dashboard'
        }
      }
    })

    // E-commerce Sales Dashboard
    this.register({
      name: 'ecommerce-sales',
      description: 'Sales analytics for Shopify stores',
      keywords: ['shopify', 'sales', 'orders', 'revenue', 'ecommerce', 'store'],
      requiredDataSources: ['shopify'],
      optionalDataSources: ['googlesheets', 'stripe'],
      build: (params) => {
        const pipeline = new DataPipelineBuilder()
        
        // Shopify orders
        const ordersId = pipeline.addShopifySource(params.store, 'orders')
        
        // Group by product
        const productSalesId = pipeline.addAggregation(ordersId, ['product_name'], [
          { column: 'total_price', function: 'sum' },
          { column: 'quantity', function: 'sum' },
          { column: 'id', function: 'count' }
        ])
        
        // Group by date
        const dailySalesId = pipeline.addAggregation(ordersId, ['created_at'], [
          { column: 'total_price', function: 'sum' },
          { column: 'id', function: 'count' }
        ])
        
        // If Stripe is connected, join payment data
        if (params.includeStripe) {
          const stripeId = pipeline.addStripeSource('payments')
          const joinedId = pipeline.addJoin(ordersId, stripeId, 'id', 'order_id')
          pipeline.addOutput(joinedId, 'table')
        }
        
        pipeline.addOutput(productSalesId, 'chart')
        pipeline.addOutput(dailySalesId, 'chart')
        
        return {
          pipeline: pipeline.getPipeline(),
          visualizations: [
            {
              type: 'kpiCard',
              title: 'Total Revenue',
              metric: 'total_price',
              aggregation: 'sum',
              format: 'currency'
            },
            {
              type: 'kpiCard',
              title: 'Orders',
              metric: 'id',
              aggregation: 'count'
            },
            {
              type: 'kpiCard',
              title: 'Avg Order Value',
              metric: 'total_price',
              aggregation: 'avg',
              format: 'currency'
            },
            {
              type: 'kpiCard',
              title: 'Products Sold',
              metric: 'quantity',
              aggregation: 'sum'
            },
            {
              type: 'barChart',
              title: 'Top Products by Revenue',
              xAxis: 'product_name',
              yAxis: 'sum_total_price',
              style: { orientation: 'horizontal', limit: 10 }
            },
            {
              type: 'lineChart',
              title: 'Daily Sales Trend',
              xAxis: 'created_at',
              yAxis: 'sum_total_price',
              style: { smooth: true, area: true }
            },
            {
              type: 'pieChart',
              title: 'Sales by Category',
              groupBy: 'product_category',
              value: 'total_price'
            },
            {
              type: 'table',
              title: 'Recent Orders',
              columns: ['order_number', 'customer_email', 'total_price', 'status', 'created_at'],
              style: { sortBy: 'created_at', sortOrder: 'desc', limit: 50 }
            }
          ],
          layout: 'dashboard',
          theme: 'modern',
          title: 'E-commerce Sales Dashboard'
        }
      }
    })

    // Marketing Attribution Dashboard
    this.register({
      name: 'marketing-attribution',
      description: 'Multi-channel marketing attribution and ROI analysis',
      keywords: ['attribution', 'marketing', 'roi', 'channels', 'conversion'],
      requiredDataSources: ['googlesheets'],
      optionalDataSources: ['shopify', 'stripe'],
      build: (params) => {
        const pipeline = new DataPipelineBuilder()
        
        // Multiple marketing sources
        const googleAdsId = pipeline.addGoogleSheetsSource(params.googleAdsSheet)
        const facebookAdsId = pipeline.addGoogleSheetsSource(params.facebookAdsSheet)
        const emailId = pipeline.addGoogleSheetsSource(params.emailSheet)
        
        // Normalize channel names
        const normalizedGoogle = pipeline.addTransform(googleAdsId, 'addColumn', {
          column: 'channel',
          value: 'Google Ads'
        })
        const normalizedFacebook = pipeline.addTransform(facebookAdsId, 'addColumn', {
          column: 'channel',
          value: 'Facebook'
        })
        const normalizedEmail = pipeline.addTransform(emailId, 'addColumn', {
          column: 'channel',
          value: 'Email'
        })
        
        // Union all channels
        const unionId = pipeline.addUnion(normalizedGoogle, normalizedFacebook)
        const allChannelsId = pipeline.addUnion(unionId, normalizedEmail)
        
        // Calculate ROI by channel
        const roiId = pipeline.addAggregation(allChannelsId, ['channel'], [
          { column: 'spend', function: 'sum' },
          { column: 'revenue', function: 'sum' },
          { column: 'conversions', function: 'sum' }
        ])
        
        const withRoiId = pipeline.addTransform(roiId, 'calculate', {
          roi: '(revenue - spend) / spend * 100',
          cpa: 'spend / conversions'
        })
        
        pipeline.addOutput(withRoiId, 'table')
        pipeline.addOutput(withRoiId, 'chart')
        
        return {
          pipeline: pipeline.getPipeline(),
          visualizations: [
            {
              type: 'kpiCard',
              title: 'Total Spend',
              metric: 'spend',
              aggregation: 'sum',
              format: 'currency'
            },
            {
              type: 'kpiCard',
              title: 'Total Revenue',
              metric: 'revenue',
              aggregation: 'sum',
              format: 'currency'
            },
            {
              type: 'kpiCard',
              title: 'Overall ROI',
              metric: 'roi',
              aggregation: 'avg',
              format: 'percentage'
            },
            {
              type: 'kpiCard',
              title: 'Conversions',
              metric: 'conversions',
              aggregation: 'sum'
            },
            {
              type: 'barChart',
              title: 'Revenue by Channel',
              xAxis: 'channel',
              yAxis: 'sum_revenue',
              style: { color: '#10B981' }
            },
            {
              type: 'barChart',
              title: 'ROI by Channel',
              xAxis: 'channel',
              yAxis: 'roi',
              style: { color: '#8B5CF6' }
            },
            {
              type: 'pieChart',
              title: 'Spend Distribution',
              groupBy: 'channel',
              value: 'spend'
            },
            {
              type: 'table',
              title: 'Channel Performance',
              columns: ['channel', 'spend', 'revenue', 'conversions', 'roi', 'cpa']
            }
          ],
          layout: 'analytics',
          theme: 'modern',
          title: 'Marketing Attribution Dashboard'
        }
      }
    })

    // Financial KPI Dashboard
    this.register({
      name: 'financial-kpis',
      description: 'Key financial metrics and performance indicators',
      keywords: ['finance', 'revenue', 'profit', 'expenses', 'kpi', 'metrics'],
      requiredDataSources: ['googlesheets', 'database'],
      build: (params) => {
        const pipeline = new DataPipelineBuilder()
        
        // Financial data sources
        const revenueId = pipeline.addDatabaseSource('revenue', 'postgresql')
        const expensesId = pipeline.addDatabaseSource('expenses', 'postgresql')
        const forecastId = pipeline.addGoogleSheetsSource(params.forecastSheet)
        
        // Join actual vs forecast
        const actualVsForecastId = pipeline.addJoin(
          revenueId,
          forecastId,
          'month',
          'month',
          'left'
        )
        
        // Calculate profit margins
        const profitId = pipeline.addTransform(actualVsForecastId, 'calculate', {
          gross_profit: 'revenue - cogs',
          gross_margin: 'gross_profit / revenue * 100',
          net_profit: 'revenue - total_expenses',
          net_margin: 'net_profit / revenue * 100',
          variance: 'revenue - forecast_revenue'
        })
        
        pipeline.addOutput(profitId, 'table')
        pipeline.addOutput(profitId, 'chart')
        
        return {
          pipeline: pipeline.getPipeline(),
          visualizations: [
            {
              type: 'kpiCard',
              title: 'Revenue',
              metric: 'revenue',
              aggregation: 'sum',
              format: 'currency',
              showTrend: true
            },
            {
              type: 'kpiCard',
              title: 'Gross Margin',
              metric: 'gross_margin',
              aggregation: 'avg',
              format: 'percentage',
              thresholds: { good: 40, warning: 30, bad: 20 }
            },
            {
              type: 'kpiCard',
              title: 'Net Profit',
              metric: 'net_profit',
              aggregation: 'sum',
              format: 'currency',
              showTrend: true
            },
            {
              type: 'kpiCard',
              title: 'Expenses',
              metric: 'total_expenses',
              aggregation: 'sum',
              format: 'currency'
            },
            {
              type: 'lineChart',
              title: 'Revenue vs Forecast',
              xAxis: 'month',
              yAxis: ['revenue', 'forecast_revenue'],
              style: { 
                colors: ['#3B82F6', '#EF4444'],
                dashed: [false, true]
              }
            },
            {
              type: 'areaChart',
              title: 'Profit Margins Over Time',
              xAxis: 'month',
              series: ['gross_margin', 'net_margin'],
              style: { stacked: false }
            },
            {
              type: 'waterfallChart',
              title: 'Revenue to Profit',
              categories: ['Revenue', 'COGS', 'Operating Expenses', 'Other', 'Net Profit'],
              style: { positiveColor: '#10B981', negativeColor: '#EF4444' }
            },
            {
              type: 'table',
              title: 'Monthly Financial Summary',
              columns: ['month', 'revenue', 'expenses', 'gross_profit', 'net_profit', 'margins']
            }
          ],
          layout: 'report',
          theme: 'professional',
          title: 'Financial Performance Dashboard'
        }
      }
    })

    // Customer Analytics Dashboard
    this.register({
      name: 'customer-analytics',
      description: 'Customer behavior, retention, and lifetime value analysis',
      keywords: ['customer', 'retention', 'ltv', 'churn', 'cohort', 'analytics'],
      requiredDataSources: ['database'],
      optionalDataSources: ['shopify', 'stripe'],
      build: (params) => {
        const pipeline = new DataPipelineBuilder()
        
        // Customer data
        const customersId = pipeline.addDatabaseSource('customers')
        const ordersId = pipeline.addDatabaseSource('orders')
        
        // Join customer and order data
        const customerOrdersId = pipeline.addJoin(
          customersId,
          ordersId,
          'id',
          'customer_id'
        )
        
        // Calculate customer metrics
        const metricsId = pipeline.addAggregation(customerOrdersId, ['customer_id'], [
          { column: 'order_total', function: 'sum' },
          { column: 'order_id', function: 'count' },
          { column: 'order_date', function: 'max' }
        ])
        
        // Cohort analysis
        const cohortId = pipeline.addTransform(metricsId, 'cohort', {
          dateColumn: 'first_order_date',
          metricColumn: 'customer_id',
          aggregation: 'count'
        })
        
        pipeline.addOutput(metricsId, 'table')
        pipeline.addOutput(cohortId, 'chart')
        
        return {
          pipeline: pipeline.getPipeline(),
          visualizations: [
            {
              type: 'kpiCard',
              title: 'Total Customers',
              metric: 'customer_id',
              aggregation: 'count'
            },
            {
              type: 'kpiCard',
              title: 'Avg LTV',
              metric: 'lifetime_value',
              aggregation: 'avg',
              format: 'currency'
            },
            {
              type: 'kpiCard',
              title: 'Retention Rate',
              metric: 'retention_rate',
              aggregation: 'avg',
              format: 'percentage'
            },
            {
              type: 'kpiCard',
              title: 'Churn Rate',
              metric: 'churn_rate',
              aggregation: 'avg',
              format: 'percentage'
            },
            {
              type: 'cohortChart',
              title: 'Retention Cohorts',
              xAxis: 'cohort_month',
              yAxis: 'months_since_signup',
              value: 'retention_percentage'
            },
            {
              type: 'histogram',
              title: 'Customer Value Distribution',
              xAxis: 'lifetime_value',
              bins: 20
            },
            {
              type: 'lineChart',
              title: 'Customer Growth',
              xAxis: 'month',
              yAxis: ['new_customers', 'churned_customers', 'net_growth']
            },
            {
              type: 'table',
              title: 'Top Customers',
              columns: ['customer_name', 'lifetime_value', 'orders', 'last_order_date'],
              style: { sortBy: 'lifetime_value', sortOrder: 'desc', limit: 100 }
            }
          ],
          layout: 'analytics',
          theme: 'modern',
          title: 'Customer Analytics Dashboard'
        }
      }
    })
  }

  // Register a custom template
  static register(template: SemanticTemplate) {
    this.templates.set(template.name, template)
  }

  // Get template by name
  static get(name: string): SemanticTemplate | undefined {
    return this.templates.get(name)
  }

  // Find templates matching keywords
  static find(query: string): SemanticTemplate[] {
    const queryLower = query.toLowerCase()
    const matches: SemanticTemplate[] = []
    
    this.templates.forEach(template => {
      const score = this.calculateMatchScore(template, queryLower)
      if (score > 0) {
        matches.push(template)
      }
    })
    
    // Sort by relevance
    return matches.sort((a, b) => 
      this.calculateMatchScore(b, queryLower) - this.calculateMatchScore(a, queryLower)
    )
  }

  // Calculate match score for ranking
  private static calculateMatchScore(template: SemanticTemplate, query: string): number {
    let score = 0
    
    // Check name match
    if (template.name.toLowerCase().includes(query)) {
      score += 10
    }
    
    // Check description match
    if (template.description.toLowerCase().includes(query)) {
      score += 5
    }
    
    // Check keyword matches
    template.keywords.forEach(keyword => {
      if (query.includes(keyword) || keyword.includes(query)) {
        score += 3
      }
    })
    
    return score
  }

  // Build dashboard from template
  static buildDashboard(
    templateName: string,
    params: any,
    orchestrator: DashboardOrchestrator
  ): boolean {
    const template = this.templates.get(templateName)
    if (!template) {
      return false
    }
    
    const definition = template.build(params)
    
    // Clear existing dashboard
    orchestrator.clear()
    
    // Set theme
    if (definition.theme) {
      orchestrator.setTheme(definition.theme as 'light' | 'dark')
    }
    
    // Add title
    if (definition.title) {
      orchestrator.addVisualization('title', {
        title: definition.title,
        x: 20,
        y: 20,
        width: 1560,
        height: 60
      })
    }
    
    // Create visualizations
    const layoutEngine = new LayoutEngine()
    const layoutItems: import('./layout-engine').LayoutItem[] = definition.visualizations.map((viz, index) => {
      const mappedType = viz.type && typeof viz.type === 'string'
        ? (viz.type.includes('Card')
            ? ('kpi' as const)
            : (viz.type.includes('able') ? ('table' as const) : ('chart' as const)))
        : ('chart' as const)

      return {
        id: `viz-${index}`,
        type: mappedType,
        priority: 10 - index,
        width: Number(viz.width ?? 400),
        height: Number(viz.height ?? 300)
      }
    })
    
    const positions = layoutEngine.arrangeItems(layoutItems)
    
    // Add visualizations with calculated positions
    definition.visualizations.forEach((viz, index) => {
      const pos = positions.get(`viz-${index}`)
      if (pos) {
        orchestrator.addVisualization(viz.type, {
          ...viz,
          x: pos.x,
          y: pos.y + 100, // Account for title
          width: pos.width,
          height: pos.height
        })
      }
    })
    
    return true
  }

  // List all available templates
  static listTemplates(): Array<{ name: string; description: string }> {
    return Array.from(this.templates.values()).map(t => ({
      name: t.name,
      description: t.description
    }))
  }
}

// Helper for pipeline transforms not in base builder
interface TransformNode {
  addTransform(inputId: string, operation: string, config: any): string
}

// Extend DataPipelineBuilder with additional transforms
declare module './data-pipeline-builder' {
  interface DataPipelineBuilder {
    addTransform(inputNodeId: string, operation: string, config: any): string
    addUnion(leftNodeId: string, rightNodeId: string): string
    addStripeSource(resource?: 'payments' | 'charges' | 'invoices'): string
  }
}