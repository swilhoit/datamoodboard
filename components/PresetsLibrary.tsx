"use client"

import React, { useMemo } from "react"
import { X } from "lucide-react"
import { INTEGRATIONS, SIZE_TO_DIMENSIONS, type IntegrationDefinition } from "./presets/integrations"
import { SHOPIFY_PRESETS } from "./presets/shopify-presets"
import { GOOGLE_ADS_PRESETS } from "./presets/google-ads-presets"

interface PresetsLibraryProps {
  isOpen: boolean
  onClose: () => void
  onInsertItems: (items: Array<{ type: string; title?: string; data: any; width?: number; height?: number }>) => void
}

export default function PresetsLibrary({ isOpen, onClose, onInsertItems }: PresetsLibraryProps) {
  const integrations: IntegrationDefinition[] = useMemo(() => {
    return INTEGRATIONS.map((base) => {
      if (base.id === "shopify") {
        return { ...base, presets: SHOPIFY_PRESETS }
      }
      if (base.id === "google-ads") {
        return { ...base, presets: GOOGLE_ADS_PRESETS }
      }
      return base
    })
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-[960px] max-h-[80vh] rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Preset Blocks & Reports</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto">
          {integrations.map((integration) => {
            const Icon = integration.icon
            return (
              <div key={integration.id} className="border rounded-lg">
                <div className="p-4 flex items-center gap-3 border-b">
                  <div className={`w-9 h-9 ${integration.colorClass} text-white rounded-lg flex items-center justify-center`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="font-medium">{integration.name}</div>
                    <div className="text-xs text-gray-500">Prebuilt dashboards</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4">
                  {integration.presets.map((preset) => (
                    <button
                      key={preset.key}
                      onClick={() => {
                        const items = preset.items.map((item) => {
                          const dims = item.size ? SIZE_TO_DIMENSIONS[item.size] : undefined
                          return {
                            type: item.type,
                            title: item.title,
                            data: item.data,
                            width: dims?.width,
                            height: dims?.height,
                          }
                        })
                        onInsertItems(items)
                        onClose()
                      }}
                      className="text-left border rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition"
                    >
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


