import { NextRequest, NextResponse } from 'next/server'
import { DashboardBuilder } from '@/lib/orchestration'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { command, context } = await request.json()

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'command is required' }, { status: 400 })
    }

    const builder = new DashboardBuilder()
    const state = await builder.buildFromDescription(command, context)

    return NextResponse.json({ state })
  } catch (error) {
    console.error('AI orchestrate error:', error)
    return NextResponse.json({ error: 'Failed to orchestrate dashboard' }, { status: 500 })
  }
}


