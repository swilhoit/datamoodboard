import { DashboardService, type Dashboard } from '@/lib/supabase/dashboards'

export type DashboardRecord = Pick<Dashboard, 'id' | 'name' | 'share_slug' | 'thumbnail_url' | 'updated_at'> & {
  id: string
}

const service = new DashboardService()

export async function listDashboards(): Promise<DashboardRecord[]> {
  const rows = await service.getUserDashboards()
  return (rows || []).map((d) => ({
    id: String(d.id),
    name: d.name,
    share_slug: d.share_slug,
    thumbnail_url: d.thumbnail_url,
    updated_at: d.updated_at,
  }))
}

export async function renameDashboard(id: string, name: string): Promise<DashboardRecord> {
  const updated = await service.updateDashboard(id, { name })
  return {
    id: String(updated.id),
    name: updated.name,
    share_slug: updated.share_slug,
    thumbnail_url: updated.thumbnail_url,
    updated_at: updated.updated_at,
  }
}

export async function deleteDashboard(id: string): Promise<void> {
  await service.deleteDashboard(id)
}

export async function publishDashboard(id: string, options: {
  visibility: 'public' | 'unlisted' | 'private'
  allowComments?: boolean
  allowDownloads?: boolean
}) {
  return await service.publishDashboard(id, options)
}

export async function getDashboardByShareSlug(shareSlug: string) {
  return await service.getDashboardByShareSlug(shareSlug)
}


