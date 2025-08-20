'use client'

import React, { useEffect, useState } from 'react'
import { X, Check, CreditCard, Zap, Crown, Sparkles, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface BillingModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Plan {
  name: string
  price: string
  priceId?: string
  features: string[]
  recommended?: boolean
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: '$0',
    features: [
      '5 AI images per month',
      '1 dashboard',
      'Basic charts',
      'Public sharing',
      'Community support'
    ]
  },
  {
    name: 'Pro',
    price: '$29',
    priceId: 'price_1QidMgLO5PJjRdJuEoXLHxRY',
    recommended: true,
    features: [
      '100 AI images per month',
      'Unlimited dashboards',
      'Advanced charts',
      'Private sharing',
      'Priority support',
      'Custom branding',
      'API access',
      'Export to PDF/PNG'
    ]
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    features: [
      'Unlimited AI images',
      'Unlimited everything',
      'White-label options',
      'Dedicated support',
      'SLA guarantees',
      'Custom integrations',
      'Team collaboration',
      'Advanced security'
    ]
  }
]

export default function BillingModal({ isOpen, onClose }: BillingModalProps) {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [billingHistory, setBillingHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [changingPlan, setChangingPlan] = useState(false)
  const [usageData, setUsageData] = useState<any[]>([])
  const [portalLoading, setPortalLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchBillingData()
    }
  }, [isOpen])

  const fetchBillingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(prof)

      // Fetch billing history
      try {
        const { data: history, error } = await supabase
          .rpc('get_billing_history', { p_limit: 5 })
        
        if (!error && history) {
          setBillingHistory(history)
        } else {
          // If RPC doesn't exist yet, just use empty array
          setBillingHistory([])
        }
      } catch (e) {
        console.log('Billing history not available yet')
        setBillingHistory([])
      }

      // Mock usage data for the chart
      const mockUsage = [
        { month: 'Jan', amount: 29 },
        { month: 'Feb', amount: 29 },
        { month: 'Mar', amount: 29 },
        { month: 'Apr', amount: 29 },
        { month: 'May', amount: 29 },
        { month: 'Jun', amount: 29 }
      ]
      setUsageData(mockUsage)
    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlanChange = async (plan: Plan) => {
    setErrorMessage(null)
    
    if (plan.name === 'Enterprise') {
      window.open('mailto:sales@datamoodboard.com?subject=Enterprise Plan Inquiry', '_blank')
      return
    }

    // Downgrading from Pro to Free - use Stripe portal
    if (plan.name === 'Free' && (profile as any)?.subscription_tier === 'pro') {
      setPortalLoading(true)
      try {
        await goToPortal()
      } finally {
        setPortalLoading(false)
      }
    } 
    // Upgrading to Pro
    else if (plan.priceId) {
      setChangingPlan(true)
      try {
        const res = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId: plan.priceId })
        })
        
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Failed to create checkout session')
        }
        
        const { url } = await res.json()
        if (url) {
          window.location.href = url
        } else {
          throw new Error('No checkout URL received')
        }
      } catch (error: any) {
        console.error('Error changing plan:', error)
        setErrorMessage(error.message || 'Failed to change plan. Please try again.')
        setChangingPlan(false)
      }
    }
  }

  const goToPortal = async () => {
    setErrorMessage(null)
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to open billing portal')
      }
      
      const { url } = await res.json()
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No portal URL received')
      }
    } catch (error: any) {
      console.error('Error opening portal:', error)
      setErrorMessage(error.message || 'Failed to open billing portal. Please try again.')
    }
  }

  if (!isOpen) return null

  const currentPlan = (profile as any)?.subscription_tier === 'pro' ? 'Pro' : 'Free'

  const pieData = [
    { name: 'AI Images', value: 40, color: '#8B5CF6' },
    { name: 'Storage', value: 30, color: '#3B82F6' },
    { name: 'API Calls', value: 30, color: '#10B981' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold font-dm-mono uppercase">Billing & Plans</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Error Message */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
                  <span>{errorMessage}</span>
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {/* Current Plan Status */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Current Plan</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{currentPlan}</p>
                  </div>
                  {currentPlan === 'Pro' && (
                    <button
                      onClick={goToPortal}
                      disabled={portalLoading}
                      className="px-4 py-2 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {portalLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <CreditCard size={16} />
                          Manage Subscription
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-3">Monthly Spending</h4>
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={usageData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-3">Resource Usage</h4>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Plans */}
              <div>
                <h3 className="text-xl font-semibold mb-6">Available Plans</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.name}
                      className={`relative rounded-xl border-2 p-6 transition-all ${
                        plan.recommended
                          ? 'border-blue-500 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${currentPlan === plan.name ? 'bg-blue-50' : 'bg-white'}`}
                    >
                      {plan.recommended && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            RECOMMENDED
                          </span>
                        </div>
                      )}

                      {currentPlan === plan.name && (
                        <div className="absolute -top-3 right-4">
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            CURRENT
                          </span>
                        </div>
                      )}

                      <div className="text-center mb-6">
                        <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
                        <p className="text-3xl font-bold">
                          {plan.price}
                          {plan.price !== 'Custom' && <span className="text-base font-normal">/mo</span>}
                        </p>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => handlePlanChange(plan)}
                        disabled={currentPlan === plan.name || changingPlan || portalLoading}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                          currentPlan === plan.name
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : plan.recommended
                            ? 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50'
                            : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50'
                        }`}
                      >
                        {changingPlan || portalLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                          </div>
                        ) : currentPlan === plan.name ? (
                          'Current Plan'
                        ) : plan.name === 'Enterprise' ? (
                          <>Contact Sales <ArrowRight size={16} /></>
                        ) : currentPlan === 'Free' && plan.name === 'Pro' ? (
                          <>Upgrade to Pro <Zap size={16} /></>
                        ) : currentPlan === 'Pro' && plan.name === 'Free' ? (
                          <>Downgrade to Free</>
                        ) : (
                          'Select Plan'
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Billing History */}
              {billingHistory.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Recent Transactions</h3>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">Date</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Description</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Amount</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingHistory.map((item: any) => (
                          <tr key={item.id} className="border-t">
                            <td className="px-4 py-2 text-sm">
                              {new Date(item.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {item.description || item.event_type.replace(/[._]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              ${(item.amount / 100).toFixed(2)}
                            </td>
                            <td className="px-4 py-2">
                              <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                {item.status || 'Completed'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}