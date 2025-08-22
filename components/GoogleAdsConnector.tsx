'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Loader2, TrendingUp, Link as LinkIcon } from 'lucide-react'

interface GoogleAdsConnectorProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (data: any) => void
}

export default function GoogleAdsConnector({ isOpen, onClose, onConnect }: GoogleAdsConnectorProps) {
  // Remove manual input states and fields
  // Add states for accessToken, customers, selectedCustomer
  const [accessToken, setAccessToken] = useState('')
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState('')

  // Effect for callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('code')) {
      fetch('/api/auth/google-ads/callback?code=' + params.get('code'))
        .then(res => res.json())
        .then(data => {
          if (data.access_token) {
            setAccessToken(data.access_token)
            fetchCustomers(data.access_token)
          }
        })
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Fetch customers
  const fetchCustomers = async (token: string) => {
    const res = await fetch('https://googleads.googleapis.com/v17/customers:listAccessibleCustomers', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setCustomers(data.resourceNames || [])
  }

  // Update handleConnect to use selectedCustomer
  const handleConnect = () => {
    onConnect({
      type: 'googleads',
      customerId: selectedCustomer.replace('customers/', ''),
      accessToken
    })
  }

  // UI: If no token, show connect button
  if (!accessToken) {
    return <button onClick={() => window.location.href = '/api/auth/google-ads'}>Connect Google Ads</button>
  }

  // Then show customer select
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
            {/* isConnected state removed, as it's now handled by accessToken */}

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

            {/* connectionStatus state removed, as it's now handled by accessToken */}

            {/* isConnected && ( ... ) block removed */}

            {/* isConnected && ( ... ) block removed */}

            <button
              onClick={handleConnect}
              disabled={!selectedCustomer}
              className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                !selectedCustomer
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {selectedCustomer ? (
                <>
                  <CheckCircle size={16} />
                  Connect
                </>
              ) : (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Connecting...
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}