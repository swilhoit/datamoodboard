import Stripe from 'stripe'

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
  return new Stripe(key, { apiVersion: '2024-04-10' })
}

export const STRIPE_PRICE_IDS = {
  free: process.env.NEXT_PUBLIC_STRIPE_PRICE_FREE || '',
  pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '',
  pro_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || '',
}

export type SubscriptionTier = 'free' | 'pro'


