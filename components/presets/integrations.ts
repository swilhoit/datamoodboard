"use client"

import { ShoppingCart, Target } from "lucide-react"

export type PresetChartType =
  | "lineChart"
  | "barChart"
  | "pieChart"
  | "area"
  | "scatter"
  | "table"

export interface PresetItemDescriptor {
  type: PresetChartType
  title?: string
  // Arbitrary data array that matches chart type expectations
  data: any[]
  // Optional size hint; page will map to width/height
  size?: "small" | "medium" | "large"
}

export interface IntegrationPreset {
  key: string
  name: string
  description: string
  // List of blocks to insert
  items: PresetItemDescriptor[]
}

export interface IntegrationDefinition {
  id: string
  name: string
  icon: any
  colorClass: string
  presets: IntegrationPreset[]
}

export const SIZE_TO_DIMENSIONS: Record<NonNullable<PresetItemDescriptor["size"]>, { width: number; height: number }> = {
  small: { width: 300, height: 180 },
  medium: { width: 400, height: 260 },
  large: { width: 520, height: 320 },
}

export const INTEGRATIONS: Array<IntegrationDefinition> = [
  {
    id: "shopify",
    name: "Shopify",
    icon: ShoppingCart,
    colorClass: "bg-green-500",
    presets: [],
  },
  {
    id: "google-ads",
    name: "Google Ads",
    icon: Target,
    colorClass: "bg-blue-500",
    presets: [],
  },
]


