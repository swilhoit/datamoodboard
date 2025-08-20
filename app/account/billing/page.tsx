'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Crown, CreditCard, Check, X, Loader2, Calendar, AlertCircle, Zap, Shield, Sparkles, Database, BarChart3 } from 'lucide-react'

interface Plan {
  name: string
  price: number
  priceId?: string
  features: {
    name: string
    included: boolean
    value?: string
  }[]
  recommended?: boolean
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: 0,
    features: [
      { name: 'AI Image Generations', included: true, value: '10/day' },
      { name: 'Dashboards', included: true, value: '5' },
      { name: 'Data Tables', included: true, value: '10' },
      { name: 'Storage', included: true, value: '1 GB' },
      { name: 'Public Dashboard Sharing', included: true },
      { name: 'CSV Export', included: true },
      { name: 'Community Support', included: true },
      { name: 'Priority Support', included: false },
      { name: 'API Access', included: false },
      { name: 'Custom Branding', included: false },
      { name: 'Team Collaboration', included: false },
      { name: 'Advanced Analytics', included: false }
    ]
  },
  {
    name: 'Pro',
    price: 29,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    recommended: true,
    features: [
      { name: 'AI Image Generations', included: true, value: '50/day' },
      { name: 'Dashboards', included: true, value: 'Unlimited' },
      { name: 'Data Tables', included: true, value: 'Unlimited' },
      { name: 'Storage', included: true, value: '10 GB' },
      { name: 'Public Dashboard Sharing', included: true },
      { name: 'CSV Export', included: true },
      { name: 'Community Support', included: true },
      { name: 'Priority Support', included: true },
      { name: 'API Access', included: true },
      { name: 'Custom Branding', included: false },
      { name: 'Team Collaboration', included: false },
      { name: 'Advanced Analytics', included: true }
    ]
  },
  {
    name: 'Team',
    price: 99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID,
    features: [
      { name: 'AI Image Generations', included: true, value: '500/day' },
      { name: 'Dashboards', included: true, value: 'Unlimited' },
      { name: 'Data Tables', included: true, value: 'Unlimited' },
      { name: 'Storage', included: true, value: '100 GB' },
      { name: 'Public Dashboard Sharing', included: true },
      { name: 'CSV Export', included: true },
      { name: 'Community Support', included: true },
      { name: 'Priority Support', included: true },
      { name: 'API Access', included: true },
      { name: 'Custom Branding', included: true },
      { name: 'Team Collaboration', included: true },
      { name: 'Advanced Analytics', included: true }
    ]
  }
]

export default function BillingPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [changingPlan, setChangingPlan] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [billingHistory, setBillingHistory] = useState<any[]>([])
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    let mounted = true
    loadBillingData()
    
    async function loadBillingData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Please sign in to manage billing')
          setLoading(false)
          return
        }
        
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        // Mock billing history - in production, fetch from Stripe
        const mockHistory = (prof as any)?.subscription_tier === 'pro' ? [
          { date: '2024-01-01', amount: 29, status: 'paid', description: 'Pro Plan - Monthly' },
          { date: '2023-12-01', amount: 29, status: 'paid', description: 'Pro Plan - Monthly' },
          { date: '2023-11-01', amount: 29, status: 'paid', description: 'Pro Plan - Monthly' }
        ] : []
        
        if (!mounted) return
        setProfile(prof)
        setBillingHistory(mockHistory)
      } catch (e: any) {
        if (mounted) {
          setError(e.message || 'Failed to load billing')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    return () => { mounted = false }
  }, [supabase])

  const handlePlanChange = async (plan: Plan) => {
    if (plan.name === 'Free' && profile?.subscription_tier === 'pro') {
      // Downgrade to free - open Stripe portal for cancellation
      await goToPortal()
    } else if (plan.priceId) {
      // Upgrade or change to paid plan
      setChangingPlan(true)
      try {
        const res = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId: plan.priceId })
        })
        const json = await res.json()
        if (json.url) {
          window.location.href = json.url
        } else {
          throw new Error('Failed to create checkout session')
        }
      } catch (e) {
        console.error('Plan change error:', e)
        setError('Failed to change plan. Please try again.')
        setChangingPlan(false)
      }
    }
  }

  const goToPortal = async () => {
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const json = await res.json()
      if (json.url) window.location.href = json.url
    } catch (e) {
      console.error('Portal error:', e)
      setError('Failed to open billing portal')
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse h-8 w-48 bg-gray-200 rounded mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border rounded-lg p-6 h-96 animate-pulse">
              <div className="h-6 w-24 bg-gray-200 rounded mb-4" />
              <div className="h-8 w-32 bg-gray-200 rounded mb-6" />
              <div className="space-y-3">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-4 w-full bg-gray-100 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="text-red-600" size={18} />
          <span className="text-red-600">{error}</span>
        </div>
      </div>
    )
  }

  const currentPlan = profile?.subscription_tier || 'free'
  const nextBillingDate = profile?.current_period_end 
    ? new Date(profile.current_period_end).toLocaleDateString()
    : null

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Billing & Plans</h1>
        {currentPlan !== 'free' && (
          <button
            onClick={goToPortal}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Manage Subscription
          </button>
        )}
      </div>

      {/* Current Plan Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Crown className={currentPlan !== 'free' ? 'text-yellow-500' : 'text-gray-400'} size={24} />
              <div>
                <h2 className="text-lg font-medium">Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</h2>
                {nextBillingDate && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar size={14} />
                    Next billing date: {nextBillingDate}
                  </p>
                )}
              </div>
            </div>
            {profile?.subscription_status && profile.subscription_status !== 'active' && (
              <div className="mt-2 text-sm text-orange-600 flex items-center gap-1">
                <AlertCircle size={14} />
                Status: {profile.subscription_status}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            {showComparison ? 'Hide' : 'Compare'} Plans
          </button>
        </div>
      </div>

      {/* Plans Comparison */}
      {showComparison && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {plans.map((plan) => {
            const isCurrentPlan = 
              (plan.name.toLowerCase() === currentPlan.toLowerCase()) ||
              (plan.name === 'Free' && currentPlan === 'free')
            
            return (
              <div
                key={plan.name}
                className={`bg-white border-2 rounded-lg p-6 relative ${
                  plan.recommended ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                } ${isCurrentPlan ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">
                      RECOMMENDED
                    </span>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                      CURRENT
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-gray-500 ml-2">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.slice(0, 8).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      {feature.included ? (
                        <Check className="text-green-500 mt-0.5" size={16} />
                      ) : (
                        <X className="text-gray-300 mt-0.5" size={16} />
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.name}
                        {feature.value && <span className="font-medium"> - {feature.value}</span>}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanChange(plan)}
                  disabled={isCurrentPlan || changingPlan}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : plan.recommended
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {changingPlan ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      Processing...
                    </span>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : plan.name === 'Free' ? (
                    'Downgrade'
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-blue-600" size={18} />
            <span className="text-sm font-medium text-gray-700">AI Images Limit</span>
          </div>
          <div className="text-2xl font-semibold">
            {currentPlan === 'pro' ? '50' : currentPlan === 'team' ? '500' : '10'}/day
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="text-green-600" size={18} />
            <span className="text-sm font-medium text-gray-700">Storage Limit</span>
          </div>
          <div className="text-2xl font-semibold">
            {currentPlan === 'pro' ? '10 GB' : currentPlan === 'team' ? '100 GB' : '1 GB'}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="text-purple-600" size={18} />
            <span className="text-sm font-medium text-gray-700">Dashboards</span>
          </div>
          <div className="text-2xl font-semibold">
            {currentPlan === 'free' ? '5' : 'Unlimited'}
          </div>
        </div>
      </div>

      {/* Billing History */}
      {billingHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Billing History</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {billingHistory.map((item, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.description}</p>
                  <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.status === 'paid' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.status}
                  </span>
                  <span className="text-sm font-medium">${item.amount}</span>
                </div>
              </div>
            ))}
          </div>
          {currentPlan !== 'free' && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={goToPortal}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all invoices →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="text-gray-600" size={18} />
          <span className="text-sm font-medium text-gray-700">Secure Billing</span>
        </div>
        <p className="text-sm text-gray-600">
          All billing is securely processed through Stripe. Your payment information is never stored on our servers.
          {currentPlan !== 'free' && ' You can manage your subscription, update payment methods, or download invoices through the Stripe portal.'}
        </p>
      </div>
    </div>
  )
}