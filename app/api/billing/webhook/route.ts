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

    // Helper function to record billing event
    const recordEvent = async (
      userId: string,
      customerId: string | null,
      eventType: string,
      amount: number | null,
      description: string,
      status: string = 'completed'
    ) => {
      try {
        await (admin as any).rpc('record_billing_event', {
          p_user_id: userId,
          p_stripe_customer_id: customerId,
          p_event_type: eventType,
          p_amount: amount,
          p_currency: 'usd',
          p_status: status,
          p_description: description,
          p_stripe_event_id: event.id,
          p_metadata: { stripe_event: event.type }
        })
      } catch (error) {
        console.error('Error recording billing event:', error)
      }
    }

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
          
          // Record the event
          await recordEvent(
            userId,
            sub.customer,
            event.type === 'customer.subscription.created' ? 'subscription.created' : 'subscription.updated',
            sub.items?.data?.[0]?.price?.unit_amount || null,
            event.type === 'customer.subscription.created' ? 'Pro Plan Subscription Created' : 'Subscription Updated',
            sub.status
          )
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
          
          // Record the cancellation
          await recordEvent(
            userId,
            sub.customer,
            'subscription.canceled',
            null,
            'Subscription Canceled',
            'canceled'
          )
        }
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const userId = invoice.subscription_details?.metadata?.supabase_user_id || 
                       invoice.lines?.data?.[0]?.metadata?.supabase_user_id
        if (userId) {
          await recordEvent(
            userId,
            invoice.customer,
            'payment.succeeded',
            invoice.amount_paid,
            'Payment Successful',
            'completed'
          )
        }
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const userId = invoice.subscription_details?.metadata?.supabase_user_id || 
                       invoice.lines?.data?.[0]?.metadata?.supabase_user_id
        if (userId) {
          await recordEvent(
            userId,
            invoice.customer,
            'payment.failed',
            invoice.amount_due,
            'Payment Failed',
            'failed'
          )
        }
        break
      }
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.client_reference_id
        if (userId && session.customer) {
          await admin.from('profiles').update({ stripe_customer_id: session.customer as string }).eq('id', userId)
          
          // Record the checkout completion
          await recordEvent(
            userId,
            session.customer,
            'checkout.completed',
            session.amount_total,
            'Checkout Completed',
            'completed'
          )
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


