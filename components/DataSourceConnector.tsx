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
  const [connectingStep, setConnectingStep] = useState<'authenticating' | 'fetching' | 'processing' | null>(null)
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

  // Tabs and Query builder state (simple client-side query definition)
  const [activeTab, setActiveTab] = useState<'details' | 'query'>('details')
  const [availableFields, setAvailableFields] = useState<string[]>([])
  const [selectedColumnsList, setSelectedColumnsList] = useState<string[]>([])
  const [filters, setFilters] = useState<Array<{ field: string; operator: string; value: string }>>([
    { field: '', operator: 'contains', value: '' },
  ])
  const [sortField, setSortField] = useState('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [limit, setLimit] = useState<string>('')
  // Shopify-specific query helpers
  const [shopifyDateField, setShopifyDateField] = useState<'created_at' | 'updated_at'>(
    (currentConfig?.query?.dateRange?.field as 'created_at' | 'updated_at') || 'created_at'
  )
  const [shopifyDatePreset, setShopifyDatePreset] = useState<
    'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_month' | 'last_month' | 'this_year' | 'all_time' | 'custom'
  >(currentConfig?.query?.dateRange?.preset || 'last_30_days')
  const [shopifyDateFrom, setShopifyDateFrom] = useState<string>(currentConfig?.query?.dateRange?.from || '')
  const [shopifyDateTo, setShopifyDateTo] = useState<string>(currentConfig?.query?.dateRange?.to || '')
  const [shopifyPreviewLoading, setShopifyPreviewLoading] = useState(false)
  const [shopifyPreviewError, setShopifyPreviewError] = useState<string | null>(null)
  const [shopifyPreviewData, setShopifyPreviewData] = useState<any[]>([])

  // Scheduling (one-time vs recurring)
  const [syncMode, setSyncMode] = useState<'one_time' | 'recurring'>(currentConfig?.sync?.mode || 'one_time')
  const [syncFrequency, setSyncFrequency] = useState<'hourly' | 'daily' | 'weekly'>(currentConfig?.sync?.frequency || 'daily')

  // Static field definitions aligned with Shopify Admin REST API schemas (2024-04)
  const SHOPIFY_FIELDS_BY_RESOURCE: Record<string, string[]> = {
    orders: [
      'id', 'order_number', 'name', 'created_at', 'processed_at', 'updated_at', 'cancelled_at',
      'financial_status', 'fulfillment_status', 'test',
      'email', 'customer_id',
      'currency', 'subtotal_price', 'total_discounts', 'total_tax', 'total_price',
      'source_name', 'referring_site', 'landing_site',
      'tags', 'line_items'
    ],
    products: [
      'id', 'title', 'handle', 'vendor', 'product_type', 'status', 'created_at', 'updated_at', 'published_at', 'tags',
      'variants', 'images', 'options'
    ],
    customers: [
      'id', 'email', 'first_name', 'last_name', 'state', 'orders_count', 'total_spent', 'created_at', 'updated_at',
      'verified_email', 'accepts_marketing', 'phone', 'last_order_id', 'last_order_name', 'tags', 'default_address'
    ],
    inventory: [
      'inventory_item_id', 'location_id', 'available', 'updated_at'
    ],
    fulfillments: [
      'id', 'order_id', 'status', 'tracking_company', 'tracking_number', 'created_at', 'updated_at', 'location_id'
    ],
  }

  // Analyst-friendly quick presets per resource
  const SHOPIFY_COLUMN_PRESETS: Record<string, Array<{ key: string; label: string; columns: string[] }>> = {
    orders: [
      { key: 'orders_essentials', label: 'Essentials', columns: ['id','order_number','created_at','email','total_price','currency','financial_status','fulfillment_status'] },
      { key: 'orders_finance', label: 'Finance', columns: ['subtotal_price','total_discounts','total_tax','total_price'] },
      { key: 'orders_acquisition', label: 'Acquisition', columns: ['source_name','referring_site','landing_site'] }
    ],
    products: [
      { key: 'products_essentials', label: 'Essentials', columns: ['id','title','handle','vendor','product_type','status','created_at','updated_at'] },
      { key: 'products_media', label: 'Media', columns: ['images','options'] },
      { key: 'products_variants', label: 'Variants', columns: ['variants'] }
    ],
    customers: [
      { key: 'customers_essentials', label: 'Essentials', columns: ['id','email','first_name','last_name','created_at','orders_count','total_spent','state'] },
      { key: 'customers_marketing', label: 'Marketing', columns: ['accepts_marketing','verified_email','tags'] },
      { key: 'customers_address', label: 'Default Address', columns: ['default_address'] }
    ],
    fulfillments: [
      { key: 'fulfillments_tracking', label: 'Tracking', columns: ['id','order_id','status','tracking_company','tracking_number','created_at','updated_at'] }
    ],
    inventory: [
      { key: 'inventory_levels', label: 'Levels', columns: ['inventory_item_id','location_id','available','updated_at'] }
    ]
  }

  // Beginner-friendly quick query presets (one-click)
  type ShopifyQuickPreset = {
    key: string
    label: string
    description?: string
    apply: () => void
  }
  const SHOPIFY_QUERY_PRESETS: ShopifyQuickPreset[] = [
    {
      key: 'orders_last_month_total_sales',
      label: "Last month's total sales",
      description: 'Orders marked paid last month (sum total_price later in chart/table)',
      apply: () => {
        setShopifyResource('orders')
        setSelectedColumnsList(['total_price','currency','created_at','financial_status'])
        setShopifyDateField('created_at')
        setShopifyDatePreset('last_month')
        setFilters([{ field: 'financial_status', operator: 'equals', value: 'paid' }])
        setSortField('created_at')
        setSortDirection('asc')
        setLimit('250')
      }
    },
    {
      key: 'orders_this_month_total_sales',
      label: 'This month total sales',
      apply: () => {
        setShopifyResource('orders')
        setSelectedColumnsList(['total_price','currency','created_at','financial_status'])
        setShopifyDateField('created_at')
        setShopifyDatePreset('this_month')
        setFilters([{ field: 'financial_status', operator: 'equals', value: 'paid' }])
        setSortField('created_at')
        setSortDirection('asc')
        setLimit('250')
      }
    },
    {
      key: 'orders_last_7_days_count',
      label: 'Orders in last 7 days (count)',
      apply: () => {
        setShopifyResource('orders')
        setSelectedColumnsList(['id','created_at'])
        setShopifyDateField('created_at')
        setShopifyDatePreset('last_7_days')
        setFilters([])
        setSortField('created_at')
        setSortDirection('asc')
        setLimit('250')
      }
    },
    {
      key: 'orders_unfulfilled_this_month',
      label: 'Unfulfilled orders (this month)',
      apply: () => {
        setShopifyResource('orders')
        setSelectedColumnsList(['id','order_number','created_at','total_price','fulfillment_status'])
        setShopifyDateField('created_at')
        setShopifyDatePreset('this_month')
        setFilters([{ field: 'fulfillment_status', operator: 'equals', value: 'unfulfilled' }])
        setSortField('created_at')
        setSortDirection('desc')
        setLimit('250')
      }
    },
    {
      key: 'customers_new_last_30_days',
      label: 'New customers (last 30 days)',
      apply: () => {
        setShopifyResource('customers')
        setSelectedColumnsList(['id','email','first_name','last_name','created_at','orders_count','total_spent'])
        setShopifyDateField('created_at')
        setShopifyDatePreset('last_30_days')
        setFilters([])
        setSortField('created_at')
        setSortDirection('desc')
        setLimit('250')
      }
    },
    {
      key: 'products_created_last_30_days',
      label: 'Products created (last 30 days)',
      apply: () => {
        setShopifyResource('products')
        setSelectedColumnsList(['id','title','handle','vendor','product_type','status','created_at'])
        setShopifyDateField('created_at')
        setShopifyDatePreset('last_30_days')
        setFilters([{ field: 'status', operator: 'equals', value: 'active' }])
        setSortField('created_at')
        setSortDirection('desc')
        setLimit('250')
      }
    }
  ]

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

  // Check for OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const integration = params.get('integration')
    const status = params.get('status')
    
    if (status === 'connected') {
      if (integration === 'shopify') {
        const shop = params.get('shop')
        if (shop) {
          setShopifyStore(shop)
          setTestResult('success')
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname)
        }
      } else if (integration === 'stripe' || integration === 'google_ads') {
        setTestResult('success')
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [])

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
      const fields = SHOPIFY_FIELDS_BY_RESOURCE[shopifyResource] || []
      setAvailableFields(fields)
      if (selectedColumnsList.length === 0) {
        const presets = SHOPIFY_COLUMN_PRESETS[shopifyResource] || []
        const essentials = presets.find((p) => p.key.includes('essentials'))
        if (essentials) setSelectedColumnsList(essentials.columns)
      }
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
    setConnectingStep('authenticating')
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
      setConnectingStep(null)
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    setConnectingStep('processing')
    
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
    const queryConfig: any = {
      selectColumns: selectedColumnsList,
      filters: filters
        .filter((f) => String(f.field || '').trim().length > 0 && String(f.value || '').length > 0)
        .map((f) => ({ field: f.field, operator: f.operator, value: f.value })),
      sortBy: sortField ? { field: sortField, direction: sortDirection } : null,
      limit: Number(limit) > 0 ? Number(limit) : undefined,
    }
    if (sourceType === 'shopify') {
      queryConfig.dateRange =
        shopifyDatePreset === 'custom'
          ? { field: shopifyDateField, preset: 'custom', from: shopifyDateFrom || undefined, to: shopifyDateTo || undefined }
          : { field: shopifyDateField, preset: shopifyDatePreset }
    }
    // Include scheduling
    const sync = { mode: syncMode, frequency: syncMode === 'recurring' ? syncFrequency : undefined }
    config = { ...config, query: queryConfig, sync }

    // Auto-test the connection before connecting
    setTestResult(null)
    setError(null)
    await testConnection()
    if (testResult === 'failed') {
      return
    }

    // If CSV, testConnection populated parsed data and schema already
    // Simulate processing time for better UX
    setTimeout(() => {
      onConnect(config)
      setIsConnecting(false)
      setConnectingStep(null)
      onClose()
    }, 500)
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
            : `fixed right-0 top-20 bottom-16 w-[500px] shadow-2xl z-50 flex flex-col ${
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

        {/* Tabs */}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1 rounded-md text-sm border ${
              activeTab === 'details'
                ? isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                : isDarkMode
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('query')}
            className={`px-3 py-1 rounded-md text-sm border flex items-center gap-1 ${
              activeTab === 'query'
                ? isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                : isDarkMode
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Filter size={14} />
            Query Manager
          </button>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'details' && sourceType === 'googlesheets' && (
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

        {activeTab === 'details' && sourceType === 'shopify' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border-2 border-dashed ${
              isDarkMode ? 'bg-purple-900/20 border-purple-700' : 'bg-purple-50 border-purple-300'
            }`}>
              <h3 className="font-medium text-lg mb-2">One-Click Connection</h3>
              <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">
                Connect your Shopify store with OAuth - no API keys needed!
              </p>
              
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
                  } mb-3`}
                />
              </div>

              <button
                onClick={() => {
                  if (!shopifyStore || !shopifyStore.includes('.myshopify.com')) {
                    setError('Please enter a valid Shopify store URL')
                    return
                  }
                  // Redirect to OAuth flow
                  window.location.href = `/api/auth/shopify?shop=${encodeURIComponent(shopifyStore)}`
                }}
                disabled={!shopifyStore}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  shopifyStore
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Link2 size={18} />
                Connect with Shopify OAuth
              </button>
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
                ℹ️ You'll be redirected to Shopify to authorize access. No manual API keys required!
              </p>
            </div>
          </div>
        )}

        {activeTab === 'details' && sourceType === 'stripe' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border-2 border-dashed ${
              isDarkMode ? 'bg-indigo-900/20 border-indigo-700' : 'bg-indigo-50 border-indigo-300'
            }`}>
              <h3 className="font-medium text-lg mb-2">One-Click Connection</h3>
              <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">
                Connect your Stripe account with OAuth - secure and simple!
              </p>
              
              <button
                onClick={() => {
                  // Redirect to OAuth flow
                  window.location.href = '/api/auth/stripe'
                }}
                className="w-full px-4 py-3 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Link2 size={18} />
                Connect with Stripe
              </button>
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
                ℹ️ You'll be redirected to Stripe to authorize access. Read-only permissions only.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'details' && sourceType === 'googleads' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border-2 border-dashed ${
              isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-300'
            }`}>
              <h3 className="font-medium text-lg mb-2">One-Click Connection</h3>
              <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">
                Connect your Google Ads account with OAuth - no API keys needed!
              </p>
              
              <button
                onClick={() => {
                  // Redirect to OAuth flow
                  window.location.href = '/api/auth/google-ads'
                }}
                className="w-full px-4 py-3 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Link2 size={18} />
                Connect with Google
              </button>
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
              isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
            }`}>
              <p className="text-sm text-blue-600">
                ℹ️ You'll be redirected to Google to authorize access to your Google Ads data.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'details' && sourceType === 'csv' && (
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

        {/* Test Result (Details tab only) */}
        {activeTab === 'details' && testResult && (
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

        {/* Query Manager Tab */}
        {activeTab === 'query' && (
          <div className="mt-2">
            <div className="mt-1 space-y-4">
              {/* Scheduling controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Run mode</label>
                  <select
                    value={syncMode}
                    onChange={(e) => setSyncMode(e.target.value as 'one_time' | 'recurring')}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="one_time">One-time</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Frequency</label>
                  <select
                    value={syncFrequency}
                    onChange={(e) => setSyncFrequency(e.target.value as 'hourly' | 'daily' | 'weekly')}
                    disabled={syncMode !== 'recurring'}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
              {sourceType === 'shopify' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Quick query presets</label>
                    <div className="flex flex-wrap gap-2">
                      {SHOPIFY_QUERY_PRESETS.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          className={`text-xs px-2 py-1 rounded border ${
                            isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => p.apply()}
                          title={p.description || ''}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quick column presets</label>
                    <div className="flex flex-wrap gap-2">
                      {(SHOPIFY_COLUMN_PRESETS[shopifyResource] || []).map((preset) => (
                        <button
                          key={preset.key}
                          type="button"
                          className={`text-xs px-2 py-1 rounded border ${
                            isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            setSelectedColumnsList((prev) => Array.from(new Set([...(prev || []), ...preset.columns])))
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                      {selectedColumnsList.length > 0 && (
                        <button
                          type="button"
                          className={`text-xs px-2 py-1 rounded border ${
                            isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedColumnsList([])}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Date field</label>
                      <select
                        value={shopifyDateField}
                        onChange={(e) => setShopifyDateField(e.target.value as 'created_at' | 'updated_at')}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="created_at">created_at</option>
                        <option value="updated_at">updated_at</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date range</label>
                      <select
                        value={shopifyDatePreset}
                        onChange={(e) => setShopifyDatePreset(e.target.value as any)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="last_7_days">Last 7 days</option>
                        <option value="last_30_days">Last 30 days</option>
                        <option value="last_90_days">Last 90 days</option>
                        <option value="this_month">This month</option>
                        <option value="last_month">Last month</option>
                        <option value="this_year">This year</option>
                        <option value="all_time">All time</option>
                        <option value="custom">Custom…</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">From</label>
                        <input
                          type="date"
                          value={shopifyDateFrom}
                          onChange={(e) => setShopifyDateFrom(e.target.value)}
                          disabled={shopifyDatePreset !== 'custom'}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">To</label>
                        <input
                          type="date"
                          value={shopifyDateTo}
                          onChange={(e) => setShopifyDateTo(e.target.value)}
                          disabled={shopifyDatePreset !== 'custom'}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      disabled={shopifyPreviewLoading || !shopifyStore || (!shopifyAccessToken && !shopifyApiKey)}
                      className={`text-xs px-3 py-2 rounded border ${
                        isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={async () => {
                        try {
                          setShopifyPreviewLoading(true)
                          setShopifyPreviewError(null)
                          setShopifyPreviewData([])
                          const body: any = {
                            shopDomain: shopifyStore,
                            accessToken: shopifyAccessToken || undefined,
                            resource: shopifyResource,
                            query: {
                              selectColumns: selectedColumnsList,
                              filters: filters
                                .filter((f) => String(f.field || '').trim().length > 0 && String(f.value || '').length > 0)
                                .map((f) => ({ field: f.field, operator: f.operator, value: f.value })),
                              sortBy: sortField ? { field: sortField, direction: sortDirection } : undefined,
                              limit: Number(limit) || 20,
                              dateRange: shopifyDatePreset === 'custom'
                                ? { field: shopifyDateField, preset: 'custom', from: shopifyDateFrom || undefined, to: shopifyDateTo || undefined }
                                : { field: shopifyDateField, preset: shopifyDatePreset }
                            }
                          }
                          const res = await fetch('/api/shopify/import', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(body)
                          })
                          const json = await res.json()
                          if (!json.success) throw new Error(json.error || 'Preview failed')
                          setShopifyPreviewData(Array.isArray(json.data) ? json.data.slice(0, 20) : [])
                        } catch (e: any) {
                          setShopifyPreviewError(e?.message || 'Failed to preview')
                        } finally {
                          setShopifyPreviewLoading(false)
                        }
                      }}
                    >
                      {shopifyPreviewLoading ? 'Loading…' : 'Preview'}
                    </button>
                  </div>

                  {(shopifyPreviewError || shopifyPreviewData.length > 0) && (
                    <div className="mt-2">
                      {shopifyPreviewError && (
                        <div className={`text-xs p-2 rounded ${isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>{shopifyPreviewError}</div>
                      )}
                      {shopifyPreviewData.length > 0 && (
                        <div className={`overflow-auto border rounded ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <table className={`min-w-full text-xs ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            <thead>
                              <tr>
                                {Object.keys(shopifyPreviewData[0]).map((h) => (
                                  <th key={h} className="px-2 py-1 border-b text-left font-semibold">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {shopifyPreviewData.map((row, idx) => (
                                <tr key={idx}>
                                  {Object.keys(shopifyPreviewData[0]).map((h) => (
                                    <td key={h} className="px-2 py-1 border-b">{String(row[h] ?? '')}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
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
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isConnecting && connectingStep && (
        <div className="absolute inset-0 bg-white bg-opacity-90 dark:bg-gray-900 dark:bg-opacity-90 flex items-center justify-center z-50 rounded-lg">
          <div className="text-center">
            <RefreshCw size={32} className="text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              {connectingStep === 'authenticating' && 'Authenticating...'}
              {connectingStep === 'fetching' && 'Fetching data...'}
              {connectingStep === 'processing' && 'Processing connection...'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {connectingStep === 'authenticating' && `Verifying ${sourceType} credentials`}
              {connectingStep === 'fetching' && 'Loading available data'}
              {connectingStep === 'processing' && 'Setting up data source'}
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`p-4 border-t flex items-center justify-end ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      } ${layout !== 'sidebar' ? 'rounded-b-lg' : ''}`}>
        <div className="flex gap-2 ml-auto">
          {layout !== 'inline' && (
            <button
              onClick={onClose}
              disabled={isConnecting}
              className={`px-4 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'border-gray-700 hover:bg-gray-800' 
                  : 'border-gray-300 hover:bg-gray-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className={`px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isConnecting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Link2 size={16} />
                <span>{activeTab === 'query' ? 'Submit Query' : 'Connect'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}