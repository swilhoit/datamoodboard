"use client"

import { useEffect, useState } from 'react'
import { Database, Plus, RefreshCw, X } from 'lucide-react'
import { DataTableService } from '@/lib/supabase/data-tables'
import TableViewer from './TableViewer'

interface DataManagerModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DataManagerModal({ isOpen, onClose }: DataManagerModalProps) {
  const [loading, setLoading] = useState(false)
  const [tables, setTables] = useState<any[]>([])
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const dataTableService = new DataTableService()

  useEffect(() => {
    if (!isOpen) return
    ;(async () => {
      setLoading(true)
      try {
        const t = await dataTableService.getUserDataTables()
        setTables(t || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [isOpen])

  const refresh = async () => {
    setLoading(true)
    try {
      const t = await dataTableService.getUserDataTables()
      setTables(t || [])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const selectedTable = tables.find((t) => t.id === selectedTableId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-[1100px] h-[80vh] rounded-xl shadow-2xl overflow-hidden grid grid-cols-[320px_1fr]">
        {/* Sidebar */}
        <div className="border-r p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database size={18} className="text-blue-600" />
              <span className="font-semibold">Your Tables</span>
            </div>
            <button onClick={refresh} className="p-2 rounded hover:bg-gray-100" title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-sm text-gray-500 p-2">Loading...</div>
            ) : tables.length === 0 ? (
              <div className="text-sm text-gray-500 p-2">No tables yet. Import from Google Sheets or Shopify.</div>
            ) : (
              <ul className="space-y-1">
                {tables.map((t) => (
                  <li key={t.id}>
                    <button
                      onClick={() => setSelectedTableId(t.id)}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                        selectedTableId === t.id ? 'bg-blue-50 text-blue-700' : 'text-gray-800'
                      }`}
                    >
                      <div className="text-sm font-medium truncate">{t.name}</div>
                      <div className="text-xs text-gray-500 truncate">{t.source}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t pt-3 mt-3 text-xs text-gray-500">
            Tip: Click a table to open the editor
          </div>
        </div>

        {/* Main */}
        <div className="relative flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="font-semibold">Data Editor</div>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {selectedTable ? (
              <TableViewer
                table={{
                  id: selectedTable.id,
                  tableName: selectedTable.name,
                  database: selectedTable.source,
                  data: selectedTable.data,
                  schema: selectedTable.schema,
                }}
                isOpen={true}
                onClose={() => setSelectedTableId(null)}
                onUpdate={async (tableId, updates) => {
                  const updated = await dataTableService.updateDataTable(tableId, updates)
                  setTables((prev) => prev.map((t) => (t.id === tableId ? updated : t)))
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Select a table on the left to edit
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


