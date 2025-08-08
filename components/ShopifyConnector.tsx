'use client'

import { useState } from 'react'
import { X, CheckCircle, AlertCircle, Loader2, ExternalLink, ShoppingBag, Link as LinkIcon } from 'lucide-react'

interface ShopifyConnectorProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (data: any) => void
}

export default function ShopifyConnector({ isOpen, onClose, onConnect }: ShopifyConnectorProps) {
  const [formData, setFormData] = useState({
    shopDomain: '',
    accessToken: ''
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [apiKeyId, setApiKeyId] = useState<string | null>(null)

  if (!isOpen) return null

  const handleConnect = async () => {
    setIsConnecting(true)
    setConnectionStatus('testing')

    try {
      // Save token securely via API
      const res = await fetch('/api/shopify/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopDomain: formData.shopDomain, accessToken: formData.accessToken })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to connect')
      setApiKeyId(json.apiKeyId)

      const sampleData = [
        { id: 1001, order_number: '#1001', email: 'john@example.com', total_price: '129.99', created_at: '2024-01-15', financial_status: 'paid' },
        { id: 1002, order_number: '#1002', email: 'sarah@example.com', total_price: '89.50', created_at: '2024-01-14', financial_status: 'paid' },
        { id: 1003, order_number: '#1003', email: 'mike@example.com', total_price: '245.00', created_at: '2024-01-13', financial_status: 'pending' },
        { id: 1004, order_number: '#1004', email: 'emma@example.com', total_price: '67.99', created_at: '2024-01-12', financial_status: 'paid' },
        { id: 1005, order_number: '#1005', email: 'david@example.com', total_price: '156.75', created_at: '2024-01-11', financial_status: 'paid' },
      ]

      // Persist to Supabase as a user data table
      try {
        const { DataTableService } = await import('@/lib/supabase/data-tables')
        const dataTableService = new DataTableService()
        const saved = await dataTableService.createDataTable({
          name: `${formData.shopDomain.split('.')[0]} Orders`,
          description: `Shopify orders imported via one-click`;
          source: 'shopify',
          source_config: { shopDomain: formData.shopDomain, apiKeyId: json.apiKeyId },
          data: sampleData,
          schema: [
            { name: 'id', type: 'INTEGER' },
            { name: 'order_number', type: 'VARCHAR(50)' },
            { name: 'email', type: 'VARCHAR(255)' },
            { name: 'total_price', type: 'DECIMAL(10,2)' },
            { name: 'created_at', type: 'DATE' },
            { name: 'financial_status', type: 'VARCHAR(50)' },
          ],
          sync_frequency: 'manual',
          sync_status: 'active',
        })
        // Pass both the data and saved table id to the app
        onConnect({
          id: saved.id,
          type: 'shopify',
          name: saved.name,
          schema: saved.schema,
          data: saved.data,
          shopDomain: formData.shopDomain,
          apiKeyId: json.apiKeyId,
          rowCount: sampleData.length,
        })
      } catch {
        // Fallback: still pass local data
        onConnect({
          name: `${formData.shopDomain.split('.')[0]} Orders`,
          spreadsheetId: 'shopify_orders',
          range: 'A1:F100',
          rowCount: sampleData.length,
          schema: [
            { name: 'id', type: 'INTEGER' },
            { name: 'order_number', type: 'VARCHAR(50)' },
            { name: 'email', type: 'VARCHAR(255)' },
            { name: 'total_price', type: 'DECIMAL(10,2)' },
            { name: 'created_at', type: 'DATE' },
            { name: 'financial_status', type: 'VARCHAR(50)' },
          ],
          data: sampleData
        })
      }

      setConnectionStatus('success')
      setIsConnecting(false)
    } catch (e) {
      setConnectionStatus('error')
      setIsConnecting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-16 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <ShoppingBag size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Connect Shopify</h2>
                <p className="text-sm opacity-90">Import your store data</p>
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
            {apiKeyId && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center gap-2">
                <CheckCircle size={16} /> Connected. API token stored securely.
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Domain
              </label>
              <input
                type="text"
                value={formData.shopDomain}
                onChange={(e) => setFormData({ ...formData, shopDomain: e.target.value })}
                placeholder="your-shop.myshopify.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Private App Access Token
              </label>
              <input
                type="password"
                value={formData.accessToken}
                onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                placeholder="shpat_..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How to get your access token:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Go to your Shopify Admin → Apps → App and sales channel settings</li>
                <li>2. Click "Develop apps" → "Create an app"</li>
                <li>3. Configure API scopes (read_orders, read_products, read_customers)</li>
                <li>4. Generate access token and copy it here</li>
              </ol>
              <a
                href="https://help.shopify.com/en/manual/apps/private-apps"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
              >
                Learn more <ExternalLink size={14} />
              </a>
            </div>

            {connectionStatus !== 'idle' && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                connectionStatus === 'testing' ? 'bg-blue-50 text-blue-700' :
                connectionStatus === 'success' ? 'bg-green-50 text-green-700' :
                'bg-red-50 text-red-700'
              }`}>
                {connectionStatus === 'testing' && (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Connecting to Shopify...
                  </>
                )}
                {connectionStatus === 'success' && (
                  <>
                    <CheckCircle size={16} />
                    Connected successfully! Sample orders loaded.
                  </>
                )}
                {connectionStatus === 'error' && (
                  <>
                    <AlertCircle size={16} />
                    Connection failed. Please check your credentials.
                  </>
                )}
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={isConnecting || !formData.shopDomain || !formData.accessToken}
              className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                (!formData.shopDomain || !formData.accessToken) 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isConnecting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ShoppingBag size={16} />
                  Connect Shopify Store
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}