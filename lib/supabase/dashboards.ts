import { createClient } from './client'
import type { CanvasMode } from '@/app/page'

export interface Dashboard {
  id?: string
  user_id?: string
  name: string
  description?: string
  slug?: string
  is_public?: boolean
  canvas_mode?: CanvasMode
  canvas_items: any[]
  data_tables?: any[]
  connections?: any[]
  canvas_background?: any
  theme?: string
  thumbnail_url?: string
  view_count?: number
  created_at?: string
  updated_at?: string
}

export interface SavedChart {
  id?: string
  user_id?: string
  dashboard_id?: string
  name: string
  chart_type: string
  chart_library: string
  data_source_id?: string
  transform_id?: string
  config: any
  position?: any
  created_at?: string
  updated_at?: string
}

export class DashboardService {
  private supabase = createClient()

  // Create a new dashboard
  async createDashboard(dashboard: Dashboard) {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Generate a unique slug if not provided
    const slug = dashboard.slug || this.generateSlug(dashboard.name)

    const { data, error } = await this.supabase
      .from('dashboards')
      .insert({
        ...dashboard,
        user_id: user.id,
        slug,
      })
      .select()
      .single()

    if (error) throw error
    
    // Log activity
    await this.logActivity('dashboard_create', 'dashboard', data.id, { name: dashboard.name })
    
    return data
  }

  // Get all user's dashboards
  async getUserDashboards() {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('dashboards')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Get a specific dashboard
  async getDashboard(id: string) {
    const { data, error } = await this.supabase
      .from('dashboards')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // Get dashboard by slug (for public sharing)
  async getDashboardBySlug(slug: string) {
    const { data, error } = await this.supabase
      .from('dashboards')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) throw error

    // Increment view count if public
    if (data.is_public) {
      await this.supabase
        .from('dashboards')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id)
    }

    return data
  }

  // Update a dashboard
  async updateDashboard(id: string, updates: Partial<Dashboard>) {
    const { data, error } = await this.supabase
      .from('dashboards')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    
    // Log activity
    await this.logActivity('dashboard_update', 'dashboard', id)
    
    return data
  }

  // Delete a dashboard
  async deleteDashboard(id: string) {
    const { error } = await this.supabase
      .from('dashboards')
      .delete()
      .eq('id', id)

    if (error) throw error
    
    // Log activity
    await this.logActivity('dashboard_delete', 'dashboard', id)
  }

  // Save dashboard state (auto-save functionality)
  async saveDashboardState(
    id: string, 
    canvasItems: any[], 
    dataTables?: any[], 
    connections?: any[]
  ) {
    const { data, error } = await this.supabase
      .from('dashboards')
      .update({
        canvas_items: canvasItems,
        data_tables: dataTables,
        connections: connections,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Duplicate a dashboard
  async duplicateDashboard(id: string, newName?: string) {
    const original = await this.getDashboard(id)
    
    const duplicate: Dashboard = {
      ...original,
      id: undefined,
      name: newName || `${original.name} (Copy)`,
      slug: undefined,
      created_at: undefined,
      updated_at: undefined,
      view_count: 0,
    }

    return await this.createDashboard(duplicate)
  }

  // Save a chart
  async saveChart(chart: SavedChart) {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('saved_charts')
      .insert({
        ...chart,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    
    // Log activity
    await this.logActivity('chart_create', 'chart', data.id, { name: chart.name })
    
    return data
  }

  // Get charts for a dashboard
  async getDashboardCharts(dashboardId: string) {
    const { data, error } = await this.supabase
      .from('saved_charts')
      .select('*')
      .eq('dashboard_id', dashboardId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Update a chart
  async updateChart(id: string, updates: Partial<SavedChart>) {
    const { data, error } = await this.supabase
      .from('saved_charts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    
    // Log activity
    await this.logActivity('chart_update', 'chart', id)
    
    return data
  }

  // Delete a chart
  async deleteChart(id: string) {
    const { error } = await this.supabase
      .from('saved_charts')
      .delete()
      .eq('id', id)

    if (error) throw error
    
    // Log activity
    await this.logActivity('chart_delete', 'chart', id)
  }

  // Get dashboard templates
  async getDashboardTemplates(category?: string) {
    let query = this.supabase
      .from('dashboard_templates')
      .select('*')

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query.order('use_count', { ascending: false })

    if (error) throw error
    return data
  }

  // Create dashboard from template
  async createFromTemplate(templateId: string, name: string) {
    const { data: template, error: templateError } = await this.supabase
      .from('dashboard_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError) throw templateError

    // Increment template use count
    await this.supabase
      .from('dashboard_templates')
      .update({ use_count: (template.use_count || 0) + 1 })
      .eq('id', templateId)

    // Create new dashboard from template
    const dashboard: Dashboard = {
      name,
      description: `Created from template: ${template.name}`,
      canvas_items: template.canvas_items,
      canvas_mode: 'design',
      theme: 'light',
    }

    return await this.createDashboard(dashboard)
  }

  // Generate unique slug
  private generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    
    return `${baseSlug}-${Date.now().toString(36)}`
  }

  // Log activity
  private async logActivity(action: string, resourceType?: string, resourceId?: string, metadata?: any) {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return

    await this.supabase
      .from('activity_log')
      .insert({
        user_id: user.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        metadata,
      })
  }
}