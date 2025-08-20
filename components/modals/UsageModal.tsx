'use client'

import React, { useEffect, useState } from 'react'
import { X, TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, Zap, Image, Table, Download, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface UsageModalProps {
  isOpen: boolean
  onClose: () => void
}

type TimeRange = '7d' | '30d' | '90d' | 'all'

export default function UsageModal({ isOpen, onClose }: UsageModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [profile, setProfile] = useState<any>(null)
  const [usageStats, setUsageStats] = useState({
    aiImages: { used: 0, limit: 0, percentage: 0 },
    dashboards: { count: 0, limit: 0, percentage: 0 },
    storage: { used: 0, limit: 0, percentage: 0 },
    apiCalls: { count: 0, limit: 0, percentage: 0 }
  })
  const [activityData, setActivityData] = useState<any[]>([])
  const [resourceBreakdown, setResourceBreakdown] = useState<any[]>([])
  const [dailyUsage, setDailyUsage] = useState<any[]>([])
  const [topFeatures, setTopFeatures] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      fetchUsageData()
    }
  }, [isOpen, timeRange])

  const fetchUsageData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(prof)

      // Calculate date range
      const now = new Date()
      let startDate = new Date()
      switch (timeRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
        case '90d':
          startDate.setDate(now.getDate() - 90)
          break
        case 'all':
          startDate = new Date('2024-01-01')
          break
      }

      // Fetch AI image usage
      const { data: aiUsage } = await (supabase as any)
        .from('ai_image_usage')
        .select('*')
        .eq('user_id', user.id)
        .gte('usage_date', startDate.toISOString().split('T')[0])
        .order('usage_date', { ascending: true })

      // Fetch dashboard count
      const { count: dashboardCount } = await supabase
        .from('dashboards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Fetch table count
      const { count: tableCount } = await supabase
        .from('user_data_tables')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Calculate usage stats
      const isProUser = (prof as any)?.subscription_tier === 'pro'
      const aiLimit = isProUser ? 100 : 5
      const currentAiUsage = aiUsage?.reduce((sum: number, day: any) => sum + (day.used || 0), 0) || 0
      const dashboardLimit = isProUser ? 999 : 1
      const storageLimit = isProUser ? 10240 : 1024 // MB
      const apiLimit = isProUser ? 10000 : 1000

      setUsageStats({
        aiImages: {
          used: currentAiUsage,
          limit: aiLimit,
          percentage: Math.min((currentAiUsage / aiLimit) * 100, 100)
        },
        dashboards: {
          count: dashboardCount || 0,
          limit: dashboardLimit,
          percentage: Math.min(((dashboardCount || 0) / dashboardLimit) * 100, 100)
        },
        storage: {
          used: 256, // Mock data - would calculate from actual storage
          limit: storageLimit,
          percentage: Math.min((256 / storageLimit) * 100, 100)
        },
        apiCalls: {
          count: 450, // Mock data - would track actual API calls
          limit: apiLimit,
          percentage: Math.min((450 / apiLimit) * 100, 100)
        }
      })

      // Process activity data for charts
      const activityByDay: { [key: string]: any } = {}
      const today = new Date()
      
      // Initialize all days in range
      for (let i = 0; i < (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90); i++) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        activityByDay[dateStr] = {
          date: dateStr,
          aiImages: 0,
          dashboards: 0,
          tables: 0,
          total: 0
        }
      }

      // Add AI usage data
      aiUsage?.forEach((day: any) => {
        if (activityByDay[day.usage_date]) {
          activityByDay[day.usage_date].aiImages = day.used || 0
          activityByDay[day.usage_date].total += day.used || 0
        }
      })

      // Convert to array and sort
      const activityArray = Object.values(activityByDay)
        .sort((a: any, b: any) => a.date.localeCompare(b.date))
        .map((day: any) => ({
          ...day,
          date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))

      setActivityData(activityArray)

      // Set daily usage for area chart
      setDailyUsage(activityArray.map((day: any) => ({
        date: day.date,
        value: day.total
      })))

      // Resource breakdown for pie chart
      setResourceBreakdown([
        { name: 'AI Images', value: currentAiUsage, color: '#8B5CF6' },
        { name: 'Dashboards', value: dashboardCount || 0, color: '#3B82F6' },
        { name: 'Data Tables', value: tableCount || 0, color: '#10B981' },
        { name: 'API Calls', value: 45, color: '#F59E0B' } // Mock
      ])

      // Top features usage
      setTopFeatures([
        { name: 'AI Image Generation', usage: currentAiUsage, trend: '+12%' },
        { name: 'Dashboard Creation', usage: dashboardCount || 0, trend: '+5%' },
        { name: 'Data Import', usage: tableCount || 0, trend: '+8%' },
        { name: 'Chart Customization', usage: 23, trend: '+15%' }, // Mock
        { name: 'Sharing & Export', usage: 12, trend: '+3%' } // Mock
      ])

    } catch (error) {
      console.error('Error fetching usage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportUsageReport = () => {
    const report = {
      period: timeRange,
      generated: new Date().toISOString(),
      stats: usageStats,
      activity: activityData,
      features: topFeatures
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usage-report-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-600'
    if (percentage < 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressBarColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500'
    if (percentage < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold font-dm-mono uppercase">Usage Analytics</h2>
            <div className="flex items-center gap-2">
              {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {range === 'all' ? 'All Time' : `Last ${range}`}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportUsageReport}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export Report"
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Usage Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Image size={20} className="text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">AI Images</span>
                    </div>
                    <span className={`text-sm font-bold ${getUsageColor(usageStats.aiImages.percentage)}`}>
                      {usageStats.aiImages.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="text-2xl font-bold">{usageStats.aiImages.used}</span>
                    <span className="text-sm text-gray-600"> / {usageStats.aiImages.limit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressBarColor(usageStats.aiImages.percentage)}`}
                      style={{ width: `${usageStats.aiImages.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={20} className="text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Dashboards</span>
                    </div>
                    <span className={`text-sm font-bold ${getUsageColor(usageStats.dashboards.percentage)}`}>
                      {usageStats.dashboards.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="text-2xl font-bold">{usageStats.dashboards.count}</span>
                    <span className="text-sm text-gray-600"> / {usageStats.dashboards.limit === 999 ? '∞' : usageStats.dashboards.limit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressBarColor(usageStats.dashboards.percentage)}`}
                      style={{ width: `${usageStats.dashboards.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Table size={20} className="text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Storage</span>
                    </div>
                    <span className={`text-sm font-bold ${getUsageColor(usageStats.storage.percentage)}`}>
                      {usageStats.storage.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="text-2xl font-bold">{usageStats.storage.used}MB</span>
                    <span className="text-sm text-gray-600"> / {(usageStats.storage.limit / 1024).toFixed(1)}GB</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressBarColor(usageStats.storage.percentage)}`}
                      style={{ width: `${usageStats.storage.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap size={20} className="text-amber-600" />
                      <span className="text-sm font-medium text-gray-700">API Calls</span>
                    </div>
                    <span className={`text-sm font-bold ${getUsageColor(usageStats.apiCalls.percentage)}`}>
                      {usageStats.apiCalls.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="text-2xl font-bold">{usageStats.apiCalls.count}</span>
                    <span className="text-sm text-gray-600"> / {usageStats.apiCalls.limit.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressBarColor(usageStats.apiCalls.percentage)}`}
                      style={{ width: `${usageStats.apiCalls.percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Activity Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Activity */}
                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity size={20} />
                    Daily Activity
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={dailyUsage}>
                      <defs>
                        <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#3B82F6" fillOpacity={1} fill="url(#colorUsage)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Resource Breakdown */}
                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <PieChartIcon size={20} />
                    Resource Breakdown
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={resourceBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {resourceBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Activity by Type */}
              <div className="bg-white border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp size={20} />
                  Activity Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="aiImages" name="AI Images" fill="#8B5CF6" />
                    <Bar dataKey="dashboards" name="Dashboards" fill="#3B82F6" />
                    <Bar dataKey="tables" name="Tables" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Features */}
              <div className="bg-white border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Top Features Used</h3>
                <div className="space-y-3">
                  {topFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                          {index + 1}
                        </div>
                        <span className="font-medium">{feature.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600">{feature.usage} uses</span>
                        <span className={`text-sm font-medium ${
                          feature.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {feature.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage Tips */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3">Optimization Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Reduce Image Generation</p>
                      <p className="text-xs text-gray-600">Consider reusing existing images when possible</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Optimize Storage</p>
                      <p className="text-xs text-gray-600">Remove unused dashboards and data tables</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Batch API Calls</p>
                      <p className="text-xs text-gray-600">Group multiple operations together</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Upgrade Your Plan</p>
                      <p className="text-xs text-gray-600">Get more resources with Pro or Enterprise</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}