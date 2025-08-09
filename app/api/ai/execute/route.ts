import { NextRequest, NextResponse } from 'next/server'
import { validateCommands, applyValidationGuards } from '@/lib/ai/validators'
import { resolveTable, inferBindings, materializeDataset } from '@/lib/ai/binding'
import { DataTableService } from '@/lib/supabase/data-tables'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

type Command = {
  action: string
  target?: { id?: string; title?: string; selector?: '@selected' | '#last' }
  params?: any
}

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { commands, context } = await request.json()
    if (!Array.isArray(commands)) {
      return NextResponse.json({ error: 'commands[] required' }, { status: 400 })
    }
    const currentState = context?.currentState
    if (!currentState) {
      return NextResponse.json({ error: 'context.currentState required' }, { status: 400 })
    }

    // Clone state to mutate safely
    const state = JSON.parse(JSON.stringify(currentState))

    // Validate high-level schema
    const invalid = validateCommands(commands)
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 })
    }

    // Helpers
    const pickTarget = (cmd: Command) => {
      const items: any[] = Array.isArray(state.canvasItems) ? state.canvasItems : []
      if (cmd.target?.id) return items.find(i => i.id === cmd.target!.id)
      if (cmd.target?.title) return items.find(i => String(i.title || '').toLowerCase() === String(cmd.target!.title).toLowerCase())
      if (cmd.target?.selector === '@selected' && state.selectedItem) return items.find(i => i.id === state.selectedItem)
      if (cmd.target?.selector === '#last') return items[items.length - 1]
      return null
    }

    // Apply each command
    for (const cmd of commands as Command[]) {
      const action = String(cmd.action || '').toLowerCase()
      applyValidationGuards(action, cmd, state)

      if (action === 'listdatasets') {
        try {
          const supabase = await createServerSupabase()
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data, error } = await supabase
              .from('user_data_tables')
              .select('name,row_count,source')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
            if (error) throw error
            ;(state as any).__datasets = data || []
          } else {
            ;(state as any).__datasets = []
          }
        } catch {
          ;(state as any).__datasets = (context?.currentState?.dataTables || []).map((t: any) => ({ name: t.tableName, row_count: t.rowCount || t.row_count, source: t.source }))
        }
        continue
      }

      if (action === 'addvisualization') {
        const type = cmd.params?.type || 'barChart'
        const title = cmd.params?.title || `New ${type.replace('Chart', ' Chart')}`
        const newItem = {
          id: `item-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          type,
          title,
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100,
          width: cmd.params?.width || 400,
          height: cmd.params?.height || 300,
          data: [],
          style: {
            theme: 'modern',
            colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
            background: '#FFFFFF',
            gridColor: '#E5E7EB',
            textColor: '#1F2937',
            font: 'Inter',
            fontSize: 12,
            gradients: false,
          },
          zIndex: (state.canvasItems?.length || 0) + 1,
        }
        state.canvasItems = [...(state.canvasItems || []), newItem]

        // Optional immediate binding if params include table/fields
        if (cmd.params?.table || cmd.params?.xField || cmd.params?.yField) {
          const table = resolveTable(context, { name: cmd.params?.table })
          if (table) {
            const bindings = inferBindings(table.schema, {
              xField: cmd.params?.xField,
              yField: cmd.params?.yField,
              series: cmd.params?.series,
              agg: cmd.params?.agg,
            })
            const rows = materializeDataset(table, bindings, { limit: 500 })
            newItem.data = rows
          }
        }
      } else if (action === 'binddata') {
        const target = pickTarget(cmd)
        if (!target) continue
        const table = resolveTable(context, { name: cmd.params?.table, id: cmd.params?.tableId })
        if (!table) continue
        const bindings = inferBindings(table.schema, {
          xField: cmd.params?.xField,
          yField: cmd.params?.yField,
          series: cmd.params?.series,
          agg: cmd.params?.agg,
        })
        const rows = materializeDataset(table, bindings, { limit: 2000 })
        // Always ensure array
        target.data = Array.isArray(rows) ? rows : []
        // record simple mapping for future edits
        target.bindings = bindings
      } else if (action === 'moveitem') {
        const target = pickTarget(cmd)
        if (!target) continue
        const dx = Number(cmd.params?.dx || 0)
        const dy = Number(cmd.params?.dy || 0)
        target.x = (target.x || 0) + dx
        target.y = (target.y || 0) + dy
      } else if (action === 'resizeitem') {
        const target = pickTarget(cmd)
        if (!target) continue
        const w = Number(cmd.params?.width || target.width || 400)
        const h = Number(cmd.params?.height || target.height || 300)
        target.width = Math.max(120, Math.min(2000, w))
        target.height = Math.max(100, Math.min(1200, h))
      } else if (action === 'updateitem') {
        const target = pickTarget(cmd)
        if (!target) continue
        const allowed = ['title', 'type', 'style', 'options']
        for (const k of allowed) {
          if (cmd.params && k in cmd.params) {
            ;(target as any)[k] = cmd.params[k]
          }
        }
      } else if (action === 'removeitem') {
        const target = pickTarget(cmd)
        if (!target) continue
        state.canvasItems = (state.canvasItems || []).filter((it: any) => it.id !== target.id)
      } else if (action === 'arrangelayout') {
        // Simple vertical stacking as a placeholder; real layout is handled elsewhere
        let y = 80
        const gap = 24
        for (const it of state.canvasItems || []) {
          it.y = y
          y += (it.height || 300) + gap
        }
      } else if (action === 'settheme') {
        state.theme = cmd.params?.theme === 'dark' ? 'dark' : 'light'
      }
    }

    return NextResponse.json({ state })
  } catch (e: any) {
    console.error('AI execute error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to execute commands' }, { status: 500 })
  }
}


