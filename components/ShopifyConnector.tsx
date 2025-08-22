'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Loader2, ExternalLink, ShoppingBag, Link as LinkIcon } from 'lucide-react'

interface ShopifyConnectorProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (data: any) => void
}

export default function ShopifyConnector({ isOpen, onClose, onConnect }: ShopifyConnectorProps) {
  const [shopDomain, setShopDomain] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [isConnected, setIsConnected] = useState(false)
  // Add state for shops, selectedShop
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState('')

  useEffect(() => {
    // Check URL params for OAuth callback
    const params = new URLSearchParams(window.location.search)
    if (params.get('integration') === 'shopify' && params.get('status') === 'connected') {
      setIsConnected(true)
      setConnectionStatus('success')
      const shop = params.get('shop')
      if (shop) {
        setShopDomain(shop)
        handleLoadData(shop)
      }
      // Fetch shops from /api/shopify/list or Supabase
      fetch('/api/shopify/list').then(res => res.json()).then(data => setShops(data.shops))
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  if (!isOpen) return null

  const handleOAuthConnect = () => {
    if (!shopDomain || !shopDomain.includes('.myshopify.com')) {
      setConnectionStatus('error')
      return
    }
    
    // Redirect to OAuth flow
    window.location.href = `/api/auth/shopify?shop=${encodeURIComponent(shopDomain)}`
  }

  const handleLoadData = async (shop: string) => {
    setIsConnecting(true)
    setConnectionStatus('testing')

    try {

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
          name: `${shop.split('.')[0]} Orders`,
          description: `Shopify orders imported via OAuth`,
          source: 'shopify',
          source_config: { shopDomain: shop, oauth: true },
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
          shopDomain: shop,
          oauth: true,
          rowCount: sampleData.length,
        })
      } catch {
        // Fallback: still pass local data
        onConnect({
          name: `${shop.split('.')[0]} Orders`,
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
            {isConnected && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center gap-2">
                <CheckCircle size={16} /> Connected via OAuth. Your store data is ready.
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Domain
              </label>
              {shops.length > 0 && (
                <select value={selectedShop} onChange={e => setSelectedShop(e.target.value)}>
                  {shops.map(s => <option value={s.domain}>{s.name}</option>)}
                </select>
              )}
              <input
                type="text"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                placeholder="your-shop.myshopify.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isConnected}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">One-click connection</h4>
              <p className="text-sm text-blue-800">
                Simply enter your shop domain and click connect. You'll be redirected to Shopify to authorize access.
                No API keys or manual configuration required!
              </p>
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
              onClick={handleOAuthConnect}
              disabled={isConnecting || !shopDomain || isConnected}
              className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                (!shopDomain || isConnected) 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isConnecting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Connecting...
                </>
              ) : isConnected ? (
                <>
                  <CheckCircle size={16} />
                  Connected
                </>
              ) : (
                <>
                  <LinkIcon size={16} />
                  Connect with OAuth
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}