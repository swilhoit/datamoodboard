'use client'

import { useState } from 'react'
import { 
  X, Database, ShoppingBag, CreditCard, Megaphone, 
  FileSpreadsheet, Cloud, ChevronRight, Loader2
} from 'lucide-react'
import GoogleSheetsConnector from './GoogleSheetsConnector'
import ShopifyConnector from './ShopifyConnector'
import GoogleAdsConnector from './GoogleAdsConnector'
import DatabaseConnectors from './DatabaseConnectors'

interface DataSourceModalProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (type: string, data: any) => void
  isDarkMode?: boolean
}

// Primary sources - most commonly used
const PRIMARY_SOURCES = [
  {
    id: 'googlesheets',
    name: 'Google Sheets',
    description: 'Connect spreadsheets via OAuth',
    icon: FileSpreadsheet,
    color: 'bg-green-600',
    iconColor: 'text-green-600',
    primary: true
  },
  {
    id: 'csv',
    name: 'CSV Upload',
    description: 'Upload files directly',
    icon: FileSpreadsheet,
    color: 'bg-emerald-600',
    iconColor: 'text-emerald-600',
    primary: true
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Import store data via OAuth',
    icon: ShoppingBag,
    color: 'bg-purple-600',
    iconColor: 'text-purple-600',
    primary: true
  },
  {
    id: 'database',
    name: 'Database',
    description: 'BigQuery, Snowflake & more',
    icon: Database,
    color: 'bg-blue-600',
    iconColor: 'text-blue-600',
    primary: true
  }
]

// Secondary sources - shown when expanded
const SECONDARY_SOURCES = [
  {
    id: 'googleads',
    name: 'Google Ads',
    description: 'Campaign performance metrics',
    icon: Megaphone,
    color: 'bg-yellow-600',
    iconColor: 'text-yellow-600'
  },
  {
    id: 'preset',
    name: 'Sample Data',
    description: 'Browse preset datasets',
    icon: Database,
    color: 'bg-indigo-600',
    iconColor: 'text-indigo-600'
  }
]

export default function DataSourceModal({ isOpen, onClose, onConnect, isDarkMode = false }: DataSourceModalProps) {
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [showSecondary, setShowSecondary] = useState(false)
  
  if (!isOpen) return null

  const handleConnect = (type: string, data: any) => {
    onConnect(type, data)
    onClose()
  }

  // Show specific connector if selected
  if (selectedSource === 'googlesheets') {
    return (
      <GoogleSheetsConnector
        isOpen={true}
        onClose={() => setSelectedSource(null)}
        onConnect={(data) => handleConnect('googlesheets', data)}
      />
    )
  }

  if (selectedSource === 'shopify') {
    return (
      <ShopifyConnector
        isOpen={true}
        onClose={() => setSelectedSource(null)}
        onConnect={(data) => handleConnect('shopify', data)}
      />
    )
  }

  if (selectedSource === 'googleads') {
    return (
      <GoogleAdsConnector
        isOpen={true}
        onClose={() => setSelectedSource(null)}
        onConnect={(data) => handleConnect('googleads', data)}
      />
    )
  }

  if (selectedSource === 'database') {
    return (
      <DatabaseConnectors
        isOpen={true}
        onClose={() => setSelectedSource(null)}
        onConnect={(dbType, config) => handleConnect(dbType, config)}
        isDarkMode={isDarkMode}
      />
    )
  }

  if (selectedSource === 'csv') {
    // Handle CSV upload directly
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleConnect('csv', { file, name: file.name })
      }
    }
    input.click()
    setSelectedSource(null)
    return null
  }

  if (selectedSource === 'preset') {
    // Trigger preset datasets modal
    handleConnect('preset', {})
    return null
  }

  // Main selection screen
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-[600px] max-h-[80vh] rounded-xl shadow-2xl overflow-hidden ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`p-5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Connect Data Source</h2>
              <p className="text-sm text-gray-500 mt-1">Choose your data source to get started</p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                isDarkMode ? 'hover:bg-gray-800' : ''
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Primary Sources */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {PRIMARY_SOURCES.map((source) => {
              const Icon = source.icon
              return (
                <button
                  key={source.id}
                  onClick={() => setSelectedSource(source.id)}
                  className={`p-4 rounded-lg border transition-all hover:scale-[1.02] ${
                    isDarkMode
                      ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                  }`}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className={`w-14 h-14 rounded-xl ${source.color} bg-opacity-10 flex items-center justify-center`}>
                      <Icon size={28} className={source.iconColor} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{source.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{source.description}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Expandable Secondary Sources */}
          <div className="mb-4">
            <button
              onClick={() => setShowSecondary(!showSecondary)}
              className={`w-full p-3 rounded-lg border border-dashed transition-all flex items-center justify-center gap-2 ${
                isDarkMode
                  ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <span className="text-sm font-medium">
                {showSecondary ? 'Show Less' : `More Sources (${SECONDARY_SOURCES.length})`}
              </span>
              <ChevronRight 
                size={16} 
                className={`transition-transform ${showSecondary ? 'rotate-90' : ''}`}
              />
            </button>
            
            {showSecondary && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {SECONDARY_SOURCES.map((source) => {
                  const Icon = source.icon
                  return (
                    <button
                      key={source.id}
                      onClick={() => setSelectedSource(source.id)}
                      className={`p-3 rounded-lg border transition-all hover:scale-[1.02] ${
                        isDarkMode
                          ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${source.color} bg-opacity-10 flex items-center justify-center`}>
                          <Icon size={20} className={source.iconColor} />
                        </div>
                        <div className="text-left">
                          <h3 className="font-medium text-sm">{source.name}</h3>
                          <p className="text-xs text-gray-500">{source.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className={`p-4 rounded-lg ${
            isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'
          }`}>
            <h4 className={`text-xs font-semibold mb-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              QUICK ACTIONS
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedSource('preset')}
                className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    : 'bg-white hover:bg-gray-100 text-gray-700'
                }`}
              >
                Browse Sample Data
              </button>
              <button
                onClick={() => setSelectedSource('csv')}
                className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    : 'bg-white hover:bg-gray-100 text-gray-700'
                }`}
              >
                Upload CSV File
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}