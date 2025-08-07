'use client'

import { 
  Database, GitMerge, Filter, Calculator, Table2, Code, 
  FileJson, Download, Upload, Layers, Sigma, Copy,
  Plus, Search, FolderOpen, BarChart2, LineChart, PieChart
} from 'lucide-react'
import { TransformType } from './TransformNode'

interface DataNodePanelProps {
  onAddNode: (type: 'table' | 'transform' | 'chart', subType?: any) => void
  onOpenConnector: () => void
  isDarkMode?: boolean
}

const transformNodes = [
  { type: 'sql' as TransformType, name: 'SQL Query', icon: Code, description: 'Write custom SQL' },
  { type: 'join' as TransformType, name: 'Join', icon: GitMerge, description: 'Join two tables' },
  { type: 'filter' as TransformType, name: 'Filter', icon: Filter, description: 'Filter rows' },
  { type: 'aggregate' as TransformType, name: 'Aggregate', icon: Sigma, description: 'Group and aggregate' },
  { type: 'pivot' as TransformType, name: 'Pivot', icon: Table2, description: 'Create pivot table' },
  { type: 'select' as TransformType, name: 'Select', icon: Layers, description: 'Select columns' },
  { type: 'union' as TransformType, name: 'Union', icon: Copy, description: 'Combine tables' },
  { type: 'merge' as TransformType, name: 'Merge', icon: GitMerge, description: 'Merge two tables' },
  { type: 'import' as TransformType, name: 'Import', icon: Upload, description: 'Import data' },
  { type: 'export' as TransformType, name: 'Export', icon: Download, description: 'Export results' },
]

export default function DataNodePanel({ onAddNode, onOpenConnector, isDarkMode = false }: DataNodePanelProps) {
  return (
    <div className={`absolute top-20 left-4 w-64 rounded-lg shadow-xl border overflow-hidden z-10 ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <h3 className="font-semibold flex items-center gap-2">
          <Database size={18} />
          Data Pipeline
        </h3>
        <p className="text-xs mt-1 opacity-90">Sheets, Shopify & Stripe ready</p>
      </div>

      <div className="p-3">
        <button
          onClick={onOpenConnector}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mb-3"
        >
          <Plus size={16} />
          Connect Data Source
        </button>

        <div className="mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
            <FolderOpen size={14} />
            Sample Data Sources
          </div>
          <div className="space-y-2">
            <button
              onClick={() => onAddNode('table', { database: 'googlesheets', name: 'Sheet1' })}
              className="w-full p-3 text-xs bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg border border-green-200 transition-colors flex items-center gap-3"
            >
              <span className="text-lg">📊</span>
              <div className="text-left">
                <div className="font-medium text-green-800">Google Sheets</div>
                <div className="text-green-600">Sample spreadsheet data</div>
              </div>
            </button>
            <button
              onClick={() => onAddNode('table', { database: 'shopify', name: 'orders' })}
              className="w-full p-3 text-xs bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg border border-green-200 transition-colors flex items-center gap-3"
            >
              <span className="text-lg">🛍️</span>
              <div className="text-left">
                <div className="font-medium text-green-800">Shopify Orders</div>
                <div className="text-green-600">Store transaction data</div>
              </div>
            </button>
            <button
              onClick={() => onAddNode('table', { database: 'stripe', name: 'payments' })}
              className="w-full p-3 text-xs bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg border border-purple-200 transition-colors flex items-center gap-3"
            >
              <span className="text-lg">💳</span>
              <div className="text-left">
                <div className="font-medium text-purple-800">Stripe Payments</div>
                <div className="text-purple-600">Payment transaction data</div>
              </div>
            </button>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
            <Layers size={14} />
            Transform Nodes
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {transformNodes.map((node) => (
              <button
                key={node.type}
                onClick={() => onAddNode('transform', node.type)}
                className="w-full p-2 text-left hover:bg-gray-50 rounded transition-colors flex items-center gap-3 group"
              >
                <div className="p-1.5 bg-gray-100 rounded group-hover:bg-blue-100 transition-colors">
                  <node.icon size={14} className="text-gray-600 group-hover:text-blue-600" />
                </div>
                <div>
                  <div className="text-xs font-medium">{node.name}</div>
                  <div className="text-xs text-gray-500">{node.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
            <BarChart2 size={14} />
            Output Nodes
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onAddNode('chart', 'bar')}
              className="p-3 flex flex-col items-center gap-1 bg-gray-50 hover:bg-purple-50 rounded border border-gray-200 hover:border-purple-300 transition-colors group"
            >
              <BarChart2 size={18} className="text-gray-600 group-hover:text-purple-600" />
              <span className="text-xs">Bar</span>
            </button>
            <button
              onClick={() => onAddNode('chart', 'line')}
              className="p-3 flex flex-col items-center gap-1 bg-gray-50 hover:bg-purple-50 rounded border border-gray-200 hover:border-purple-300 transition-colors group"
            >
              <LineChart size={18} className="text-gray-600 group-hover:text-purple-600" />
              <span className="text-xs">Line</span>
            </button>
            <button
              onClick={() => onAddNode('chart', 'pie')}
              className="p-3 flex flex-col items-center gap-1 bg-gray-50 hover:bg-purple-50 rounded border border-gray-200 hover:border-purple-300 transition-colors group"
            >
              <PieChart size={18} className="text-gray-600 group-hover:text-purple-600" />
              <span className="text-xs">Pie</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-white border-2 border-blue-500 rounded-full" />
            <span>Input connection</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white border-2 border-green-500 rounded-full" />
            <span>Output connection</span>
          </div>
        </div>
      </div>
    </div>
  )
}