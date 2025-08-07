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
    fields: [],
    customComponent: true,
  },
  bigquery: {
    name: 'BigQuery',
    icon: '🔷',
    color: 'bg-blue-500',
    fields: [
      { name: 'projectId', label: 'Project ID', type: 'text', required: true },
      { name: 'datasetId', label: 'Dataset ID', type: 'text', required: true },
      { name: 'keyFile', label: 'Service Account Key', type: 'file', required: true },
    ]
  },
  postgresql: {
    name: 'PostgreSQL',
    icon: '🐘',
    color: 'bg-blue-600',
    fields: [
      { name: 'host', label: 'Host', type: 'text', required: true, placeholder: 'localhost' },
      { name: 'port', label: 'Port', type: 'number', required: true, placeholder: '5432' },
      { name: 'database', label: 'Database', type: 'text', required: true },
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'ssl', label: 'Use SSL', type: 'checkbox', required: false },
    ]
  },
  mysql: {
    name: 'MySQL',
    icon: '🐬',
    color: 'bg-orange-500',
    fields: [
      { name: 'host', label: 'Host', type: 'text', required: true, placeholder: 'localhost' },
      { name: 'port', label: 'Port', type: 'number', required: true, placeholder: '3306' },
      { name: 'database', label: 'Database', type: 'text', required: true },
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
    ]
  },
  mongodb: {
    name: 'MongoDB',
    icon: '🍃',
    color: 'bg-green-600',
    fields: [
      { name: 'connectionString', label: 'Connection String', type: 'text', required: true, placeholder: 'mongodb://...' },
      { name: 'database', label: 'Database', type: 'text', required: true },
      { name: 'collection', label: 'Collection', type: 'text', required: false },
    ]
  },
  snowflake: {
    name: 'Snowflake',
    icon: '❄️',
    color: 'bg-cyan-500',
    fields: [
      { name: 'account', label: 'Account', type: 'text', required: true },
      { name: 'warehouse', label: 'Warehouse', type: 'text', required: true },
      { name: 'database', label: 'Database', type: 'text', required: true },
      { name: 'schema', label: 'Schema', type: 'text', required: true },
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
    ]
  },
  redshift: {
    name: 'Redshift',
    icon: '🔴',
    color: 'bg-red-600',
    fields: [
      { name: 'host', label: 'Host', type: 'text', required: true },
      { name: 'port', label: 'Port', type: 'number', required: true, placeholder: '5439' },
      { name: 'database', label: 'Database', type: 'text', required: true },
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
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
      onClose()
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
              <h2 className="text-xl font-bold">Connect to Database</h2>
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
              <p className="text-sm text-gray-600 mb-4">Select a database to connect:</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(databaseConfigs).map(([key, db]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDb(key as DatabaseType)}
                    className={`p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all flex items-center gap-3`}
                  >
                    <span className="text-2xl">{db.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold">{db.name}</div>
                      <div className="text-xs text-gray-500">Click to configure</div>
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

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleTestConnection}
                  disabled={isConnecting}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <TestTube size={16} />
                  Test Connection
                </button>
                <button
                  onClick={handleConnect}
                  disabled={isConnecting || connectionStatus !== 'success'}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    connectionStatus === 'success' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Database size={16} />
                  Connect & Add Tables
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}