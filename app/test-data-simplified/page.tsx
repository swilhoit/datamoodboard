'use client'

import { useState } from 'react'

export default function TestDataSimplified() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Simplified Data Mode</h1>
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold">Focused Data Sources:</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-lg bg-green-500 text-white text-xl">📊</div>
                <div>
                  <h3 className="font-semibold text-green-700">Google Sheets</h3>
                  <p className="text-green-600 text-xs">Spreadsheet Integration</p>
                </div>
              </div>
              <ul className="space-y-1 text-gray-600">
                <li>• Easy spreadsheet data import</li>
                <li>• Real-time sync capability</li>
                <li>• Collaborative editing support</li>
                <li>• Formula preservation</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-lg bg-green-600 text-white text-xl">🛍️</div>
                <div>
                  <h3 className="font-semibold text-green-700">Shopify</h3>
                  <p className="text-green-600 text-xs">E-commerce Analytics</p>
                </div>
              </div>
              <ul className="space-y-1 text-gray-600">
                <li>• Orders and transaction data</li>
                <li>• Product performance metrics</li>
                <li>• Customer analytics</li>
                <li>• Revenue tracking</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-lg bg-purple-600 text-white text-xl">💳</div>
                <div>
                  <h3 className="font-semibold text-purple-700">Stripe</h3>
                  <p className="text-purple-600 text-xs">Payment Analytics</p>
                </div>
              </div>
              <ul className="space-y-1 text-gray-600">
                <li>• Payment transaction data</li>
                <li>• Subscription analytics</li>
                <li>• Refund and dispute tracking</li>
                <li>• Revenue metrics</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
            <h3 className="font-semibold text-blue-800 mb-2">Streamlined Experience:</h3>
            <ol className="text-blue-700 space-y-1 text-sm">
              <li>1. **Simplified Connection**: Only 3 popular data sources to choose from</li>
              <li>2. **Dedicated UI**: Each source has its own optimized connection flow</li>
              <li>3. **Quick Setup**: Pre-configured schemas and sample data</li>
              <li>4. **Focus on Business**: Common e-commerce and productivity tools</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">How to Test:</h2>
        
        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <div>
              <p className="font-medium">Switch to Data Mode</p>
              <p className="text-gray-600">Use the mode toggle at the top of the application</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <div>
              <p className="font-medium">Connect Data Source</p>
              <p className="text-gray-600">Click "Connect Data Source" in the Data Pipeline panel</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
            <div>
              <p className="font-medium">Choose Your Platform</p>
              <p className="text-gray-600">Select from Google Sheets, Shopify, or Stripe with detailed descriptions</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
            <div>
              <p className="font-medium">Simplified Configuration</p>
              <p className="text-gray-600">Each platform has its own dedicated setup flow with help text</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">Benefits of the Simplified Approach:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
            <div>✅ Reduced cognitive load</div>
            <div>✅ Faster onboarding</div>
            <div>✅ Better user guidance</div>
            <div>✅ Business-focused tools</div>
            <div>✅ Consistent experience</div>
            <div>✅ Optimized workflows</div>
          </div>
        </div>
      </div>
    </div>
  )
}