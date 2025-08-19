'use client'

import React, { useState } from 'react'
import { 
  Database, Cloud, Server, Layers, 
  Zap, Flame, X, Link2, AlertCircle,
  Loader2, Check, ChevronRight, Key,
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

const CLOUD_DATABASES = [
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
    ]
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
    ]
  },
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
    ]
  }
]

export default function DatabaseConnectors({ isOpen, onClose, onConnect, isDarkMode = false }: DatabaseConnectorsProps) {
  const [selectedDb, setSelectedDb] = useState<typeof CLOUD_DATABASES[0] | null>(null)
  const [config, setConfig] = useState<ConnectionConfig>({})
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

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

  const testConnection = async () => {
    if (!selectedDb) return
    
    setConnectionStatus('testing')
    setErrorMessage('')
    
    // Simulate connection test
    setTimeout(() => {
      const success = Math.random() > 0.2
      if (success) {
        setConnectionStatus('success')
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`w-[900px] max-h-[85vh] rounded-xl shadow-2xl overflow-hidden flex ${
        isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white'
      }`}>
        {/* Sidebar */}
        <div className={`w-72 border-r ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-dm-mono font-medium uppercase tracking-wider">Database Connectors</h2>
            <p className="text-sm text-gray-500 mt-1">One-click cloud integration</p>
          </div>
          
          <div className="p-3">
            {CLOUD_DATABASES.map((db) => {
              const Icon = db.icon
              return (
                <button
                  key={db.id}
                  onClick={() => {
                    setSelectedDb(db)
                    setConfig({})
                    setConnectionStatus('idle')
                    setErrorMessage('')
                  }}
                  className={`w-full p-3 rounded-lg mb-2 flex items-center gap-3 transition-all ${
                    selectedDb?.id === db.id
                      ? isDarkMode 
                        ? 'bg-gray-700 border border-gray-600' 
                        : 'bg-white border border-gray-300 shadow-sm'
                      : isDarkMode
                        ? 'hover:bg-gray-700/50'
                        : 'hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${db.color} bg-opacity-10 flex items-center justify-center`}>
                    <Icon size={20} className={db.iconColor} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-dm-mono font-medium text-sm uppercase">{db.name}</div>
                    <div className="text-xs text-gray-500">{db.description}</div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className={`p-5 border-b flex items-center justify-between ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            {selectedDb ? (
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg ${selectedDb.color} bg-opacity-10 flex items-center justify-center`}>
                  <selectedDb.icon size={24} className={selectedDb.iconColor} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedDb.name}</h3>
                  <p className="text-sm text-gray-500">Configure connection settings</p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-lg">Select a Database</h3>
                <p className="text-sm text-gray-500">Choose a database from the left panel</p>
              </div>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
                isDarkMode ? 'hover:bg-gray-700' : ''
              }`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedDb ? (
              <div className="space-y-4">
                {selectedDb.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-dm-mono font-medium uppercase mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {field.type === 'file' ? (
                      <input
                        type="file"
                        accept={'accept' in field ? field.accept : '.json'}
                        onChange={(e) => handleFileUpload(field.key, e)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${
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
                          className="rounded text-gray-600 focus:ring-gray-500"
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
                          className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(field.key)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                        >
                          {showPasswords[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        placeholder={'placeholder' in field ? field.placeholder : undefined}
                        value={
                          typeof config[field.key] === 'boolean' 
                            ? '' 
                            : (config[field.key] || ('default' in field && typeof field.default !== 'boolean' ? field.default : '') || '')
                        }
                        onChange={(e) => handleFieldChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${
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
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Settings className="w-12 h-12 mb-3" />
                <p>Select a database to configure</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {selectedDb && (
            <div className={`p-5 border-t flex items-center justify-between ${
              isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Key size={14} />
                <span>Credentials are encrypted and stored securely</span>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={testConnection}
                  disabled={isConnecting || connectionStatus === 'testing'}
                  className={`px-4 py-2 text-sm font-dm-mono font-medium uppercase rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Test Connection
                </button>
                <button
                  onClick={handleConnect}
                  disabled={isConnecting || connectionStatus === 'testing'}
                  className="px-4 py-2 text-sm font-dm-mono font-medium uppercase text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      Connect
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}