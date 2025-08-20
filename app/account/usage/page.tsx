'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Crown, BarChart3, TrendingUp, Database, Image, LayoutDashboard, Activity } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface UsageMetrics {
  aiImages: { used: number; limit: number }
  dashboards: { total: number; published: number; drafts: number }
  dataTables: { total: number; totalRows: number }
  storage: { used: number; limit: number }
  history: Array<{ date: string; images: number; dashboards: number; tables: number }>
}

export default function UsagePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    let mounted = true
    loadUsageData()
    
    async function loadUsageData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Please sign in to view your usage')
          setLoading(false)
          return
        }

        // Fetch profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        // Fetch current AI image limits
        const { data: limits } = await (supabase as any).rpc('get_ai_image_limits')
        const aiUsed = Array.isArray(limits) ? limits[0]?.used ?? 0 : (limits as any)?.used ?? 0
        const aiLimit = Array.isArray(limits) ? limits[0]?.daily_limit ?? 0 : (limits as any)?.daily_limit ?? 0

        // Fetch dashboards count
        const { count: totalDashboards } = await supabase
          .from('dashboards')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        const { count: publishedDashboards } = await supabase
          .from('dashboards')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_public', true)

        // Fetch data tables
        const { data: tables } = await supabase
          .from('user_data_tables')
          .select('row_count')
          .eq('user_id', user.id)

        const totalTables = tables?.length ?? 0
        const totalRows = tables?.reduce((sum, t) => sum + (t.row_count || 0), 0) ?? 0

        // Fetch historical usage (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const { data: aiHistory } = await (supabase as any)
          .from('ai_image_usage')
          .select('usage_date, used')
          .eq('user_id', user.id)
          .gte('usage_date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('usage_date', { ascending: true })

        const { data: dashboardHistory } = await supabase
          .from('dashboards')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', thirtyDaysAgo.toISOString())

        const { data: tableHistory } = await supabase
          .from('user_data_tables')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', thirtyDaysAgo.toISOString())

        // Process history data
        const historyMap = new Map<string, { images: number; dashboards: number; tables: number }>()
        
        // Initialize last 30 days
        for (let i = 29; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          historyMap.set(dateStr, { images: 0, dashboards: 0, tables: 0 })
        }

        // Fill in AI usage
        aiHistory?.forEach((row: any) => {
          const dateStr = row.usage_date
          if (historyMap.has(dateStr)) {
            const entry = historyMap.get(dateStr)!
            entry.images = row.used
          }
        })

        // Count dashboards by day
        dashboardHistory?.forEach((row: any) => {
          const dateStr = row.created_at.split('T')[0]
          if (historyMap.has(dateStr)) {
            const entry = historyMap.get(dateStr)!
            entry.dashboards++
          }
        })

        // Count tables by day
        tableHistory?.forEach((row: any) => {
          const dateStr = row.created_at.split('T')[0]
          if (historyMap.has(dateStr)) {
            const entry = historyMap.get(dateStr)!
            entry.tables++
          }
        })

        const history = Array.from(historyMap.entries()).map(([date, data]) => ({
          date,
          ...data
        }))

        // Calculate storage (mock for now - you'd need actual file storage data)
        const storageUsed = Math.round((totalRows * 0.001) + (totalDashboards || 0) * 0.5) // MB estimate
        const storageLimit = (prof as any)?.subscription_tier === 'pro' ? 10000 : 1000 // MB

        if (!mounted) return

        setProfile(prof)
        setMetrics({
          aiImages: { used: aiUsed, limit: aiLimit },
          dashboards: { 
            total: totalDashboards || 0, 
            published: publishedDashboards || 0, 
            drafts: (totalDashboards || 0) - (publishedDashboards || 0) 
          },
          dataTables: { total: totalTables, totalRows },
          storage: { used: storageUsed, limit: storageLimit },
          history
        })
      } catch (e: any) {
        if (mounted) {
          setError(e.message || 'Failed to load usage')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    return () => { mounted = false }
  }, [supabase, timeRange])

  const goToUpgrade = async () => {
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const json = await res.json()
      if (json.url) window.location.href = json.url
    } catch (e) {
      console.error('Upgrade error:', e)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse h-8 w-48 bg-gray-200 rounded mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border rounded-lg p-4 h-24 animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-6 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white border rounded-lg p-4 h-64 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="p-6 max-w-7xl mx-auto text-red-600">{error}</div>
  }

  const aiPercent = metrics ? Math.min(100, Math.round((metrics.aiImages.used / Math.max(metrics.aiImages.limit, 1)) * 100)) : 0
  const storagePercent = metrics ? Math.min(100, Math.round((metrics.storage.used / Math.max(metrics.storage.limit, 1)) * 100)) : 0

  const dashboardData = metrics ? [
    { name: 'Published', value: metrics.dashboards.published, color: '#10B981' },
    { name: 'Drafts', value: metrics.dashboards.drafts, color: '#6B7280' }
  ] : []

  // Filter history based on time range
  const filteredHistory = metrics?.history.slice(timeRange === '7d' ? -7 : timeRange === '30d' ? -30 : -90) || []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Usage & Analytics</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              timeRange === '7d' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            7 days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              timeRange === '30d' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            30 days
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              timeRange === '90d' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            90 days
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="text-blue-600" size={18} />
              <span className="text-sm font-medium text-gray-700">AI Images Today</span>
            </div>
            <span className="text-xs text-gray-500">{aiPercent}%</span>
          </div>
          <div className="text-2xl font-semibold mb-2">
            {metrics?.aiImages.used ?? 0} / {metrics?.aiImages.limit ?? 0}
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${aiPercent}%` }} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <LayoutDashboard className="text-purple-600" size={18} />
            <span className="text-sm font-medium text-gray-700">Dashboards</span>
          </div>
          <div className="text-2xl font-semibold mb-1">{metrics?.dashboards.total ?? 0}</div>
          <div className="text-xs text-gray-500">
            {metrics?.dashboards.published ?? 0} published, {metrics?.dashboards.drafts ?? 0} drafts
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="text-green-600" size={18} />
            <span className="text-sm font-medium text-gray-700">Data Tables</span>
          </div>
          <div className="text-2xl font-semibold mb-1">{metrics?.dataTables.total ?? 0}</div>
          <div className="text-xs text-gray-500">
            {(metrics?.dataTables.totalRows ?? 0).toLocaleString()} total rows
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="text-orange-600" size={18} />
              <span className="text-sm font-medium text-gray-700">Storage</span>
            </div>
            <span className="text-xs text-gray-500">{storagePercent}%</span>
          </div>
          <div className="text-2xl font-semibold mb-2">
            {metrics?.storage.used ?? 0} MB
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-red-500" style={{ width: `${storagePercent}%` }} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp size={16} />
            Activity Over Time
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={filteredHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <Legend />
              <Line type="monotone" dataKey="images" stroke="#3B82F6" name="AI Images" />
              <Line type="monotone" dataKey="dashboards" stroke="#8B5CF6" name="Dashboards" />
              <Line type="monotone" dataKey="tables" stroke="#10B981" name="Tables" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <BarChart3 size={16} />
            Dashboard Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={dashboardData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dashboardData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Usage Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Usage Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total AI Images (30d):</span>
            <span className="ml-2 font-medium">
              {metrics?.history.reduce((sum, h) => sum + h.images, 0) ?? 0}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Dashboards Created (30d):</span>
            <span className="ml-2 font-medium">
              {metrics?.history.reduce((sum, h) => sum + h.dashboards, 0) ?? 0}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Tables Created (30d):</span>
            <span className="ml-2 font-medium">
              {metrics?.history.reduce((sum, h) => sum + h.tables, 0) ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      {profile?.subscription_tier !== 'pro' && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="text-yellow-500" size={20} />
                <span className="text-lg font-medium text-gray-800">Upgrade to Pro</span>
              </div>
              <p className="text-sm text-gray-600 mb-1">Unlock premium features:</p>
              <ul className="text-sm text-gray-600 list-disc list-inside">
                <li>5x more daily AI image generations</li>
                <li>10x more storage space</li>
                <li>Priority processing and support</li>
                <li>Advanced analytics and insights</li>
              </ul>
            </div>
            <button 
              onClick={goToUpgrade} 
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}
    </div>
  )
}