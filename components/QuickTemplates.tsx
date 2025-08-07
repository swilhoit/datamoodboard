'use client'

import { useState } from 'react'
import { 
  Users, Globe, ShoppingCart, TrendingUp, BarChart3, PieChart, 
  DollarSign, Target, Zap, Calendar, MapPin, Package, 
  CreditCard, UserCheck, MousePointer, Clock, Sparkles,
  ChevronRight, X
} from 'lucide-react'

interface QuickTemplatesProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: any) => void
  mode: 'dashboard' | 'data'
}

export const dataTemplates = {
  customers: {
    name: 'Customer Analytics',
    icon: Users,
    color: 'bg-blue-500',
    description: 'Analyze customer segments, retention, and lifetime value',
    metrics: [
      { name: 'Total Customers', type: 'number', icon: Users },
      { name: 'New vs Returning', type: 'pie', icon: UserCheck },
      { name: 'Customer Segments', type: 'bar', icon: PieChart },
      { name: 'Lifetime Value', type: 'line', icon: DollarSign },
      { name: 'Churn Rate', type: 'line', icon: TrendingUp },
      { name: 'Geographic Distribution', type: 'map', icon: MapPin },
    ],
    sampleData: {
      overview: [
        { metric: 'Total Customers', value: 45230, change: 12.5 },
        { metric: 'Active Users', value: 32100, change: 8.3 },
        { metric: 'Avg LTV', value: 1250, change: 15.2 },
        { metric: 'Churn Rate', value: 5.2, change: -2.1 },
      ],
      segments: [
        { segment: 'Enterprise', customers: 1200, revenue: 2400000, growth: 18 },
        { segment: 'Mid-Market', customers: 5600, revenue: 1680000, growth: 12 },
        { segment: 'Small Business', customers: 15000, revenue: 900000, growth: 25 },
        { segment: 'Individual', customers: 23430, revenue: 468600, growth: 8 },
      ],
      retention: [
        { month: 'Jan', retained: 95, churned: 5 },
        { month: 'Feb', retained: 92, churned: 8 },
        { month: 'Mar', retained: 90, churned: 10 },
        { month: 'Apr', retained: 88, churned: 12 },
        { month: 'May', retained: 87, churned: 13 },
        { month: 'Jun', retained: 86, churned: 14 },
      ],
    },
  },
  visitors: {
    name: 'Website Analytics',
    icon: Globe,
    color: 'bg-green-500',
    description: 'Track website traffic, user behavior, and conversion rates',
    metrics: [
      { name: 'Page Views', type: 'line', icon: MousePointer },
      { name: 'Unique Visitors', type: 'line', icon: Users },
      { name: 'Bounce Rate', type: 'area', icon: TrendingUp },
      { name: 'Session Duration', type: 'bar', icon: Clock },
      { name: 'Traffic Sources', type: 'pie', icon: Globe },
      { name: 'Device Types', type: 'pie', icon: Package },
    ],
    sampleData: {
      traffic: [
        { date: 'Mon', pageViews: 12500, visitors: 3200, bounceRate: 42 },
        { date: 'Tue', pageViews: 15200, visitors: 3800, bounceRate: 38 },
        { date: 'Wed', pageViews: 14800, visitors: 3600, bounceRate: 40 },
        { date: 'Thu', pageViews: 16500, visitors: 4100, bounceRate: 35 },
        { date: 'Fri', pageViews: 18200, visitors: 4500, bounceRate: 33 },
        { date: 'Sat', pageViews: 11200, visitors: 2800, bounceRate: 45 },
        { date: 'Sun', pageViews: 10500, visitors: 2600, bounceRate: 48 },
      ],
      sources: [
        { source: 'Organic Search', visits: 42000, percentage: 35 },
        { source: 'Direct', visits: 30000, percentage: 25 },
        { source: 'Social Media', visits: 24000, percentage: 20 },
        { source: 'Referral', visits: 18000, percentage: 15 },
        { source: 'Email', visits: 6000, percentage: 5 },
      ],
      devices: [
        { device: 'Desktop', users: 55000, percentage: 55 },
        { device: 'Mobile', users: 35000, percentage: 35 },
        { device: 'Tablet', users: 10000, percentage: 10 },
      ],
    },
  },
  sales: {
    name: 'Sales & Revenue',
    icon: DollarSign,
    color: 'bg-purple-500',
    description: 'Monitor sales performance, revenue trends, and product analytics',
    metrics: [
      { name: 'Revenue Trend', type: 'area', icon: TrendingUp },
      { name: 'Sales by Product', type: 'bar', icon: Package },
      { name: 'Revenue by Region', type: 'map', icon: MapPin },
      { name: 'Conversion Funnel', type: 'funnel', icon: Target },
      { name: 'Average Order Value', type: 'line', icon: ShoppingCart },
      { name: 'Payment Methods', type: 'pie', icon: CreditCard },
    ],
    sampleData: {
      revenue: [
        { month: 'Jan', revenue: 125000, orders: 1250, aov: 100 },
        { month: 'Feb', revenue: 142000, orders: 1420, aov: 100 },
        { month: 'Mar', revenue: 168000, orders: 1600, aov: 105 },
        { month: 'Apr', revenue: 155000, orders: 1450, aov: 107 },
        { month: 'May', revenue: 182000, orders: 1650, aov: 110 },
        { month: 'Jun', revenue: 195000, orders: 1700, aov: 115 },
      ],
      products: [
        { product: 'Product A', sales: 450000, units: 4500 },
        { product: 'Product B', sales: 380000, units: 7600 },
        { product: 'Product C', sales: 290000, units: 2900 },
        { product: 'Product D', sales: 220000, units: 5500 },
        { product: 'Product E', sales: 180000, units: 3600 },
      ],
      funnel: [
        { stage: 'Visits', value: 100000 },
        { stage: 'Product Views', value: 45000 },
        { stage: 'Add to Cart', value: 15000 },
        { stage: 'Checkout', value: 8000 },
        { stage: 'Purchase', value: 5000 },
      ],
    },
  },
  marketing: {
    name: 'Marketing Channels',
    icon: Target,
    color: 'bg-orange-500',
    description: 'Analyze marketing campaign performance and ROI',
    metrics: [
      { name: 'Channel Performance', type: 'bar', icon: BarChart3 },
      { name: 'Campaign ROI', type: 'scatter', icon: DollarSign },
      { name: 'Lead Generation', type: 'line', icon: Users },
      { name: 'Cost per Acquisition', type: 'bar', icon: Target },
      { name: 'Email Metrics', type: 'area', icon: Globe },
      { name: 'Social Engagement', type: 'line', icon: TrendingUp },
    ],
    sampleData: {
      channels: [
        { channel: 'Google Ads', spend: 25000, leads: 1200, conversions: 150, roi: 2.4 },
        { channel: 'Facebook', spend: 18000, leads: 950, conversions: 95, roi: 1.8 },
        { channel: 'LinkedIn', spend: 12000, leads: 400, conversions: 80, roi: 3.2 },
        { channel: 'Email', spend: 5000, leads: 800, conversions: 120, roi: 4.5 },
        { channel: 'Content', spend: 8000, leads: 600, conversions: 60, roi: 2.1 },
      ],
      campaigns: [
        { name: 'Summer Sale', cost: 15000, revenue: 65000, roi: 333 },
        { name: 'Product Launch', cost: 25000, revenue: 85000, roi: 240 },
        { name: 'Holiday Special', cost: 20000, revenue: 95000, roi: 375 },
        { name: 'Brand Awareness', cost: 10000, revenue: 25000, roi: 150 },
      ],
      email: [
        { metric: 'Open Rate', value: 24.5, benchmark: 21.3 },
        { metric: 'Click Rate', value: 3.2, benchmark: 2.6 },
        { metric: 'Conversion Rate', value: 1.8, benchmark: 1.5 },
        { metric: 'Unsubscribe Rate', value: 0.5, benchmark: 0.7 },
      ],
    },
  },
  performance: {
    name: 'Performance Metrics',
    icon: Zap,
    color: 'bg-red-500',
    description: 'Track KPIs, system performance, and operational metrics',
    metrics: [
      { name: 'KPI Dashboard', type: 'number', icon: Target },
      { name: 'System Uptime', type: 'line', icon: Zap },
      { name: 'Response Time', type: 'area', icon: Clock },
      { name: 'Error Rates', type: 'line', icon: TrendingUp },
      { name: 'Resource Usage', type: 'bar', icon: BarChart3 },
      { name: 'API Performance', type: 'scatter', icon: Globe },
    ],
    sampleData: {
      kpis: [
        { kpi: 'Uptime', value: 99.95, target: 99.9, status: 'green' },
        { kpi: 'Response Time', value: 245, target: 300, status: 'green' },
        { kpi: 'Error Rate', value: 0.12, target: 0.5, status: 'green' },
        { kpi: 'Throughput', value: 5200, target: 5000, status: 'green' },
      ],
      performance: [
        { time: '00:00', cpu: 45, memory: 62, disk: 38, network: 28 },
        { time: '04:00', cpu: 32, memory: 58, disk: 38, network: 15 },
        { time: '08:00', cpu: 68, memory: 72, disk: 42, network: 55 },
        { time: '12:00', cpu: 82, memory: 78, disk: 45, network: 72 },
        { time: '16:00', cpu: 75, memory: 75, disk: 44, network: 68 },
        { time: '20:00', cpu: 58, memory: 68, disk: 40, network: 45 },
      ],
      apis: [
        { endpoint: '/api/users', calls: 125000, avgTime: 125, errors: 42 },
        { endpoint: '/api/products', calls: 85000, avgTime: 95, errors: 28 },
        { endpoint: '/api/orders', calls: 45000, avgTime: 245, errors: 15 },
        { endpoint: '/api/analytics', calls: 32000, avgTime: 450, errors: 8 },
      ],
    },
  },
}

export const dashboardLayouts = {
  executive: {
    name: 'Executive Dashboard',
    description: 'High-level overview for C-suite',
    charts: [
      { type: 'number', size: 'small', data: 'kpi' },
      { type: 'line', size: 'medium', data: 'revenue' },
      { type: 'pie', size: 'small', data: 'segments' },
      { type: 'bar', size: 'medium', data: 'products' },
    ],
  },
  operations: {
    name: 'Operations Dashboard',
    description: 'Monitor operational efficiency',
    charts: [
      { type: 'line', size: 'large', data: 'performance' },
      { type: 'bar', size: 'medium', data: 'resources' },
      { type: 'scatter', size: 'medium', data: 'correlation' },
    ],
  },
  marketing: {
    name: 'Marketing Dashboard',
    description: 'Campaign and channel analytics',
    charts: [
      { type: 'funnel', size: 'medium', data: 'conversion' },
      { type: 'bar', size: 'large', data: 'channels' },
      { type: 'line', size: 'medium', data: 'trends' },
    ],
  },
}

export default function QuickTemplates({ isOpen, onClose, onSelectTemplate, mode }: QuickTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSelectTemplate = (templateKey: string) => {
    const template = dataTemplates[templateKey as keyof typeof dataTemplates]
    onSelectTemplate({
      ...template,
      key: templateKey,
      mode,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[900px] max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles size={24} />
                Quick Start Templates
              </h2>
              <p className="text-blue-100 mt-1">
                Choose a template to instantly create data visualizations
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Template Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(dataTemplates).map(([key, template]) => {
              const Icon = template.icon
              return (
                <div
                  key={key}
                  className={`relative group cursor-pointer transition-all ${
                    hoveredTemplate === key ? 'scale-105' : ''
                  }`}
                  onMouseEnter={() => setHoveredTemplate(key)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                  onClick={() => handleSelectTemplate(key)}
                >
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-blue-500 hover:shadow-xl transition-all">
                    <div className={`w-12 h-12 ${template.color} rounded-lg flex items-center justify-center text-white mb-3`}>
                      <Icon size={24} />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.metrics.slice(0, 3).map((metric, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded"
                        >
                          {metric.name}
                        </span>
                      ))}
                      {template.metrics.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                          +{template.metrics.length - 3} more
                        </span>
                      )}
                    </div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={20} className="text-blue-500" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Dashboard Layouts Section */}
          {mode === 'dashboard' && (
            <>
              <div className="mt-8 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Dashboard Layouts
                </h3>
                <p className="text-sm text-gray-600">
                  Pre-configured dashboard layouts for different roles
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(dashboardLayouts).map(([key, layout]) => (
                  <div
                    key={key}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                    onClick={() => {
                      onSelectTemplate({
                        type: 'layout',
                        layout: layout,
                        key: key,
                      })
                      onClose()
                    }}
                  >
                    <h4 className="font-medium text-gray-900 mb-1">
                      {layout.name}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {layout.description}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Templates include sample data to get you started quickly
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}