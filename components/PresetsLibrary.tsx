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
      <div className="bg-white w-[980px] max-h-[82vh] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="font-semibold text-gray-800">Preset Blocks & Reports</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-white/60">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto">
          {integrations.map((integration) => {
            const Icon = integration.icon
            return (
              <div key={integration.id} className="border rounded-xl overflow-hidden bg-white">
                <div className="px-5 py-4 flex items-center gap-3 border-b bg-white/60">
                  <div className={`w-9 h-9 ${integration.colorClass} text-white rounded-lg flex items-center justify-center shadow-sm`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{integration.name}</div>
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
                      className="text-left rounded-xl p-4 border bg-white hover:border-blue-500 hover:bg-blue-50/60 transition flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-gray-800">{preset.name}</div>
                          <div className="text-sm text-gray-600 mt-0.5">{preset.description}</div>
                        </div>
                        <div className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">2x Grid</div>
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        {preset.items.map((it, i) => (
                          <div
                            key={i}
                            className="h-16 rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-[10px] text-gray-500"
                          >
                            {it.title || it.type}
                          </div>
                        ))}
                      </div>
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


