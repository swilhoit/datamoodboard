'use client'

import React, { useState, useEffect } from 'react'
import { X, Sparkles, ChevronRight, Zap, Star, Heart, Rocket, Crown } from 'lucide-react'

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

  if (!isVisible) return null

  // Create repeated content for seamless scrolling
  const marqueeContent = (
    <>
      <span className="flex items-center gap-2">
        <span>🎉</span>
        <span>Welcome to Data Moodboard!</span>
        <Sparkles className="w-4 h-4" />
      </span>
      <span className="mx-4">•</span>
      <span className="flex items-center gap-2">
        <span>🚀</span>
        <span>Create stunning dashboards</span>
        <Rocket className="w-4 h-4" />
      </span>
      <span className="mx-4">•</span>
      <span className="flex items-center gap-2">
        <span>✨</span>
        <span>AI-powered image generation</span>
        <Star className="w-4 h-4" />
      </span>
      <span className="mx-4">•</span>
      <span className="flex items-center gap-2">
        <span>📊</span>
        <span>Connect your data sources</span>
        <Zap className="w-4 h-4" />
      </span>
      <span className="mx-4">•</span>
      <span className="flex items-center gap-2">
        <span>🎨</span>
        <span>Design with drag & drop</span>
        <Heart className="w-4 h-4" />
      </span>
      <span className="mx-4">•</span>
      <span className="flex items-center gap-2">
        <span>👑</span>
        <span>Upgrade to Pro for unlimited features</span>
        <Crown className="w-4 h-4" />
      </span>
      <span className="mx-4">•</span>
    </>
  )

  return (
    <div 
      className={`
        relative w-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 
        border-b-2 border-yellow-500
        transition-all duration-300 ease-in-out overflow-hidden
        ${isAnimating ? 'h-0 opacity-0' : 'h-auto opacity-100'}
      `}
    >
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .marquee {
          animation: marquee 30s linear infinite;
        }
        
        .marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      <div className="relative flex items-center py-2.5 px-4">
        {/* Gradient fade effects on sides */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-yellow-400 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-yellow-400 to-transparent z-10 pointer-events-none" />
        
        {/* Scrolling marquee content */}
        <div className="flex-1 overflow-hidden relative">
          <div className="marquee flex items-center whitespace-nowrap text-yellow-900 font-dm-mono font-medium uppercase text-sm">
            {/* Duplicate content for seamless scrolling */}
            {marqueeContent}
            {marqueeContent}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="
            ml-4 p-1.5 rounded-full hover:bg-yellow-500/30 
            transition-colors duration-200 group z-20
            flex-shrink-0
          "
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4 text-yellow-800 group-hover:text-yellow-900" />
        </button>
      </div>

      {/* Decorative bottom border gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 animate-pulse" />
    </div>
  )
}