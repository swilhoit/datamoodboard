'use client'

import { useState, useRef, useEffect } from 'react'
import { User, Settings, HelpCircle, LogOut, ChevronDown, Crown } from 'lucide-react'

interface AccountMenuProps {
  isDarkMode?: boolean
}

export default function AccountMenu({ isDarkMode }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Mock user data - in a real app this would come from auth context
  const user = {
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
    plan: 'Pro'
  }

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

  const menuItems = [
    { icon: User, label: 'Profile', action: () => {} /* console.log('Profile') */ },
    { icon: Settings, label: 'Settings', action: () => {} /* console.log('Settings') */ },
    { icon: Crown, label: 'Upgrade to Pro', action: () => {} /* console.log('Upgrade') */, highlight: true },
    { icon: HelpCircle, label: 'Help & Support', action: () => {} /* console.log('Help') */ },
    { icon: LogOut, label: 'Sign Out', action: () => {} /* console.log('Sign Out') */, danger: true },
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Account Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-105 ${
          isDarkMode 
            ? 'bg-gray-800 hover:bg-gray-700 text-white' 
            : 'bg-white hover:bg-gray-50 text-gray-700 shadow-sm border border-gray-200'
        }`}
      >
        <img
          src={user.avatar}
          alt={user.name}
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="text-left min-w-0">
          <div className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {user.name}
          </div>
          <div className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {user.plan} Plan
          </div>
        </div>
        <ChevronDown 
          size={16} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${
            isDarkMode ? 'text-gray-400' : 'text-gray-400'
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute right-0 top-full mt-2 w-64 rounded-xl shadow-xl border z-50 ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          {/* User Info Header */}
          <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user.name}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {user.email}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Crown size={12} className="text-yellow-500" />
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user.plan} Plan
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.action()
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  item.danger
                    ? `text-red-600 hover:bg-red-50 ${isDarkMode ? 'hover:bg-red-900/20' : ''}`
                    : item.highlight
                    ? `text-blue-600 hover:bg-blue-50 ${isDarkMode ? 'text-blue-400 hover:bg-blue-900/20' : ''}`
                    : isDarkMode
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon size={16} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.highlight && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                  }`}>
                    New
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}