"use client"

import type { IntegrationPreset } from "./integrations"

export const SHOPIFY_PRESETS: IntegrationPreset[] = [
  {
    key: "shopify-store-summary",
    name: "Store Summary",
    description: "Revenue trend, top products, and KPI snapshot",
    items: [
      {
        type: "area",
        title: "Revenue Trend",
        size: "large",
        data: [
          { month: "Jan", revenue: 125000, orders: 1250 },
          { month: "Feb", revenue: 142000, orders: 1420 },
          { month: "Mar", revenue: 168000, orders: 1600 },
          { month: "Apr", revenue: 155000, orders: 1450 },
          { month: "May", revenue: 182000, orders: 1650 },
          { month: "Jun", revenue: 195000, orders: 1700 },
        ],
      },
      {
        type: "barChart",
        title: "Top Products",
        size: "medium",
        data: [
          { name: "Product A", value: 450000 },
          { name: "Product B", value: 380000 },
          { name: "Product C", value: 290000 },
          { name: "Product D", value: 220000 },
          { name: "Product E", value: 180000 },
        ],
      },
      {
        type: "pieChart",
        title: "Payment Methods",
        size: "small",
        data: [
          { name: "Card", value: 62 },
          { name: "PayPal", value: 28 },
          { name: "Apple Pay", value: 6 },
          { name: "Other", value: 4 },
        ],
      },
    ],
  },
  {
    key: "shopify-product-breakdown",
    name: "Product Breakdown",
    description: "Units and sales by product with distribution",
    items: [
      {
        type: "barChart",
        title: "Sales by Product",
        size: "large",
        data: [
          { name: "Product A", value: 4500 },
          { name: "Product B", value: 3800 },
          { name: "Product C", value: 2900 },
          { name: "Product D", value: 2200 },
          { name: "Product E", value: 1800 },
        ],
      },
      {
        type: "pieChart",
        title: "Inventory Status",
        size: "small",
        data: [
          { name: "In Stock", value: 72 },
          { name: "Low Stock", value: 18 },
          { name: "Out of Stock", value: 10 },
        ],
      },
    ],
  },
]


