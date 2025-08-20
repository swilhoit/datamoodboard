import { NextRequest, NextResponse } from 'next/server'
import { createClient, createSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role using regular client (RLS applies here)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createSupabaseAdmin()

    const [usersCountRes, dashboardsCountRes, tablesCountRes, totalImagesRes, last7Res, topUsersRes] = await Promise.all([
      admin.from('profiles').select('*', { count: 'exact', head: true }),
      admin.from('dashboards').select('*', { count: 'exact', head: true }),
      admin.from('user_data_tables').select('*', { count: 'exact', head: true }),
      admin.rpc('sql', { }) // placeholder
    ].map(p => p.catch((e: any) => ({ error: e }))))

    // The Supabase JS client has no generic SQL endpoint; run aggregate queries via admin client using PostgREST RPCs or use postgrest filters
    // Fallback: we compute aggregates with multiple queries

    const totalAiImages = await admin
      .from('ai_image_usage')
      .select('used', { count: 'none' })

    const last7Days = await admin
      .from('ai_image_usage')
      .select('usage_date, used')
      .gte('usage_date', new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString().slice(0, 10))

    const topUsers = await admin
      .from('ai_image_usage')
      .select('user_id, used, usage_date')
      .gte('usage_date', new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString().slice(0, 10))

    // Reduce client-side
    const totalImages = (totalAiImages.data || []).reduce((sum: number, r: any) => sum + (r.used || 0), 0)

    const dailyMap = new Map<string, number>()
    ;(last7Days.data || []).forEach((r: any) => {
      const d = r.usage_date
      dailyMap.set(d, (dailyMap.get(d) || 0) + (r.used || 0))
    })
    // Ensure 7 days present
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().slice(0, 10)
      if (!dailyMap.has(d)) dailyMap.set(d, 0)
    }
    const daily = Array.from(dailyMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([date, total]) => ({ date, total }))

    const topMap = new Map<string, number>()
    ;(topUsers.data || []).forEach((r: any) => {
      topMap.set(r.user_id, (topMap.get(r.user_id) || 0) + (r.used || 0))
    })
    const top = Array.from(topMap.entries()).map(([user_id, total]) => ({ user_id, total }))
      .sort((a, b) => b.total - a.total).slice(0, 10)

    return NextResponse.json({
      users: usersCountRes.count || 0,
      dashboards: dashboardsCountRes.count || 0,
      dataTables: tablesCountRes.count || 0,
      totalAiImages: totalImages,
      last7: daily,
      topUsers: top
    })
  } catch (e: any) {
    console.error('Admin metrics error:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


