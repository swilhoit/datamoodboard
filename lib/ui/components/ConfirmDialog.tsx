"use client"

import Modal from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  variant?: 'default' | 'danger' | 'warning'
  loading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const variantStyles = {
    default: 'bg-blue-600 hover:bg-blue-700',
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
  }

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
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
          className={`px-3 py-1.5 text-sm rounded-lg text-white disabled:opacity-60 ${variantStyles[variant]}`}
        >
          {loading ? 'Working…' : confirmText}
        </button>
      </div>
    </Modal>
  )
}