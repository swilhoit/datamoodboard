type Table = { id?: string; tableName?: string; name?: string; schema?: Array<{ name: string; type?: string }>; data?: any[]; sourceType?: string }

export function resolveTable(context: any, opts: { name?: string; id?: string }): Table | null {
  const name = opts.name
  const id = opts.id
  const tables: Table[] = context?.currentState?.dataTables || []
  if (!tables || tables.length === 0) return null
  if (id) {
    const byId = tables.find(t => String(t.id || '').toLowerCase() === String(id).toLowerCase())
    if (byId) return byId
  }
  if (!name) return null
  const n = String(name).toLowerCase().trim()
  
  // exact match on tableName or name
  let found = tables.find(t => 
    String(t.tableName || '').toLowerCase() === n || 
    String(t.name || '').toLowerCase() === n
  )
  if (found) return found
  
  // Try without underscores/hyphens (sales_data matches sales-data or "sales data")
  const normalized = n.replace(/[-_\s]+/g, '')
  found = tables.find(t => {
    const tName = String(t.tableName || t.name || '').toLowerCase().replace(/[-_\s]+/g, '')
    return tName === normalized
  })
  if (found) return found
  
  // fuzzy contains
  found = tables.find(t => String(t.tableName || t.name || '').toLowerCase().includes(n))
  if (found) return found
  
  // fuzzy contains with normalization
  found = tables.find(t => {
    const tName = String(t.tableName || t.name || '').toLowerCase().replace(/[-_\s]+/g, '')
    return tName.includes(normalized)
  })
  
  return found || null
}

export function inferBindings(schema: Array<{ name: string; type?: string }> = [], hint: { xField?: string; yField?: string; series?: string; agg?: string } = {}) {
  const lower = (s: string | undefined) => (s || '').toLowerCase()
  const findBy = (rx: RegExp) => schema.find(col => rx.test(lower(col.name)))?.name
  const xField = hint.xField || findBy(/date|time|day|month|period|timestamp/)
  const yField = hint.yField || findBy(/value|amount|total|count|price|usd|number|metric|score/)
  const series = hint.series || findBy(/category|segment|type|group|region|product|name/)
  const agg = hint.agg || 'none'
  return { xField: xField || 'x', yField: yField || 'value', series, agg }
}

export function materializeDataset(table: Table, bindings: { xField: string; yField: string; series?: string; agg?: string }, opts: { limit?: number } = {}) {
  const rows = Array.isArray(table?.data) ? table.data : []
  const limit = Math.max(1, Math.min(10000, opts.limit || 1000))
  const result: any[] = []
  for (let i = 0; i < rows.length && i < limit; i++) {
    const r: any = rows[i]
    const nameRaw = r[bindings.xField] ?? r.name ?? r.label ?? i
    const name = typeof nameRaw === 'string' || typeof nameRaw === 'number' ? nameRaw : String(nameRaw)
    const yRaw = r[bindings.yField] ?? r.value ?? 0
    const value = typeof yRaw === 'number' ? yRaw : Number(yRaw)
    const point: any = { name, value }
    if (bindings.series && r[bindings.series] !== undefined) point.series = r[bindings.series]
    result.push(point)
  }
  return result
}

export function analyzeSchemaAndData(table: Table) {
  const rows = Array.isArray(table?.data) ? table.data : []
  const schema = Array.isArray(table?.schema) ? table.schema : []
  const columns: string[] = schema.length
    ? schema.map(c => c.name)
    : (rows[0] ? Object.keys(rows[0]) : [])
  const stats = columns.map(col => {
    let numericCount = 0
    let dateCount = 0
    let uniques = new Set<any>()
    let sum = 0
    let sumSq = 0
    let n = 0
    for (let i = 0; i < Math.min(rows.length, 1000); i++) {
      const v = rows[i]?.[col]
      uniques.add(v)
      const num = Number(v)
      if (Number.isFinite(num)) {
        numericCount++
        n++
        sum += num
        sumSq += num * num
      }
      if (v && (typeof v === 'string' || typeof v === 'number')) {
        const d = Date.parse(String(v))
        if (!Number.isNaN(d)) dateCount++
      }
    }
    const variance = n > 1 ? sumSq / n - (sum / n) ** 2 : 0
    return { col, numericCount, dateCount, uniqueCount: uniques.size, variance }
  })
  return { rows, schema, columns, stats }
}

export function pickBestBindings(table: Table, hint: { xField?: string; yField?: string; series?: string }) {
  const { stats } = analyzeSchemaAndData(table)
  const byName = (name?: string) => (name ? stats.find(s => s.col.toLowerCase() === name.toLowerCase())?.col : undefined)
  let x = byName(hint.xField)
  let y = byName(hint.yField)
  if (!x) {
    // Prefer date-like
    x = stats.find(s => s.dateCount > 3)?.col
  }
  if (!x) {
    // Next prefer categorical (moderate uniques)
    x = stats
      .filter(s => s.numericCount < 3)
      .sort((a, b) => a.uniqueCount - b.uniqueCount)[0]?.col
  }
  if (!y) {
    // Prefer numeric with variance
    y = stats
      .filter(s => s.numericCount > 3)
      .sort((a, b) => b.variance - a.variance)[0]?.col
  }
  // Fallbacks
  if (!x && stats.length) x = stats[0].col
  if (!y && stats.length > 1) y = stats[1].col
  return { xField: x, yField: y, series: hint.series }
}

export function buildRowsForAxes(table: Table, bindings: { xField?: string; yField?: string; series?: string }, limit: number = 1000) {
  const rows = Array.isArray(table?.data) ? table.data : []
  const out: any[] = []
  for (let i = 0; i < rows.length && i < limit; i++) {
    const r = rows[i]
    const x = bindings.xField ? r?.[bindings.xField] : undefined
    const y = bindings.yField ? r?.[bindings.yField] : undefined
    if (x === undefined || y === undefined) continue
    const row: any = {}
    row[bindings.xField!] = x
    row[bindings.yField!] = typeof y === 'number' ? y : Number(y)
    if (bindings.series && r?.[bindings.series] !== undefined) row[bindings.series] = r[bindings.series]
    if (Number.isFinite(row[bindings.yField!])) out.push(row)
  }
  return out
}


