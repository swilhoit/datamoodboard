import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createRateLimiter } from '@/lib/rateLimit'

// Only initialize OpenAI if API key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

// Module-level limiter to persist across invocations on warm lambdas
const limiter = createRateLimiter({ tokens: 30, windowMs: 60_000 })

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'global'
    const { allowed, resetAt } = limiter.check(ip)
    if (!allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } })
    }
    // Return early if OpenAI is not configured
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' },
        { status: 503 }
      )
    }

    const { messages, mode, context } = await request.json()

    // Create a concise execution-first system message
    const systemMessage = mode === 'dashboard-tools'
      ? `You are an intelligent canvas orchestrator for a dashboard app with spatial awareness.
         Output ONLY a compact JSON object with a 'commands' array. No prose, no explanations, no markdown.
         Each command: { "action": string, "target"?: { "id"?: string, "title"?: string, "selector"?: "@selected"|"#last" }, "params"?: object }.
         
         CANVAS NAVIGATION ACTIONS:
         - findEmptySpace: Find empty area for item placement
         - placeNear: Position item near another (params: targetId, side: "right"|"left"|"top"|"bottom")
         - arrangeGrid: Arrange items in grid layout (params: items?: string[])
         - align: Align items (params: items: string[], alignment: "left"|"right"|"top"|"bottom"|"centerX"|"centerY")
         - distribute: Space items evenly (params: items: string[], direction: "horizontal"|"vertical")
         - createPipeline: Create data flow layout (params: source, transforms?, output)
         - getAnalytics: Get canvas state analytics
         - findItems: Find items by criteria (params: type?, hasData?, connected?)
         
         VISUALIZATION ACTIONS:
         - addVisualization: Add chart/visual (params: type, title, nearId?, side?)
         - updateItem, removeItem, moveItem, resizeItem: Modify existing items
         - bindData: Connect data to visualization
         - setTheme: Change visual theme
         
         SMART BEHAVIORS:
         - When adding visualizations, use intelligent positioning (nearId or findEmptySpace)
         - Create logical flows: data source → transform → visualization
         - Organize related items together
         - Avoid overlapping items
         - After adding multiple items, consider arrangeGrid or distribute
         
         Examples:
         {"commands":[{"action":"addVisualization","params":{"type":"barChart","title":"Sales","nearId":"data-1","side":"right"}},{"action":"bindData","target":{"selector":"#last"},"params":{"table":"Orders"}}]}
         {"commands":[{"action":"arrangeGrid"},{"action":"align","params":{"items":["chart-1","chart-2"],"alignment":"top"}}]}`
      : mode === 'dashboard'
      ? `You are a data visualization assistant embedded in a canvas app that CAN directly apply changes by triggering tools.
         CRITICAL RULES:
         - Speak confidently as an active agent. Never claim you can't manipulate the app or link data.
         - Prefer taking actions and giving short confirmations over step-by-step instructions.
         - Avoid disclaimers like "as an AI" or "I can't". If information is missing, ask ONE short question.
         - Keep answers under 2 short sentences.
         - When the user asks to link/bind/connect data to a chart, briefly confirm and proceed.
         Context: ${JSON.stringify(context || {})}`
      : `You are a data engineering assistant embedded in a canvas app that CAN directly apply changes by triggering tools.
         CRITICAL RULES:
         - Speak confidently as an active agent. Never claim you can't manipulate the app or link data.
         - Prefer taking actions and giving short confirmations over step-by-step instructions.
         - Avoid disclaimers like "as an AI" or "I can't". If information is missing, ask ONE short question.
         - Keep answers under 2 short sentences.
         Context: ${JSON.stringify(context || {})}`

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    return NextResponse.json({ 
      message: completion.choices[0].message.content 
    })
  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}