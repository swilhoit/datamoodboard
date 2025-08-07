'use client'

import { useEffect, useState } from 'react'

const testFonts = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 
  'Playfair Display', 'Merriweather', 'Raleway', 'Ubuntu', 'Oswald',
  'Dancing Script', 'Pacifico', 'Caveat'
]

export default function TestFonts() {
  const [loadedFonts, setLoadedFonts] = useState<string[]>([])

  useEffect(() => {
    // Load all test fonts
    testFonts.forEach(font => {
      const link = document.createElement('link')
      link.href = `https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@300;400;500;600;700;800;900&display=swap`
      link.rel = 'stylesheet'
      link.onload = () => {
        setLoadedFonts(prev => [...prev, font])
      }
      document.head.appendChild(link)
    })
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Google Fonts Integration Test</h1>
      
      <div className="mb-4 text-sm text-gray-600">
        Loaded: {loadedFonts.length}/{testFonts.length} fonts
      </div>

      <div className="space-y-4">
        {testFonts.map(font => (
          <div key={font} className="p-4 border rounded-lg">
            <div className="text-sm text-gray-500 mb-2">{font}</div>
            <div 
              style={{ fontFamily: font, fontSize: '24px' }}
              className="text-gray-800"
            >
              The quick brown fox jumps over the lazy dog
            </div>
            <div 
              style={{ fontFamily: font, fontSize: '16px', fontWeight: 'bold' }}
              className="text-gray-600 mt-2"
            >
              ABCDEFGHIJKLMNOPQRSTUVWXYZ
            </div>
            <div 
              style={{ fontFamily: font, fontSize: '16px' }}
              className="text-gray-600"
            >
              abcdefghijklmnopqrstuvwxyz 0123456789
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}