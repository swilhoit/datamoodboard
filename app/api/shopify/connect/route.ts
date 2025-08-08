import { NextRequest, NextResponse } from 'next/server'
import { encryptString } from '@/lib/crypto'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { shopDomain, accessToken } = body
    if (!shopDomain || !accessToken) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const encrypted = encryptString(accessToken)
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        service: 'shopify',
        key_name: shopDomain,
        encrypted_key: encrypted,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, apiKeyId: data.id })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to connect Shopify' }, { status: 500 })
  }
}


