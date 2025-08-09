"use client"

import { X } from 'lucide-react'
import { useCallback } from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  isDestructive?: boolean
  loading?: boolean
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
  loading = false,
}: ConfirmModalProps) {
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onCancel()
    },
    [onCancel]
  )

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-sm mx-4 rounded-xl shadow-2xl bg-white border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onCancel}
            className="p-2 rounded hover:bg-gray-100 text-gray-600"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4">
          {description && (
            <p className="text-sm text-gray-700">{description}</p>
          )}
        </div>
        <div className="p-4 pt-0 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={
              `px-3 py-1.5 text-sm rounded-lg text-white disabled:opacity-60 ` +
              (isDestructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700')
            }
          >
            {loading ? 'Working…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}


