'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Crown, CreditCard } from 'lucide-react'

export default function BillingPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Please sign in to manage billing')
          return
        }
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (!mounted) return
        setProfile(prof)
      } catch (e: any) {
        setError(e.message || 'Failed to load billing')
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const goToCheckout = async () => {
    const res = await fetch('/api/billing/checkout', { method: 'POST' })
    const json = await res.json()
    if (json.url) window.location.href = json.url
  }

  const goToPortal = async () => {
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const json = await res.json()
    if (json.url) window.location.href = json.url
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="animate-pulse h-6 w-40 bg-gray-200 rounded mb-4" />
        <div className="animate-pulse h-3 w-full bg-gray-100 rounded" />
      </div>
    )
  }

  if (error) {
    return <div className="p-6 max-w-2xl mx-auto text-red-600">{error}</div>
  }

  const isPro = profile?.subscription_tier === 'pro'

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Billing</h1>
      <div className="grid gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className={isPro ? 'text-yellow-500' : 'text-gray-400'} size={18} />
              <span className="text-sm font-medium text-gray-700">Current plan</span>
            </div>
            <span className="text-sm text-gray-600">{isPro ? 'Pro' : 'Free'}</span>
          </div>
        </div>

        {isPro ? (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="text-blue-600" size={18} />
                <span className="text-sm font-medium text-gray-700">Manage subscription</span>
              </div>
              <button onClick={goToPortal} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">Open Portal</button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-yellow-50 to-white border border-yellow-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="text-yellow-500" size={18} />
                <span className="text-sm font-medium text-gray-800">Upgrade to Pro</span>
              </div>
              <button onClick={goToCheckout} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm">Upgrade</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


