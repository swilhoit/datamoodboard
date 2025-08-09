import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const { params } = context
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: table, error } = await supabase
      .from('user_data_tables')
      .select('*')
      .eq('id', params.tableId)
      .eq('user_id', user.id)
      .single()

    if (error || !table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      table: {
        id: table.id,
        name: table.name,
        source: table.source,
        data: table.data || [],
        schema: table.schema || [],
        row_count: table.row_count || 0,
        created_at: table.created_at,
      }
    })
  } catch (error) {
    console.error('Error fetching table:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}