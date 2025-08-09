import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptString } from '@/lib/crypto'

type ShopifyQueryConfig = {
  selectColumns?: string[]
  filters?: Array<{ field: string; operator: string; value: string }>
  sortBy?: { field: string; direction: 'asc' | 'desc' } | null
  limit?: number
  dateRange?:
    | { field: 'created_at' | 'updated_at'; preset: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_month' | 'last_month' | 'this_year' | 'all_time' }
    | { field: 'created_at' | 'updated_at'; preset: 'custom'; from?: string; to?: string }
}

function computeDateRange(preset: ShopifyQueryConfig['dateRange']): { min?: string; max?: string } {
  if (!preset) return {}
  if ('preset' in preset && preset.preset === 'custom') {
    return { min: preset.from, max: preset.to }
  }
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)
  switch (preset.preset) {
    case 'last_7_days':
      start.setDate(now.getDate() - 7)
      break
    case 'last_30_days':
      start.setDate(now.getDate() - 30)
      break
    case 'last_90_days':
      start.setDate(now.getDate() - 90)
      break
    case 'this_month':
      start.setDate(1)
      break
    case 'last_month': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1)
      d.setMonth(d.getMonth() - 1)
      start.setTime(d.getTime())
      end.setTime(new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime())
      break
    }
    case 'this_year':
      start.setMonth(0, 1)
      break
    case 'all_time':
      return {}
  }
  return { min: start.toISOString(), max: end.toISOString() }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      shopDomain,
      apiKeyId,
      accessToken: directAccessToken,
      resource = 'orders',
      query = {},
    }: { shopDomain: string; apiKeyId?: string; accessToken?: string; resource?: string; query?: ShopifyQueryConfig } = body

    if (!shopDomain) {
      return NextResponse.json({ success: false, error: 'Missing shopDomain' }, { status: 400 })
    }

    let accessToken = directAccessToken
    if (!accessToken) {
      if (!apiKeyId) return NextResponse.json({ success: false, error: 'Missing apiKeyId or accessToken' }, { status: 400 })
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      const { data: keyRow, error } = await supabase
        .from('api_keys')
        .select('encrypted_key')
        .eq('id', apiKeyId)
        .eq('user_id', user.id)
        .single()
      if (error || !keyRow) throw new Error('API key not found')
      accessToken = decryptString(keyRow.encrypted_key)
    }

    const version = '2024-04'
    let endpoint = ''
    switch (resource) {
      case 'products': endpoint = `products.json`; break
      case 'customers': endpoint = `customers.json`; break
      case 'inventory': endpoint = `inventory_levels.json`; break
      case 'fulfillments': endpoint = `fulfillments.json`; break
      case 'orders':
      default:
        endpoint = `orders.json`
        break
    }

    const url = new URL(`https://${shopDomain}/admin/api/${version}/${endpoint}`)

    // Basic params
    if (resource === 'orders') {
      url.searchParams.set('status', 'any')
    }
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 250) : 50
    url.searchParams.set('limit', String(limit))

    // Sorting
    if (query.sortBy && query.sortBy.field) {
      const dir = query.sortBy.direction === 'desc' ? 'desc' : 'asc'
      url.searchParams.set('order', `${query.sortBy.field} ${dir}`)
    }

    // Date range
    if (query.dateRange && 'field' in query.dateRange) {
      const { min, max } = computeDateRange(query.dateRange)
      const field = query.dateRange.field
      if (min) url.searchParams.set(`${field}_min`, min)
      if (max && (query.dateRange as any).preset === 'custom') url.searchParams.set(`${field}_max`, max)
    }

  // Beginner-friendly filters mapped to real REST params (whitelisted per resource)
  if (Array.isArray(query.filters) && query.filters.length > 0) {
    const applyEquals = (key: string, value: string) => {
      if (!value) return
      url.searchParams.set(key, value)
    }
    for (const f of query.filters) {
      const field = (f.field || '').trim()
      const value = String(f.value ?? '').trim()
      const isEquals = (f.operator || 'equals') === 'equals'
      if (!field || !isEquals) continue
      if (resource === 'orders') {
        // Supported: financial_status, fulfillment_status, status, email
        if (['financial_status','fulfillment_status','status','email'].includes(field)) {
          applyEquals(field, value)
        }
      } else if (resource === 'products') {
        // Supported: vendor, product_type, status
        if (['vendor','product_type','status'].includes(field)) {
          applyEquals(field, value)
        }
      } else if (resource === 'customers') {
        // Supported: state
        if (['state'].includes(field)) {
          applyEquals(field, value)
        }
      }
      // inventory and fulfillments have limited filtering; skipping here for simplicity
    }
  }

    // Field selection (where supported)
    if (Array.isArray(query.selectColumns) && query.selectColumns.length > 0 && resource !== 'inventory') {
      url.searchParams.set('fields', query.selectColumns.join(','))
    }

    const resp = await fetch(url.toString(), {
      headers: {
        'X-Shopify-Access-Token': String(accessToken),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })
    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`Shopify API error: ${resp.status} ${text}`)
    }
    const json = await resp.json()

    // Extract array by resource
    const collectionKey =
      resource === 'orders' ? 'orders' :
      resource === 'products' ? 'products' :
      resource === 'customers' ? 'customers' :
      resource === 'inventory' ? 'inventory_levels' :
      resource === 'fulfillments' ? 'fulfillments' : 'orders'

    const items: any[] = Array.isArray(json[collectionKey]) ? json[collectionKey] : []

    // Project to selected columns if provided, else pick a sane default
    const pickCols = (row: any) => {
      const cols = (query.selectColumns && query.selectColumns.length > 0)
        ? query.selectColumns
        : (
          resource === 'orders'
            ? ['id','order_number','email','total_price','financial_status','created_at','currency']
            : resource === 'products'
              ? ['id','title','vendor','status','created_at','updated_at']
              : resource === 'customers'
                ? ['id','email','first_name','last_name','orders_count','total_spent','created_at']
                : resource === 'inventory'
                  ? ['inventory_item_id','sku','location_id','available','updated_at']
                  : ['id']
        )
      const out: Record<string, any> = {}
      for (const c of cols) {
        const val = row?.[c]
        out[c] = typeof val === 'number' ? val : typeof val === 'string' ? val : Array.isArray(val) || typeof val === 'object' ? JSON.stringify(val) : val
      }
      return out
    }

    const data = items.map(pickCols)

    // Infer schema types crudely
    const schema = Object.keys(data[0] || {}).map((name) => {
      const sample = data[0]?.[name]
      let type = 'TEXT'
      if (typeof sample === 'number') type = 'NUMBER'
      else if (typeof sample === 'string') {
        if (!isNaN(Date.parse(sample))) type = 'DATE'
        else if (/^\d+(?:\.\d+)?$/.test(sample)) type = 'NUMBER'
        else type = 'TEXT'
      }
      return { name, type }
    })

    return NextResponse.json({ success: true, data, schema, rowCount: data.length })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to import from Shopify' }, { status: 500 })
  }
}


