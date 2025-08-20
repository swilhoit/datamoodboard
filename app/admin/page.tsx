'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, Users, LayoutDashboard, Sparkles } from 'lucide-react'

export default function AdminPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [metrics, setMetrics] = useState<any>({})

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Please sign in as an admin')
          return
        }
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const admin = prof?.role === 'admin'
        setIsAdmin(admin)
        if (!admin) {
          setError('Access denied')
          return
        }

        const res = await fetch('/api/admin/metrics', { cache: 'no-store' })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j.error || 'Failed to load metrics')
        }
        const j = await res.json()
        setMetrics(j)
      } catch (e: any) {
        setError(e.message || 'Failed to load admin metrics')
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return <div className="p-6">Loading…</div>
  }
  if (error) {
    return <div className="p-6 text-red-600">{error}</div>
  }
  if (!isAdmin) {
    return null
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard icon={<Users size={18} />} label="Users" value={metrics.users ?? 0} />
        <MetricCard icon={<LayoutDashboard size={18} />} label="Dashboards" value={metrics.dashboards ?? 0} />
        <MetricCard icon={<BarChart3 size={18} />} label="Data Tables" value={metrics.dataTables ?? 0} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="text-blue-600" size={18} />
          <span className="text-sm font-medium text-gray-700">Top AI usage (last 7 days)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">Date</th>
                  <th className="py-2">Total AI Images</th>
                </tr>
              </thead>
              <tbody>
                {(metrics.last7 || []).map((row: any) => (
                  <tr key={row.date} className="border-t border-gray-100">
                    <td className="py-2">{row.date}</td>
                    <td className="py-2">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">User</th>
                  <th className="py-2">Total (7d)</th>
                </tr>
              </thead>
              <tbody>
                {(metrics.topUsers || []).map((row: any) => (
                  <tr key={row.user_id} className="border-t border-gray-100">
                    <td className="py-2">
                      <div className="text-sm text-gray-800">{row.full_name || row.email || row.user_id}</div>
                      {row.email && <div className="text-xs text-gray-500">{row.email}</div>}
                    </td>
                    <td className="py-2">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-gray-500 text-xs mb-1 flex items-center gap-2">{icon} {label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}


