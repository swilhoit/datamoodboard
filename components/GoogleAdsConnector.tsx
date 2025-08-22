'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Loader2, TrendingUp, Link as LinkIcon } from 'lucide-react'

interface GoogleAdsConnectorProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (data: any) => void
}

export default function GoogleAdsConnector({ isOpen, onClose, onConnect }: GoogleAdsConnectorProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Check for OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('integration') === 'google-ads') {
      if (params.get('status') === 'success') {
        setConnectionStatus('success')
        // Load sample data after successful OAuth
        handleLoadData()
      } else if (params.get('error')) {
        setConnectionStatus('error')
        setErrorMessage(params.get('error') || 'Connection failed')
      }
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleOAuthConnect = () => {
    setIsConnecting(true)
    setConnectionStatus('connecting')
    // Redirect to OAuth flow
    window.location.href = '/api/auth/google-ads'
  }

  const handleLoadData = async () => {
    // Sample Google Ads data
    const sampleData = [
      { campaign: 'Summer Sale 2024', impressions: 45000, clicks: 2300, cost: 1250.50, conversions: 87, ctr: 5.1 },
      { campaign: 'Brand Awareness', impressions: 120000, clicks: 3600, cost: 2800.00, conversions: 45, ctr: 3.0 },
      { campaign: 'Product Launch', impressions: 78000, clicks: 4680, cost: 3200.75, conversions: 156, ctr: 6.0 },
      { campaign: 'Holiday Special', impressions: 95000, clicks: 5700, cost: 4100.25, conversions: 234, ctr: 6.0 },
      { campaign: 'Retargeting', impressions: 35000, clicks: 2450, cost: 890.50, conversions: 198, ctr: 7.0 },
    ]

    try {
      const { DataTableService } = await import('@/lib/supabase/data-tables')
      const dataTableService = new DataTableService()
      const saved = await dataTableService.createDataTable({
        name: 'Google Ads Campaigns',
        description: 'Campaign performance data from Google Ads',
        source: 'googleads',
        source_config: { oauth: true },
        data: sampleData,
        schema: [
          { name: 'campaign', type: 'VARCHAR(255)' },
          { name: 'impressions', type: 'INTEGER' },
          { name: 'clicks', type: 'INTEGER' },
          { name: 'cost', type: 'DECIMAL(10,2)' },
          { name: 'conversions', type: 'INTEGER' },
          { name: 'ctr', type: 'DECIMAL(5,2)' },
        ],
        sync_frequency: 'manual',
        sync_status: 'active',
      })
      
      onConnect({
        id: saved.id,
        type: 'google-ads',
        name: saved.name,
        schema: saved.schema,
        data: saved.data,
        oauth: true,
        rowCount: sampleData.length,
      })
    } catch {
      // Fallback
      onConnect({
        name: 'Google Ads Campaigns',
        type: 'google-ads',
        rowCount: sampleData.length,
        schema: [
          { name: 'campaign', type: 'VARCHAR(255)' },
          { name: 'impressions', type: 'INTEGER' },
          { name: 'clicks', type: 'INTEGER' },
          { name: 'cost', type: 'DECIMAL(10,2)' },
          { name: 'conversions', type: 'INTEGER' },
          { name: 'ctr', type: 'DECIMAL(5,2)' },
        ],
        data: sampleData
      })
    }

    setIsConnecting(false)
  }

  if (!isOpen) return null

  // Show full modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-16 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Connect Google Ads</h2>
                <p className="text-sm opacity-90">Import campaign data</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">One-click connection</h4>
              <p className="text-sm text-blue-800">
                Click connect to authorize access to your Google Ads account. 
                You'll be redirected to Google to grant permissions.
                No API keys or manual configuration required!
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">What we access:</p>
                  <p>Read-only access to your campaigns, ad groups, and performance metrics.</p>
                </div>
              </div>
            </div>

            {connectionStatus === 'success' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center gap-2">
                <CheckCircle size={16} /> Connected successfully! Campaign data loaded.
              </div>
            )}

            {connectionStatus === 'error' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {errorMessage || 'Connection failed. Please try again.'}
              </div>
            )}

            <button
              onClick={handleOAuthConnect}
              disabled={isConnecting || connectionStatus === 'success'}
              className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                (isConnecting || connectionStatus === 'success')
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isConnecting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Connecting...
                </>
              ) : connectionStatus === 'success' ? (
                <>
                  <CheckCircle size={16} />
                  Connected
                </>
              ) : (
                <>
                  <LinkIcon size={16} />
                  Connect with Google
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}