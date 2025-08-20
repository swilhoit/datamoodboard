'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Crown } from 'lucide-react'

export default function UsagePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Please sign in to view your usage')
          return
        }

        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        const { data: limits } = await supabase.rpc('get_ai_image_limits')
        const used = Array.isArray(limits) ? limits[0]?.used ?? 0 : (limits as any)?.used ?? 0
        const daily_limit = Array.isArray(limits) ? limits[0]?.daily_limit ?? 0 : (limits as any)?.daily_limit ?? 0
        if (!mounted) return
        setProfile(prof)
        setUsage({ used, limit: daily_limit })
      } catch (e: any) {
        setError(e.message || 'Failed to load usage')
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const goToUpgrade = async () => {
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const json = await res.json()
      if (json.url) window.location.href = json.url
    } catch (e) {}
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

  const percent = usage ? Math.min(100, Math.round((usage.used / Math.max(usage.limit, 1)) * 100)) : 0

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Usage</h1>
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-blue-600" size={18} />
            <span className="text-sm font-medium text-gray-700">Daily AI Images</span>
          </div>
          <span className="text-sm text-gray-600">{usage?.used ?? 0} / {usage?.limit ?? 0}</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${percent}%` }} />
        </div>
        <div className="text-xs text-gray-500">Resets daily (UTC)</div>
      </div>

      {profile?.subscription_tier !== 'pro' && (
        <div className="mt-6 bg-gradient-to-r from-yellow-50 to-white border border-yellow-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="text-yellow-500" size={18} />
            <span className="text-sm font-medium text-gray-800">Upgrade to Pro</span>
          </div>
          <p className="text-sm text-gray-600 mb-3">Get 5x daily AI images, higher limits, and priority processing.</p>
          <button onClick={goToUpgrade} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm">Upgrade</button>
        </div>
      )}
    </div>
  )
}


