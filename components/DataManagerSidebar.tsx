"use client"

import React, { useState, useEffect } from 'react'
import { ChevronRight, Database, Trash2, Table, GripVertical, Plus, Search, Sheet, Pencil } from 'lucide-react'
import ConfirmDialog from '@/lib/ui/components/ConfirmDialog'
import { createClient } from '@/lib/supabase/client'
import DataSourceModal from './DataSourceModal'

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

function DataManagerSidebar({ 
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

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string>('')
  const [renamingId, setRenamingId] = useState<string | null>(null)

  // DataSourceModal state
  const [showDataSourceModal, setShowDataSourceModal] = useState(false)

  // Highlighted table state
  const [highlightedTableId, setHighlightedTableId] = useState<string | null>(null)

  // Load user tables from Supabase
  const loadTables = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      // console.log('DataManagerSidebar: Loading tables for user:', user?.id)
      
      if (!user) {
        // console.log('DataManagerSidebar: No user found')
        setTables([])
        return
      }

      const { data, error } = await supabase
        .from('user_data_tables')
        .select('id, name, source, row_count, created_at, schema')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // console.log('DataManagerSidebar: Query result:', { data, error })

      if (error) {
        console.error('Error loading tables:', error)
        setTables([])
      } else {
        // console.log('DataManagerSidebar: Setting tables:', data?.length || 0, 'tables')
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

  // Start inline rename
  const beginRename = (tableId: string, currentName: string) => {
    // console.log('Begin rename:', tableId, currentName)
    setEditingId(tableId)
    setEditingName(currentName)
  }

  const cancelRename = () => {
    setEditingId(null)
    setEditingName('')
    setRenamingId(null)
  }

  const commitRename = async () => {
    if (!editingId) return cancelRename()
    const newName = editingName.trim()
    const original = tables.find(t => t.id === editingId)
    if (!original) return cancelRename()
    if (newName.length === 0) {
      alert('Name cannot be empty')
      return
    }
    if (newName === original.name) {
      return cancelRename()
    }
    const duplicate = tables.find(t => t.name.toLowerCase() === newName.toLowerCase() && t.id !== editingId)
    if (duplicate) {
      alert('A table with this name already exists')
      return
    }
    try {
      setRenamingId(editingId)
      const supabase = createClient()
      const { error } = await supabase
        .from('user_data_tables')
        .update({ name: newName, updated_at: new Date().toISOString() })
        .eq('id', editingId)
      if (error) throw error
      setTables(prev => prev.map(t => (t.id === editingId ? { ...t, name: newName } : t)))
    } catch (err) {
      console.error('Error renaming table:', err)
      alert('Failed to rename table')
    } finally {
      cancelRename()
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

  // Handle data source connection from DataSourceModal
  const handleDataSourceConnect = (type: string, data: any) => {
    // Trigger the same event that the legacy flow would trigger
    // This ensures compatibility with existing canvas integration
    window.dispatchEvent(new CustomEvent('dataflow-create-source-on-canvas', { 
      detail: { source: type, config: data } 
    }))
    
    // Also call the legacy callback if provided for backward compatibility
    onAddDataSource?.()
    
    // Close the modal
    setShowDataSourceModal(false)
    
    // Reload tables to show the new data source if it gets saved as a table
    setTimeout(() => {
      loadTables()
    }, 1000)
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
      // console.log('DataManagerSidebar: Received dataflow-table-saved event, reloading tables')
      loadTables()
    }
    
    const handleTableRenamed = (e: any) => {
      const { tableId, newName } = e.detail || {}
      if (tableId && newName) {
        // console.log('DataManagerSidebar: Table renamed:', tableId, newName)
        setTables(prev => prev.map(t => 
          t.id === tableId ? { ...t, name: newName } : t
        ))
      }
    }
    
    window.addEventListener('dataflow-table-saved', handleTableAdded)
    window.addEventListener('dataflow-table-renamed', handleTableRenamed as EventListener)
    return () => {
      window.removeEventListener('dataflow-table-saved', handleTableAdded)
      window.removeEventListener('dataflow-table-renamed', handleTableRenamed as EventListener)
    }
  }, [])

  // Filter tables based on search
  const filteredTables = tables.filter(table => 
    table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.source.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Fade out after 5s: setTimeout(() => setHighlightedTableId(null), 5000)
  useEffect(() => {
    if (highlightedTableId) {
      const timer = setTimeout(() => setHighlightedTableId(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [highlightedTableId])

  return (
    <div 
      className={`absolute left-4 top-1/2 -translate-y-1/2 bg-white border border-gray-200 transition-all duration-300 z-20 ${
        isOpen ? 'w-64' : 'w-12'
      } max-h-[500px] rounded-lg shadow-lg flex flex-col overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
        {isOpen && (
          <div className="flex items-center gap-2">
            <Database size={18} className="text-gray-600" />
            <span className="font-dm-mono font-medium text-xs uppercase tracking-wider">DATA MANAGER</span>
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
        <div className="flex flex-col flex-1 min-h-0">
          {/* Search and Add */}
          <div className="p-3 space-y-2 border-b border-gray-200 flex-shrink-0">
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
                onClick={() => setShowDataSourceModal(true)}
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
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
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
                    draggable={editingId !== table.id}
                    onDragStart={(e) => {
                      if (editingId !== table.id) {
                        handleDragStart(e, table)
                      }
                    }}
                    className={`group relative p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:bg-gray-100 transition-colors ${
                      table.id === highlightedTableId ? 'border-green-500 animate-pulse' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Table size={14} className="text-gray-500 flex-shrink-0" />
                          {editingId === table.id ? (
                            <input
                              value={editingName}
                              autoFocus
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={commitRename}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitRename()
                                if (e.key === 'Escape') cancelRename()
                              }}
                              maxLength={100}
                              className="flex-1 min-w-0 text-sm font-medium bg-white border border-blue-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <div
                              className="text-left flex-1 min-w-0 cursor-text select-none"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                beginRename(table.id, table.name)
                              }}
                              onMouseDown={(e) => {
                                // Prevent drag from starting when clicking on name
                                e.stopPropagation()
                              }}
                              title="Click to rename table"
                              style={{ userSelect: 'none' }}
                            >
                              <span className="text-sm font-medium truncate inline-block align-middle hover:text-blue-600 hover:underline">
                                {table.name}
                              </span>
                            </div>
                          )}
                          {editingId !== table.id && (
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                beginRename(table.id, table.name)
                              }}
                              onMouseDown={(e) => {
                                // Prevent drag from starting when clicking on edit button
                                e.stopPropagation()
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-all"
                              title="Edit name"
                            >
                              <Pencil size={14} className="text-gray-500" />
                            </button>
                          )}
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
                      <button
                        onClick={() => onAddTable?.()}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-green-100 transition-all"
                        title="Load to Canvas"
                      >
                        <Sheet size={14} className="text-green-500" />
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
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Delete table?"
        description="This will permanently delete the table and its metadata. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        loading={isConfirming}
        onConfirm={confirmDeleteTable}
        onCancel={() => setConfirmDeleteId(null)}
      />
      
      {/* DataSourceModal for OAuth-enabled data source connections */}
      <DataSourceModal
        isOpen={showDataSourceModal}
        onClose={() => setShowDataSourceModal(false)}
        onConnect={handleDataSourceConnect}
        isDarkMode={false}
      />

    </div>
  )
}

export default React.memo(DataManagerSidebar)