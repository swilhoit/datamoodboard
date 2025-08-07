'use client'

import { useState } from 'react'
import FontSelector from '@/components/FontSelector'
import FontWeightSelector from '@/components/FontWeightSelector'

export default function TestMultiWeight() {
  const [selectedFont, setSelectedFont] = useState('Inter')
  const [selectedWeight, setSelectedWeight] = useState('400')

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Multi-Weight Font Support Test</h1>
      
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex gap-4 items-center p-4 bg-gray-50 rounded-lg">
          <label className="font-medium">Font:</label>
          <FontSelector
            selectedFont={selectedFont}
            onFontChange={setSelectedFont}
          />
          
          <label className="font-medium">Weight:</label>
          <FontWeightSelector
            selectedFont={selectedFont}
            selectedWeight={selectedWeight}
            onWeightChange={(weight) => setSelectedWeight(String(weight))}
          />
        </div>

        {/* Preview */}
        <div className="p-6 border rounded-lg">
          <h2 className="text-lg font-medium mb-4">Preview</h2>
          <div 
            className="text-4xl mb-4"
            style={{ 
              fontFamily: selectedFont,
              fontWeight: selectedWeight
            }}
          >
            The quick brown fox jumps over the lazy dog
          </div>
          <div 
            className="text-lg text-gray-600"
            style={{ 
              fontFamily: selectedFont,
              fontWeight: selectedWeight
            }}
          >
            ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
            abcdefghijklmnopqrstuvwxyz<br />
            0123456789
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Font: {selectedFont} | Weight: {selectedWeight}
          </div>
        </div>

        {/* Weight Showcase for Current Font */}
        <div className="p-6 border rounded-lg">
          <h2 className="text-lg font-medium mb-4">All Available Weights for {selectedFont}</h2>
          <WeightShowcase fontFamily={selectedFont} />
        </div>
      </div>
    </div>
  )
}

function WeightShowcase({ fontFamily }: { fontFamily: string }) {
  const { googleFonts } = require('@/components/FontSelector')
  const fontData = googleFonts.find((font: any) => font.name === fontFamily)
  const weights = fontData?.weights || ['400']

  const weightLabels: Record<string, string> = {
    '100': 'Thin',
    '200': 'Extra Light',
    '300': 'Light',
    '400': 'Regular',
    '500': 'Medium',
    '600': 'Semi Bold',
    '700': 'Bold',
    '800': 'Extra Bold',
    '900': 'Black'
  }

  return (
    <div className="space-y-3">
      {weights.map((weight: string) => (
        <div key={weight} className="flex items-center gap-4">
          <div className="w-16 text-sm text-gray-500">
            {weight}
          </div>
          <div className="w-20 text-sm text-gray-500">
            {weightLabels[weight] || weight}
          </div>
          <div 
            className="flex-1 text-xl"
            style={{ 
              fontFamily: fontFamily,
              fontWeight: weight
            }}
          >
            The quick brown fox jumps over the lazy dog
          </div>
        </div>
      ))}
    </div>
  )
}