'use client'

import { useEffect, useState } from 'react'
import { listDashboards, renameDashboard, deleteDashboard, type DashboardRecord } from '@/lib/dashboardService'
import { ExternalLink, Link as LinkIcon, Pencil, Trash2, RefreshCw, FolderOpen, Eye, Search } from 'lucide-react'

interface MyDashboardsModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenDashboard: (id: string) => Promise<void> | void
  isDarkMode?: boolean
}

export default function MyDashboardsModal({ isOpen, onClose, onOpenDashboard, isDarkMode }: MyDashboardsModalProps) {
  const [dashboards, setDashboards] = useState<DashboardRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    setError(null)
    listDashboards()
      .then(setDashboards)
      .catch((e) => setError((e as any)?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [isOpen])

  const filtered = dashboards.filter(d => (d.name || '').toLowerCase().includes(query.toLowerCase()))

  const copyLink = async (d: DashboardRecord) => {
    if (!d.share_slug) return
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      await navigator.clipboard.writeText(`${origin}/shared/${d.share_slug}`)
      setCopiedId(d.id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {}
  }

  const viewLive = (d: DashboardRecord) => {
    if (!d.share_slug) return
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    window.open(`${origin}/shared/${d.share_slug}`, '_blank')
  }

  const doRename = async (d: DashboardRecord) => {
    const newName = prompt('Rename dashboard', d.name)
    if (!newName || newName === d.name) return
    try {
      const updated = await renameDashboard(d.id, newName)
      setDashboards(prev => prev.map(x => x.id === d.id ? { ...x, name: updated.name } as DashboardRecord : x))
    } catch (e) {
      alert('Failed to rename')
    }
  }

  const doDelete = async (d: DashboardRecord) => {
    if (!confirm('Delete this dashboard? This cannot be undone.')) return
    try {
      await deleteDashboard(d.id)
      setDashboards(prev => prev.filter(x => x.id !== d.id))
    } catch (e) {
      alert('Failed to delete')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`w-full max-w-4xl mx-4 rounded-xl shadow-2xl ${isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <div className={`p-4 flex items-center justify-between ${isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className={isDarkMode ? 'text-white' : 'text-gray-900'} />
            <div className={`font-dm-mono font-medium text-xs uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>MY DASHBOARDS</div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-2 py-1 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <Search size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className={`bg-transparent outline-none text-sm ${isDarkMode ? 'text-gray-200 placeholder:text-gray-500' : 'text-gray-800 placeholder:text-gray-500'}`}
              />
            </div>
            <button onClick={onClose} className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>✕</button>
          </div>
        </div>
        <div className="p-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm"><RefreshCw size={16} className="animate-spin" /> Loading…</div>
          )}
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          {!loading && filtered.length === 0 && (
            <div className={isDarkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>No dashboards yet.</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(d => {
              const origin = typeof window !== 'undefined' ? window.location.origin : ''
              const shareUrl = d.share_slug ? `${origin}/shared/${d.share_slug}` : ''
              return (
                <div key={d.id} className={`rounded-lg overflow-hidden border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} shadow-sm`}>
                  <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                    {d.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.thumbnail_url} alt={d.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className={isDarkMode ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs'}>No thumbnail</div>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <div className={`text-sm font-dm-mono font-medium truncate ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{d.name}</div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{d.updated_at ? new Date(d.updated_at).toLocaleString() : ''}</div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenDashboard(d.id)}
                          className={`px-2 py-1 text-xs rounded ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                        >
                          Open
                        </button>
                        <button
                          onClick={() => viewLive(d)}
                          disabled={!d.share_slug}
                          title={d.share_slug ? 'View live' : 'Not published yet'}
                          className={`p-1 rounded ${d.share_slug ? (isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200') : (isDarkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-50 text-gray-400')}`}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => copyLink(d)}
                          disabled={!d.share_slug}
                          title={d.share_slug ? 'Copy link' : 'Not published yet'}
                          className={`p-1 rounded ${d.share_slug ? (isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200') : (isDarkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-50 text-gray-400')}`}
                        >
                          {copiedId === d.id ? 'Copied' : <LinkIcon size={14} />}
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => doRename(d)} className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}><Pencil size={14} /></button>
                        <button onClick={() => doDelete(d)} className={`p-1 rounded ${isDarkMode ? 'hover:bg-red-900/20 text-red-300' : 'hover:bg-red-50 text-red-600'}`}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}


