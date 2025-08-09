"use client"

import { useState, useEffect } from 'react'
import { ChevronRight, Database, Trash2, Table, GripVertical, Plus, Search, Sheet, ShoppingBag, CreditCard, Megaphone, X } from 'lucide-react'
import ConfirmModal from './ConfirmModal'
import { createClient } from '@/lib/supabase/client'
import DataSourceConnector from './DataSourceConnector'

interface DataTable {
  id: string
  name: string
  source: string
  row_count: number
  created_at: string
  schema?: any[]
}

interface DataManagerSidebarProps {
  onDragStart: (table: DataTable) => void
  onTableDeleted?: (tableId: string) => void
  // Deprecated: use onAddDataSource instead
  onAddTable?: () => void
  onAddDataSource?: () => void
  onCreateTable?: () => void
}

export default function DataManagerSidebar({ 
  onDragStart, 
  onTableDeleted,
  onAddTable,
  onAddDataSource,
  onCreateTable,
}: DataManagerSidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [tables, setTables] = useState<DataTable[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  // Inline add-source flow state
  const [isAddingSource, setIsAddingSource] = useState(false)
  const [pendingSourceType, setPendingSourceType] = useState<'googlesheets' | 'shopify' | 'stripe' | 'googleads' | 'csv' | null>(null)

  // Load user tables from Supabase
  const loadTables = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      console.log('DataManagerSidebar: Loading tables for user:', user?.id)
      
      if (!user) {
        console.log('DataManagerSidebar: No user found')
        setTables([])
        return
      }

      const { data, error } = await supabase
        .from('user_data_tables')
        .select('id, name, source, row_count, created_at, schema')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      console.log('DataManagerSidebar: Query result:', { data, error })

      if (error) {
        console.error('Error loading tables:', error)
        setTables([])
      } else {
        console.log('DataManagerSidebar: Setting tables:', data?.length || 0, 'tables')
        const safe = (data || []).map((t: any) => ({
          id: String(t.id),
          name: String(t.name),
          source: String(t.source),
          row_count: Number(t.row_count || 0),
          created_at: t.created_at || new Date().toISOString(),
          schema: Array.isArray(t.schema) ? t.schema : [],
        }))
        setTables(safe)
      }
    } catch (error) {
      console.error('Error loading tables:', error)
      setTables([])
    } finally {
      setLoading(false)
    }
  }

  // Delete a table with custom confirmation modal
  const requestDeleteTable = (tableId: string) => {
    setConfirmDeleteId(tableId)
  }

  const confirmDeleteTable = async () => {
    if (!confirmDeleteId) return
    const tableId = confirmDeleteId
    try {
      setIsConfirming(true)
      setDeletingId(tableId)
      const supabase = createClient()
      const { error } = await supabase
        .from('user_data_tables')
        .delete()
        .eq('id', tableId)

      if (error) {
        console.error('Error deleting table:', error)
        alert('Failed to delete table')
      } else {
        setTables(prev => prev.filter(t => t.id !== tableId))
        onTableDeleted?.(tableId)
      }
    } finally {
      setIsConfirming(false)
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, table: DataTable) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'table',
      table: {
        id: table.id,
        name: table.name,
        source: table.source,
        schema: table.schema
      }
    }))
    onDragStart(table)
  }

  // Load tables on mount
  useEffect(() => {
    loadTables()
  }, [])

  // Inline create-source integration: allow outer canvas to handle creation
  useEffect(() => {
    const handler = (e: any) => {
      const { source, config } = e?.detail || {}
      // Broadcast to canvas to create a source node and open connector
      try {
        window.dispatchEvent(new CustomEvent('dataflow-create-source-on-canvas', { detail: { source, config } }))
      } catch {}
    }
    window.addEventListener('dataflow-create-source', handler as EventListener)
    return () => window.removeEventListener('dataflow-create-source', handler as EventListener)
  }, [])

  // Listen for table added events
  useEffect(() => {
    const handleTableAdded = () => {
      console.log('DataManagerSidebar: Received dataflow-table-saved event, reloading tables')
      loadTables()
    }
    
    window.addEventListener('dataflow-table-saved', handleTableAdded)
    return () => window.removeEventListener('dataflow-table-saved', handleTableAdded)
  }, [])

  // Filter tables based on search
  const filteredTables = tables.filter(table => 
    table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.source.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div 
      className={`absolute left-4 top-1/2 -translate-y-1/2 bg-white border border-gray-200 transition-all duration-300 z-20 ${
        isOpen ? 'w-64' : 'w-12'
      } max-h-[500px] rounded-lg shadow-lg overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        {isOpen && (
          <div className="flex items-center gap-2">
            <Database size={18} className="text-gray-600" />
            <span className="font-medium text-sm">Data Manager</span>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <ChevronRight 
            size={18} 
            className={`text-gray-600 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="flex flex-col h-[calc(100%-56px)]">
          {/* Search and Add */}
          <div className="p-3 space-y-2 border-b border-gray-200">
            <div className="relative">
              <Search size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => (onAddDataSource ?? onAddTable)?.()}
                className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                title="Add Data Source"
              >
                <Plus size={16} />
                Add Data Source
              </button>
              <button
                onClick={() => onCreateTable?.()}
                className="w-full px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                title="Create Empty Table"
              >
                <Table size={16} />
                Create Table
              </button>
            </div>
          </div>
          {/* Inline connector removed; creation now handled on canvas via modal */}

          {/* Tables List */}
          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="text-sm text-gray-500 text-center py-4">
                Loading tables...
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                {searchQuery ? 'No tables found' : 'No tables added yet'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTables.map((table) => (
                  <div
                    key={table.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, table)}
                    className="group relative p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Table size={14} className="text-gray-500 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {table.name}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {table.source} • {table.row_count || 0} rows
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          requestDeleteTable(table.id)
                        }}
                        disabled={deletingId === table.id}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 transition-all"
                      >
                        <Trash2 
                          size={14} 
                          className={`${
                            deletingId === table.id 
                              ? 'text-gray-400' 
                              : 'text-red-500'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Drag tables to canvas to use them
            </p>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete table?"
        description="This will permanently delete the table and its metadata. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
        loading={isConfirming}
        onConfirm={confirmDeleteTable}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}