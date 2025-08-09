'use client'

import { 
  Database, Table2, Plus, FolderOpen, Sparkles, GitMerge
} from 'lucide-react'

interface DataNodePanelProps {
  onAddNode: (type: 'table' | 'transform' | 'chart', subType?: any) => void
  onOpenConnector: () => void
  isDarkMode?: boolean
}

export default function DataNodePanel({ onAddNode, onOpenConnector, isDarkMode = false }: DataNodePanelProps) {
  return (
    <div className={`absolute top-20 left-4 w-64 rounded-lg shadow-xl border overflow-hidden z-10 ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <h3 className="font-semibold flex items-center gap-2">
          <Database size={18} />
          Data Flow Builder
        </h3>
        <p className="text-xs mt-1 opacity-90">Connect sources → Create tables → Visualize</p>
      </div>

      <div className="p-3 space-y-4">
        {/* Connect Data Source Button */}
        <button
          onClick={onOpenConnector}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <Plus size={16} />
          <span className="font-medium">Connect Data Source</span>
        </button>

        {/* Create New Table */}
        <div>
          <div className={`flex items-center gap-2 text-xs font-semibold mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <Table2 size={14} />
            <span>Create Table</span>
          </div>
          <button
            onClick={() => onAddNode('table', { database: 'custom', name: 'New Table', isOutput: true })}
            className={`w-full p-3 rounded-lg border-2 border-dashed transition-all flex items-center justify-center gap-2 ${
              isDarkMode 
                ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700 text-gray-400' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-600'
            }`}
          >
            <Plus size={16} />
            <span className="text-sm font-medium">New Table</span>
          </button>
          <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Connect multiple sources to a table to combine data
          </p>
        </div>

        {/* Quick Add Sources */}
        <div>
          <div className={`flex items-center gap-2 text-xs font-semibold mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <Sparkles size={14} />
            <span>Quick Add</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onAddNode('table', { database: 'googlesheets', name: 'Sheet1' })}
              className={`p-3 flex flex-col items-center gap-1 rounded-lg border transition-all ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300' 
                  : 'bg-green-50 border-green-200 hover:bg-green-100'
              }`}
              title="Google Sheets"
            >
              <span className="text-lg">📊</span>
              <span className="text-xs">Sheets</span>
            </button>
            <button
              onClick={() => onAddNode('table', { database: 'shopify', name: 'Orders' })}
              className={`p-3 flex flex-col items-center gap-1 rounded-lg border transition-all ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300' 
                  : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
              }`}
              title="Shopify"
            >
              <span className="text-lg">🛍️</span>
              <span className="text-xs">Shopify</span>
            </button>
            <button
              onClick={() => onAddNode('table', { database: 'stripe', name: 'Payments' })}
              className={`p-3 flex flex-col items-center gap-1 rounded-lg border transition-all ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300' 
                  : 'bg-purple-50 border-purple-200 hover:bg-purple-100'
              }`}
              title="Stripe"
            >
              <span className="text-lg">💳</span>
              <span className="text-xs">Stripe</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}