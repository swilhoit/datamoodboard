'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Image, Sparkles, Wand2, Search, X, Loader2, Upload, Eraser, ChevronDown, TrendingUp, FileImage } from 'lucide-react'

interface MediaToolbarProps {
  onAddImage: (src: string, type: 'image' | 'gif') => void
  onRemoveBackground?: (imageSrc: string) => void
  isDarkMode?: boolean
}

export default function MediaToolbar({ onAddImage, onRemoveBackground, isDarkMode = false }: MediaToolbarProps) {
  const [showGiphy, setShowGiphy] = useState(false)
  const [showAIImage, setShowAIImage] = useState(false)
  const [showBgRemover, setShowBgRemover] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [giphySearch, setGiphySearch] = useState('')
  const [giphyResults, setGiphyResults] = useState<any[]>([])
  const [trendingGifs, setTrendingGifs] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingMoreSearch, setIsLoadingMoreSearch] = useState(false)
  const [isLoadingMoreTrending, setIsLoadingMoreTrending] = useState(false)
  const [lastSearchTerm, setLastSearchTerm] = useState('')
  const [searchOffset, setSearchOffset] = useState(0)
  const [searchHasMore, setSearchHasMore] = useState(true)
  const [trendingOffset, setTrendingOffset] = useState(0)
  const [trendingHasMore, setTrendingHasMore] = useState(true)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [bgRemovalImage, setBgRemovalImage] = useState<string | null>(null)
  const [isRemovingBg, setIsRemovingBg] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // GIPHY API Key - using public beta key for development
  // In production, this should be stored in environment variables
  const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65'
  const TRENDING_LIMIT = 12
  const SEARCH_LIMIT = 20

  // Load trending GIFs on mount
  useEffect(() => {
    loadTrendingGifs(0, false)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadTrendingGifs = async (offset: number = 0, append: boolean = false) => {
    try {
      if (append) setIsLoadingMoreTrending(true)
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${TRENDING_LIMIT}&offset=${offset}&rating=g`
      )
      const data = await response.json()
      const items: any[] = data.data || []
      setTrendingGifs(prev => (append ? [...prev, ...items] : items))
      const pagination = data.pagination || { count: items.length, offset, total_count: (append ? trendingGifs.length : items.length) + items.length }
      const newOffset = (pagination.offset || offset) + (pagination.count || items.length)
      setTrendingOffset(newOffset)
      setTrendingHasMore(newOffset < (pagination.total_count || newOffset))
    } catch (error) {
      console.error('Error loading trending GIFs:', error)
    } finally {
      if (append) setIsLoadingMoreTrending(false)
    }
  }

  const loadMoreTrending = () => {
    if (isLoadingMoreTrending || !trendingHasMore) return
    loadTrendingGifs(trendingOffset, true)
  }

  const fetchSearchGiphy = async (query: string, offset: number = 0, append: boolean = false) => {
    try {
      if (append) setIsLoadingMoreSearch(true)
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${SEARCH_LIMIT}&offset=${offset}&rating=g`
      )
      const data = await response.json()
      const items: any[] = data.data || []
      setGiphyResults(prev => (append ? [...prev, ...items] : items))
      const pagination = data.pagination || { count: items.length, offset, total_count: (append ? giphyResults.length : items.length) + items.length }
      const newOffset = (pagination.offset || offset) + (pagination.count || items.length)
      setSearchOffset(newOffset)
      setSearchHasMore(newOffset < (pagination.total_count || newOffset))
    } catch (error) {
      console.error('Error searching Giphy:', error)
      if (!append) {
        // For demo purposes, show sample GIFs on initial search failure
        setGiphyResults([
          { id: '1', images: { fixed_height: { url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' } } },
          { id: '2', images: { fixed_height: { url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif' } } },
          { id: '3', images: { fixed_height: { url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif' } } },
          { id: '4', images: { fixed_height: { url: 'https://media.giphy.com/media/26tPplGWjN0xLybiU/giphy.gif' } } },
        ])
        setSearchOffset(4)
        setSearchHasMore(false)
      }
    } finally {
      if (append) setIsLoadingMoreSearch(false)
    }
  }

  const searchGiphy = async () => {
    const query = giphySearch.trim()
    if (!query) return
    setIsSearching(true)
    try {
      setLastSearchTerm(query)
      setSearchOffset(0)
      setSearchHasMore(true)
      await fetchSearchGiphy(query, 0, false)
    } finally {
      setIsSearching(false)
    }
  }

  const loadMoreSearch = () => {
    if (isLoadingMoreSearch || !searchHasMore || !lastSearchTerm) return
    fetchSearchGiphy(lastSearchTerm, searchOffset, true)
  }

  const generateAIImage = async () => {
    if (!aiPrompt.trim()) return
    
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          size: '1024x1024'
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image')
      }
      
      if (data.imageUrl) {
        onAddImage(data.imageUrl, 'image')
        setShowAIImage(false)
        setAiPrompt('')
      }
    } catch (error: any) {
      console.error('Error generating AI image:', error)
      alert(error.message || 'Failed to generate image. Please try again.')
    }
    setIsGenerating(false)
  }

  const removeBackground = async () => {
    if (!bgRemovalImage) return
    
    setIsRemovingBg(true)
    try {
      // Here you would integrate with a background removal API like:
      // - Remove.bg API
      // - Clipdrop API
      // - PhotoRoom API
      // - RunwayML API
      
      // For demo purposes, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In production, this would be the processed image URL
      const processedImageUrl = bgRemovalImage + '?bg-removed=true'
      
      onAddImage(processedImageUrl, 'image')
      setShowBgRemover(false)
      setBgRemovalImage(null)
    } catch (error) {
      console.error('Error removing background:', error)
    }
    setIsRemovingBg(false)
  }

  const handleBgRemovalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setBgRemovalImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        onAddImage(event.target?.result as string, 'image')
        setShowImageUpload(false)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <>
      {/* Image Dropdown Menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-all-smooth button-press flex items-center gap-1"
          title="Image tools"
        >
          <Image size={18} />
          <ChevronDown size={14} />
        </button>
        
        {showDropdown && (
          <div className="absolute bottom-full left-0 mb-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[60]">
            <button
              onClick={() => {
                setShowImageUpload(true)
                setShowDropdown(false)
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Upload size={16} />
              Upload Image
            </button>
            <button
              onClick={() => {
                setShowGiphy(true)
                setShowDropdown(false)
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <FileImage size={16} />
              Add GIF
            </button>
            <button
              onClick={() => {
                setShowAIImage(true)
                setShowDropdown(false)
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Sparkles size={16} />
              AI Generate
            </button>
            <button
              onClick={() => {
                setShowBgRemover(true)
                setShowDropdown(false)
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Eraser size={16} />
              Remove Background
            </button>
          </div>
        )}
      </div>

      {/* GIPHY Modal */}
      {showGiphy && isClient && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-16 z-[100] modal-backdrop-enter">
          <div className="bg-white rounded-lg w-[600px] max-h-[calc(100vh-8rem)] flex flex-col modal-content-enter">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Search GIPHY</h3>
                <button
                  onClick={() => setShowGiphy(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={giphySearch}
                  onChange={(e) => setGiphySearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchGiphy()}
                  placeholder="Search for GIFs..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={searchGiphy}
                  disabled={isSearching}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  Search
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {/* Trending GIFs Section */}
              {giphySearch === '' && trendingGifs.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={16} className="text-purple-600" />
                    <h4 className="text-sm font-semibold text-gray-700">Trending Now</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {trendingGifs.map((gif) => (
                      <div
                        key={gif.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('gifUrl', gif.images.fixed_height.url)
                          e.dataTransfer.effectAllowed = 'copy'
                        }}
                        onClick={() => {
                          onAddImage(gif.images.fixed_height.url, 'gif')
                          setShowGiphy(false)
                        }}
                        className="relative group overflow-hidden rounded-lg border-2 border-transparent hover:border-purple-500 transition-all cursor-move"
                      >
                        <img
                          src={gif.images.fixed_height_small.url}
                          alt="GIF"
                          className="w-full h-24 object-cover"
                          draggable={false}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 bg-purple-600 text-white px-2 py-1 rounded text-xs">
                            Drag or Click
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                    {trendingHasMore && (
                      <div className="flex justify-center mt-4">
                        <button
                          onClick={loadMoreTrending}
                          disabled={isLoadingMoreTrending}
                          className="px-4 py-2 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isLoadingMoreTrending && <Loader2 size={16} className="animate-spin" />}
                          Load more
                        </button>
                      </div>
                    )}
                </div>
              )}
              
              {/* Search Results */}
              {giphyResults.length > 0 && (
                <div>
                  {giphySearch && (
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Results for "{giphySearch}"
                    </h4>
                  )}
                  <div className="grid grid-cols-3 gap-3">
                    {giphyResults.map((gif) => (
                      <div
                        key={gif.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('gifUrl', gif.images.fixed_height.url)
                          e.dataTransfer.effectAllowed = 'copy'
                        }}
                        onClick={() => {
                          onAddImage(gif.images.fixed_height.url, 'gif')
                          setShowGiphy(false)
                        }}
                        className="relative group overflow-hidden rounded-lg border-2 border-transparent hover:border-blue-500 transition-all cursor-move"
                      >
                        <img
                          src={gif.images.fixed_height_small.url}
                          alt="GIF"
                          className="w-full h-24 object-cover"
                          draggable={false}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                            Drag or Click
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                    {searchHasMore && (
                      <div className="flex justify-center mt-4">
                        <button
                          onClick={loadMoreSearch}
                          disabled={isLoadingMoreSearch}
                          className="px-4 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isLoadingMoreSearch && <Loader2 size={16} className="animate-spin" />}
                          Load more
                        </button>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* AI Image Generator Modal */}
      {showAIImage && isClient && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-16 z-[100] modal-backdrop-enter">
          <div className="bg-white rounded-lg w-[500px] p-6 modal-content-enter">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="text-blue-600" size={20} />
                AI Image Generator
              </h3>
              <button
                onClick={() => setShowAIImage(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the image you want to create
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="A futuristic city at sunset with flying cars..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={generateAIImage}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 size={16} />
                      Generate Image
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Background Remover Modal */}
      {showBgRemover && isClient && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-16 z-[100] modal-backdrop-enter">
          <div className="bg-white rounded-lg w-[500px] p-6 modal-content-enter">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Eraser className="text-green-600" size={20} />
                Remove Background
              </h3>
              <button
                onClick={() => {
                  setShowBgRemover(false)
                  setBgRemovalImage(null)
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {!bgRemovalImage ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-4">
                    Upload an image to remove its background
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBgRemovalImageUpload}
                    className="hidden"
                    id="bg-removal-upload"
                  />
                  <label
                    htmlFor="bg-removal-upload"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer inline-block"
                  >
                    Choose Image
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={bgRemovalImage}
                      alt="Preview"
                      className="w-full h-64 object-contain bg-gray-100 rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBgRemovalImage(null)}
                      className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Change Image
                    </button>
                    <button
                      onClick={removeBackground}
                      disabled={isRemovingBg}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isRemovingBg ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Removing Background...
                        </>
                      ) : (
                        <>
                          <Eraser size={16} />
                          Remove Background
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Image Upload Modal */}
      {showImageUpload && isClient && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-16 z-[100] modal-backdrop-enter">
          <div className="bg-white rounded-lg w-[500px] p-6 modal-content-enter">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="text-blue-600" size={20} />
                Upload Image
              </h3>
              <button
                onClick={() => setShowImageUpload(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  Choose an image to add to your canvas
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block"
                >
                  Choose Image
                </label>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}