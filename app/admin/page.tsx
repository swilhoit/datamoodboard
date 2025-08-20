'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, Users, LayoutDashboard, Activity, Database, Sparkles } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
// import { Skeleton } from '@/components/ui/skeleton' // Component not available

export default function AdminPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<any>({})

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Please sign in as admin')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role !== 'admin' && user.email !== 'tetrahedronglobal@gmail.com') throw new Error('Access denied')

        const res = await fetch('/api/admin/metrics')
        if (!res.ok) throw new Error('Failed to load metrics')
        setMetrics(await res.json())
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />)}
      </div>
      {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />)}
    </div>
  )
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard icon={<Users size={18} />} label="Users" value={metrics.users ?? 0} />
        <MetricCard icon={<LayoutDashboard size={18} />} label="Dashboards" value={metrics.dashboards ?? 0} />
        <MetricCard icon={<Database size={18} />} label="Data Tables" value={metrics.dataTables ?? 0} />
        <MetricCard icon={<Activity size={18} />} label="Connections" value={metrics.connections ?? 0} />
      </div>

      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <LayoutDashboard size={18} className="text-purple-600" />
          <span className="text-sm font-medium">Dashboards by Day (30d)</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.dashboardsByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <table className="w-full text-sm mt-4">
          <thead><tr className="text-left text-gray-500"><th>Date</th><th>Count</th></tr></thead>
          <tbody>
            {metrics.dashboardsByDay?.map((row: any) => (
              <tr key={row.date} className="border-t"><td>{row.date}</td><td>{row.count}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database size={18} className="text-blue-600" />
          <span className="text-sm font-medium">Tables Growth (30d)</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.tablesByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="tables" stroke="#8884d8" />
              <Line yAxisId="right" type="monotone" dataKey="rows" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <table className="w-full text-sm mt-4">
          <thead><tr className="text-left text-gray-500"><th>Date</th><th>Tables</th><th>Rows</th></tr></thead>
          <tbody>
            {metrics.tablesByDay?.map((row: any) => (
              <tr key={row.date} className="border-t"><td>{row.date}</td><td>{row.tables}</td><td>{row.rows}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={18} className="text-green-600" />
          <span className="text-sm font-medium">Activity per User (30d)</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.activityPerUser}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="full_name" angle={-45} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <table className="w-full text-sm mt-4">
          <thead><tr className="text-left text-gray-500"><th>User</th><th>Actions</th></tr></thead>
          <tbody>
            {metrics.activityPerUser?.map((row: any) => (
              <tr key={row.user_id} className="border-t">
                <td>
                  <div>{row.full_name || row.email || row.user_id}</div>
                  {row.email && <div className="text-xs text-gray-500">{row.email}</div>}
                </td>
                <td>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-yellow-600" />
          <span className="text-sm font-medium">AI Image Usage (30d)</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.aiUsageByDay || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="used" stroke="#eab308" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <table className="w-full text-sm mt-4">
          <thead><tr className="text-left text-gray-500"><th>User</th><th>Images Generated</th></tr></thead>
          <tbody>
            {metrics.topAiUsers?.map((row: any) => (
              <tr key={row.user_id} className="border-t">
                <td>{row.full_name || row.email || row.user_id}</td>
                <td>{row.total_used}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-gray-500 text-xs mb-1 flex gap-2">{icon} {label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}


