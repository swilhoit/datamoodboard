/**
 * Visualization Factory
 * Automatically selects and configures appropriate visualizations based on data characteristics
 */

export interface DataSchema {
  columns: Array<{
    name: string
    type: 'number' | 'string' | 'date' | 'boolean'
    cardinality?: number // Number of unique values
    min?: number
    max?: number
    sample?: any[]
  }>
  rowCount: number
}

export interface VisualizationConfig {
  type: string
  title?: string
  xAxis?: string
  yAxis?: string | string[]
  series?: string[]
  groupBy?: string
  aggregation?: string
  style?: any
}

export class VisualizationFactory {
  
  // Analyze data and recommend visualizations
  static recommendVisualizations(data: any[], intent?: string): VisualizationConfig[] {
    const schema = this.analyzeSchema(data)
    const recommendations: VisualizationConfig[] = []
    
    // Detect data patterns
    const hasTimeSeries = this.hasTimeSeriesData(schema)
    const hasCategorical = this.hasCategoricalData(schema)
    const hasNumerical = this.hasNumericalData(schema)
    const hasGeographical = this.hasGeographicalData(schema)
    
    // Time series patterns
    if (hasTimeSeries && hasNumerical) {
      const dateCol = schema.columns.find(c => c.type === 'date')!
      const numCols = schema.columns.filter(c => c.type === 'number')
      
      recommendations.push({
        type: 'lineChart',
        title: 'Trend Over Time',
        xAxis: dateCol.name,
        yAxis: numCols.map(c => c.name),
        style: { smooth: true, showPoints: false }
      })
      
      if (numCols.length > 1) {
        recommendations.push({
          type: 'areaChart',
          title: 'Stacked Metrics',
          xAxis: dateCol.name,
          series: numCols.map(c => c.name),
          style: { stacked: true }
        })
      }
    }
    
    // Categorical comparisons
    if (hasCategorical && hasNumerical) {
      const catCol = this.getBestCategoricalColumn(schema)
      const numCol = this.getBestNumericalColumn(schema)
      
      if (catCol && numCol) {
        // Bar chart for categories
        recommendations.push({
          type: 'barChart',
          title: `${numCol.name} by ${catCol.name}`,
          xAxis: catCol.name,
          yAxis: numCol.name,
          style: { orientation: catCol.cardinality! > 5 ? 'horizontal' : 'vertical' }
        })
        
        // Pie chart for proportions (if not too many categories)
        if (catCol.cardinality! <= 8) {
          recommendations.push({
            type: 'pieChart',
            title: `${catCol.name} Distribution`,
            groupBy: catCol.name,
            aggregation: 'sum',
            style: { showLabels: true, showLegend: true }
          })
        }
      }
    }
    
    // Correlation patterns
    const numCols = schema.columns.filter(c => c.type === 'number')
    if (numCols.length >= 2) {
      recommendations.push({
        type: 'scatterPlot',
        title: `${numCols[0].name} vs ${numCols[1].name}`,
        xAxis: numCols[0].name,
        yAxis: numCols[1].name,
        style: { showTrendline: true }
      })
    }
    
    // Distribution patterns
    if (hasNumerical && schema.rowCount > 20) {
      const numCol = this.getBestNumericalColumn(schema)
      if (numCol) {
        recommendations.push({
          type: 'histogram',
          title: `${numCol.name} Distribution`,
          xAxis: numCol.name,
          style: { bins: 20 }
        })
      }
    }
    
    // KPI/Metrics cards
    if (hasNumerical) {
      const kpiCols = numCols.slice(0, 4)
      recommendations.push({
        type: 'kpiCard',
        title: 'Key Metrics',
        series: kpiCols.map(c => c.name),
        style: { layout: 'horizontal', showTrend: hasTimeSeries }
      })
    }
    
    // Table as fallback
    recommendations.push({
      type: 'table',
      title: 'Data Table',
      style: { 
        sortable: true, 
        filterable: true,
        pagination: schema.rowCount > 50
      }
    })
    
    // Filter by intent if provided
    if (intent) {
      return this.filterByIntent(recommendations, intent)
    }
    
    return recommendations
  }

  // Create visualization based on data type
  static createVisualization(
    data: any[],
    type: string,
    config?: Partial<VisualizationConfig>
  ): any {
    const schema = this.analyzeSchema(data)
    
    switch (type) {
      case 'lineChart':
        return this.createLineChart(data, schema, config)
      case 'barChart':
        return this.createBarChart(data, schema, config)
      case 'pieChart':
        return this.createPieChart(data, schema, config)
      case 'scatterPlot':
        return this.createScatterPlot(data, schema, config)
      case 'areaChart':
        return this.createAreaChart(data, schema, config)
      case 'table':
        return this.createTable(data, schema, config)
      case 'kpiCard':
        return this.createKPICard(data, schema, config)
      default:
        return this.createTable(data, schema, config)
    }
  }

  // Schema analysis
  private static analyzeSchema(data: any[]): DataSchema {
    if (!data || data.length === 0) {
      return { columns: [], rowCount: 0 }
    }
    
    const sample = data.slice(0, 100)
    const columns: DataSchema['columns'] = []
    
    // Analyze each column
    const keys = Object.keys(data[0])
    keys.forEach(key => {
      const values = sample.map(row => row[key]).filter(v => v != null)
      const uniqueValues = new Set(values)
      
      const column: any = {
        name: key,
        cardinality: uniqueValues.size,
        sample: Array.from(uniqueValues).slice(0, 5)
      }
      
      // Detect type
      if (this.isDateColumn(values)) {
        column.type = 'date'
      } else if (this.isNumericColumn(values)) {
        column.type = 'number'
        const nums = values.map(Number)
        column.min = Math.min(...nums)
        column.max = Math.max(...nums)
      } else if (this.isBooleanColumn(values)) {
        column.type = 'boolean'
      } else {
        column.type = 'string'
      }
      
      columns.push(column)
    })
    
    return { columns, rowCount: data.length }
  }

  // Type detection helpers
  private static isDateColumn(values: any[]): boolean {
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}/ // DD-MM-YYYY
    ]
    
    return values.some(v => {
      const str = String(v)
      return datePatterns.some(pattern => pattern.test(str)) ||
             !isNaN(Date.parse(str))
    })
  }

  private static isNumericColumn(values: any[]): boolean {
    return values.every(v => !isNaN(Number(v)))
  }

  private static isBooleanColumn(values: any[]): boolean {
    const boolValues = new Set(['true', 'false', '1', '0', 'yes', 'no'])
    return values.every(v => boolValues.has(String(v).toLowerCase()))
  }

  // Pattern detection
  private static hasTimeSeriesData(schema: DataSchema): boolean {
    return schema.columns.some(c => c.type === 'date')
  }

  private static hasCategoricalData(schema: DataSchema): boolean {
    return schema.columns.some(c => 
      c.type === 'string' && 
      c.cardinality! > 1 && 
      c.cardinality! < schema.rowCount * 0.5
    )
  }

  private static hasNumericalData(schema: DataSchema): boolean {
    return schema.columns.some(c => c.type === 'number')
  }

  private static hasGeographicalData(schema: DataSchema): boolean {
    const geoPatterns = ['country', 'state', 'city', 'region', 'lat', 'lon', 'zip']
    return schema.columns.some(c => 
      geoPatterns.some(pattern => c.name.toLowerCase().includes(pattern))
    )
  }

  // Column selection helpers
  private static getBestCategoricalColumn(schema: DataSchema) {
    return schema.columns
      .filter(c => c.type === 'string' && c.cardinality! > 1 && c.cardinality! <= 20)
      .sort((a, b) => (a.cardinality || 0) - (b.cardinality || 0))[0]
  }

  private static getBestNumericalColumn(schema: DataSchema) {
    return schema.columns
      .filter(c => c.type === 'number')
      .sort((a, b) => {
        // Prefer columns with more variation
        const aRange = (a.max || 0) - (a.min || 0)
        const bRange = (b.max || 0) - (b.min || 0)
        return bRange - aRange
      })[0]
  }

  // Intent filtering
  private static filterByIntent(
    recommendations: VisualizationConfig[],
    intent: string
  ): VisualizationConfig[] {
    const lower = intent.toLowerCase()
    
    if (lower.includes('trend') || lower.includes('time')) {
      return recommendations.filter(r => 
        ['lineChart', 'areaChart'].includes(r.type)
      )
    }
    
    if (lower.includes('compare') || lower.includes('versus')) {
      return recommendations.filter(r => 
        ['barChart', 'scatterPlot'].includes(r.type)
      )
    }
    
    if (lower.includes('distribution') || lower.includes('proportion')) {
      return recommendations.filter(r => 
        ['pieChart', 'histogram'].includes(r.type)
      )
    }
    
    if (lower.includes('table') || lower.includes('details')) {
      return recommendations.filter(r => r.type === 'table')
    }
    
    return recommendations
  }

  // Visualization creators
  private static createLineChart(
    data: any[],
    schema: DataSchema,
    config?: Partial<VisualizationConfig>
  ) {
    const dateCol = schema.columns.find(c => c.type === 'date')
    const numCols = schema.columns.filter(c => c.type === 'number')
    
    return {
      type: 'lineChart',
      data,
      config: {
        xAxis: config?.xAxis || dateCol?.name || schema.columns[0].name,
        yAxis: config?.yAxis || numCols[0]?.name,
        title: config?.title || 'Line Chart',
        style: {
          smooth: true,
          showGrid: true,
          showLegend: numCols.length > 1,
          ...config?.style
        }
      }
    }
  }

  private static createBarChart(
    data: any[],
    schema: DataSchema,
    config?: Partial<VisualizationConfig>
  ) {
    const catCol = this.getBestCategoricalColumn(schema)
    const numCol = this.getBestNumericalColumn(schema)
    
    return {
      type: 'barChart',
      data,
      config: {
        xAxis: config?.xAxis || catCol?.name || schema.columns[0].name,
        yAxis: config?.yAxis || numCol?.name || schema.columns[1].name,
        title: config?.title || 'Bar Chart',
        style: {
          orientation: 'vertical',
          showValues: true,
          ...config?.style
        }
      }
    }
  }

  private static createPieChart(
    data: any[],
    schema: DataSchema,
    config?: Partial<VisualizationConfig>
  ) {
    const catCol = this.getBestCategoricalColumn(schema)
    const numCol = this.getBestNumericalColumn(schema)
    
    // Aggregate data for pie chart
    const aggregated = this.aggregateData(
      data,
      catCol?.name || schema.columns[0].name,
      numCol?.name || 'count'
    )
    
    return {
      type: 'pieChart',
      data: aggregated,
      config: {
        title: config?.title || 'Pie Chart',
        labelField: catCol?.name || schema.columns[0].name,
        valueField: numCol?.name || 'value',
        style: {
          showLabels: true,
          showLegend: true,
          ...config?.style
        }
      }
    }
  }

  private static createScatterPlot(
    data: any[],
    schema: DataSchema,
    config?: Partial<VisualizationConfig>
  ) {
    const numCols = schema.columns.filter(c => c.type === 'number')
    
    return {
      type: 'scatterPlot',
      data,
      config: {
        xAxis: config?.xAxis || numCols[0]?.name,
        yAxis: config?.yAxis || numCols[1]?.name,
        title: config?.title || 'Scatter Plot',
        style: {
          showTrendline: false,
          pointSize: 5,
          ...config?.style
        }
      }
    }
  }

  private static createAreaChart(
    data: any[],
    schema: DataSchema,
    config?: Partial<VisualizationConfig>
  ) {
    const dateCol = schema.columns.find(c => c.type === 'date')
    const numCols = schema.columns.filter(c => c.type === 'number')
    
    return {
      type: 'areaChart',
      data,
      config: {
        xAxis: config?.xAxis || dateCol?.name || schema.columns[0].name,
        series: config?.series || numCols.map(c => c.name),
        title: config?.title || 'Area Chart',
        style: {
          stacked: true,
          smooth: true,
          opacity: 0.7,
          ...config?.style
        }
      }
    }
  }

  private static createTable(
    data: any[],
    schema: DataSchema,
    config?: Partial<VisualizationConfig>
  ) {
    return {
      type: 'table',
      data,
      config: {
        title: config?.title || 'Data Table',
        columns: schema.columns.map(c => ({
          name: c.name,
          type: c.type,
          sortable: true,
          filterable: true
        })),
        style: {
          striped: true,
          hover: true,
          pagination: data.length > 50,
          pageSize: 50,
          ...config?.style
        }
      }
    }
  }

  private static createKPICard(
    data: any[],
    schema: DataSchema,
    config?: Partial<VisualizationConfig>
  ) {
    const numCols = schema.columns.filter(c => c.type === 'number').slice(0, 4)
    
    const metrics = numCols.map(col => {
      const values = data.map(row => Number(row[col.name]) || 0)
      const current = values[values.length - 1]
      const previous = values[values.length - 2] || current
      const change = ((current - previous) / previous) * 100
      
      return {
        label: col.name,
        value: current,
        change: isFinite(change) ? change : 0,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
      }
    })
    
    return {
      type: 'kpiCard',
      data: metrics,
      config: {
        title: config?.title || 'Key Metrics',
        style: {
          layout: 'grid',
          showTrend: true,
          showChange: true,
          ...config?.style
        }
      }
    }
  }

  // Helper to aggregate data
  private static aggregateData(data: any[], groupBy: string, valueField: string): any[] {
    const groups = new Map<string, number>()
    
    data.forEach(row => {
      const key = row[groupBy]
      const value = valueField === 'count' ? 1 : Number(row[valueField]) || 0
      groups.set(key, (groups.get(key) || 0) + value)
    })
    
    return Array.from(groups.entries()).map(([key, value]) => ({
      [groupBy]: key,
      value
    }))
  }
}