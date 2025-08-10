import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const STRIPE_CLIENT_ID = process.env.STRIPE_CLIENT_ID!
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/auth/stripe/callback'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate state parameter for security
    const state = crypto.randomBytes(32).toString('hex')

    // Store state in database for verification
    const { error } = await supabase
      .from('oauth_states')
      .insert({
        user_id: user.id,
        state,
        provider: 'stripe',
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to store OAuth state:', error)
    }

    // Stripe OAuth URL
    const authUrl = new URL('https://connect.stripe.com/oauth/authorize')
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('client_id', STRIPE_CLIENT_ID)
    authUrl.searchParams.append('scope', 'read_write')
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.append('state', state)

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Stripe OAuth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}