"use client"

import type { IntegrationPreset } from "./integrations"

export const GOOGLE_ADS_PRESETS: IntegrationPreset[] = [
  {
    key: "google-ads-account-overview",
    name: "Account Overview",
    description: "Spend, clicks, conversions, and CTR trend",
    items: [
      {
        type: "lineChart",
        title: "Clicks & Conversions",
        size: "large",
        data: [
          { date: "Mon", clicks: 12500, conversions: 150 },
          { date: "Tue", clicks: 15200, conversions: 170 },
          { date: "Wed", clicks: 14800, conversions: 160 },
          { date: "Thu", clicks: 16500, conversions: 180 },
          { date: "Fri", clicks: 18200, conversions: 210 },
          { date: "Sat", clicks: 11200, conversions: 110 },
          { date: "Sun", clicks: 10500, conversions: 95 },
        ],
      },
      {
        type: "area",
        title: "Daily Spend",
        size: "medium",
        data: [
          { date: "Mon", spend: 3200 },
          { date: "Tue", spend: 3400 },
          { date: "Wed", spend: 3300 },
          { date: "Thu", spend: 3600 },
          { date: "Fri", spend: 3800 },
          { date: "Sat", spend: 2100 },
          { date: "Sun", spend: 1900 },
        ],
      },
      {
        type: "pieChart",
        title: "Device Split",
        size: "small",
        data: [
          { name: "Mobile", value: 62 },
          { name: "Desktop", value: 30 },
          { name: "Tablet", value: 8 },
        ],
      },
    ],
  },
  {
    key: "google-ads-campaign-breakdown",
    name: "Campaign Breakdown",
    description: "Cost, clicks, conversions by campaign",
    items: [
      {
        type: "barChart",
        title: "Top Campaigns by Cost",
        size: "large",
        data: [
          { name: "Brand - Search", value: 12500 },
          { name: "Non-Brand - Search", value: 9800 },
          { name: "Display - Remarketing", value: 7200 },
          { name: "YouTube - Prospecting", value: 5600 },
        ],
      },
      {
        type: "table",
        title: "Campaign Performance",
        size: "medium",
        data: [
          { campaign: "Brand - Search", clicks: 42000, conv: 1200, cost: 12500, cpa: 10.42 },
          { campaign: "Non-Brand - Search", clicks: 28000, conv: 650, cost: 9800, cpa: 15.08 },
          { campaign: "Display - Remarketing", clicks: 18000, conv: 300, cost: 7200, cpa: 24.00 },
          { campaign: "YouTube - Prospecting", clicks: 14000, conv: 180, cost: 5600, cpa: 31.11 },
        ],
      },
    ],
  },
]


