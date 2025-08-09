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

  const state = (dashboard as any).state_json || (dashboard as any).state || {}
  const mode = (dashboard.canvas_mode as 'design' | 'data') || (state.mode as 'design' | 'data') || 'design'
  const designItems = Array.isArray(dashboard.canvas_items) && dashboard.canvas_items.length > 0
    ? dashboard.canvas_items
    : (Array.isArray(state.canvasItems) ? state.canvasItems : [])
  const designElements = Array.isArray((dashboard as any).canvas_elements) && (dashboard as any).canvas_elements.length > 0
    ? (dashboard as any).canvas_elements
    : (Array.isArray((state as any).canvasElements) ? (state as any).canvasElements : [])
  const dataTables = Array.isArray(dashboard.data_tables) && dashboard.data_tables.length > 0
    ? dashboard.data_tables
    : (Array.isArray(state.dataTables) ? state.dataTables : [])
  const connections = Array.isArray(dashboard.connections) && dashboard.connections.length > 0
    ? dashboard.connections
    : (Array.isArray(state.connections) ? state.connections : [])
  const background = dashboard.canvas_background || state.background

  return (
    <div className="fixed inset-0 bg-white">
      <SharedCanvasView
        mode={mode}
            designItems={[...designItems, ...designElements]}
        dataTables={dataTables}
        connections={connections}
        background={background}
        isDarkMode={dashboard.theme === 'dark'}
      />
    </div>
  )
}


