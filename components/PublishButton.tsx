'use client'

import { useState } from 'react'
import { Share, Globe, Link, Users, Eye, EyeOff, Copy, Check, X } from 'lucide-react'

interface PublishButtonProps {
  isDarkMode?: boolean
  onPublish?: (settings: PublishSettings) => Promise<string | void> | string | void
}

interface PublishSettings {
  visibility: 'public' | 'unlisted' | 'private'
  allowComments: boolean
  allowDownloads: boolean
}

export default function PublishButton({ isDarkMode, onPublish }: PublishButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [shareableLink, setShareableLink] = useState('')
  const [publishSettings, setPublishSettings] = useState<PublishSettings>({
    visibility: 'public',
    allowComments: true,
    allowDownloads: false
  })

  const handlePublish = async () => {
    setIsPublishing(true)
    
    try {
      if (onPublish) {
        const url = await onPublish(publishSettings)
        if (url) setShareableLink(url)
      }
    } finally {
      setIsPublishing(false)
      setShowShareModal(true)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const effectiveLink = shareableLink || (typeof window !== 'undefined' ? window.location.origin : 'https://datamoodboard.com')

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Publish Status Indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
          isDarkMode 
            ? 'bg-gray-800 text-gray-400' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
          <span>Draft</span>
        </div>

        {/* Publish Button */}
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-dm-mono font-medium uppercase transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
            isDarkMode
              ? 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg shadow-gray-900/25'
              : 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg shadow-gray-600/25'
          }`}
        >
          {isPublishing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Publishing...</span>
            </>
          ) : (
            <>
              <Share size={16} />
              <span>Publish</span>
            </>
          )}
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`relative max-w-md w-full mx-4 rounded-xl shadow-2xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Header */}
            <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800/20' : 'bg-gray-100'}`}>
                    <Share size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-dm-mono font-semibold uppercase ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Published Successfully! 🎉
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Your moodboard is now live and ready to share
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className={`p-1 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-dm-mono font-medium uppercase mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Shareable Link
                </label>
                <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                  isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <Globe size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  <input
                    type="text"
                    value={shareableLink || ''}
                    readOnly
                    className={`flex-1 bg-transparent text-sm ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    } focus:outline-none`}
                  />
                  <button
                    onClick={() => shareableLink && copyToClipboard(shareableLink)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-dm-mono font-medium uppercase rounded transition-colors ${
                      copiedLink
                        ? (isDarkMode ? 'bg-gray-800/30 text-gray-400' : 'bg-gray-100 text-gray-700')
                        : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200')
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check size={12} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/20' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  💡 Anyone with this link can view your moodboard. Share it with colleagues, clients, or on social media!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}