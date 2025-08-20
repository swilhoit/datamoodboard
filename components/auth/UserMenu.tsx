'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, LogOut, Settings, BarChart, UserCircle, Crown, CreditCard, Sparkles } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface UserMenuProps {
  onOpenAuth: () => void
  onOpenDashboards?: () => void
}

export default function UserMenu({ onOpenAuth, onOpenDashboards }: UserMenuProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [credits, setCredits] = useState<{ used: number; limit: number } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchProfile(user.id)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)

    // Fetch today's usage and limit
    const { data: limits } = await (supabase as any).rpc('get_ai_image_limits')
    const used = Array.isArray(limits) ? limits[0]?.used ?? 0 : (limits as any)?.used ?? 0
    const daily_limit = Array.isArray(limits) ? limits[0]?.daily_limit ?? 0 : (limits as any)?.daily_limit ?? 0
    setCredits({ used, limit: daily_limit })
  }

  const handleUpgrade = async () => {
    const res = await fetch('/api/billing/checkout', { method: 'POST' })
    const json = await res.json()
    if (json.url) window.location.href = json.url
  }

  const handleManageBilling = async () => {
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const json = await res.json()
    if (json.url) window.location.href = json.url
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsOpen(false)
    window.location.reload()
  }

  if (!user) {
    return (
      <button
        onClick={onOpenAuth}
        className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 font-dm-mono uppercase shadow-md"
      >
        <UserCircle size={18} />
        Sign In
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors font-dm-mono uppercase"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name || 'User'}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
            {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
          </div>
        )}
        <span className="text-sm font-dm-mono font-medium uppercase text-gray-700">
          {profile?.full_name || user.email?.split('@')[0]}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-dm-mono font-medium uppercase text-gray-900">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs font-dm-mono uppercase text-gray-500 mt-0.5">
                {user.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Crown size={14} className={profile?.subscription_tier === 'pro' ? 'text-yellow-500' : 'text-gray-400'} />
                <span className="text-xs font-dm-mono uppercase text-gray-600">
                  {profile?.subscription_tier === 'pro' ? 'Pro plan' : 'Free plan'}
                </span>
              </div>
            </div>

            <div className="py-2">
              {credits && (
                <div className="px-4 py-2 text-xs font-dm-mono uppercase text-gray-600 flex items-center justify-between">
                  <span>Daily AI images</span>
                  <span>{credits.used} / {credits.limit}</span>
                </div>
              )}
              <button
                onClick={() => {
                  setIsOpen(false)
                  if (onOpenDashboards) onOpenDashboards()
                }}
                className="w-full px-4 py-2 text-left text-sm font-dm-mono uppercase text-gray-700 hover:bg-gray-100 flex items-center gap-3"
              >
                <BarChart size={16} />
                My Dashboards
              </button>
              <button
                onClick={() => {
                  setIsOpen(false)
                  window.location.href = '/account/usage'
                }}
                className="w-full px-4 py-2 text-left text-sm font-dm-mono uppercase text-gray-700 hover:bg-gray-100 flex items-center gap-3"
              >
                <Sparkles size={16} />
                Usage
              </button>
              <button
                onClick={() => {
                  setIsOpen(false)
                  window.location.href = '/account/billing'
                }}
                className="w-full px-4 py-2 text-left text-sm font-dm-mono uppercase text-gray-700 hover:bg-gray-100 flex items-center gap-3"
              >
                <CreditCard size={16} />
                Billing
              </button>
              <button
                onClick={() => {
                  setIsOpen(false)
                  // Navigate to profile settings
                }}
                className="w-full px-4 py-2 text-left text-sm font-dm-mono uppercase text-gray-700 hover:bg-gray-100 flex items-center gap-3"
              >
                <Settings size={16} />
                Settings
              </button>
              {profile?.subscription_tier !== 'pro' ? (
                <button
                  onClick={() => {
                    setIsOpen(false)
                    handleUpgrade()
                  }}
                  className="w-full px-4 py-2 text-left text-sm font-dm-mono uppercase text-blue-700 hover:bg-blue-50 flex items-center gap-3"
                >
                  <Crown size={16} />
                  Upgrade to Pro
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsOpen(false)
                    handleManageBilling()
                  }}
                  className="w-full px-4 py-2 text-left text-sm font-dm-mono uppercase text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                >
                  <CreditCard size={16} />
                  Manage Billing
                </button>
              )}
              {profile?.role === 'admin' && (
                <button
                  onClick={() => {
                    setIsOpen(false)
                    window.location.href = '/admin'
                  }}
                  className="w-full px-4 py-2 text-left text-sm font-dm-mono uppercase text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                >
                  <Settings size={16} />
                  Admin Dashboard
                </button>
              )}
            </div>

            <div className="border-t border-gray-200 pt-2">
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-left text-sm font-dm-mono uppercase text-red-600 hover:bg-red-50 flex items-center gap-3"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}