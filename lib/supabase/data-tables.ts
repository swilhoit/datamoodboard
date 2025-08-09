import { createClient } from './client'

export interface DataTable {
  id?: string
  user_id?: string
  name: string
  description?: string
  source: 'googlesheets' | 'csv' | 'api' | 'database' | 'shopify' | 'stripe'
  source_config?: any
  data: any[]
  schema?: any[]
  row_count?: number
  last_synced_at?: string
  sync_status?: 'active' | 'paused' | 'error'
  sync_frequency?: 'manual' | 'hourly' | 'daily' | 'weekly'
  created_at?: string
  updated_at?: string
}

export interface DataTransformation {
  id?: string
  user_id?: string
  name: string
  source_table_ids: string[]
  transform_type: 'filter' | 'aggregate' | 'join' | 'pivot' | 'custom'
  transform_config: any
  result_data?: any[]
  result_schema?: any[]
  is_cached?: boolean
  cache_expires_at?: string
  created_at?: string
  updated_at?: string
}

export class DataTableService {
  private supabase = createClient()

  // Create a new data table
  async createDataTable(table: DataTable) {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('user_data_tables')
      .insert({
        ...table,
        user_id: user.id,
        row_count: table.data?.length || 0,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Get all user's data tables
  async getUserDataTables() {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('user_data_tables')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Get a specific data table
  async getDataTable(id: string) {
    const { data, error } = await this.supabase
      .from('user_data_tables')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // Update a data table
  async updateDataTable(id: string, updates: Partial<DataTable>) {
    const { data, error } = await this.supabase
      .from('user_data_tables')
      .update({
        ...updates,
        row_count: updates.data?.length || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Delete a data table
  async deleteDataTable(id: string) {
    const { error } = await this.supabase
      .from('user_data_tables')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Sync data from source
  async syncDataTable(id: string) {
    const table = await this.getDataTable(id)
    
    // This would contain logic to re-fetch data from the source
    // For now, just update the last_synced_at timestamp
    const { data, error } = await this.supabase
      .from('user_data_tables')
      .update({
        last_synced_at: new Date().toISOString(),
        sync_status: 'active',
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Create a transformation
  async createTransformation(transformation: DataTransformation) {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Apply the transformation logic here
    const resultData = await this.applyTransformation(transformation)

    const { data, error } = await this.supabase
      .from('data_transformations')
      .insert({
        ...transformation,
        user_id: user.id,
        result_data: resultData,
        is_cached: true,
        cache_expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour cache
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Apply transformation logic
  private async applyTransformation(transformation: DataTransformation): Promise<any[]> {
    // Fetch source tables
    const sourceTables = await Promise.all(
      transformation.source_table_ids.map(id => this.getDataTable(id))
    )

    let result: any[] = []

    switch (transformation.transform_type) {
      case 'filter':
        // Apply filter logic
        const filterConfig = transformation.transform_config
        result = Array.isArray(sourceTables?.[0]?.data) ? sourceTables[0].data.filter((row: any) => {
          // Simple filter implementation
          return Object.entries(filterConfig.conditions || {}).every(
            ([key, value]) => row[key] === value
          )
        }) : []
        break

      case 'aggregate':
        // Apply aggregation logic
        const aggConfig = transformation.transform_config
        const grouped: Record<string, any[]> = {}

        ;(Array.isArray(sourceTables?.[0]?.data) ? sourceTables[0].data : []).forEach((row: any) => {
          const key = String(row[aggConfig.groupBy])
          if (!grouped[key]) grouped[key] = []
          grouped[key].push(row)
        })

        result = Object.entries(grouped).map(([key, rows]: [string, any[]]) => {
          const aggregated: any = { [aggConfig.groupBy]: key }
          
          if (aggConfig.aggregate === 'sum') {
            aggregated[aggConfig.column] = rows.reduce(
              (sum, row) => sum + (parseFloat(row[aggConfig.column]) || 0), 
              0
            )
          } else if (aggConfig.aggregate === 'count') {
            aggregated.count = rows.length
          } else if (aggConfig.aggregate === 'avg') {
            const sum = rows.reduce(
              (sum, row) => sum + (parseFloat(row[aggConfig.column]) || 0), 
              0
            )
            aggregated[aggConfig.column] = sum / rows.length
          }
          
          return aggregated
        })
        break

      case 'join':
        // Simple inner join implementation
        const joinConfig = transformation.transform_config
        const table1 = Array.isArray(sourceTables?.[0]?.data) ? sourceTables[0].data : []
        const table2 = Array.isArray(sourceTables?.[1]?.data) ? sourceTables[1].data : []
        
        result = table1.flatMap((row1: any) =>
          table2
            .filter((row2: any) => row1[joinConfig.leftKey] === row2[joinConfig.rightKey])
            .map((row2: any) => ({ ...row1, ...row2 }))
        )
        break

      default:
        result = Array.isArray(sourceTables?.[0]?.data) ? sourceTables[0].data : []
    }

    return result
  }

  // Get user's transformations
  async getUserTransformations() {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('data_transformations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Log activity
  async logActivity(action: string, resourceType?: string, resourceId?: string, metadata?: any) {
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