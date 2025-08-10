import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STRIPE_CLIENT_ID = process.env.STRIPE_CLIENT_ID!
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const error_description = searchParams.get('error_description')

    if (error) {
      console.error('Stripe OAuth error:', error, error_description)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=stripe_auth_denied`)
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
      .eq('provider', 'stripe')
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
    const tokenResponse = await fetch('https://connect.stripe.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: STRIPE_CLIENT_ID,
        client_secret: STRIPE_SECRET_KEY,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=token_exchange_failed`)
    }

    const tokens = await tokenResponse.json()

    // Get account details
    const accountResponse = await fetch('https://api.stripe.com/v1/accounts/' + tokens.stripe_user_id, {
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      },
    })

    let accountInfo = {}
    if (accountResponse.ok) {
      accountInfo = await accountResponse.json()
    }

    // Store credentials
    const { error: storeError } = await supabase
      .from('integration_credentials')
      .upsert({
        user_id: stateData.user_id,
        provider: 'stripe',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        metadata: {
          stripe_user_id: tokens.stripe_user_id,
          stripe_publishable_key: tokens.stripe_publishable_key,
          scope: tokens.scope,
          livemode: tokens.livemode,
          token_type: tokens.token_type,
          account_info: accountInfo,
        },
        updated_at: new Date().toISOString(),
      })

    if (storeError) {
      console.error('Failed to store tokens:', storeError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=storage_failed`)
    }

    // Redirect back to app with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?integration=stripe&status=connected`)
  } catch (error) {
    console.error('Stripe callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=callback_error`)
  }
}