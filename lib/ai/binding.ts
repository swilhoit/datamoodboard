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
  let found = tables.find(t => String(t.tableName || '').toLowerCase() === n || String(t.name || '').toLowerCase() === n)
  if (found) return found
  // fuzzy contains
  found = tables.find(t => String(t.tableName || t.name || '').toLowerCase().includes(n))
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


