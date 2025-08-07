'use client'

import { useState } from 'react'

export default function TestDataBridge() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Data Mode & Table Bridge Features</h1>
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <h2 className="text-xl font-semibold">New Bridging Features Completed:</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-lg bg-blue-500 text-white text-xl">📊</div>
                <div>
                  <h3 className="font-semibold text-blue-700">Universal Table Viewer</h3>
                  <p className="text-blue-600 text-xs">Works in both Dashboard & Data Mode</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Click-to-edit cells with type detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Image URL support with thumbnail preview</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>URL detection with clickable links</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Add/delete rows dynamically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Search and sort functionality</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>CSV export capability</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-lg bg-purple-500 text-white text-xl">🔗</div>
                <div>
                  <h3 className="font-semibold text-purple-700">Data Mode Enhancements</h3>
                  <p className="text-purple-600 text-xs">Improved UX & Functionality</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Fixed node dragging & connecting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Data pipeline UI moved to left side</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Table viewer accessible from data tables</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Connection visual feedback improved</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Better visual hierarchy & organization</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
            <h3 className="font-semibold text-blue-800 mb-3">How to Test the New Features:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Dashboard Mode:</h4>
                <ol className="text-blue-700 space-y-1">
                  <li>1. Create or select a table visualization</li>
                  <li>2. Look for the database icon in the table header</li>
                  <li>3. Click to open the table viewer/editor</li>
                  <li>4. Try editing cells, adding rows, searching</li>
                  <li>5. Test image URLs and external links</li>
                </ol>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Data Mode:</h4>
                <ol className="text-blue-700 space-y-1">
                  <li>1. Switch to Data Mode using the mode toggle</li>
                  <li>2. Notice the Data Pipeline panel on the left</li>
                  <li>3. Connect a data source (Google Sheets/Shopify/Stripe)</li>
                  <li>4. Try dragging tables and nodes around</li>
                  <li>5. Create connections between tables and nodes</li>
                  <li>6. Click the database icon to view/edit table data</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="font-semibold">Cell Editing</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Click any cell to edit with intelligent type detection
          </p>
          <div className="text-xs text-gray-500 space-y-1">
            <div>• Text fields for general content</div>
            <div>• Number inputs for numeric data</div>
            <div>• URL detection with preview</div>
            <div>• Image URL with thumbnails</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">🖼️</span>
            </div>
            <h3 className="font-semibold">Image Support</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Paste image URLs to see instant thumbnails in table cells
          </p>
          <div className="text-xs text-gray-500 space-y-1">
            <div>• Automatic image detection</div>
            <div>• Thumbnail generation</div>
            <div>• Error handling for broken images</div>
            <div>• Supports common formats</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">🔄</span>
            </div>
            <h3 className="font-semibold">Node Connections</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Drag from connection points to create data pipelines
          </p>
          <div className="text-xs text-gray-500 space-y-1">
            <div>• Visual connection feedback</div>
            <div>• Drag and drop interface</div>
            <div>• Connection validation</div>
            <div>• Real-time updates</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Sample Data for Testing</h2>
        
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-800 mb-2">Test Image URLs:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs bg-gray-50 p-3 rounded">
              <div>https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100</div>
              <div>https://images.unsplash.com/photo-1519337265831-281ec6cc8514?w=100</div>
              <div>https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=100</div>
              <div>https://images.unsplash.com/photo-1481487196290-c152efe083f5?w=100</div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-800 mb-2">Test URLs:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs bg-gray-50 p-3 rounded">
              <div>https://www.google.com</div>
              <div>https://github.com/vercel/next.js</div>
              <div>https://stripe.com/docs</div>
              <div>https://shopify.dev/api</div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-800 mb-2">Sample Table Data Structure:</h3>
            <div className="bg-gray-50 p-3 rounded text-xs font-mono">
              <div>• id: 1, 2, 3... (numbers)</div>
              <div>• name: "John Doe", "Jane Smith"... (text)</div>
              <div>• email: "user@domain.com"... (text)</div>
              <div>• avatar: "https://..."... (image URLs)</div>
              <div>• website: "https://..."... (URLs)</div>
              <div>• created_at: "2024-01-15"... (dates)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}