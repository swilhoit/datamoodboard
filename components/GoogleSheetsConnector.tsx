'use client'

import { useState, useEffect } from 'react'
import { X, FileSpreadsheet, RefreshCw, Link, Check, AlertCircle } from 'lucide-react'

interface GoogleSheetsConnectorProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (data: any) => void
}

declare global {
  interface Window {
    google: any
    gapi: any
    handleGoogleCallback: () => void
  }
}

export default function GoogleSheetsConnector({ isOpen, onClose, onConnect }: GoogleSheetsConnectorProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('')
  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [sheets, setSheets] = useState<any[]>([])
  const [selectedSheet, setSelectedSheet] = useState('')
  const [selectedRange, setSelectedRange] = useState('A:Z')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tokenClient, setTokenClient] = useState<any>(null)

  // Google OAuth 2.0 configuration
  const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
  const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly'

  useEffect(() => {
    if (isOpen && !window.google) {
      // Load Google Identity Services library
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initializeGoogleAuth
      document.body.appendChild(script)
    } else if (isOpen && window.google) {
      initializeGoogleAuth()
    }
  }, [isOpen])

  const initializeGoogleAuth = () => {
    if (!CLIENT_ID) {
      setError('Google Client ID not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.')
      return
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.access_token) {
          setAccessToken(response.access_token)
          setIsAuthenticated(true)
          setError('')
        }
      },
    })
    setTokenClient(client)
  }

  const handleAuth = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken()
    }
  }

  const extractSpreadsheetId = (url: string) => {
    // Extract spreadsheet ID from Google Sheets URL
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : ''
  }

  const handleUrlChange = (url: string) => {
    setSpreadsheetUrl(url)
    const id = extractSpreadsheetId(url)
    setSpreadsheetId(id)
    if (id) {
      fetchSheets(id)
    }
  }

  const fetchSheets = async (id: string) => {
    if (!accessToken) {
      setError('Please authenticate first')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'listSheets',
          spreadsheetId: id,
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
        setError(data.error || 'Failed to fetch sheets')
      }
    } catch (err: any) {
      setError('Failed to fetch sheets: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!spreadsheetId || !selectedSheet) {
      setError('Please select a spreadsheet and sheet')
      return
    }

    setLoading(true)
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
        // Create a table with the imported data
        onConnect({
          type: 'googlesheets',
          name: selectedSheet,
          schema: data.schema,
          data: data.data,
          spreadsheetId,
          range,
          rowCount: data.rowCount,
        })
        onClose()
      } else {
        setError(data.error || 'Failed to import data')
      }
    } catch (err: any) {
      setError('Failed to import data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

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
          {/* Authentication Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium">
                  {isAuthenticated ? 'Authenticated with Google' : 'Not authenticated'}
                </span>
              </div>
              {!isAuthenticated ? (
                <button
                  onClick={handleAuth}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>
              ) : (
                <button
                  onClick={handleAuth}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1"
                >
                  <RefreshCw size={14} />
                  Refresh Token
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Spreadsheet URL Input */}
          {isAuthenticated && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Sheets URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={spreadsheetUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => fetchSheets(spreadsheetId)}
                    disabled={!spreadsheetId || loading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Paste the full URL of your Google Sheet
                </p>
              </div>

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
              <div className="flex justify-end gap-3 pt-4 border-t">
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
                      Importing...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Import Data
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Instructions for Client ID setup */}
          {!CLIENT_ID && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Setup Required</h3>
              <p className="text-sm text-blue-700 mb-2">
                To use Google Sheets integration, you need to:
              </p>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Create a project in Google Cloud Console</li>
                <li>Enable Google Sheets API</li>
                <li>Create OAuth 2.0 credentials</li>
                <li>Add http://localhost:3000 to authorized JavaScript origins</li>
                <li>Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env.local file</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}