'use client'

import { useEffect, useState } from 'react'
import { Database, Download, ExternalLink, X, RefreshCw } from 'lucide-react'

type DatasetMeta = {
  id: string
  title: string
  description: string
  source: string
  sourceUrl?: string
  filePath: string
  tags?: string[]
}

interface PremadeDatasetsModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (params: { name: string; schema: any[]; data: any[]; rowCount: number }) => void
  isDarkMode?: boolean
}

const DATASETS: DatasetMeta[] = [
  {
    id: 'gold-prices',
    title: 'Daily Gold Prices',
    description: 'Historical daily gold spot prices. Useful for time-series charts and trend analysis.',
    source: 'Kaggle',
    sourceUrl: 'https://www.kaggle.com/datasets/faisaljanjua0555/daily-gold-price-historical-dataset',
    filePath: '/datasets/gold_prices_sample.json',
    tags: ['finance', 'time-series'],
  },
]

export default function PremadeDatasetsModal({ isOpen, onClose, onImport, isDarkMode = false }: PremadeDatasetsModalProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState<'downloading' | 'processing' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setLoadingId(null)
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const inferType = (value: any): string => {
    if (value === null || value === undefined) return 'VARCHAR(255)'
    if (typeof value === 'number') return Number.isInteger(value) ? 'INTEGER' : 'DECIMAL(12,4)'
    if (typeof value === 'boolean') return 'BOOLEAN'
    if (typeof value === 'string') {
      // Very light date detection (YYYY-MM-DD or ISO)
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'DATE'
      if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return 'TIMESTAMP'
      return 'VARCHAR(255)'
    }
    return 'JSON'
  }

  const buildSchema = (rows: any[]): any[] => {
    const first = rows[0] || {}
    return Object.keys(first).map((key) => ({
      name: key,
      type: inferType(first[key]),
    }))
  }

  const handleImport = async (ds: DatasetMeta) => {
    try {
      setError(null)
      setLoadingId(ds.id)
      setLoadingStep('downloading')
      const res = await fetch(ds.filePath)
      if (!res.ok) throw new Error(`Failed to load ${ds.title}`)
      setLoadingStep('processing')
      const json = await res.json()
      if (!Array.isArray(json)) throw new Error('Dataset format invalid (expected array)')
      const schema = buildSchema(json)
      onImport({ name: ds.title, schema, data: json, rowCount: json.length })
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Failed to import')
    } finally {
      setLoadingId(null)
      setLoadingStep(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`w-[900px] h-[70vh] rounded-xl shadow-2xl overflow-hidden grid grid-rows-[56px_1fr] ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white'}`}>
        <div className={`px-4 h-14 flex items-center justify-between ${isDarkMode ? 'border-b border-gray-800' : 'border-b border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Database size={18} className="text-blue-600" />
            <div className="font-dm-mono font-medium text-xs uppercase tracking-wider">PREMADE DATASETS</div>
          </div>
          <button onClick={onClose} className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <X size={16} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          {error && (
            <div className={`mb-3 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{error}</div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {DATASETS.map((ds) => (
              <div key={ds.id} className={`rounded-lg border p-4 flex flex-col gap-3 ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white'}`}>
                <div>
                  <div className="font-dm-mono font-medium text-sm uppercase tracking-wider">{ds.title}</div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{ds.description}</div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Source:</span>
                  {ds.sourceUrl ? (
                    <a href={ds.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                      {ds.source}
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span>{ds.source}</span>
                  )}
                </div>
                {ds.tags && (
                  <div className="flex flex-wrap gap-2">
                    {ds.tags.map((t) => (
                      <span key={t} className={`text-[10px] px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{t}</span>
                    ))}
                  </div>
                )}
                <div className="mt-1">
                  <button
                    onClick={() => handleImport(ds)}
                    disabled={loadingId === ds.id}
                    className={`px-3 py-2 rounded-lg text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-blue-900/40 hover:bg-blue-900/50 text-blue-200' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'}`}
                  >
                    {loadingId === ds.id ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        {loadingStep === 'downloading' ? 'Downloading...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Import as Table
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


