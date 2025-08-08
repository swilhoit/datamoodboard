import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptString } from '@/lib/crypto'

export async function POST(req: NextRequest) {
  try {
    const { shopDomain, apiKeyId } = await req.json()
    if (!shopDomain || !apiKeyId) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    // Get encrypted token
    const { data: keyRow, error } = await supabase
      .from('api_keys')
      .select('encrypted_key')
      .eq('id', apiKeyId)
      .eq('user_id', user.id)
      .single()
    if (error || !keyRow) throw new Error('API key not found')

    const accessToken = decryptString(keyRow.encrypted_key)

    // Fetch recent orders (first page)
    const url = `https://${shopDomain}/admin/api/2024-04/orders.json?status=any&limit=50`
    const resp = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
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
    const orders = Array.isArray(json.orders) ? json.orders : []

    // Normalize data to a flat table for the editor
    const data = orders.map((o: any) => ({
      id: o.id,
      order_number: o.order_number,
      email: o.email,
      total_price: parseFloat(o.total_price),
      financial_status: o.financial_status,
      created_at: o.created_at?.slice(0, 10),
      currency: o.currency,
    }))

    const schema = [
      { name: 'id', type: 'INTEGER' },
      { name: 'order_number', type: 'VARCHAR(50)' },
      { name: 'email', type: 'VARCHAR(255)' },
      { name: 'total_price', type: 'DECIMAL(10,2)' },
      { name: 'financial_status', type: 'VARCHAR(50)' },
      { name: 'created_at', type: 'DATE' },
      { name: 'currency', type: 'VARCHAR(10)' },
    ]

    return NextResponse.json({ success: true, data, schema, rowCount: data.length })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to import from Shopify' }, { status: 500 })
  }
}


