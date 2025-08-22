'use client'

import React, { useState } from 'react'
import { 
  Database, Cloud, Server, Layers, 
  Zap, Flame, X, Link2, AlertCircle,
  Loader2, Check, ChevronRight, ChevronLeft, Key,
  Settings, Eye, EyeOff
} from 'lucide-react'

interface DatabaseConnectorsProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (dbType: string, config: any) => void
  isDarkMode?: boolean
}

interface ConnectionConfig {
  [key: string]: string | number | boolean
}

// Popular databases - shown first
const POPULAR_DATABASES = [
  {
    id: 'bigquery',
    name: 'BigQuery',
    description: 'Google Cloud data warehouse',
    icon: Database,
    color: 'bg-blue-600',
    iconColor: 'text-blue-600',
    fields: [
      { key: 'projectId', label: 'Project ID', type: 'text', required: true },
      { key: 'datasetId', label: 'Dataset ID', type: 'text', required: false },
      { key: 'credentials', label: 'Service Account Key', type: 'file', required: true, accept: '.json' }
    ],
    oauth: true,
    popular: true
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Open source Firebase alternative',
    icon: Zap,
    color: 'bg-green-600',
    iconColor: 'text-green-600',
    fields: [
      { key: 'url', label: 'Project URL', type: 'text', required: true, placeholder: 'https://xxx.supabase.co' },
      { key: 'anonKey', label: 'Anon/Public Key', type: 'password', required: true },
      { key: 'serviceKey', label: 'Service Role Key', type: 'password', required: false }
    ],
    popular: true
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    description: 'Cloud data platform',
    icon: Cloud,
    color: 'bg-cyan-600',
    iconColor: 'text-cyan-600',
    fields: [
      { key: 'account', label: 'Account Identifier', type: 'text', required: true },
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'warehouse', label: 'Warehouse', type: 'text', required: true },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'schema', label: 'Schema', type: 'text', required: false }
    ],
    popular: true
  }
]

// Advanced databases - shown when expanded
const ADVANCED_DATABASES = [
  {
    id: 'redshift',
    name: 'Amazon Redshift',
    description: 'AWS data warehouse',
    icon: Server,
    color: 'bg-orange-600',
    iconColor: 'text-orange-600',
    fields: [
      { key: 'host', label: 'Cluster Endpoint', type: 'text', required: true },
      { key: 'port', label: 'Port', type: 'number', required: true, default: 5439 },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true }
    ]
  },
  {
    id: 'azure',
    name: 'Azure SQL',
    description: 'Microsoft cloud database',
    icon: Layers,
    color: 'bg-sky-600',
    iconColor: 'text-sky-600',
    fields: [
      { key: 'server', label: 'Server Name', type: 'text', required: true, placeholder: 'myserver.database.windows.net' },
      { key: 'database', label: 'Database Name', type: 'text', required: true },
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'encrypt', label: 'Use Encryption', type: 'checkbox', required: false, default: true }
    ]
  },
  {
    id: 'firebase',
    name: 'Firebase',
    description: 'Google app development platform',
    icon: Flame,
    color: 'bg-yellow-600',
    iconColor: 'text-yellow-600',
    fields: [
      { key: 'projectId', label: 'Project ID', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'authDomain', label: 'Auth Domain', type: 'text', required: true },
      { key: 'databaseURL', label: 'Database URL', type: 'text', required: false },
      { key: 'storageBucket', label: 'Storage Bucket', type: 'text', required: false }
    ],
    oauth: true
  }
]

const ALL_DATABASES = [...POPULAR_DATABASES, ...ADVANCED_DATABASES]

export default function DatabaseConnectors({ isOpen, onClose, onConnect, isDarkMode = false }: DatabaseConnectorsProps) {
  const [step, setStep] = useState<'select' | 'configure' | 'connect'>('select')
  const [selectedDb, setSelectedDb] = useState<typeof ALL_DATABASES[0] | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [config, setConfig] = useState<ConnectionConfig>({})
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Check for OAuth callbacks
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('integration') === 'bigquery' && params.get('status') === 'success') {
      setConnectionStatus('success')
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  if (!isOpen) return null

  const handleFieldChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleFileUpload = (key: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string)
          handleFieldChange(key, json)
        } catch (error) {
          setErrorMessage('Invalid JSON file')
          setConnectionStatus('error')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleOAuthConnect = (dbId: string) => {
    setIsConnecting(true)
    setConnectionStatus('testing')
    window.location.href = `/api/auth/${dbId}`
  }

  const testConnection = async () => {
    if (!selectedDb) return
    
    // Handle OAuth databases
    if (selectedDb.oauth) {
      handleOAuthConnect(selectedDb.id)
      return
    }
    
    // Validate required fields
    const missingFields = selectedDb.fields
      .filter(field => field.required && !config[field.key])
      .map(field => field.label)
    
    if (missingFields.length > 0) {
      setErrorMessage(`Please fill in: ${missingFields.join(', ')}`)
      setConnectionStatus('error')
      return
    }
    
    setConnectionStatus('testing')
    setErrorMessage('')
    
    // Simulate connection test
    setTimeout(() => {
      const success = Math.random() > 0.2
      if (success) {
        setConnectionStatus('success')
        // Auto-connect after successful test
        setTimeout(() => {
          onConnect(selectedDb.id, config)
          onClose()
        }, 1000)
      } else {
        setConnectionStatus('error')
        setErrorMessage('Connection failed. Please check your credentials.')
      }
    }, 2000)
  }

  const handleConnect = async () => {
    if (!selectedDb) return
    
    // Validate required fields
    const missingFields = selectedDb.fields
      .filter(field => field.required && !config[field.key])
      .map(field => field.label)
    
    if (missingFields.length > 0) {
      setErrorMessage(`Missing required fields: ${missingFields.join(', ')}`)
      setConnectionStatus('error')
      return
    }
    
    setIsConnecting(true)
    
    setTimeout(() => {
      onConnect(selectedDb.id, config)
      setIsConnecting(false)
      onClose()
    }, 1500)
  }

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }))
  }


  // Step 1: Database Selection
  if (step === 'select') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className={`w-[600px] max-h-[80vh] rounded-xl shadow-2xl overflow-hidden ${
          isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white'
        }`}>
          {/* Header */}
          <div className={`p-5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Choose Database</h2>
                <p className="text-sm text-gray-500 mt-1">Select your cloud database platform</p>
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
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Popular Databases */}
            <div className="mb-4">
              <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Popular Databases
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {POPULAR_DATABASES.map((db) => {
                  const Icon = db.icon
                  return (
                    <button
                      key={db.id}
                      onClick={() => {
                        setSelectedDb(db)
                        setStep('configure')
                        setConfig({})
                        setConnectionStatus('idle')
                        setErrorMessage('')
                      }}
                      className={`p-4 rounded-lg border transition-all hover:scale-[1.01] ${
                        isDarkMode
                          ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg ${db.color} bg-opacity-10 flex items-center justify-center`}>
                          <Icon size={24} className={db.iconColor} />
                        </div>
                        <div className="text-left flex-1">
                          <h3 className="font-semibold">{db.name}</h3>
                          <p className="text-sm text-gray-500">{db.description}</p>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Advanced Databases */}
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`w-full p-3 rounded-lg border border-dashed transition-all flex items-center justify-center gap-2 mb-3 ${
                  isDarkMode
                    ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm font-medium">
                  {showAdvanced ? 'Show Less' : `Advanced Databases (${ADVANCED_DATABASES.length})`}
                </span>
                <ChevronRight 
                  size={16} 
                  className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                />
              </button>
              
              {showAdvanced && (
                <div className="grid grid-cols-1 gap-2">
                  {ADVANCED_DATABASES.map((db) => {
                    const Icon = db.icon
                    return (
                      <button
                        key={db.id}
                        onClick={() => {
                          setSelectedDb(db)
                          setStep('configure')
                          setConfig({})
                          setConnectionStatus('idle')
                          setErrorMessage('')
                        }}
                        className={`p-3 rounded-lg border transition-all hover:scale-[1.01] ${
                          isDarkMode
                            ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${db.color} bg-opacity-10 flex items-center justify-center`}>
                            <Icon size={20} className={db.iconColor} />
                          </div>
                          <div className="text-left flex-1">
                            <h3 className="font-medium">{db.name}</h3>
                            <p className="text-sm text-gray-500">{db.description}</p>
                          </div>
                          <ChevronRight size={16} className="text-gray-400" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Configuration
  if (step === 'configure' && selectedDb) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className={`w-[500px] max-h-[80vh] rounded-xl shadow-2xl overflow-hidden ${
          isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white'
        }`}>
          {/* Header */}
          <div className={`p-5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep('select')}
                  className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700' : ''
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>
                <div className={`w-10 h-10 rounded-lg ${selectedDb.color} bg-opacity-10 flex items-center justify-center`}>
                  <selectedDb.icon size={20} className={selectedDb.iconColor} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{selectedDb.name}</h2>
                  <p className="text-sm text-gray-500">Configure connection</p>
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
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* OAuth Connect Button for supported databases */}
            {selectedDb.oauth && (
              <div className="mb-6">
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-900'
                  }`}>
                    One-click connection
                  </h4>
                  <p className={`text-sm mb-4 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-800'
                  }`}>
                    Authorize access to your {selectedDb.name} account securely.
                  </p>
                  <button
                    onClick={() => handleOAuthConnect(selectedDb.id)}
                    disabled={isConnecting || connectionStatus === 'success'}
                    className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      (isConnecting || connectionStatus === 'success')
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : `${selectedDb.color} text-white hover:opacity-90`
                    }`}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Connecting...
                      </>
                    ) : connectionStatus === 'success' ? (
                      <>
                        <Check size={16} />
                        Connected
                      </>
                    ) : (
                      <>
                        <Link2 size={16} />
                        Connect with {selectedDb.name}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Manual Configuration Fields */}
            {!selectedDb.oauth && (
              <div className="space-y-4">
                {selectedDb.fields.map((field) => (
                  <div key={field.key}>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {field.type === 'file' ? (
                      <input
                        type="file"
                        accept={'accept' in field ? field.accept as string : '.json'}
                        onChange={(e) => handleFileUpload(field.key, e)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-gray-100' 
                            : 'bg-white border-gray-300'
                        }`}
                      />
                    ) : field.type === 'checkbox' ? (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config[field.key] as boolean || ('default' in field ? field.default as boolean : false)}
                          onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Enable</span>
                      </label>
                    ) : field.type === 'password' ? (
                      <div className="relative">
                        <input
                          type={showPasswords[field.key] ? 'text' : 'password'}
                          placeholder={'placeholder' in field ? field.placeholder : undefined}
                          value={config[field.key] as string || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(field.key)}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 ${
                            isDarkMode ? 'hover:bg-gray-700' : ''
                          }`}
                        >
                          {showPasswords[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        placeholder={'placeholder' in field ? field.placeholder : undefined}
                        value={(() => {
                          const configValue = config[field.key]
                          if (typeof configValue === 'string' || typeof configValue === 'number') {
                            return configValue
                          }
                          if ('default' in field) {
                            const defaultValue = field.default
                            if (typeof defaultValue === 'string' || typeof defaultValue === 'number') {
                              return defaultValue
                            }
                          }
                          return ''
                        })()}
                        onChange={(e) => handleFieldChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-gray-100' 
                            : 'bg-white border-gray-300'
                        }`}
                      />
                    )}
                  </div>
                ))}

                {/* Connection Status */}
                {connectionStatus !== 'idle' && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 ${
                    connectionStatus === 'testing' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                    connectionStatus === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                    'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {connectionStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {connectionStatus === 'success' && <Check className="w-4 h-4" />}
                    {connectionStatus === 'error' && <AlertCircle className="w-4 h-4" />}
                    <span className="text-sm">
                      {connectionStatus === 'testing' && 'Testing connection...'}
                      {connectionStatus === 'success' && 'Connection successful!'}
                      {connectionStatus === 'error' && errorMessage}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className={`p-5 border-t flex items-center justify-between ${
            isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Key size={14} />
              <span>Secure encrypted connections</span>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setStep('select')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Back
              </button>
              {!selectedDb?.oauth && (
                <button
                  onClick={testConnection}
                  disabled={isConnecting || connectionStatus === 'testing'}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {connectionStatus === 'testing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Testing...
                    </>
                  ) : (
                    'Test & Connect'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback to original layout for other steps (should not reach here with new flow)
  return null
}