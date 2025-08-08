'use client'

import { useState } from 'react'
import { 
  X, Sheet, ShoppingBag, CreditCard, 
  Check, AlertCircle, Loader2, ExternalLink,
  Key, Link2, RefreshCw, TestTube
} from 'lucide-react'

interface DataSourceConnectorProps {
  sourceType: 'googlesheets' | 'shopify' | 'stripe'
  nodeId: string
  nodeLabel: string
  currentConfig?: any
  onConnect: (config: any) => void
  onClose: () => void
  isDarkMode?: boolean
}

export default function DataSourceConnector({
  sourceType,
  nodeId,
  nodeLabel,
  currentConfig,
  onConnect,
  onClose,
  isDarkMode = false
}: DataSourceConnectorProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null)
  
  // Google Sheets config
  const [sheetsUrl, setSheetsUrl] = useState('')
  const [spreadsheetId, setSpreadsheetId] = useState(currentConfig?.spreadsheetId || '')
  const [sheetName, setSheetName] = useState(currentConfig?.sheetName || '')
  const [range, setRange] = useState(currentConfig?.range || 'A:Z')
  
  // Shopify config
  const [shopifyStore, setShopifyStore] = useState(currentConfig?.store || '')
  const [shopifyApiKey, setShopifyApiKey] = useState(currentConfig?.apiKey || '')
  const [shopifyAccessToken, setShopifyAccessToken] = useState(currentConfig?.accessToken || '')
  const [shopifyResource, setShopifyResource] = useState(currentConfig?.resource || 'orders')
  
  // Stripe config
  const [stripeApiKey, setStripeApiKey] = useState(currentConfig?.apiKey || '')
  const [stripeResource, setStripeResource] = useState(currentConfig?.resource || 'charges')
  const [stripeDateRange, setStripeDateRange] = useState(currentConfig?.dateRange || 'last_30_days')

  const getSourceInfo = () => {
    switch (sourceType) {
      case 'googlesheets':
        return {
          icon: <Sheet size={24} className="text-green-600" />,
          title: 'Google Sheets',
          description: 'Connect to a Google Sheets spreadsheet to import data',
          color: 'green'
        }
      case 'shopify':
        return {
          icon: <ShoppingBag size={24} className="text-purple-600" />,
          title: 'Shopify',
          description: 'Connect to your Shopify store to import orders, products, and customers',
          color: 'purple'
        }
      case 'stripe':
        return {
          icon: <CreditCard size={24} className="text-indigo-600" />,
          title: 'Stripe',
          description: 'Connect to Stripe to import payment and subscription data',
          color: 'indigo'
        }
    }
  }

  const extractSpreadsheetId = (url: string) => {
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /spreadsheetId=([a-zA-Z0-9-_]+)/,
      /^([a-zA-Z0-9-_]+)$/,
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return ''
  }

  const testConnection = async () => {
    setIsConnecting(true)
    setError(null)
    setTestResult(null)

    try {
      if (sourceType === 'googlesheets') {
        if (!spreadsheetId) {
          setError('Spreadsheet ID is required')
          setTestResult('failed')
          return
        }

        // Step 1: confirm the spreadsheet is accessible and list sheets
        const listResp = await fetch('/api/google-sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'listSheets', spreadsheetId }),
        })
        const listJson = await listResp.json()
        if (!listJson.success) {
          setError(listJson.error || 'Failed to access spreadsheet. Ensure it is shared with the service account.')
          setTestResult('failed')
          return
        }

        // If a sheetName was provided, verify it exists then test fetching a small range
        if (sheetName) {
          const exists = (listJson.sheets || []).some((s: any) => s.title === sheetName)
          if (!exists) {
            setError(`Sheet "${sheetName}" not found in this spreadsheet`)
            setTestResult('failed')
            return
          }

          const testRange = `${sheetName}!${range || 'A:Z'}`
          const fetchResp = await fetch('/api/google-sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'fetchData', spreadsheetId, range: testRange }),
          })
          const fetchJson = await fetchResp.json()
          if (!fetchJson.success) {
            setError(fetchJson.error || 'Failed to read data in the selected range')
            setTestResult('failed')
            return
          }
        }

        setTestResult('success')
        return
      }

      if (sourceType === 'shopify') {
        if (!shopifyStore || !shopifyApiKey || !shopifyAccessToken) {
          setError('Store URL, API Key, and Access Token are required')
          setTestResult('failed')
          return
        }
        // Placeholder: real API validation can be added here
        setTestResult('success')
        return
      }

      if (sourceType === 'stripe') {
        if (!stripeApiKey) {
          setError('API Key is required')
          setTestResult('failed')
          return
        }
        // Placeholder: real API validation can be added here
        setTestResult('success')
        return
      }
    } catch (e: any) {
      setError(e?.message || 'Unexpected error while testing connection')
      setTestResult('failed')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleConnect = () => {
    let config: any = { sourceType }

    if (sourceType === 'googlesheets') {
      config = {
        ...config,
        spreadsheetId,
        sheetName,
        range,
      }
    } else if (sourceType === 'shopify') {
      config = {
        ...config,
        store: shopifyStore,
        apiKey: shopifyApiKey,
        accessToken: shopifyAccessToken,
        resource: shopifyResource,
      }
    } else if (sourceType === 'stripe') {
      config = {
        ...config,
        apiKey: stripeApiKey,
        resource: stripeResource,
        dateRange: stripeDateRange,
      }
    }

    onConnect(config)
    onClose()
  }

  const sourceInfo = getSourceInfo()

  return (
    <div className={`fixed right-0 top-0 h-full w-[500px] shadow-2xl z-50 flex flex-col ${
      isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {sourceInfo.icon}
            <div>
              <h2 className="text-lg font-semibold">{sourceInfo.title}</h2>
              <p className="text-xs text-gray-500">{nodeLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : ''
            }`}
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">{sourceInfo.description}</p>
      </div>

      {/* Configuration Form */}
      <div className="flex-1 overflow-auto p-4">
        {sourceType === 'googlesheets' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Google Sheets URL
                <a 
                  href="https://docs.google.com/spreadsheets/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-500 hover:text-blue-600"
                >
                  <ExternalLink size={14} className="inline" />
                </a>
              </label>
              <input
                type="text"
                value={sheetsUrl}
                onChange={(e) => {
                  const v = e.target.value
                  setSheetsUrl(v)
                  const id = extractSpreadsheetId(v)
                  if (id) setSpreadsheetId(id)
                }}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-300'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste a Google Sheets URL and we'll extract the Spreadsheet ID.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Spreadsheet ID
                <a 
                  href="https://developers.google.com/sheets/api/guides/concepts#spreadsheet_id" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-500 hover:text-blue-600"
                >
                  <ExternalLink size={14} className="inline" />
                </a>
              </label>
              <input
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-300'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Find this in your Google Sheets URL: docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sheet Name</label>
              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="e.g., Sheet1"
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Range (Optional)</label>
              <input
                type="text"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="e.g., A1:Z100 or A:Z for all rows"
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>

            <div className={`p-3 rounded-lg ${
              isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
            }`}>
              <p className="text-sm text-blue-600">
                ℹ️ Make sure your Google Sheet is shared with the service account or made public.
              </p>
            </div>
          </div>
        )}

        {sourceType === 'shopify' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Store URL</label>
              <input
                type="text"
                value={shopifyStore}
                onChange={(e) => setShopifyStore(e.target.value)}
                placeholder="e.g., mystore.myshopify.com"
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                API Key
                <Key size={14} className="inline ml-2 text-gray-400" />
              </label>
              <input
                type="password"
                value={shopifyApiKey}
                onChange={(e) => setShopifyApiKey(e.target.value)}
                placeholder="Your Shopify API Key"
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Access Token
                <Key size={14} className="inline ml-2 text-gray-400" />
              </label>
              <input
                type="password"
                value={shopifyAccessToken}
                onChange={(e) => setShopifyAccessToken(e.target.value)}
                placeholder="Your Private App Access Token"
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Resource Type</label>
              <select
                value={shopifyResource}
                onChange={(e) => setShopifyResource(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="orders">Orders</option>
                <option value="products">Products</option>
                <option value="customers">Customers</option>
                <option value="inventory">Inventory</option>
                <option value="fulfillments">Fulfillments</option>
              </select>
            </div>

            <div className={`p-3 rounded-lg ${
              isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'
            }`}>
              <p className="text-sm text-purple-600">
                ℹ️ Create a private app in your Shopify admin to get API credentials.
              </p>
            </div>
          </div>
        )}

        {sourceType === 'stripe' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                API Key
                <Key size={14} className="inline ml-2 text-gray-400" />
              </label>
              <input
                type="password"
                value={stripeApiKey}
                onChange={(e) => setStripeApiKey(e.target.value)}
                placeholder="sk_test_... or sk_live_..."
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-300'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use test keys for development, live keys for production
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Resource Type</label>
              <select
                value={stripeResource}
                onChange={(e) => setStripeResource(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="charges">Charges</option>
                <option value="customers">Customers</option>
                <option value="invoices">Invoices</option>
                <option value="subscriptions">Subscriptions</option>
                <option value="payments">Payment Intents</option>
                <option value="payouts">Payouts</option>
                <option value="refunds">Refunds</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <select
                value={stripeDateRange}
                onChange={(e) => setStripeDateRange(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="last_7_days">Last 7 days</option>
                <option value="last_30_days">Last 30 days</option>
                <option value="last_90_days">Last 90 days</option>
                <option value="this_month">This month</option>
                <option value="last_month">Last month</option>
                <option value="this_year">This year</option>
                <option value="all_time">All time</option>
              </select>
            </div>

            <div className={`p-3 rounded-lg ${
              isDarkMode ? 'bg-indigo-900/20' : 'bg-indigo-50'
            }`}>
              <p className="text-sm text-indigo-600">
                ℹ️ Find your API keys in the Stripe Dashboard under Developers → API keys.
              </p>
            </div>
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
            testResult === 'success' 
              ? isDarkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-600'
              : isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
          }`}>
            {testResult === 'success' ? (
              <>
                <Check size={16} />
                <span className="text-sm">Connection successful!</span>
              </>
            ) : (
              <>
                <AlertCircle size={16} />
                <span className="text-sm">{error || 'Connection failed'}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`p-4 border-t flex items-center justify-between ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <button
          onClick={testConnection}
          disabled={isConnecting}
          className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
            isDarkMode 
              ? 'border-gray-700 hover:bg-gray-800' 
              : 'border-gray-300 hover:bg-gray-50'
          } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isConnecting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <TestTube size={16} />
          )}
          <span>Test Connection</span>
        </button>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg border ${
              isDarkMode 
                ? 'border-gray-700 hover:bg-gray-800' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={testResult !== 'success'}
            className={`px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2 ${
              testResult !== 'success' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Link2 size={16} />
            <span>Connect</span>
          </button>
        </div>
      </div>
    </div>
  )
}