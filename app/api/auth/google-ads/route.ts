import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GOOGLE_ADS_CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID!
const GOOGLE_ADS_CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET!
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/auth/google-ads/callback'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate state parameter for security
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      timestamp: Date.now()
    })).toString('base64')

    // Store state in session for verification
    const { error } = await supabase
      .from('oauth_states')
      .insert({
        user_id: user.id,
        state,
        provider: 'google_ads',
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to store OAuth state:', error)
    }

    // Google OAuth URL with required scopes for Google Ads
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.append('client_id', GOOGLE_ADS_CLIENT_ID)
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/adwords')
    authUrl.searchParams.append('access_type', 'offline')
    authUrl.searchParams.append('prompt', 'consent')
    authUrl.searchParams.append('state', state)

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Google Ads OAuth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}