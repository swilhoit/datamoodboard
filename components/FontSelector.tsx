'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Check, Type } from 'lucide-react'

interface FontSelectorProps {
  selectedFont: string
  onFontChange: (font: string) => void
}

// Comprehensive Google Fonts library with weight support
const googleFonts = [
  // Sans Serif - Most Popular
  { name: 'Inter', category: 'Sans Serif', preview: 'Modern & Clean Typography', weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popular: true },
  { name: 'Roboto', category: 'Sans Serif', preview: 'Friendly & Professional', weights: ['100', '300', '400', '500', '700', '900'], popular: true },
  { name: 'Open Sans', category: 'Sans Serif', preview: 'Readable & Neutral', weights: ['300', '400', '500', '600', '700', '800'], popular: true },
  { name: 'Lato', category: 'Sans Serif', preview: 'Warm & Friendly', weights: ['100', '300', '400', '700', '900'], popular: true },
  { name: 'Montserrat', category: 'Sans Serif', preview: 'Geometric & Urban', weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popular: true },
  { name: 'Poppins', category: 'Sans Serif', preview: 'Circular & Modern', weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], popular: true },
  
  // Sans Serif - Extended Collection
  { name: 'Source Sans Pro', category: 'Sans Serif', preview: 'Clean & Professional', weights: ['200', '300', '400', '600', '700', '900'] },
  { name: 'Nunito', category: 'Sans Serif', preview: 'Rounded & Friendly', weights: ['200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'Raleway', category: 'Sans Serif', preview: 'Elegant & Sophisticated', weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'Ubuntu', category: 'Sans Serif', preview: 'Humanist & Warm', weights: ['300', '400', '500', '700'] },
  { name: 'Work Sans', category: 'Sans Serif', preview: 'Optimized for UI', weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'DM Sans', category: 'Sans Serif', preview: 'Low-contrast & Clear', weights: ['400', '500', '700'] },
  { name: 'Quicksand', category: 'Sans Serif', preview: 'Rounded & Friendly', weights: ['300', '400', '500', '600', '700'] },
  { name: 'Archivo', category: 'Sans Serif', preview: 'Condensed & Strong', weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'Rubik', category: 'Sans Serif', preview: 'Slightly Rounded', weights: ['300', '400', '500', '600', '700', '800', '900'] },
  { name: 'Fira Sans', category: 'Sans Serif', preview: 'Humanist & Clear', weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'PT Sans', category: 'Sans Serif', preview: 'Versatile & Neutral', weights: ['400', '700'] },
  { name: 'Noto Sans', category: 'Sans Serif', preview: 'Universal & Complete', weights: ['400', '700'] },
  { name: 'Libre Franklin', category: 'Sans Serif', preview: 'Contemporary Classic', weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'IBM Plex Sans', category: 'Sans Serif', preview: 'Corporate & Modern', weights: ['100', '200', '300', '400', '500', '600', '700'] },
  { name: 'Manrope', category: 'Sans Serif', preview: 'Modern & Geometric', weights: ['200', '300', '400', '500', '600', '700', '800'] },
  { name: 'Plus Jakarta Sans', category: 'Sans Serif', preview: 'Neo-grotesque Style', weights: ['200', '300', '400', '500', '600', '700', '800'] },
  { name: 'Lexend', category: 'Sans Serif', preview: 'Designed for Reading', weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  
  // Serif - Classic & Elegant
  { name: 'Playfair Display', category: 'Serif', preview: 'Elegant & Dramatic', weights: ['400', '500', '600', '700', '800', '900'], popular: true },
  { name: 'Merriweather', category: 'Serif', preview: 'Designed for Reading', weights: ['300', '400', '700', '900'], popular: true },
  { name: 'Lora', category: 'Serif', preview: 'Contemporary Serif', weights: ['400', '500', '600', '700'], popular: true },
  { name: 'Crimson Text', category: 'Serif', preview: 'Inspired by Old-style', weights: ['400', '600', '700'] },
  { name: 'Cormorant Garamond', category: 'Serif', preview: 'Display Serif', weights: ['300', '400', '500', '600', '700'] },
  { name: 'EB Garamond', category: 'Serif', preview: 'Classical & Elegant', weights: ['400', '500', '600', '700', '800'] },
  { name: 'Source Serif Pro', category: 'Serif', preview: 'Readable Serif', weights: ['200', '300', '400', '600', '700', '900'] },
  { name: 'Libre Baskerville', category: 'Serif', preview: 'Web Optimized', weights: ['400', '700'] },
  { name: 'Arvo', category: 'Serif', preview: 'Geometric Slab Serif', weights: ['400', '700'] },
  { name: 'Bitter', category: 'Serif', preview: 'Contemporary Slab', weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'Zilla Slab', category: 'Serif', preview: 'Contemporary Slab', weights: ['300', '400', '500', '600', '700'] },
  { name: 'Vollkorn', category: 'Serif', preview: 'Quiet & Solid', weights: ['400', '500', '600', '700', '800', '900'] },
  { name: 'PT Serif', category: 'Serif', preview: 'Transitional Serif', weights: ['400', '700'] },
  { name: 'Spectral', category: 'Serif', preview: 'Produced Specifically', weights: ['200', '300', '400', '500', '600', '700', '800'] },
  
  // Monospace - Code & Technical
  { name: 'JetBrains Mono', category: 'Monospace', preview: 'Made for Developers', weights: ['100', '200', '300', '400', '500', '600', '700', '800'], popular: true },
  { name: 'Fira Code', category: 'Monospace', preview: 'Programming Ligatures', weights: ['300', '400', '500', '600', '700'], popular: true },
  { name: 'Source Code Pro', category: 'Monospace', preview: 'Coding Font', weights: ['200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'Space Mono', category: 'Monospace', preview: 'Original Monospace', weights: ['400', '700'] },
  { name: 'Roboto Mono', category: 'Monospace', preview: 'Mechanical & Geometric', weights: ['100', '200', '300', '400', '500', '600', '700'] },
  { name: 'IBM Plex Mono', category: 'Monospace', preview: 'Corporate Monospace', weights: ['100', '200', '300', '400', '500', '600', '700'] },
  { name: 'Inconsolata', category: 'Monospace', preview: 'Humanist Monospace', weights: ['200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'Ubuntu Mono', category: 'Monospace', preview: 'Clarity & Character', weights: ['400', '700'] },
  { name: 'Courier Prime', category: 'Monospace', preview: 'Typewriter Style', weights: ['400', '700'] },
  
  // Handwriting - Script & Cursive
  { name: 'Dancing Script', category: 'Handwriting', preview: 'Lively Casual Script', weights: ['400', '500', '600', '700'] },
  { name: 'Pacifico', category: 'Handwriting', preview: 'Surf Style Script', weights: ['400'] },
  { name: 'Caveat', category: 'Handwriting', preview: 'Handwriting Font', weights: ['400', '500', '600', '700'] },
  { name: 'Satisfy', category: 'Handwriting', preview: 'Casual Handwriting', weights: ['400'] },
  { name: 'Kaushan Script', category: 'Handwriting', preview: 'Acrylic Brush Style', weights: ['400'] },
  { name: 'Great Vibes', category: 'Handwriting', preview: 'Connecting Script', weights: ['400'] },
  { name: 'Allura', category: 'Handwriting', preview: 'Flowing Script', weights: ['400'] },
  { name: 'Sacramento', category: 'Handwriting', preview: 'Monoline Script', weights: ['400'] },
  { name: 'Amatic SC', category: 'Handwriting', preview: 'Simple Handwriting', weights: ['400', '700'] },
  { name: 'Indie Flower', category: 'Handwriting', preview: 'Friendly Handwriting', weights: ['400'] },
  { name: 'Shadows Into Light', category: 'Handwriting', preview: 'Marker Style', weights: ['400'] },
  { name: 'Permanent Marker', category: 'Handwriting', preview: 'Marker Look', weights: ['400'] },
  
  // Display - Decorative & Impact
  { name: 'Oswald', category: 'Display', preview: 'Reworked Gothic', weights: ['200', '300', '400', '500', '600', '700'], popular: true },
  { name: 'Bebas Neue', category: 'Display', preview: 'All Caps Display', weights: ['400'] },
  { name: 'Rajdhani', category: 'Display', preview: 'Low Contrast Sans', weights: ['300', '400', '500', '600', '700'] },
  { name: 'Orbitron', category: 'Display', preview: 'Futuristic Sans', weights: ['400', '500', '600', '700', '800', '900'] },
  { name: 'Anton', category: 'Display', preview: 'Impact & Solid', weights: ['400'] },
  { name: 'Fjalla One', category: 'Display', preview: 'Medium Contrast', weights: ['400'] },
  { name: 'Staatliches', category: 'Display', preview: 'Condensed Display', weights: ['400'] },
  { name: 'Righteous', category: 'Display', preview: 'Casual Display', weights: ['400'] },
  { name: 'Russo One', category: 'Display', preview: 'Balanced Grotesque', weights: ['400'] },
  { name: 'Bangers', category: 'Display', preview: 'Comicbook Style', weights: ['400'] },
  { name: 'Fredoka One', category: 'Display', preview: 'Rounded Display', weights: ['400'] },
  { name: 'Comfortaa', category: 'Display', preview: 'Rounded Geometric', weights: ['300', '400', '500', '600', '700'] },
  { name: 'Alfa Slab One', category: 'Display', preview: 'Ultra Bold Slab', weights: ['400'] },
  { name: 'Bungee', category: 'Display', preview: 'Signage Style', weights: ['400'] },
  { name: 'Press Start 2P', category: 'Display', preview: 'The quick brown fox jumps over the lazy dog' },
]

export { googleFonts }

export default function FontSelector({ selectedFont, onFontChange }: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set())
  const dropdownRef = useRef<HTMLDivElement>(null)

  const categories = ['All', 'Sans Serif', 'Serif', 'Monospace', 'Handwriting', 'Display']

  // Load Google Font dynamically
  const loadFont = (fontName: string) => {
    if (!loadedFonts.has(fontName) && !document.querySelector(`link[href*="${fontName}"]`)) {
      // Find the font data to get available weights
      const fontData = googleFonts.find(font => font.name === fontName)
      const weights = fontData?.weights || ['400']
      const weightsQuery = weights.join(';')
      
      const link = document.createElement('link')
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@${weightsQuery}&display=swap`
      link.rel = 'stylesheet'
      document.head.appendChild(link)
      setLoadedFonts(prev => new Set([...prev, fontName]))
    }
  }

  // Filter fonts based on search and category
  const filteredFonts = googleFonts.filter(font => {
    const matchesSearch = font.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || font.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load selected font on mount
  useEffect(() => {
    loadFont(selectedFont)
  }, [selectedFont])

  const handleFontSelect = (font: string) => {
    loadFont(font)
    onFontChange(font)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Font Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1 text-xs border border-gray-200 rounded hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-24"
        style={{ fontFamily: selectedFont }}
      >
        <Type size={12} />
        <span className="truncate">{selectedFont}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 flex flex-col">
          {/* Search Header */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search fonts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Category Filters */}
            <div className="flex gap-1 mt-2 overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Font List */}
          <div className="flex-1 overflow-y-auto">
            {filteredFonts.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                No fonts found
              </div>
            ) : (
              <div className="py-1">
                {filteredFonts.map(font => (
                  <button
                    key={font.name}
                    onClick={() => handleFontSelect(font.name)}
                    onMouseEnter={() => loadFont(font.name)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span 
                          className="font-medium text-sm truncate"
                          style={{ fontFamily: font.name }}
                        >
                          {font.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{font.category}</span>
                          {selectedFont === font.name && (
                            <Check size={14} className="text-blue-600" />
                          )}
                        </div>
                      </div>
                      <div 
                        className="text-xs text-gray-500 mt-1 truncate"
                        style={{ fontFamily: font.name }}
                      >
                        {font.preview}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}