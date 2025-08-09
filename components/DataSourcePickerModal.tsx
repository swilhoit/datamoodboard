"use client"

import { X, Database as DatabaseIcon, FileSpreadsheet } from 'lucide-react'
import { GoogleSheetsLogo, ShopifyLogo, StripeLogo, GoogleAdsLogo } from './brand/Logos'

type SourceType = 'googlesheets' | 'shopify' | 'stripe' | 'preset' | 'googleads' | 'csv'

interface DataSourcePickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (source: SourceType) => void
  isDarkMode?: boolean
}

const SOURCES: Array<{ key: SourceType; name: string; description: string; icon: any; color: string }> = [
  { key: 'googlesheets', name: 'Google Sheets', description: 'Import data from a Google Spreadsheet', icon: (props: any) => <GoogleSheetsLogo size={props.size ?? 18} className="text-[#0F9D58]" />, color: 'text-green-600' },
  { key: 'csv', name: 'CSV Upload', description: 'Upload a CSV file and import it as a table', icon: FileSpreadsheet, color: 'text-emerald-600' },
  { key: 'shopify', name: 'Shopify', description: 'Connect your store orders, products, customers', icon: (props: any) => <ShopifyLogo size={props.size ?? 18} className="text-[#95BF47]" />, color: 'text-purple-600' },
  { key: 'stripe', name: 'Stripe', description: 'Payments, customers, subscriptions', icon: (props: any) => <StripeLogo size={props.size ?? 18} className="text-[#635BFF]" />, color: 'text-indigo-600' },
  { key: 'googleads', name: 'Google Ads', description: 'Connect your ad accounts and campaigns', icon: (props: any) => <GoogleAdsLogo size={props.size ?? 18} className="text-[#4285F4]" />, color: 'text-yellow-600' },
  { key: 'preset', name: 'Preset Data', description: 'Browse and import premade sample datasets', icon: DatabaseIcon, color: 'text-blue-600' },
]

export default function DataSourcePickerModal({ isOpen, onClose, onSelect, isDarkMode = false }: DataSourcePickerModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`w-[680px] rounded-xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white'}`}>
        <div className={`p-4 flex items-center justify-between ${isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
          <div className="text-sm font-semibold">Add Data Source</div>
          <button onClick={onClose} className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <X size={16} />
          </button>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SOURCES.map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.key}
                className={`text-left rounded-lg border p-4 hover:shadow-md transition ${isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}
                onClick={() => onSelect(s.key)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={18} className={s.color} />
                  <div className="font-medium">{s.name}</div>
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{s.description}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}


