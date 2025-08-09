'use client'

import { useState, useEffect } from 'react'
import { 
  X, Sheet, ShoppingBag, CreditCard, Megaphone,
  Check, AlertCircle, Loader2, ExternalLink,
  Key, Link2, RefreshCw, TestTube, FileSpreadsheet, Filter
} from 'lucide-react'
import Papa from 'papaparse'

interface DataSourceConnectorProps {
  sourceType: 'googlesheets' | 'shopify' | 'stripe' | 'googleads' | 'csv'
  nodeId: string
  nodeLabel: string
  currentConfig?: any
  onConnect: (config: any) => void
  onClose: () => void
  isDarkMode?: boolean
  // Layout controls: default is a right-side sidebar; when floating, position next to a node; inline embeds within a parent panel
  layout?: 'sidebar' | 'floating' | 'inline'
  position?: { left: number; top: number }
}

export default function DataSourceConnector({
  sourceType,
  nodeId,
  nodeLabel,
  currentConfig,
  onConnect,
  onClose,
  isDarkMode = false,
  layout = 'sidebar',
  position
}: DataSourceConnectorProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null)
  
  // Google Sheets config
  const [sheetsUrl, setSheetsUrl] = useState(currentConfig?.spreadsheetUrl || '')
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

  // Google Ads config (simplified)
  const [googleAdsCustomerId, setGoogleAdsCustomerId] = useState(currentConfig?.customerId || '')
  const [googleAdsDeveloperToken, setGoogleAdsDeveloperToken] = useState(currentConfig?.developerToken || '')
  const [googleAdsOAuthToken, setGoogleAdsOAuthToken] = useState(currentConfig?.oauthToken || '')
  const [googleAdsResource, setGoogleAdsResource] = useState(currentConfig?.resource || 'campaigns')

  // CSV config
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvHasHeaders, setCsvHasHeaders] = useState(true)
  const [csvParsedData, setCsvParsedData] = useState<any[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvSchema, setCsvSchema] = useState<any[]>([])

  // Query builder state (simple client-side query definition)
  const [showQueryBuilder, setShowQueryBuilder] = useState(false)
  const [availableFields, setAvailableFields] = useState<string[]>([])
  const [selectedColumnsList, setSelectedColumnsList] = useState<string[]>([])
  const [filters, setFilters] = useState<Array<{ field: string; operator: string; value: string }>>([
    { field: '', operator: 'contains', value: '' },
  ])
  const [sortField, setSortField] = useState('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [limit, setLimit] = useState<string>('')

  // Static field definitions for standardized integrations
  const SHOPIFY_FIELDS_BY_RESOURCE: Record<string, string[]> = {
    orders: [
      'id','name','created_at','updated_at','currency','financial_status','fulfillment_status',
      'subtotal_price','total_discount','total_tax','total_price','customer_id','customer_email','line_items_count','tags'
    ],
    products: [
      'id','title','vendor','product_type','status','created_at','updated_at','variants_count','tags','price_min','price_max','inventory_quantity'
    ],
    customers: [
      'id','email','first_name','last_name','state','orders_count','total_spent','created_at','updated_at','verified_email','phone','city','province','country'
    ],
    inventory: [
      'item_id','sku','product_id','location_id','available','updated_at'
    ],
    fulfillments: [
      'id','order_id','status','tracking_company','tracking_number','created_at','updated_at'
    ],
  }

  const GOOGLE_ADS_FIELDS_BY_RESOURCE: Record<string, string[]> = {
    campaigns: [
      'id','name','status','clicks','impressions','cost_micros','conversions','ctr','cpc_micros'
    ],
    ad_groups: [
      'id','name','campaign_id','status','clicks','impressions','cost_micros','cpc_micros'
    ],
    ads: [
      'id','ad_group_id','type','status','clicks','impressions','cost_micros'
    ],
    metrics: [
      'date','campaign_id','clicks','impressions','cost_micros','conversions','ctr','cpc_micros'
    ],
  }

  // Populate fields based on source selection
  useEffect(() => {
    setAvailableFields([])
    setSelectedColumnsList([])
    setFilters([{ field: '', operator: 'contains', value: '' }])
    setSortField('')
  }, [sourceType])

  // Update fields when Shopify resource changes
  useEffect(() => {
    if (sourceType === 'shopify') {
      setAvailableFields(SHOPIFY_FIELDS_BY_RESOURCE[shopifyResource] || [])
    }
  }, [sourceType, shopifyResource])

  // Update fields when Google Ads resource changes
  useEffect(() => {
    if (sourceType === 'googleads') {
      setAvailableFields(GOOGLE_ADS_FIELDS_BY_RESOURCE[googleAdsResource] || [])
    }
  }, [sourceType, googleAdsResource])

  const detectCsvType = (values: any[]): string => {
    let hasNumber = false
    let hasBoolean = false
    let hasDate = false
    for (const v of values) {
      if (v == null || v === '') continue
      if (typeof v === 'boolean') { hasBoolean = true; continue }
      if (typeof v === 'number') { hasNumber = true; continue }
      const s = String(v).trim()
      if (/^\d+$/.test(s)) { hasNumber = true; continue }
      if (!isNaN(Date.parse(s))) { hasDate = true; continue }
    }
    if (hasBoolean && !hasNumber && !hasDate) return 'BOOLEAN'
    if (hasDate && !hasNumber) return 'DATE'
    if (hasNumber && !hasDate) return 'NUMBER'
    return 'TEXT'
  }

  const getSourceInfo = () => {
    switch (sourceType) {
      case 'googlesheets':
        return {
          icon: <Sheet size={24} className="text-green-600" />,
          title: 'Google Sheets',
          description: 'Connect to a Google Sheets spreadsheet to import data',
          color: 'green'
        }
      case 'csv':
        return {
          icon: <FileSpreadsheet size={24} className="text-emerald-600" />,
          title: 'CSV Upload',
          description: 'Upload a CSV file and import its rows into a table',
          color: 'emerald'
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
      case 'googleads':
        return {
          icon: <Megaphone size={24} className="text-yellow-600" />,
          title: 'Google Ads',
          description: 'Connect to Google Ads to import campaigns, ad groups, and metrics',
          color: 'yellow'
        }
    }
  }

  const extractSpreadsheetId = (url: string) => {
    const trimmed = (url || '').trim()
    const patterns = [
      /\/spreadsheets\/(?:u\/\d+\/)?d\/([a-zA-Z0-9-_]+)/, // Handles /spreadsheets/d/ and /spreadsheets/u/0/d/
      /spreadsheetId=([a-zA-Z0-9-_]+)/,
      /^([a-zA-Z0-9-_]+)$/,
    ]
    for (const pattern of patterns) {
      const match = trimmed.match(pattern)
      if (match) return match[1]
    }
    return ''
  }

  const testConnection = async () => {
    setIsConnecting(true)
    setError(null)
    setTestResult(null)

    try {
      if (sourceType === 'csv') {
        if (!csvFile) {
          setError('Please choose a CSV file')
          setTestResult('failed')
          return
        }
        await new Promise<void>((resolve, reject) => {
          Papa.parse(csvFile as File, {
            header: csvHasHeaders,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results: any) => {
              try {
                const rows: any[] = results.data as any[]
                const headers: string[] = (results.meta?.fields as string[]) || Object.keys(rows[0] || {})
                const schema = headers.map((h: string) => {
                  const columnValues = rows.map((r) => r[h])
                  return { name: h, type: detectCsvType(columnValues) }
                })
                setCsvParsedData(rows)
                setCsvHeaders(headers)
                setCsvSchema(schema)
                // Expose CSV headers as available fields for query builder
                setAvailableFields(headers)
                setTestResult('success')
                resolve()
              } catch (e) {
                reject(e)
              }
            },
            error: (err: any) => reject(err),
          })
        })
        return
      }
      if (sourceType === 'googlesheets') {
        // Auto-extract from URL if Spreadsheet ID not yet set
        let idToUse = spreadsheetId
        if (!idToUse && sheetsUrl) {
          const extracted = extractSpreadsheetId(sheetsUrl)
          if (extracted) {
            idToUse = extracted
            setSpreadsheetId(extracted)
          }
        }
        if (!idToUse) {
          setError('Please paste a valid Google Sheets URL')
          setTestResult('failed')
          return
        }

        // Step 1: confirm the spreadsheet is accessible and list sheets
        const listResp = await fetch('/api/google-sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'listSheets', spreadsheetId: idToUse }),
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
            body: JSON.stringify({ action: 'fetchData', spreadsheetId: idToUse, range: testRange }),
          })
          const fetchJson = await fetchResp.json()
          if (!fetchJson.success) {
            setError(fetchJson.error || 'Failed to read data in the selected range')
            setTestResult('failed')
            return
          }
          // Use returned headers if available
          const headers: string[] = fetchJson.headers || (Array.isArray(fetchJson.schema) ? fetchJson.schema.map((s: any) => s.name) : [])
          if (headers && headers.length) {
            setAvailableFields(headers)
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

      if (sourceType === 'googleads') {
        if (!googleAdsCustomerId || !googleAdsDeveloperToken || !googleAdsOAuthToken) {
          setError('Customer ID, Developer Token, and OAuth Token are required')
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

  const handleConnect = async () => {
    let config: any = { sourceType }

    if (sourceType === 'googlesheets') {
      // Ensure we have a spreadsheet ID derived from the URL
      let idToUse = spreadsheetId
      if (!idToUse && sheetsUrl) {
        const extracted = extractSpreadsheetId(sheetsUrl)
        if (extracted) {
          idToUse = extracted
          setSpreadsheetId(extracted)
        }
      }
      if (!idToUse) {
        setError('Please paste a valid Google Sheets URL')
        return
      }
      config = {
        ...config,
        spreadsheetUrl: sheetsUrl,
        spreadsheetId: idToUse,
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
    } else if (sourceType === 'googleads') {
      config = {
        ...config,
        customerId: googleAdsCustomerId,
        developerToken: googleAdsDeveloperToken,
        oauthToken: googleAdsOAuthToken,
        resource: googleAdsResource,
      }
    } else if (sourceType === 'csv') {
      if (!csvFile || !csvParsedData.length) {
        setError('Please choose a CSV file and click Test to parse it')
        return
      }
      config = {
        ...config,
        fileName: csvFile.name,
        hasHeaders: csvHasHeaders,
        headers: csvHeaders,
        schema: csvSchema,
        parsedData: csvParsedData,
      }
    }

    // Attach query builder config to connection
    const queryConfig = {
      selectColumns: selectedColumnsList,
      filters: filters
        .filter((f) => String(f.field || '').trim().length > 0 && String(f.value || '').length > 0)
        .map((f) => ({ field: f.field, operator: f.operator, value: f.value })),
      sortBy: sortField ? { field: sortField, direction: sortDirection } : null,
      limit: Number(limit) > 0 ? Number(limit) : undefined,
    }
    config = { ...config, query: queryConfig }

    // Auto-test the connection before connecting
    setTestResult(null)
    setError(null)
    await testConnection()
    if (testResult === 'failed') {
      return
    }

    // If CSV, testConnection populated parsed data and schema already
    onConnect(config)
    onClose()
  }

  const sourceInfo = getSourceInfo()

  return (
    <div
      className={`${
        layout === 'floating'
          ? `absolute shadow-2xl z-50 flex flex-col w-[420px] max-h-[70vh] rounded-lg border ${
              isDarkMode ? 'bg-gray-900 text-gray-100 border-gray-700' : 'bg-white border-gray-200'
            }`
          : layout === 'inline'
            ? `shadow-md flex flex-col w-full max-h-[60vh] rounded-lg border ${
                isDarkMode ? 'bg-gray-900 text-gray-100 border-gray-700' : 'bg-white border-gray-200'
              }`
            : `fixed right-0 top-20 bottom-6 w-[500px] shadow-2xl z-50 flex flex-col ${
                isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white'
              }`
      }`}
      style={layout === 'floating' ? { left: position?.left ?? 0, top: position?.top ?? 0 } : undefined}
    >
      {/* Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} ${layout !== 'sidebar' ? 'rounded-t-lg' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {sourceInfo.icon}
            <div>
              <h2 className="text-lg font-semibold">{sourceInfo.title}</h2>
              <p className="text-xs text-gray-500">{nodeLabel}</p>
            </div>
          </div>
          {layout !== 'inline' && (
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
                isDarkMode ? 'hover:bg-gray-700' : ''
              }`}
            >
              <X size={20} />
            </button>
          )}
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
              <p className="text-xs text-gray-500 mt-1">Paste a Google Sheets URL.</p>
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

        {sourceType === 'googleads' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Customer ID</label>
              <input
                type="text"
                value={googleAdsCustomerId}
                onChange={(e) => setGoogleAdsCustomerId(e.target.value)}
                placeholder="e.g., 123-456-7890"
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Developer Token
                <Key size={14} className="inline ml-2 text-gray-400" />
              </label>
              <input
                type="password"
                value={googleAdsDeveloperToken}
                onChange={(e) => setGoogleAdsDeveloperToken(e.target.value)}
                placeholder="Your Google Ads Developer Token"
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                OAuth Access Token
                <Key size={14} className="inline ml-2 text-gray-400" />
              </label>
              <input
                type="password"
                value={googleAdsOAuthToken}
                onChange={(e) => setGoogleAdsOAuthToken(e.target.value)}
                placeholder="ya29...."
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
                value={googleAdsResource}
                onChange={(e) => setGoogleAdsResource(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="campaigns">Campaigns</option>
                <option value="ad_groups">Ad Groups</option>
                <option value="ads">Ads</option>
                <option value="metrics">Metrics (daily)</option>
              </select>
            </div>

            <div className={`p-3 rounded-lg ${
              isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
            }`}>
              <p className="text-sm text-yellow-700">
                ℹ️ Use OAuth and a valid Developer Token for API access. This is a simplified placeholder.
              </p>
            </div>
          </div>
        )}

        {sourceType === 'csv' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">CSV File</label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null
                  setCsvFile(f)
                  setTestResult(null)
                  setCsvParsedData([])
                  setCsvHeaders([])
                  setCsvSchema([])
                }}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">Max ~10MB. UTF-8 recommended.</p>
            </div>

            <div className="flex items-center gap-2">
              <input id="csv-headers" type="checkbox" checked={csvHasHeaders} onChange={(e) => setCsvHasHeaders(e.target.checked)} />
              <label htmlFor="csv-headers" className="text-sm">First row contains headers</label>
            </div>

            {csvParsedData.length > 0 && (
              <div className={`${isDarkMode ? 'bg-emerald-900/20' : 'bg-emerald-50'} p-3 rounded-lg`}>
                <div className="text-sm font-medium mb-2">Preview</div>
                <div className="overflow-auto max-h-40 border rounded">
                  <table className={`min-w-full text-xs ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <thead>
                      <tr>
                        {csvHeaders.map((h) => (
                          <th key={h} className="px-2 py-1 border-b text-left font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvParsedData.slice(0, 5).map((row, idx) => (
                        <tr key={idx}>
                          {csvHeaders.map((h) => (
                            <td key={h} className="px-2 py-1 border-b">{String(row[h] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-xs mt-2">Rows parsed: {csvParsedData.length}</div>
              </div>
            )}
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

        {/* Query Builder */}
        <div className={`mt-6 border-t pt-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            type="button"
            className={`w-full text-left text-sm font-medium flex items-center justify-between ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
            onClick={() => setShowQueryBuilder((s) => !s)}
          >
            <span>Query Builder (optional)</span>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{showQueryBuilder ? 'Hide' : 'Show'}</span>
          </button>
          {showQueryBuilder && (
            <div className="mt-3 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Columns</label>
                {availableFields.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableFields.map((field) => {
                      const checked = selectedColumnsList.includes(field)
                      return (
                        <label key={field} className={`text-xs px-2 py-1 rounded border cursor-pointer select-none ${
                          checked
                            ? isDarkMode
                              ? 'bg-blue-900/40 border-blue-700'
                              : 'bg-blue-50 border-blue-300'
                            : isDarkMode
                              ? 'border-gray-700 hover:bg-gray-800'
                              : 'border-gray-300 hover:bg-gray-50'
                        }`}>
                          <input
                            type="checkbox"
                            className="mr-1 align-middle"
                            checked={checked}
                            onChange={(e) => {
                              const isOn = e.target.checked
                              setSelectedColumnsList((prev) => {
                                if (isOn) return Array.from(new Set([...prev, field]))
                                return prev.filter((f) => f !== field)
                              })
                            }}
                          />
                          {field}
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={selectedColumnsList.join(',')}
                    onChange={(e) => {
                      const list = e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                      setSelectedColumnsList(list)
                    }}
                    placeholder="e.g., id,name,email"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                    }`}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Filters</label>
                <div className="space-y-2">
                  {filters.map((f, idx) => (
                    <div key={idx} className="flex gap-2">
                      {availableFields.length > 0 ? (
                        <select
                          value={f.field}
                          onChange={(e) => {
                            const v = e.target.value
                            setFilters((prev) => prev.map((p, i) => (i === idx ? { ...p, field: v } : p)))
                          }}
                          className={`flex-1 px-3 py-2 rounded-lg border ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                          }`}
                        >
                          <option value="">Select field</option>
                          {availableFields.map((field) => (
                            <option value={field} key={field}>{field}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="field"
                          value={f.field}
                          onChange={(e) => {
                            const v = e.target.value
                            setFilters((prev) => prev.map((p, i) => (i === idx ? { ...p, field: v } : p)))
                          }}
                          className={`flex-1 px-3 py-2 rounded-lg border ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                          }`}
                        />
                      )}
                      <select
                        value={f.operator}
                        onChange={(e) => {
                          const v = e.target.value
                          setFilters((prev) => prev.map((p, i) => (i === idx ? { ...p, operator: v } : p)))
                        }}
                        className={`w-32 px-3 py-2 rounded-lg border ${
                          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="equals">equals</option>
                        <option value="contains">contains</option>
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                        <option value=">=">&gt;=</option>
                        <option value="<=">&lt;=</option>
                        <option value="!=">!=</option>
                      </select>
                      <input
                        type="text"
                        placeholder="value"
                        value={f.value}
                        onChange={(e) => {
                          const v = e.target.value
                          setFilters((prev) => prev.map((p, i) => (i === idx ? { ...p, value: v } : p)))
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg border ${
                          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                  ))}
                  <div>
                    <button
                      type="button"
                      className={`text-xs px-2 py-1 rounded border ${
                        isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setFilters((prev) => prev.concat({ field: '', operator: 'contains', value: '' }))}
                    >
                      Add filter
                    </button>
                  </div>
                </div>
              </div>

                <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Sort Field</label>
                    {availableFields.length > 0 ? (
                      <select
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="">Select field</option>
                        {availableFields.map((field) => (
                          <option value={field} key={field}>{field}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value)}
                        placeholder="e.g., created_at"
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                        }`}
                      />
                    )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sort Direction</label>
                  <select
                    value={sortDirection}
                    onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="asc">asc</option>
                    <option value="desc">desc</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Limit</label>
                <input
                  type="number"
                  min={1}
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="e.g., 100"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className={`p-4 border-t flex items-center justify-between ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      } ${layout !== 'sidebar' ? 'rounded-b-lg' : ''}`}>
        <button
          onClick={() => setShowQueryBuilder((s) => !s)}
          className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
            isDarkMode 
              ? 'border-gray-700 hover:bg-gray-800' 
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Filter size={16} />
          <span>Query Builder</span>
        </button>

        <div className="flex gap-2">
          {layout !== 'inline' && (
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
          )}
          <button
            onClick={handleConnect}
            className={`px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2`}
          >
            <Link2 size={16} />
            <span>Connect</span>
          </button>
        </div>
      </div>
    </div>
  )
}