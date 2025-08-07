'use client'

import { useState } from 'react'
import { X, Database, Server, Key, User, Lock, Globe, TestTube, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { DatabaseType } from '@/app/page'

interface DatabaseConnectorProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (config: any) => void
}

const databaseConfigs = {
  googlesheets: {
    name: 'Google Sheets',
    icon: '📊',
    color: 'bg-green-500',
    description: 'Connect to Google Sheets for easy spreadsheet data import',
    fields: [],
    customComponent: true,
  },
  shopify: {
    name: 'Shopify',
    icon: '🛍️',
    color: 'bg-green-600',
    description: 'Access your Shopify store data including orders, products, and customers',
    fields: [
      { name: 'shopDomain', label: 'Shop Domain', type: 'text', required: true, placeholder: 'your-shop.myshopify.com' },
      { name: 'accessToken', label: 'Access Token', type: 'password', required: true, placeholder: 'shpat_...' },
    ]
  },
  stripe: {
    name: 'Stripe',
    icon: '💳',
    color: 'bg-purple-600',
    description: 'Import payment data, transactions, and customer information from Stripe',
    fields: [
      { name: 'secretKey', label: 'Secret Key', type: 'password', required: true, placeholder: 'sk_live_... or sk_test_...' },
      { name: 'isLiveMode', label: 'Live Mode', type: 'checkbox', required: false },
    ]
  },
}

export default function DatabaseConnector({ isOpen, onClose, onConnect }: DatabaseConnectorProps) {
  const [selectedDb, setSelectedDb] = useState<DatabaseType | null>(null)
  const [formData, setFormData] = useState<any>({})
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')

  if (!isOpen) return null

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleTestConnection = async () => {
    setConnectionStatus('testing')
    setIsConnecting(true)
    
    // Simulate connection test
    setTimeout(() => {
      setConnectionStatus('success')
      setIsConnecting(false)
      setTimeout(() => setConnectionStatus('idle'), 3000)
    }, 2000)
  }

  const handleConnect = () => {
    if (selectedDb) {
      onConnect({
        type: selectedDb,
        config: formData,
        ...databaseConfigs[selectedDb]
      })
    }
  }

  const config = selectedDb ? databaseConfigs[selectedDb] : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-16 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[calc(100vh-8rem)] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="text-blue-600" size={24} />
              <div>
                <h2 className="text-xl font-bold">Connect Data Source</h2>
                <p className="text-sm text-gray-600">Google Sheets, Shopify & Stripe</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {!selectedDb ? (
            <div>
              <p className="text-sm text-gray-600 mb-6">Connect to your favorite data sources in just a few clicks:</p>
              <div className="space-y-4">
                {Object.entries(databaseConfigs).map(([key, db]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDb(key as DatabaseType)}
                    className={`w-full p-5 rounded-xl border-2 border-gray-200 hover:border-blue-500 transition-all text-left group hover:shadow-md`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${db.color} text-white text-xl`}>
                        {db.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-lg group-hover:text-blue-600 transition-colors">{db.name}</div>
                        <div className="text-sm text-gray-600 mt-1 leading-relaxed">{db.description}</div>
                        <div className="text-xs text-blue-600 mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to configure →
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setSelectedDb(null)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  ← Back
                </button>
                <span className="text-2xl">{config?.icon}</span>
                <h3 className="text-lg font-semibold">{config?.name} Configuration</h3>
              </div>

              <div className="space-y-4">
                {config?.fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'checkbox' ? (
                      <input
                        type="checkbox"
                        checked={formData[field.name] || false}
                        onChange={(e) => handleInputChange(field.name, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    ) : field.type === 'file' ? (
                      <input
                        type="file"
                        onChange={(e) => handleInputChange(field.name, e.target.files?.[0])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        accept=".json"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>
                ))}
              </div>

              {connectionStatus !== 'idle' && (
                <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                  connectionStatus === 'testing' ? 'bg-blue-50 text-blue-700' :
                  connectionStatus === 'success' ? 'bg-green-50 text-green-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {connectionStatus === 'testing' && (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-700 border-t-transparent" />
                      Testing connection...
                    </>
                  )}
                  {connectionStatus === 'success' && (
                    <>
                      <CheckCircle size={16} />
                      Connection successful!
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

              <div className="mt-6">
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Database size={16} />
                  Continue with {config?.name}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}