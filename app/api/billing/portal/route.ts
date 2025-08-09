import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient as createBrowserServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createBrowserServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const stripeCustomerId = (profile as any)?.stripe_customer_id as string | undefined
    if (!stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer' }, { status: 400 })
    }

    const stripe = getStripe()
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const portal = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: origin,
    })
    return NextResponse.json({ url: portal.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}


