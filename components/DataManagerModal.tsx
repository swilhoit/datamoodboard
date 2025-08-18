"use client"

import { X } from 'lucide-react'
import TableViewer from './TableViewer'

interface DataManagerModalProps {
  isOpen: boolean
  onClose: () => void
  externalTable?: {
    id: string
    name: string
    source: string
    data: any[]
    schema: any[]
  } | null
  onUpdateExternal?: (tableId: string, updates: any) => void
}

export default function DataManagerModal({ isOpen, onClose, externalTable = null, onUpdateExternal }: DataManagerModalProps) {
  if (!isOpen) return null

  const selectedTable = externalTable

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-[1100px] h-[80vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Main */}
        <div className="relative flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="font-dm-mono font-medium text-sm uppercase tracking-wider">TABLE EDITOR</div>
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
                embedded={true}
                onClose={onClose}
                onUpdate={async (tableId, updates) => {
                  onUpdateExternal?.(tableId, updates)
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No table selected
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


