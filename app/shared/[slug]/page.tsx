import { createClient } from '@/lib/supabase/server'
import SharedCanvasView from '@/components/SharedCanvasView'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function SharedDashboardPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: dashboard } = await supabase
    .from('dashboards')
    .select('*')
    .eq('share_slug', slug)
    .single()

  if (!dashboard || (!dashboard.is_public && !dashboard.is_unlisted)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600">Dashboard not available</div>
      </div>
    )
  }

  const mode = (dashboard.canvas_mode as 'design' | 'data') || 'design'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-6 px-4">
        <h1 className="text-2xl font-semibold mb-4">{dashboard.name}</h1>
        <div className="rounded-lg overflow-hidden border border-gray-200 bg-white" style={{ minHeight: 600 }}>
          <SharedCanvasView
            mode={mode}
            designItems={dashboard.canvas_items || []}
            dataTables={dashboard.data_tables || []}
            connections={dashboard.connections || []}
            background={dashboard.canvas_background}
            isDarkMode={dashboard.theme === 'dark'}
          />
        </div>
      </div>
    </div>
  )
}


