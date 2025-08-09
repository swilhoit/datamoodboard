import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// We need the raw body for Stripe signature verification
export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const signature = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Missing webhook secret' }, { status: 500 })

  const body = await req.text()
  try {
    const event = stripe.webhooks.constructEvent(body, signature!, secret)

    // Handle subscription lifecycle
    const admin = createSupabaseAdmin()

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as any
        const userId = sub.metadata?.supabase_user_id || sub.metadata?.user_id || sub.client_reference_id
        if (userId) {
          await admin
            .from('profiles')
            .update({
              subscription_status: sub.status,
              subscription_tier: 'pro',
              subscription_price_id: sub.items?.data?.[0]?.price?.id || null,
              current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
              cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
              trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
              role: 'pro',
            })
            .eq('id', userId)
        }
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any
        const userId = sub.metadata?.supabase_user_id || sub.metadata?.user_id || sub.client_reference_id
        if (userId) {
          await admin
            .from('profiles')
            .update({
              subscription_status: 'canceled',
              subscription_tier: 'free',
              role: 'user',
            })
            .eq('id', userId)
        }
        break
      }
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.client_reference_id
        if (userId && session.customer) {
          await admin.from('profiles').update({ stripe_customer_id: session.customer as string }).eq('id', userId)
        }
        break
      }
      default:
        break
    }

    return new NextResponse('ok', { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }
}


