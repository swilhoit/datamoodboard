import { NextRequest, NextResponse } from 'next/server'
import { getStripe, STRIPE_PRICE_IDS } from '@/lib/stripe'
import { createClient as createBrowserServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createBrowserServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { priceId, mode } = await req.json().catch(() => ({ priceId: undefined, mode: 'subscription' }))
    const resolvedPriceId = priceId || STRIPE_PRICE_IDS.pro_monthly
    if (!resolvedPriceId) return NextResponse.json({ error: 'Missing price id' }, { status: 400 })

    const stripe = getStripe()

    // Ensure customer
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    const profile: any = profileData as any

    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email || undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId } as any).eq('id', user.id)
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      mode: (mode as 'subscription' | 'payment') || 'subscription',
      customer: customerId,
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      success_url: `${origin}/?billing=success`,
      cancel_url: `${origin}/?billing=cancel`,
      allow_promotion_codes: true,
      client_reference_id: user.id,
      subscription_data: { metadata: { supabase_user_id: user.id } },
      metadata: { supabase_user_id: user.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}


