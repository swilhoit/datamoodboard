"use client"

import { Crown, Check, CreditCard } from 'lucide-react'
import Modal from '@/lib/ui/components/Modal'
import Button from '@/lib/ui/components/Button'

interface UpgradePlansModalProps {
  isOpen: boolean
  onClose: () => void
}

const features = [
  'Unlimited data tables',
  'Priority syncing',
  'Premium chart templates',
  'Email support',
]

export default function UpgradePlansModal({ isOpen, onClose }: UpgradePlansModalProps) {
  const startCheckout = async (priceId?: string) => {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, mode: 'subscription' }),
    })
    const json = await res.json()
    if (json.url) window.location.href = json.url
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade to Pro" size="xl">
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="border rounded-xl p-5">
            <div className="text-sm font-semibold text-gray-700">Free</div>
            <div className="mt-1 text-3xl font-bold">$0<span className="text-base font-medium text-gray-500">/mo</span></div>
            <div className="mt-2 text-sm text-gray-600">Get started with core features.</div>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2"><Check size={16} className="text-green-600 mt-0.5" />Up to 3 data tables</li>
              <li className="flex items-start gap-2"><Check size={16} className="text-green-600 mt-0.5" />Manual sync</li>
              <li className="flex items-start gap-2"><Check size={16} className="text-green-600 mt-0.5" />Basic templates</li>
            </ul>
            <div className="mt-5">
              <Button variant="secondary" fullWidth>Current plan</Button>
            </div>
          </div>
          <div className="border rounded-xl p-5 relative">
            <div className="absolute -top-3 right-5 bg-yellow-100 text-yellow-900 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1"><Crown size={12} /> Popular</div>
            <div className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Crown size={16} className="text-yellow-500" />Pro</div>
            <div className="mt-1 text-3xl font-bold">$19<span className="text-base font-medium text-gray-500">/mo</span></div>
            <div className="mt-2 text-sm text-gray-600">Everything in Free, plus:</div>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2"><Check size={16} className="text-green-600 mt-0.5" />{f}</li>
              ))}
            </ul>
            <div className="mt-5">
              <Button icon={CreditCard} onClick={() => startCheckout()} fullWidth>Upgrade to Pro</Button>
            </div>
            <p className="mt-3 text-xs text-gray-500 text-center">Manage or cancel anytime.</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}


