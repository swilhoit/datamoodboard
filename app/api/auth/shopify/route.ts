import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop')
  
  if (!shop || !shop.includes('.myshopify.com')) {
    return NextResponse.json({ error: 'Invalid shop parameter' }, { status: 400 })
  }

  // Get credentials from environment variables
  const clientId = process.env.NEXT_PUBLIC_SHOPIFY_CLIENT_ID || process.env.SHOPIFY_CLIENT_ID
  const scopes = process.env.SHOPIFY_SCOPES || 'read_products,read_orders,read_customers'
  const redirectUri = process.env.SHOPIFY_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/shopify/callback`
  
  if (!clientId) {
    console.error('Shopify Client ID not configured')
    // For now, fallback to mock flow
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('integration', 'shopify')
    redirectUrl.searchParams.set('status', 'connected')
    redirectUrl.searchParams.set('shop', shop)
    return NextResponse.redirect(redirectUrl)
  }

  // Generate a nonce for security
  const nonce = crypto.randomBytes(16).toString('hex')
  
  // Store nonce in a cookie for verification later
  const response = NextResponse.redirect(
    `https://${shop}/admin/oauth/authorize?` +
    `client_id=${clientId}&` +
    `scope=${scopes}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${nonce}`
  )
  
  response.cookies.set('shopify_oauth_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10 // 10 minutes
  })
  
  return response
}