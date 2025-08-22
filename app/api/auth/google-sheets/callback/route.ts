import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/?error=missing_code', req.url))
  }

  const clientId = process.env.GOOGLE_SHEETS_CLIENT_ID
  const clientSecret = process.env.GOOGLE_SHEETS_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/google-sheets/callback`

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  })

  const tokens = await tokenRes.json()
  if (!tokens.access_token) {
    return NextResponse.redirect(new URL('/?error=auth_failed', req.url))
  }

  // Save to Supabase
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/?error=unauthorized', req.url))

  await supabase.from('integration_credentials').upsert({
    user_id: user.id,
    provider: 'google_sheets',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  })

  // Redirect back to connector with success
  return NextResponse.redirect(new URL('/?integration=google_sheets&status=connected', req.url))
}
