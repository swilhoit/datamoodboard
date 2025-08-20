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

    // Verify admin
    let isAdmin = false
    if (user.email === 'tetrahedronglobal@gmail.com') {
      isAdmin = true
    } else {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role === 'admin') isAdmin = true
    }
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const client = createSupabaseAdmin() || supabase

    // Counts from actual tables
    const [users, dashboards, dataTables, connections] = await Promise.all([
      client.from('profiles').select('*', { count: 'exact', head: true }),
      client.from('dashboards').select('*', { count: 'exact', head: true }),
      client.from('user_data_tables').select('*', { count: 'exact', head: true }),
      client.from('data_connections').select('*', { count: 'exact', head: true })
    ])

    // Aggregations
    const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [dashboardsLast30, tablesLast30, activityLast30] = await Promise.all([
      client.from('dashboards').select('id, user_id, created_at').gte('created_at', last30),
      client.from('user_data_tables').select('id, user_id, row_count, created_at').gte('created_at', last30),
      client.from('activity_log').select('id, user_id, action, created_at').gte('created_at', last30)
    ])

    // Process dashboards by day
    const dashboardsByDay = processDailyCounts(dashboardsLast30.data || [], 'created_at', 30)

    // Process tables by day with row counts
    const tablesByDay = processDailyTables(tablesLast30.data || [], 'created_at', 30)

    // Total rows
    const totalRows = (tablesLast30.data || []).reduce((sum: number, t: any) => sum + (t.row_count || 0), 0)

    // Activity per user
    const activityPerUser = processPerUserCounts(activityLast30.data || [], 'user_id')

    // Fetch user details
    const userIds = [...new Set((activityLast30.data || []).map((a: any) => a.user_id))]
    const { data: userProfiles } = userIds.length > 0 ? await client.from('profiles').select('id, email, full_name').in('id', userIds) : { data: [] }
    const profileMap = new Map((userProfiles || []).map((p: any) => [p.id, p]))

    const activityPerUserDetailed = activityPerUser.map(u => ({
      ...u,
      email: profileMap.get(u.user_id)?.email,
      full_name: profileMap.get(u.user_id)?.full_name
    }))

    const aiUsageLast30 = await client.from('ai_image_usage').select('usage_date, used').gte('usage_date', last30.slice(0,10))

    const aiUsageByDay = processDailyCounts(aiUsageLast30.data || [], 'usage_date', 30, 'used')

    const topAiUsersRaw = await client.from('ai_image_usage').select('user_id, used')

    const topAiUsersMap = new Map()
    topAiUsersRaw.data?.forEach((u: any) => {
      topAiUsersMap.set(u.user_id, (topAiUsersMap.get(u.user_id) || 0) + u.used)
    })
    const topAiUsers = Array.from(topAiUsersMap.entries())
      .map(([user_id, total_used]) => ({ user_id, total_used }))
      .sort((a, b) => b.total_used - a.total_used)
      .slice(0, 10)

    // Fetch profiles for top users
    const aiUserIds = topAiUsers.map(u => u.user_id)
    const { data: aiUserProfiles } = aiUserIds.length > 0 ? await client.from('profiles').select('id, email, full_name').in('id', aiUserIds) : { data: [] }
    const aiProfileMap = new Map((aiUserProfiles || []).map((p: any) => [p.id, p]))

    const topAiUsersDetailed = topAiUsers.map(u => ({
      ...u,
      email: aiProfileMap.get(u.user_id)?.email,
      full_name: aiProfileMap.get(u.user_id)?.full_name
    }))

    return NextResponse.json({
      users: users.count,
      dashboards: dashboards.count,
      dataTables: dataTables.count,
      connections: connections.count,
      totalRows,
      dashboardsByDay,
      tablesByDay,
      activityPerUser: activityPerUserDetailed,
      aiUsageByDay,
      topAiUsers: topAiUsersDetailed
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Error fetching metrics' }, { status: 500 })
  }
}

function processDailyCounts(data: any[], dateField: string, days: number, valueKey = 'count') {
  const map = new Map()
  data.forEach((item: any) => {
    const date = item[dateField].slice(0, 10)
    map.set(date, (map.get(date) || 0) + (item[valueKey] || 1))
  })
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    result.push({ date: d, count: map.get(d) || 0 })
  }
  return result
}

function processDailyTables(data: any[], dateField: string, days: number) {
  const map = new Map()
  data.forEach((item: any) => {
    const date = item[dateField].slice(0, 10)
    const prev = map.get(date) || { tables: 0, rows: 0 }
    prev.tables += 1
    prev.rows += item.row_count || 0
    map.set(date, prev)
  })
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    const val = map.get(d) || { tables: 0, rows: 0 }
    result.push({ date: d, tables: val.tables, rows: val.rows })
  }
  return result
}

function processPerUserCounts(data: any[], userField: string) {
  const map = new Map()
  data.forEach((item: any) => {
    const uid = item[userField]
    map.set(uid, (map.get(uid) || 0) + 1)
  })
  return Array.from(map.entries()).map(([user_id, count]) => ({ user_id, count })).sort((a, b) => b.count - a.count).slice(0, 10)
}


