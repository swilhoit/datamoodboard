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
        type: "table",
        title: "Product Details",
        size: "medium",
        data: [
          {
            image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop&auto=format",
            name: "Sport Watch",
            sku: "SW-001",
            price: 199.99,
            units: 850,
            sales: 169991.5,
          },
          {
            image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=80&h=80&fit=crop&auto=format",
            name: "Leather Backpack",
            sku: "LB-204",
            price: 129.0,
            units: 620,
            sales: 79980,
          },
          {
            image: "https://images.unsplash.com/photo-1526178610353-4b2bcd4d8d37?w=80&h=80&fit=crop&auto=format",
            name: "Wireless Headphones",
            sku: "WH-552",
            price: 249.0,
            units: 540,
            sales: 134460,
          },
          {
            image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=80&fit=crop&auto=format",
            name: "Running Shoes",
            sku: "RS-998",
            price: 159.0,
            units: 460,
            sales: 73140,
          },
          {
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&h=80&fit=crop&auto=format",
            name: "Bluetooth Speaker",
            sku: "BS-311",
            price: 89.0,
            units: 520,
            sales: 46280,
          },
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


