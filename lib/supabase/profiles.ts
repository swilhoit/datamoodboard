import { createClient } from './client'

export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  company?: string
  role?: string
  created_at?: string
  updated_at?: string
}

export class ProfileService {
  private supabase = createClient()

  // Get current user's profile
  async getCurrentProfile() {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return data
  }

  // Get profile by ID
  async getProfile(id: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // Update current user's profile
  async updateProfile(updates: Partial<Profile>) {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Upload avatar
  async uploadAvatar(file: File) {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await this.supabase.storage
      .from('images')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    // Update profile with avatar URL
    const { data, error } = await this.updateProfile({
      avatar_url: publicUrl,
    })

    if (error) throw error
    return data
  }

  // Delete avatar
  async deleteAvatar() {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const profile = await this.getCurrentProfile()
    
    if (profile.avatar_url) {
      // Extract file path from URL
      const urlParts = profile.avatar_url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      
      // Delete from storage
      await this.supabase.storage
        .from('images')
        .remove([`avatars/${fileName}`])
    }

    // Clear avatar URL in profile
    return await this.updateProfile({
      avatar_url: undefined,
    })
  }

  // Get user activity
  async getUserActivity(limit = 10) {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  // Get user statistics
  async getUserStats() {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get counts from various tables
    const [dashboards, dataTables, charts] = await Promise.all([
      this.supabase
        .from('dashboards')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id),
      this.supabase
        .from('user_data_tables')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id),
      this.supabase
        .from('saved_charts')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id),
    ])

    return {
      dashboards_count: dashboards.count || 0,
      data_tables_count: dataTables.count || 0,
      charts_count: charts.count || 0,
    }
  }
}