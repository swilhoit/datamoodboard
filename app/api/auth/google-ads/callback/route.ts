import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GOOGLE_ADS_CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID!
const GOOGLE_ADS_CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET!
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/auth/google-ads/callback'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=google_ads_auth_denied`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=invalid_callback`)
    }

    const supabase = await createClient()
    
    // Verify state
    const { data: stateData } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('provider', 'google_ads')
      .single()

    if (!stateData) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=invalid_state`)
    }

    // Clean up used state
    await supabase
      .from('oauth_states')
      .delete()
      .eq('state', state)

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_ADS_CLIENT_ID,
        client_secret: GOOGLE_ADS_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=token_exchange_failed`)
    }

    const tokens = await tokenResponse.json()

    // Store tokens securely
    const { error: storeError } = await supabase
      .from('integration_credentials')
      .upsert({
        user_id: stateData.user_id,
        provider: 'google_ads',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        metadata: {
          scope: tokens.scope,
          token_type: tokens.token_type,
        },
        updated_at: new Date().toISOString(),
      })

    if (storeError) {
      console.error('Failed to store tokens:', storeError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=storage_failed`)
    }

    // Redirect back to app with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?integration=google_ads&status=connected`)
  } catch (error) {
    console.error('Google Ads callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=callback_error`)
  }
}