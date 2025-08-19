'use client'

import React, { useState, useEffect } from 'react'
import { X, Sparkles, ChevronRight } from 'lucide-react'

export default function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Check localStorage to see if banner was previously dismissed
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const dismissed = localStorage.getItem('announcementBannerDismissed')
      if (dismissed === 'true') {
        setIsVisible(false)
      }
    }
  }, [])

  const handleDismiss = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setIsVisible(false)
      // Save dismissal state to localStorage
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('announcementBannerDismissed', 'true')
      }
    }, 300)
  }

  const handleResetDismissal = () => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('announcementBannerDismissed')
    }
    setIsVisible(true)
    setIsAnimating(false)
  }

  if (!isVisible) return null

  return (
    <div 
      className={`
        relative w-full bg-gray-200 border-b-2 border-gray-300
        transition-all duration-300 ease-in-out overflow-hidden
        ${isAnimating ? 'h-0 opacity-0' : 'h-auto opacity-100'}
      `}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Animated sparkles icon */}
            <div className="animate-pulse">
              <Sparkles className="w-5 h-5 text-gray-700" />
            </div>
            
            {/* Message content */}
            <div className="flex items-center gap-2 text-gray-900 font-dm-mono font-medium uppercase text-sm md:text-base">
              <span>🎉</span>
              <span>Welcome! Create an account and start building your dashboard</span>
              <span>🚀</span>
              <span className="hidden sm:inline">✨</span>
            </div>

            {/* Optional CTA button */}
            <button 
              onClick={() => {
                // You can add navigation to signup here
                console.log('Navigate to signup')
              }}
              className="
                ml-auto mr-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 
                text-white rounded-full text-sm font-dm-mono font-medium uppercase
                transition-colors duration-200 flex items-center gap-1
                hidden md:flex
              "
            >
              Get Started
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="
              p-1.5 rounded-full hover:bg-gray-500/30 
              transition-colors duration-200 group
            "
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4 text-gray-800 group-hover:text-gray-900" />
          </button>
        </div>
      </div>

      {/* Decorative bottom border gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-gray-300 via-gray-500 to-gray-300" />
    </div>
  )
}