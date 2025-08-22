'use client'

import { useEffect, useState } from 'react'
import { X, FileSpreadsheet, RefreshCw, Check, AlertCircle, Copy, ChevronRight } from 'lucide-react'

interface GoogleSheetsConnectorProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (data: any) => void
}

export default function GoogleSheetsConnector({ isOpen, onClose, onConnect }: GoogleSheetsConnectorProps) {
  const [step, setStep] = useState(1)
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('')
  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [sheets, setSheets] = useState<any[]>([])
  const [selectedSheet, setSelectedSheet] = useState('')
  const [selectedRange, setSelectedRange] = useState('A:Z')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState<'fetching' | 'authenticating' | 'importing' | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Service account email provided by server
  const [serviceEmail, setServiceEmail] = useState<string>('')
  const [oneClickReady, setOneClickReady] = useState<boolean | null>(null)

  // Remove service account related code, sharing instructions, and quick-connect check
  // Add state for access token, spreadsheets list, selectedSpreadsheet
  const [accessToken, setAccessToken] = useState('')
  const [spreadsheets, setSpreadsheets] = useState([])
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState('')

  // Add effect to check for OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('code')) {
      // Exchange code for token via backend
      fetch('/api/auth/google-sheets/callback?code=' + params.get('code'))
        .then(res => res.json())
        .then(data => {
          if (data.access_token) {
            setAccessToken(data.access_token)
            fetchSpreadsheets(data.access_token)
          }
        })
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Function to fetch user's spreadsheets using Drive API
  const fetchSpreadsheets = async (token) => {
    const res = await fetch('https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application%2Fvnd.google-apps.spreadsheet%27', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setSpreadsheets(data.files || [])
  }

  const copyEmail = () => {
    if (!serviceEmail) return
    navigator.clipboard.writeText(serviceEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const extractSpreadsheetId = (url: string) => {
    // Extract spreadsheet ID from Google Sheets URL
    // Handle various URL formats
    const patterns = [
      /\/spreadsheets\/(?:u\/\d+\/)?d\/([a-zA-Z0-9-_]+)/,  // Standard and /u/0/ format
      /spreadsheetId=([a-zA-Z0-9-_]+)/,         // Alternative format
      /^([a-zA-Z0-9-_]+)$/                      // Just the ID
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    
    return ''
  }

  const handleUrlSubmit = async () => {
    // Clear any previous errors
    setError('')
    
    // Try to extract ID from URL
    const id = extractSpreadsheetId(spreadsheetUrl)
    if (!id) {
      setError('Please enter a valid Google Sheets URL (e.g., https://docs.google.com/spreadsheets/d/...)')
      return
    }
    
    setSpreadsheetId(id)
    setLoadingStep('authenticating')
    await fetchSheets(id)
    setLoadingStep(null)
  }

  // Update fetchSheets to use user token
  const fetchSheets = async (id) => {
    const sheetId = id || spreadsheetId
    if (!sheetId) {
      setError('Please enter a valid Google Sheets URL')
      return
    }

    setLoading(true)
    setLoadingStep('fetching')
    setError('')

    try {
      const response = await fetch('/api/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'listSheets',
          spreadsheetId: sheetId,
          accessToken,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setSheets(data.sheets)
        if (data.sheets.length > 0) {
          setSelectedSheet(data.sheets[0].title)
        }
      } else {
        // Enhance error messages to be more helpful
        let errorMsg = data.error || 'Failed to fetch sheets'
        if (errorMsg.includes('Permission denied')) {
          errorMsg = `Permission denied. Please make sure you've shared your spreadsheet with: ${serviceEmail || 'your service account email'}`
        } else if (errorMsg.includes('not found')) {
          errorMsg = 'Spreadsheet not found. Please check the URL and make sure it\'s a valid Google Sheets link.'
        }
        setError(errorMsg)
      }
    } catch (err: any) {
      setError('Failed to fetch sheets: ' + err.message)
    } finally {
      setLoading(false)
      setLoadingStep(null)
    }
  }

  const handleImport = async () => {
    if (!spreadsheetId || !selectedSheet) {
      setError('Please select a spreadsheet and sheet')
      return
    }

    setLoading(true)
    setLoadingStep('importing')
    setError('')

    try {
      const range = `${selectedSheet}!${selectedRange}`
      const response = await fetch('/api/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fetchData',
          spreadsheetId,
          range,
          accessToken,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Save to Supabase and create a table with the imported data
        const { DataTableService } = await import('@/lib/supabase/data-tables')
        const dataTableService = new DataTableService()
        
        try {
          const savedTable = await dataTableService.createDataTable({
            name: selectedSheet,
            description: `Imported from Google Sheets: ${spreadsheetUrl}`,
            source: 'googlesheets',
            source_config: {
              spreadsheetId,
              spreadsheetUrl,
              range
            },
            data: data.data,
            schema: data.schema,
            sync_frequency: 'manual',
            sync_status: 'active'
          })
          
          // Pass both the data and the saved table ID
          onConnect({
            id: savedTable.id,
            type: 'googlesheets',
            name: selectedSheet,
            schema: data.schema,
            data: data.data,
            spreadsheetId,
            range,
            rowCount: data.rowCount,
          })
          
          // Log activity
          await dataTableService.logActivity('data_import', 'data_table', savedTable.id, {
            source: 'googlesheets',
            rows: data.rowCount
          })
          
          // Dispatch event so DataManagerSidebar can refresh
          window.dispatchEvent(new CustomEvent('dataflow-table-saved'))
        } catch (saveError: any) {
          console.error('Failed to save to Supabase:', saveError)
          // Still proceed with local data if save fails
          onConnect({
            type: 'googlesheets',
            name: selectedSheet,
            schema: data.schema,
            data: data.data,
            spreadsheetId,
            range,
            rowCount: data.rowCount,
          })
        }
        
        onClose()
      } else {
        setError(data.error || 'Failed to import data')
      }
    } catch (err: any) {
      setError('Failed to import data: ' + err.message)
    } finally {
      setLoading(false)
      setLoadingStep(null)
    }
  }

  if (!isOpen) return null

  // Update UI: instead of sharing step, show Connect button if not authorized
  if (!accessToken) {
    return (
      <button onClick={() => window.location.href = '/api/auth/google-sheets'}>
        Connect with Google
      </button>
    )
  }

  // Then show list of spreadsheets
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-16 z-50">
      <div className="bg-white rounded-lg p-6 w-[600px] max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileSpreadsheet size={24} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Connect Google Sheets</h2>
              <p className="text-sm text-gray-600">Import data from your Google Sheets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Service Account Info Banner */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <FileSpreadsheet size={16} className="text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Service Account Email</p>
                <div className="flex items-center gap-2 mt-1">
                   <code className="text-xs font-mono text-blue-800">
                     {serviceEmail || '—'}
                   </code>
                  <button
                    onClick={copyEmail}
                    className="p-1 hover:bg-blue-100 rounded transition-colors"
                    title="Copy email"
                  >
                    {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-blue-600" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* One-click banner */}
          {oneClickReady && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              One-click ready: Share your sheet with our service account email below, paste the URL, and click Import.
            </div>
          )}

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
              }`}>1</div>
              <span className="text-sm">Share</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
              }`}>2</div>
              <span className="text-sm">Import</span>
            </div>
          </div>

          {/* Loading Progress Overlay */}
          {loading && loadingStep && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <RefreshCw size={18} className="text-blue-600 animate-spin" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    {loadingStep === 'authenticating' && 'Authenticating with Google Sheets...'}
                    {loadingStep === 'fetching' && 'Fetching sheet information...'}
                    {loadingStep === 'importing' && 'Importing data to your canvas...'}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {loadingStep === 'authenticating' && 'Verifying permissions and access'}
                    {loadingStep === 'fetching' && 'Loading available sheets and columns'}
                    {loadingStep === 'importing' && 'Processing rows and creating table'}
                  </p>
                </div>
              </div>
              <div className="mt-3 h-1 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{
                  width: loadingStep === 'authenticating' ? '33%' : 
                         loadingStep === 'fetching' ? '66%' : 
                         loadingStep === 'importing' ? '90%' : '0%'
                }} />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !loading && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1: Share Instructions */}
          {step === 1 && (
            <>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-3">Share your Google Sheet</h3>
                <ol className="space-y-3 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="font-medium">1.</span>
                    <div>
                      <p>Open your Google Sheet</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">2.</span>
                    <div>
                      <p>Click the "Share" button (top right)</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">3.</span>
                    <div>
                      <p>Add this email address:</p>
                      <div className="mt-2 p-2 bg-white rounded-lg border border-blue-300">
                        <div className="flex items-center justify-between gap-2">
                           <code className="text-xs font-mono text-blue-900 break-all">
                             {serviceEmail || '—'}
                           </code>
                          <button
                            onClick={copyEmail}
                            className="p-1.5 hover:bg-blue-100 rounded transition-colors flex-shrink-0"
                            title="Copy email"
                          >
                            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-blue-600" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">4.</span>
                    <div>
                      <p>Set permission to "Viewer" and click "Send"</p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  I've shared my sheet
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* Step 2: Spreadsheet URL Input */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Sheets URL
                </label>
                <input
                  type="text"
                  value={spreadsheetUrl}
                  onChange={(e) => {
                    setSpreadsheetUrl(e.target.value)
                    // Clear error when user types
                    if (error) setError('')
                  }}
                  onPaste={(e) => {
                    // Auto-load sheets when URL is pasted
                    setTimeout(async () => {
                      const pastedText = spreadsheetUrl + e.clipboardData.getData('text')
                      const id = extractSpreadsheetId(pastedText)
                      if (id) {
                        setSpreadsheetId(id)
                        await fetchSheets(id)
                      }
                    }, 100)
                  }}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste the full URL from your browser's address bar (e.g., https://docs.google.com/spreadsheets/d/abc123...)
                </p>
              </div>

              {!sheets.length && (
                <button
                  onClick={handleUrlSubmit}
                  disabled={!spreadsheetUrl || loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      {loadingStep === 'authenticating' && 'Authenticating...'}
                      {loadingStep === 'fetching' && 'Loading sheets...'}
                      {!loadingStep && 'Loading...'}
                    </>
                  ) : (
                    <>
                      Load Sheets
                      <FileSpreadsheet size={16} />
                    </>
                  )}
                </button>
              )}

              {/* Sheet Selection */}
              {sheets.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Sheet
                  </label>
                  <select
                    value={selectedSheet}
                    onChange={(e) => setSelectedSheet(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {sheets.map((sheet) => (
                      <option key={sheet.sheetId} value={sheet.title}>
                        {sheet.title} ({sheet.rowCount} rows × {sheet.columnCount} columns)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Range Selection */}
              {selectedSheet && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Range (Optional)
                  </label>
                  <input
                    type="text"
                    value={selectedRange}
                    onChange={(e) => setSelectedRange(e.target.value)}
                    placeholder="A:Z or A1:Z100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Specify the range to import (e.g., A:Z for all columns, A1:Z100 for specific rows)
                  </p>
                </div>
              )}

              {/* Import Button */}
              <div className="flex justify-between items-center gap-3 pt-4 border-t">
                <button
                  onClick={() => setStep(1)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1"
                >
                  ← Back
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!selectedSheet || loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        {loadingStep === 'importing' && 'Importing data...'}
                        {!loadingStep && 'Processing...'}
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Import Data
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}