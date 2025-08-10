import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const SHOPIFY_APP_API_KEY = process.env.SHOPIFY_APP_API_KEY!
const SHOPIFY_APP_API_SECRET = process.env.SHOPIFY_APP_API_SECRET!

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const shop = searchParams.get('shop')
    const state = searchParams.get('state')
    const hmac = searchParams.get('hmac')

    if (!code || !shop || !state || !hmac) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=invalid_callback`)
    }

    // Verify HMAC for security
    const params = new URLSearchParams(searchParams)
    params.delete('hmac')
    params.delete('signature')
    
    const message = params.toString()
    const generatedHash = crypto
      .createHmac('sha256', SHOPIFY_APP_API_SECRET)
      .update(message, 'utf8')
      .digest('hex')

    if (generatedHash !== hmac) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=invalid_hmac`)
    }

    const supabase = await createClient()
    
    // Verify state
    const { data: stateData } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('provider', 'shopify')
      .single()

    if (!stateData) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=invalid_state`)
    }

    // Clean up used state
    await supabase
      .from('oauth_states')
      .delete()
      .eq('state', state)

    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: SHOPIFY_APP_API_KEY,
        client_secret: SHOPIFY_APP_API_SECRET,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=token_exchange_failed`)
    }

    const { access_token, scope } = await tokenResponse.json()

    // Get shop information
    const shopInfoResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    })

    let shopInfo = {}
    if (shopInfoResponse.ok) {
      const data = await shopInfoResponse.json()
      shopInfo = data.shop
    }

    // Store credentials
    const { error: storeError } = await supabase
      .from('integration_credentials')
      .upsert({
        user_id: stateData.user_id,
        provider: 'shopify',
        access_token: access_token,
        metadata: {
          shop,
          scope,
          shop_info: shopInfo,
        },
        updated_at: new Date().toISOString(),
      })

    if (storeError) {
      console.error('Failed to store tokens:', storeError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=storage_failed`)
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?integration=shopify&status=connected&shop=${shop}`)
  } catch (error) {
    console.error('Shopify callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=callback_error`)
  }
}