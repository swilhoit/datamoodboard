import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get shop domain from query params
    const searchParams = request.nextUrl.searchParams
    const shop = searchParams.get('shop')
    
    if (!shop || !shop.includes('.myshopify.com')) {
      return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 })
    }

    const SHOPIFY_APP_API_KEY = process.env.SHOPIFY_APP_API_KEY
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/shopify/callback`
    
    // Check if OAuth is configured
    if (!SHOPIFY_APP_API_KEY) {
      console.error('SHOPIFY_APP_API_KEY is not configured')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/?error=oauth_not_configured&provider=shopify`
      )
    }
    
    // Generate nonce for security
    const nonce = crypto.randomBytes(16).toString('base64')
    
    // Store state in database
    const { error } = await supabase
      .from('oauth_states')
      .insert({
        user_id: user.id,
        state: nonce,
        provider: 'shopify',
        metadata: { shop },
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to store OAuth state:', error)
    }

    // Required Shopify scopes
    const scopes = [
      'read_products',
      'read_orders',
      'read_customers',
      'read_inventory',
      'read_analytics',
      'read_reports',
      'read_fulfillments'
    ].join(',')

    // Build Shopify OAuth URL
    const authUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${SHOPIFY_APP_API_KEY}&` +
      `scope=${scopes}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `state=${nonce}`

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Shopify OAuth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}