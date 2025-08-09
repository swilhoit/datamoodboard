import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    console.log('API /data-tables POST: User:', user?.id)

    if (!user) {
      console.log('API /data-tables POST: No user authenticated')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, source, data, schema, row_count } = body

    console.log('API /data-tables POST: Saving table:', { name, source, row_count })

    if (!name || !source) {
      return NextResponse.json({ error: 'Name and source are required' }, { status: 400 })
    }

    // Tier gating: free users limited to 3 tables
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const subscriptionTier = (profile as any)?.subscription_tier || 'free'
    if (subscriptionTier === 'free') {
      const { count } = await supabase
        .from('user_data_tables')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      if ((count || 0) >= 3) {
        return NextResponse.json({
          error: 'Free plan limit reached. Upgrade to Pro to add more tables.',
          requiresUpgrade: true,
        }, { status: 402 })
      }
    }

    // Check if table with same name exists
    const { data: existingTable } = await supabase
      .from('user_data_tables')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name)
      .single()

    let result
    if (existingTable) {
      // Update existing table
      const { data: updatedTable, error } = await supabase
        .from('user_data_tables')
        .update({
          source,
          data: data || [],
          schema: schema || [],
          row_count: row_count || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTable.id)
        .select()
        .single()

      if (error) throw error
      result = updatedTable
    } else {
      // Create new table
      const { data: newTable, error } = await supabase
        .from('user_data_tables')
        .insert({
          user_id: user.id,
          name,
          source,
          data: data || [],
          schema: schema || [],
          row_count: row_count || 0
        })
        .select()
        .single()

      if (error) throw error
      result = newTable
    }

    return NextResponse.json({ 
      success: true, 
      table: result 
    })
  } catch (error) {
    console.error('Error saving table:', error)
    return NextResponse.json({ 
      error: 'Failed to save table' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    console.log('API /data-tables GET: User:', user?.id)

    if (!user) {
      console.log('API /data-tables GET: No user authenticated')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: tables, error } = await supabase
      .from('user_data_tables')
      .select('id, name, source, row_count, created_at, schema')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    console.log('API /data-tables GET: Found', tables?.length || 0, 'tables')

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      tables: tables || [] 
    })
  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch tables' 
    }, { status: 500 })
  }
}