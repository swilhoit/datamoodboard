// Similar structure to Google Ads callback
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/?error=missing_code', req.url))

  const clientId = process.env.BIGQUERY_CLIENT_ID
  const clientSecret = process.env.BIGQUERY_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/bigquery/callback`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      code,
      client_id: clientId!,
      client_secret: clientSecret!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  })

  const tokens = await tokenRes.json()
  if (!tokens.access_token) return NextResponse.redirect(new URL('/?error=auth_failed', req.url))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/?error=unauthorized', req.url))

  await supabase.from('data_connections').upsert({
    user_id: user.id,
    source_type: 'bigquery',
    label: 'BigQuery Connection',
    config: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    }
  })

  return NextResponse.redirect(new URL('/?integration=bigquery&status=connected', req.url))
}
