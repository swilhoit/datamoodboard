"use client"

import Modal from '@/lib/ui/components/Modal'
import Button from '@/lib/ui/components/Button'

interface UpgradeLimitModalProps {
  isOpen: boolean
  onClose: () => void
  onUpgradeNow: () => void
  onViewPlans: () => void
  message?: string
}

export default function UpgradeLimitModal({
  isOpen,
  onClose,
  onUpgradeNow,
  onViewPlans,
  message,
}: UpgradeLimitModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade required" size="md">
      <div className="p-5 space-y-4">
        <div className="text-sm text-gray-700">
          {message || 'You have reached the limit for the Free plan.'}
        </div>
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-900">
          Unlock unlimited data tables and more by upgrading to Pro.
        </div>
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onViewPlans}>See plans</Button>
          <Button variant="primary" onClick={onUpgradeNow}>Upgrade now</Button>
        </div>
      </div>
    </Modal>
  )
}


