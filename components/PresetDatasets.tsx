'use client'

import React, { useState } from 'react'
import { 
  X, Database, TrendingUp, DollarSign, 
  Building2, Users, Package, Globe,
  BarChart3, Activity, Coins, Calendar
} from 'lucide-react'

interface PresetDatasetsProps {
  isOpen: boolean
  onClose: () => void
  onSelectDataset: (dataset: any) => void
}

// Sample preset datasets
const PRESET_DATASETS = [
  {
    id: 'gold-prices',
    name: 'Gold Prices (2024)',
    description: 'Daily gold prices for 2024',
    icon: Coins,
    color: 'bg-yellow-500',
    iconColor: 'text-yellow-600',
    data: [
      { date: '2024-01-01', price: 2062.40, volume: 180234, change: 0.3 },
      { date: '2024-01-02', price: 2066.20, volume: 165432, change: 0.18 },
      { date: '2024-01-03', price: 2055.80, volume: 198765, change: -0.5 },
      { date: '2024-01-04', price: 2048.30, volume: 210345, change: -0.36 },
      { date: '2024-01-05', price: 2052.10, volume: 178654, change: 0.19 },
      { date: '2024-01-08', price: 2045.60, volume: 195432, change: -0.32 },
      { date: '2024-01-09', price: 2038.90, volume: 203456, change: -0.33 },
      { date: '2024-01-10', price: 2041.50, volume: 187654, change: 0.13 },
      { date: '2024-01-11', price: 2049.20, volume: 176543, change: 0.38 },
      { date: '2024-01-12', price: 2054.80, volume: 192345, change: 0.27 }
    ]
  },
  {
    id: 'stock-prices',
    name: 'Tech Stock Prices',
    description: 'Major tech company stock prices',
    icon: TrendingUp,
    color: 'bg-green-500',
    iconColor: 'text-green-600',
    data: [
      { company: 'Apple', symbol: 'AAPL', price: 195.89, marketCap: '3.04T', pe: 32.1, change: 1.2 },
      { company: 'Microsoft', symbol: 'MSFT', price: 429.64, marketCap: '3.19T', pe: 37.8, change: 0.8 },
      { company: 'Google', symbol: 'GOOGL', price: 155.34, marketCap: '1.97T', pe: 28.5, change: -0.3 },
      { company: 'Amazon', symbol: 'AMZN', price: 178.86, marketCap: '1.86T', pe: 65.2, change: 2.1 },
      { company: 'Meta', symbol: 'META', price: 503.78, marketCap: '1.28T', pe: 29.4, change: 1.5 },
      { company: 'Tesla', symbol: 'TSLA', price: 248.42, marketCap: '789B', pe: 71.3, change: -1.2 },
      { company: 'NVIDIA', symbol: 'NVDA', price: 878.35, marketCap: '2.16T', pe: 68.9, change: 3.4 }
    ]
  },
  {
    id: 'sales-data',
    name: 'Monthly Sales Data',
    description: 'E-commerce sales by category',
    icon: DollarSign,
    color: 'bg-blue-500',
    iconColor: 'text-blue-600',
    data: [
      { month: 'January', electronics: 125000, clothing: 89000, home: 67000, sports: 45000, books: 23000 },
      { month: 'February', electronics: 132000, clothing: 92000, home: 71000, sports: 48000, books: 25000 },
      { month: 'March', electronics: 148000, clothing: 105000, home: 78000, sports: 52000, books: 28000 },
      { month: 'April', electronics: 139000, clothing: 118000, home: 82000, sports: 61000, books: 27000 },
      { month: 'May', electronics: 155000, clothing: 125000, home: 88000, sports: 68000, books: 31000 },
      { month: 'June', electronics: 162000, clothing: 132000, home: 92000, sports: 75000, books: 29000 }
    ]
  },
  {
    id: 'demographics',
    name: 'Customer Demographics',
    description: 'User base by age and region',
    icon: Users,
    color: 'bg-purple-500',
    iconColor: 'text-purple-600',
    data: [
      { ageGroup: '18-24', northAmerica: 2500, europe: 3200, asia: 4800, other: 900 },
      { ageGroup: '25-34', northAmerica: 4200, europe: 3800, asia: 6200, other: 1200 },
      { ageGroup: '35-44', northAmerica: 3800, europe: 3100, asia: 4500, other: 1000 },
      { ageGroup: '45-54', northAmerica: 2900, europe: 2500, asia: 3200, other: 800 },
      { ageGroup: '55-64', northAmerica: 2100, europe: 1900, asia: 2100, other: 600 },
      { ageGroup: '65+', northAmerica: 1500, europe: 1200, asia: 1400, other: 400 }
    ]
  },
  {
    id: 'website-metrics',
    name: 'Website Analytics',
    description: 'Daily website traffic metrics',
    icon: Activity,
    color: 'bg-indigo-500',
    iconColor: 'text-indigo-600',
    data: [
      { date: '2024-01-01', visitors: 12543, pageViews: 45678, bounceRate: 42.3, avgDuration: 234 },
      { date: '2024-01-02', visitors: 15234, pageViews: 52341, bounceRate: 38.7, avgDuration: 256 },
      { date: '2024-01-03', visitors: 14876, pageViews: 49875, bounceRate: 40.2, avgDuration: 245 },
      { date: '2024-01-04', visitors: 16234, pageViews: 56789, bounceRate: 36.5, avgDuration: 267 },
      { date: '2024-01-05', visitors: 13456, pageViews: 47234, bounceRate: 41.8, avgDuration: 238 },
      { date: '2024-01-06', visitors: 11234, pageViews: 38765, bounceRate: 44.2, avgDuration: 218 },
      { date: '2024-01-07', visitors: 10876, pageViews: 36542, bounceRate: 45.6, avgDuration: 209 }
    ]
  },
  {
    id: 'real-estate',
    name: 'Real Estate Prices',
    description: 'Property prices by city',
    icon: Building2,
    color: 'bg-cyan-500',
    iconColor: 'text-cyan-600',
    data: [
      { city: 'New York', avgPrice: 850000, pricePerSqft: 1250, inventory: 3200, daysOnMarket: 45 },
      { city: 'San Francisco', avgPrice: 1200000, pricePerSqft: 1450, inventory: 1800, daysOnMarket: 38 },
      { city: 'Los Angeles', avgPrice: 750000, pricePerSqft: 980, inventory: 4200, daysOnMarket: 52 },
      { city: 'Chicago', avgPrice: 380000, pricePerSqft: 420, inventory: 5600, daysOnMarket: 68 },
      { city: 'Miami', avgPrice: 550000, pricePerSqft: 680, inventory: 3800, daysOnMarket: 55 },
      { city: 'Austin', avgPrice: 480000, pricePerSqft: 520, inventory: 2900, daysOnMarket: 42 },
      { city: 'Seattle', avgPrice: 720000, pricePerSqft: 880, inventory: 2100, daysOnMarket: 40 }
    ]
  },
  {
    id: 'crypto-prices',
    name: 'Cryptocurrency Prices',
    description: 'Top cryptocurrency market data',
    icon: Coins,
    color: 'bg-orange-500',
    iconColor: 'text-orange-600',
    data: [
      { name: 'Bitcoin', symbol: 'BTC', price: 43250, marketCap: '847B', volume24h: '28.5B', change24h: 2.3 },
      { name: 'Ethereum', symbol: 'ETH', price: 2280, marketCap: '274B', volume24h: '12.8B', change24h: 1.8 },
      { name: 'Tether', symbol: 'USDT', price: 1.00, marketCap: '91B', volume24h: '45.2B', change24h: 0.01 },
      { name: 'BNB', symbol: 'BNB', price: 318, marketCap: '48B', volume24h: '1.2B', change24h: -0.5 },
      { name: 'Solana', symbol: 'SOL', price: 98.5, marketCap: '43B', volume24h: '2.8B', change24h: 4.2 },
      { name: 'XRP', symbol: 'XRP', price: 0.62, marketCap: '34B', volume24h: '1.5B', change24h: 1.1 },
      { name: 'Cardano', symbol: 'ADA', price: 0.58, marketCap: '20B', volume24h: '450M', change24h: 3.6 }
    ]
  },
  {
    id: 'global-temperatures',
    name: 'Global Temperature Data',
    description: 'Average temperatures by region',
    icon: Globe,
    color: 'bg-red-500',
    iconColor: 'text-red-600',
    data: [
      { region: 'North America', jan: -5, feb: -2, mar: 4, apr: 11, may: 17, jun: 22, jul: 25, aug: 24, sep: 19, oct: 12, nov: 5, dec: -1 },
      { region: 'Europe', jan: 3, feb: 4, mar: 8, apr: 12, may: 17, jun: 21, jul: 23, aug: 23, sep: 18, oct: 13, nov: 7, dec: 4 },
      { region: 'Asia', jan: 8, feb: 10, mar: 15, apr: 20, may: 24, jun: 27, jul: 29, aug: 28, sep: 25, oct: 20, nov: 14, dec: 9 },
      { region: 'South America', jan: 25, feb: 24, mar: 23, apr: 20, may: 17, jun: 15, jul: 14, aug: 16, sep: 18, oct: 20, nov: 22, dec: 24 },
      { region: 'Africa', jan: 22, feb: 23, mar: 24, apr: 24, may: 23, jun: 21, jul: 20, aug: 21, sep: 22, oct: 23, nov: 23, dec: 22 },
      { region: 'Australia', jan: 28, feb: 27, mar: 25, apr: 22, may: 18, jun: 15, jul: 14, aug: 15, sep: 18, oct: 21, nov: 24, dec: 26 }
    ]
  }
]

export default function PresetDatasets({ isOpen, onClose, onSelectDataset }: PresetDatasetsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)

  if (!isOpen) return null

  const handleSelectDataset = (dataset: any) => {
    onSelectDataset({
      sourceType: 'preset',
      label: dataset.name,
      parsedData: dataset.data,
      description: dataset.description
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-[900px] max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-purple-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Preset Datasets</h2>
                <p className="text-sm text-gray-500">Select from pre-loaded sample datasets</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/60 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Dataset Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          <div className="grid grid-cols-2 gap-4">
            {PRESET_DATASETS.map((dataset) => {
              const Icon = dataset.icon
              return (
                <div
                  key={dataset.id}
                  className="border rounded-xl p-4 hover:border-purple-500 hover:bg-purple-50/30 transition-all cursor-pointer group"
                  onClick={() => setPreviewData(dataset)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${dataset.color} bg-opacity-10 flex items-center justify-center`}>
                      <Icon size={20} className={dataset.iconColor} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{dataset.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{dataset.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {dataset.data.length} rows × {Object.keys(dataset.data[0]).length} columns
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectDataset(dataset)
                          }}
                          className="px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Use Dataset
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Preview Table */}
                  {previewData?.id === dataset.id && (
                    <div className="mt-4 border-t pt-4">
                      <div className="text-xs font-medium text-gray-600 mb-2">Preview (first 3 rows)</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50">
                              {Object.keys(dataset.data[0]).map(key => (
                                <th key={key} className="px-2 py-1 text-left font-medium text-gray-700">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {dataset.data.slice(0, 3).map((row, i) => (
                              <tr key={i} className="border-t">
                                {Object.values(row).map((value: any, j) => (
                                  <td key={j} className="px-2 py-1 text-gray-600">
                                    {typeof value === 'number' ? value.toLocaleString() : value}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}