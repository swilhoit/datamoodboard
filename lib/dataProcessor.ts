export function processTransformNode(
  nodeType: string,
  config: any,
  inputData: any[],
  secondaryData?: any[]
): any[] {
  if (!inputData || inputData.length === 0) return []

  switch (nodeType) {
    case 'filter':
      return filterData(inputData, config)
    
    case 'select':
      return selectColumns(inputData, config)
    
    case 'aggregate':
      return aggregateData(inputData, config)
    
    case 'join':
      if (!secondaryData) return inputData
      return joinData(inputData, secondaryData, config)
    
    case 'union':
      if (!secondaryData) return inputData
      return unionData(inputData, secondaryData, config)
    
    case 'pivot':
      return pivotData(inputData, config)
    
    case 'merge':
      if (!secondaryData) return inputData
      return mergeData(inputData, secondaryData, config)

    case 'extractMonth':
      return extractMonth(inputData, config)

    case 'calculate':
      return calculateExpressions(inputData, config)

    case 'cohort':
      return cohortAnalysis(inputData, config)
    
    case 'sql':
      // For SQL, we'd need a SQL parser/executor
      // For now, just return the input
      return inputData
    
    default:
      return inputData
  }
}

function filterData(data: any[], config: any): any[] {
  const { column, operator, value } = config
  if (!column || !operator || value === undefined) return data

  return data.filter(row => {
    const cellValue = row[column]
    
    switch (operator) {
      case '=':
        return cellValue == value
      case '!=':
        return cellValue != value
      case '>':
        return Number(cellValue) > Number(value)
      case '<':
        return Number(cellValue) < Number(value)
      case '>=':
        return Number(cellValue) >= Number(value)
      case '<=':
        return Number(cellValue) <= Number(value)
      case 'contains':
        return String(cellValue).toLowerCase().includes(String(value).toLowerCase())
      case 'starts with':
        return String(cellValue).toLowerCase().startsWith(String(value).toLowerCase())
      case 'ends with':
        return String(cellValue).toLowerCase().endsWith(String(value).toLowerCase())
      default:
        return true
    }
  })
}

function extractMonth(data: any[], config: any): any[] {
  const { dateColumn, outputColumn = 'month' } = config || {}
  if (!dateColumn) return data
  return data.map((row: any) => {
    const d = new Date(row[dateColumn])
    if (isNaN(d.getTime())) return { ...row, [outputColumn]: row[dateColumn] }
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { ...row, [outputColumn]: key }
  })
}

function calculateExpressions(data: any[], config: Record<string, string>): any[] {
  if (!config) return data
  return data.map((row) => {
    const next = { ...row }
    for (const [key, expr] of Object.entries(config)) {
      try {
        // Very simple and safe evaluator: only allow references to numeric fields and basic ops
        // Replace field references with values
        const replaced = expr.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, (name) => {
          const v = (row as any)[name]
          return typeof v === 'number' ? String(v) : '0'
        })
        // Evaluate using Function in a constrained manner
        // eslint-disable-next-line no-new-func
        const value = Function(`"use strict"; return (${replaced});`)()
        next[key] = Number.isFinite(value) ? value : null
      } catch {
        next[key] = null
      }
    }
    return next
  })
}

function cohortAnalysis(data: any[], config: any): any[] {
  // Placeholder basic cohort aggregation by month of a date column
  const { dateColumn = 'date', metricColumn } = config || {}
  if (!metricColumn) return data
  const groups = new Map<string, number>()
  data.forEach((row: any) => {
    const d = new Date(row[dateColumn])
    if (isNaN(d.getTime())) return
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    groups.set(key, (groups.get(key) || 0) + 1)
  })
  return Array.from(groups.entries()).map(([cohort_month, count]) => ({
    cohort_month,
    [metricColumn]: count,
  }))
}

function selectColumns(data: any[], config: any): any[] {
  const { columns } = config
  if (!columns) return data

  const columnList = columns.split(',').map((col: string) => col.trim())
  
  return data.map(row => {
    const newRow: any = {}
    columnList.forEach((col: string) => {
      if (row.hasOwnProperty(col)) {
        newRow[col] = row[col]
      }
    })
    return newRow
  })
}

function aggregateData(data: any[], config: any): any[] {
  const { groupBy, aggregations } = config
  if (!groupBy && !aggregations) return data

  const groups: { [key: string]: any[] } = {}
  
  // Group data
  if (groupBy) {
    const groupColumns = groupBy.split(',').map((col: string) => col.trim())
    
    data.forEach(row => {
      const key = groupColumns.map((col: string) => row[col]).join('|')
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(row)
    })
  } else {
    groups['all'] = data
  }

  // Aggregate groups
  const result: any[] = []
  Object.entries(groups).forEach(([key, groupData]) => {
    const aggregatedRow: any = {}
    
    // Add group by columns
    if (groupBy) {
      const groupColumns = groupBy.split(',').map((col: string) => col.trim())
      const keyParts = key.split('|')
      groupColumns.forEach((col: string, index: number) => {
        aggregatedRow[col] = keyParts[index]
      })
    }

    // Parse and apply aggregations
    if (aggregations) {
      // Simple parsing - in real app would need proper SQL parser
      const aggParts = aggregations.split(',')
      aggParts.forEach((agg: string) => {
        const match = agg.match(/(SUM|AVG|COUNT|MIN|MAX)\(([^)]+)\)(?:\s+as\s+(\w+))?/i)
        if (match) {
          const [, func, column, alias] = match
          const outputName = alias || `${func.toLowerCase()}_${column}`
          
          if (func.toUpperCase() === 'COUNT') {
            aggregatedRow[outputName] = groupData.length
          } else {
            const values = groupData.map(row => Number(row[column.trim()]) || 0)
            switch (func.toUpperCase()) {
              case 'SUM':
                aggregatedRow[outputName] = values.reduce((a, b) => a + b, 0)
                break
              case 'AVG':
                aggregatedRow[outputName] = values.reduce((a, b) => a + b, 0) / values.length
                break
              case 'MIN':
                aggregatedRow[outputName] = Math.min(...values)
                break
              case 'MAX':
                aggregatedRow[outputName] = Math.max(...values)
                break
            }
          }
        }
      })
    }

    result.push(aggregatedRow)
  })

  return result
}

function joinData(leftData: any[], rightData: any[], config: any): any[] {
  const { joinType = 'INNER', leftKey, rightKey } = config
  if (!leftKey || !rightKey) return leftData

  const result: any[] = []
  
  if (joinType === 'INNER' || joinType === 'LEFT') {
    leftData.forEach(leftRow => {
      const matches = rightData.filter(rightRow => 
        leftRow[leftKey] == rightRow[rightKey]
      )
      
      if (matches.length > 0) {
        matches.forEach(rightRow => {
          result.push({ ...leftRow, ...rightRow })
        })
      } else if (joinType === 'LEFT') {
        result.push(leftRow)
      }
    })
  }
  
  if (joinType === 'RIGHT') {
    rightData.forEach(rightRow => {
      const matches = leftData.filter(leftRow => 
        leftRow[leftKey] == rightRow[rightKey]
      )
      
      if (matches.length > 0) {
        matches.forEach(leftRow => {
          result.push({ ...leftRow, ...rightRow })
        })
      } else {
        result.push(rightRow)
      }
    })
  }
  
  if (joinType === 'FULL') {
    // Add all inner join results
    const innerResults = joinData(leftData, rightData, { ...config, joinType: 'INNER' })
    result.push(...innerResults)
    
    // Add unmatched left rows
    leftData.forEach(leftRow => {
      const hasMatch = rightData.some(rightRow => 
        leftRow[leftKey] == rightRow[rightKey]
      )
      if (!hasMatch) {
        result.push(leftRow)
      }
    })
    
    // Add unmatched right rows
    rightData.forEach(rightRow => {
      const hasMatch = leftData.some(leftRow => 
        leftRow[leftKey] == rightRow[rightKey]
      )
      if (!hasMatch) {
        result.push(rightRow)
      }
    })
  }
  
  return result
}

function unionData(data1: any[], data2: any[], config: any): any[] {
  const { type = 'UNION' } = config
  
  if (type === 'UNION') {
    // Remove duplicates
    const combined = [...data1, ...data2]
    const uniqueRows = new Map()
    combined.forEach(row => {
      const key = JSON.stringify(row)
      uniqueRows.set(key, row)
    })
    return Array.from(uniqueRows.values())
  } else {
    // UNION ALL - keep duplicates
    return [...data1, ...data2]
  }
}

function pivotData(data: any[], config: any): any[] {
  const { rows, columns, values, aggregation = 'SUM' } = config
  if (!rows || !columns || !values) return data

  const pivoted: { [key: string]: any } = {}
  const columnValues = new Set<string>()

  // Collect all unique column values
  data.forEach(row => {
    columnValues.add(row[columns])
  })

  // Group and aggregate
  data.forEach(row => {
    const rowKey = row[rows]
    const colKey = row[columns]
    const value = Number(row[values]) || 0

    if (!pivoted[rowKey]) {
      pivoted[rowKey] = { [rows]: rowKey }
    }

    if (!pivoted[rowKey][colKey]) {
      pivoted[rowKey][colKey] = []
    }

    pivoted[rowKey][colKey].push(value)
  })

  // Apply aggregation
  const result: any[] = []
  Object.values(pivoted).forEach(row => {
    const aggregatedRow: any = { [rows]: row[rows] }
    
    columnValues.forEach(col => {
      const values = row[col] || []
      if (values.length > 0) {
        switch (aggregation) {
          case 'SUM':
            aggregatedRow[col] = values.reduce((a: number, b: number) => a + b, 0)
            break
          case 'AVG':
            aggregatedRow[col] = values.reduce((a: number, b: number) => a + b, 0) / values.length
            break
          case 'COUNT':
            aggregatedRow[col] = values.length
            break
          case 'MIN':
            aggregatedRow[col] = Math.min(...values)
            break
          case 'MAX':
            aggregatedRow[col] = Math.max(...values)
            break
        }
      } else {
        aggregatedRow[col] = 0
      }
    })
    
    result.push(aggregatedRow)
  })

  return result
}

function mergeData(data1: any[], data2: any[], config: any): any[] {
  const { mergeType = 'inner' } = config
  if (mergeType === 'inner') {
    return data1.map((item, i) => ({ ...item, ...data2[i] }))
  }
  // outer merge
  const result = []
  const maxLen = Math.max(data1.length, data2.length)
  for (let i = 0; i < maxLen; i++) {
    result.push({ ...data1[i], ...data2[i] })
  }
  return result
}