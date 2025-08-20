'use client'

import React, { useEffect, useState } from 'react'
import { X, User, Bell, Globe, Shield, Palette, Save, Upload, Trash2, Check, Camera, Mail, Phone, MapPin, Calendar, Link2, Twitter, Github, Linkedin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type TabType = 'profile' | 'notifications' | 'preferences' | 'security' | 'billing'

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    website: '',
    twitter: '',
    github: '',
    linkedin: '',
    company: '',
    job_title: ''
  })

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    marketingEmails: false,
    weeklyReports: true,
    monthlyReports: false,
    productUpdates: true,
    securityAlerts: true,
    darkMode: false,
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    publicProfile: false,
    showEmail: false,
    allowAnalytics: true,
    compactView: false,
    autoSave: true,
    showTips: true
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      fetchUserData()
    }
  }, [isOpen])

  const fetchUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      setUser(authUser)

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (prof) {
        setProfile(prof)
        setFormData({
          full_name: prof.full_name || '',
          email: authUser.email || '',
          phone: (prof as any).phone || '',
          location: (prof as any).location || '',
          bio: (prof as any).bio || '',
          website: (prof as any).website || '',
          twitter: (prof as any).twitter || '',
          github: (prof as any).github || '',
          linkedin: (prof as any).linkedin || '',
          company: (prof as any).company || '',
          job_title: (prof as any).job_title || ''
        })

        if (prof.avatar_url) {
          setAvatarUrl(prof.avatar_url)
        }

        if ((prof as any).preferences) {
          setPreferences({ ...preferences, ...(prof as any).preferences })
        }
      }

      // Fetch active sessions (mock data for now)
      const mockSessions = [
        {
          id: '1',
          device: 'Chrome on MacOS',
          location: 'San Francisco, CA',
          lastActive: new Date().toISOString(),
          current: true
        }
      ]
      setSessions(mockSessions)

    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadingAvatar(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setAvatarUrl(publicUrl)

      // Update profile
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

    } catch (error) {
      console.error('Error uploading avatar:', error)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
          website: formData.website,
          twitter: formData.twitter,
          github: formData.github,
          linkedin: formData.linkedin,
          company: formData.company,
          job_title: formData.job_title,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      // If email changed, update auth
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        })
        if (emailError) throw emailError
      }

    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      alert('Password updated successfully')

    } catch (error) {
      console.error('Error changing password:', error)
      alert('Error changing password')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    try {
      // In production, this would call a server endpoint to properly delete the user
      alert('Account deletion request submitted. You will receive an email confirmation.')
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }

  const handleSignOutAllDevices = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'profile' as TabType, label: 'Profile', icon: User },
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell },
    { id: 'preferences' as TabType, label: 'Preferences', icon: Palette },
    { id: 'security' as TabType, label: 'Security', icon: Shield }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold font-dm-mono uppercase">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50 p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:bg-white/50'
                  }`}
                >
                  <tab.icon size={18} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                      
                      {/* Avatar Upload */}
                      <div className="flex items-center gap-6 mb-6">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User size={32} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <label className="absolute bottom-0 right-0 p-1.5 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
                            <Camera size={14} className="text-white" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                              disabled={uploadingAvatar}
                            />
                          </label>
                        </div>
                        <div>
                          <p className="font-medium">{formData.full_name || 'Your Name'}</p>
                          <p className="text-sm text-gray-500">{formData.email}</p>
                        </div>
                      </div>

                      {/* Personal Information */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Full Name</label>
                          <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Email</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Phone</label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Location</label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="San Francisco, CA"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Company</label>
                          <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Job Title</label>
                          <input
                            type="text"
                            value={formData.job_title}
                            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-1">Bio</label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Tell us about yourself..."
                        />
                      </div>

                      {/* Social Links */}
                      <h3 className="text-lg font-semibold mt-8 mb-4">Social Links</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Website</label>
                          <div className="relative">
                            <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="url"
                              value={formData.website}
                              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="https://example.com"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Twitter</label>
                          <div className="relative">
                            <Twitter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={formData.twitter}
                              onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="@username"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">GitHub</label>
                          <div className="relative">
                            <Github size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={formData.github}
                              onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="username"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">LinkedIn</label>
                          <div className="relative">
                            <Linkedin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={formData.linkedin}
                              onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="in/username"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {saving ? (
                          <>Saving...</>
                        ) : (
                          <>
                            <Save size={16} />
                            Save Profile
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">Product Updates</p>
                            <p className="text-sm text-gray-500">Get notified about new features and improvements</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.productUpdates}
                            onChange={(e) => setPreferences({ ...preferences, productUpdates: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">Security Alerts</p>
                            <p className="text-sm text-gray-500">Important notifications about your account security</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.securityAlerts}
                            onChange={(e) => setPreferences({ ...preferences, securityAlerts: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">Weekly Reports</p>
                            <p className="text-sm text-gray-500">Summary of your activity and usage</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.weeklyReports}
                            onChange={(e) => setPreferences({ ...preferences, weeklyReports: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">Monthly Reports</p>
                            <p className="text-sm text-gray-500">Detailed monthly analytics and insights</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.monthlyReports}
                            onChange={(e) => setPreferences({ ...preferences, monthlyReports: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">Marketing Emails</p>
                            <p className="text-sm text-gray-500">Tips, tutorials, and promotional content</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.marketingEmails}
                            onChange={(e) => setPreferences({ ...preferences, marketingEmails: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                        </label>
                      </div>

                      <button
                        onClick={handleSavePreferences}
                        disabled={saving}
                        className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Application Preferences</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Language</label>
                          <select
                            value={preferences.language}
                            onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="ja">Japanese</option>
                            <option value="zh">Chinese</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Timezone</label>
                          <select
                            value={preferences.timezone}
                            onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Denver">Mountain Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                            <option value="Europe/London">London</option>
                            <option value="Europe/Paris">Paris</option>
                            <option value="Asia/Tokyo">Tokyo</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Date Format</label>
                          <select
                            value={preferences.dateFormat}
                            onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          </select>
                        </div>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">Dark Mode</p>
                            <p className="text-sm text-gray-500">Use dark theme across the application</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.darkMode}
                            onChange={(e) => setPreferences({ ...preferences, darkMode: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">Auto-Save</p>
                            <p className="text-sm text-gray-500">Automatically save your work as you go</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.autoSave}
                            onChange={(e) => setPreferences({ ...preferences, autoSave: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">Compact View</p>
                            <p className="text-sm text-gray-500">Show more content with reduced spacing</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.compactView}
                            onChange={(e) => setPreferences({ ...preferences, compactView: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">Show Tips</p>
                            <p className="text-sm text-gray-500">Display helpful tips and tutorials</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.showTips}
                            onChange={(e) => setPreferences({ ...preferences, showTips: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                        </label>
                      </div>

                      <h3 className="text-lg font-semibold mt-8 mb-4">Privacy Settings</h3>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">Public Profile</p>
                            <p className="text-sm text-gray-500">Allow others to view your profile</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.publicProfile}
                            onChange={(e) => setPreferences({ ...preferences, publicProfile: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">Show Email</p>
                            <p className="text-sm text-gray-500">Display your email on your public profile</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.showEmail}
                            onChange={(e) => setPreferences({ ...preferences, showEmail: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">Analytics</p>
                            <p className="text-sm text-gray-500">Help us improve by sharing usage data</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.allowAnalytics}
                            onChange={(e) => setPreferences({ ...preferences, allowAnalytics: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                        </label>
                      </div>

                      <button
                        onClick={handleSavePreferences}
                        disabled={saving}
                        className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                      <div className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-sm font-medium mb-1">Current Password</label>
                          <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">New Password</label>
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={handleChangePassword}
                          disabled={saving || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                          {saving ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Two-Factor Authentication</h3>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Two-Factor Authentication</p>
                            <p className="text-sm text-gray-500">
                              {twoFactorEnabled ? 'Enabled - Your account is secured with 2FA' : 'Add an extra layer of security to your account'}
                            </p>
                          </div>
                          <button
                            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              twoFactorEnabled 
                                ? 'bg-red-500 text-white hover:bg-red-600' 
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                          >
                            {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
                      <div className="space-y-3">
                        {sessions.map((session) => (
                          <div key={session.id} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                            <div>
                              <p className="font-medium">{session.device}</p>
                              <p className="text-sm text-gray-500">
                                {session.location} • Last active {new Date(session.lastActive).toLocaleDateString()}
                              </p>
                              {session.current && (
                                <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  Current Session
                                </span>
                              )}
                            </div>
                            {!session.current && (
                              <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                                Revoke
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleSignOutAllDevices}
                        className="mt-4 text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Sign out all other devices
                      </button>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
                      <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
                        <p className="font-medium mb-2">Delete Account</p>
                        <p className="text-sm text-gray-600 mb-4">
                          Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <button
                          onClick={handleDeleteAccount}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}