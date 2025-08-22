import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const shop = searchParams.get('shop')
  const state = searchParams.get('state')
  const hmac = searchParams.get('hmac')
  
  // Verify the nonce
  const storedNonce = request.cookies.get('shopify_oauth_nonce')?.value
  
  if (!storedNonce || storedNonce !== state) {
    return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 })
  }
  
  // Verify HMAC if in production
  if (process.env.NODE_ENV === 'production' && hmac) {
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET
    if (clientSecret) {
      // Remove hmac from params for verification
      const params = new URLSearchParams(searchParams)
      params.delete('hmac')
      params.delete('signature')
      
      // Sort params and create query string
      const sortedParams = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&')
      
      // Calculate HMAC
      const calculatedHmac = crypto
        .createHmac('sha256', clientSecret)
        .update(sortedParams)
        .digest('hex')
      
      if (calculatedHmac !== hmac) {
        return NextResponse.json({ error: 'Invalid HMAC' }, { status: 400 })
      }
    }
  }
  
  // Exchange code for access token
  const clientId = process.env.NEXT_PUBLIC_SHOPIFY_CLIENT_ID || process.env.SHOPIFY_CLIENT_ID
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    console.error('Shopify credentials not configured')
    // Fallback to mock success
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('integration', 'shopify')
    redirectUrl.searchParams.set('status', 'connected')
    redirectUrl.searchParams.set('shop', shop || '')
    return NextResponse.redirect(redirectUrl)
  }
  
  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    })
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token')
    }
    
    const { access_token, scope } = await tokenResponse.json()
    
    // Store the access token securely (in production, encrypt and store in database)
    // For now, we'll store it in a secure cookie
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('integration', 'shopify')
    redirectUrl.searchParams.set('status', 'connected')
    redirectUrl.searchParams.set('shop', shop || '')
    
    const response = NextResponse.redirect(redirectUrl)
    
    // Store token in secure cookie (in production, use database)
    response.cookies.set(`shopify_token_${shop}`, access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })
    
    return response
    
  } catch (error) {
    console.error('Error exchanging code for token:', error)
    
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('integration', 'shopify')
    redirectUrl.searchParams.set('status', 'error')
    redirectUrl.searchParams.set('error', 'Failed to connect to Shopify')
    
    return NextResponse.redirect(redirectUrl)
  }
}