'use client'

import { useState } from 'react'
import { X, CheckCircle, AlertCircle, Loader2, ExternalLink, CreditCard } from 'lucide-react'

interface StripeConnectorProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (data: any) => void
}

export default function StripeConnector({ isOpen, onClose, onConnect }: StripeConnectorProps) {
  const [formData, setFormData] = useState({
    secretKey: '',
    isLiveMode: false
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')

  if (!isOpen) return null

  const handleConnect = async () => {
    setIsConnecting(true)
    setConnectionStatus('testing')

    // Simulate API connection
    setTimeout(() => {
      const sampleData = [
        { id: 'pi_1234', amount: 2999, currency: 'usd', status: 'succeeded', created: '2024-01-15', customer_email: 'john@example.com' },
        { id: 'pi_1235', amount: 8950, currency: 'usd', status: 'succeeded', created: '2024-01-14', customer_email: 'sarah@example.com' },
        { id: 'pi_1236', amount: 24500, currency: 'usd', status: 'succeeded', created: '2024-01-13', customer_email: 'mike@example.com' },
        { id: 'pi_1237', amount: 6799, currency: 'usd', status: 'requires_payment_method', created: '2024-01-12', customer_email: 'emma@example.com' },
        { id: 'pi_1238', amount: 15675, currency: 'usd', status: 'succeeded', created: '2024-01-11', customer_email: 'david@example.com' },
      ]

      setConnectionStatus('success')
      setIsConnecting(false)

      onConnect({
        name: `Stripe ${formData.isLiveMode ? 'Live' : 'Test'} Payments`,
        spreadsheetId: 'stripe_payments',
        range: 'A1:F100',
        rowCount: sampleData.length,
        schema: [
          { name: 'id', type: 'VARCHAR(50)' },
          { name: 'amount', type: 'INTEGER' },
          { name: 'currency', type: 'VARCHAR(3)' },
          { name: 'status', type: 'VARCHAR(50)' },
          { name: 'created', type: 'DATE' },
          { name: 'customer_email', type: 'VARCHAR(255)' },
        ],
        data: sampleData
      })
    }, 2000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-16 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <CreditCard size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Connect Stripe</h2>
                <p className="text-sm opacity-90">Import payment data</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secret Key
              </label>
              <input
                type="password"
                value={formData.secretKey}
                onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                placeholder="sk_live_... or sk_test_..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                id="liveMode"
                type="checkbox"
                checked={formData.isLiveMode}
                onChange={(e) => setFormData({ ...formData, isLiveMode: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="liveMode" className="ml-2 block text-sm text-gray-700">
                Live Mode (uncheck for test mode)
              </label>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How to get your secret key:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Log in to your Stripe Dashboard</li>
                <li>2. Go to Developers → API keys</li>
                <li>3. Copy your Secret key (starts with sk_live_ or sk_test_)</li>
                <li>4. Paste it in the field above</li>
              </ol>
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
              >
                Open Stripe Dashboard <ExternalLink size={14} />
              </a>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Security Note:</p>
                  <p>Your secret key is processed securely and not stored permanently.</p>
                </div>
              </div>
            </div>

            {connectionStatus !== 'idle' && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                connectionStatus === 'testing' ? 'bg-blue-50 text-blue-700' :
                connectionStatus === 'success' ? 'bg-green-50 text-green-700' :
                'bg-red-50 text-red-700'
              }`}>
                {connectionStatus === 'testing' && (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Connecting to Stripe...
                  </>
                )}
                {connectionStatus === 'success' && (
                  <>
                    <CheckCircle size={16} />
                    Connected successfully! Sample payments loaded.
                  </>
                )}
                {connectionStatus === 'error' && (
                  <>
                    <AlertCircle size={16} />
                    Connection failed. Please check your secret key.
                  </>
                )}
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={isConnecting || !formData.secretKey}
              className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                !formData.secretKey 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isConnecting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  Connect Stripe Account
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}