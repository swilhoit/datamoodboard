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
      ? `You are an intelligent canvas orchestrator with COMPLETE understanding of ALL canvas tools.
         Output ONLY a compact JSON object with a 'commands' array. No prose, no explanations, no markdown.
         
         CANVAS ELEMENT COMMANDS (text, emoji, images, shapes):
         - addElement: Add any element (params: type:"text"|"emoji"|"image"|"shape"|"gif", ...)
           • text: params: {type:"text", text:"content", fontSize:16, fontFamily:"Inter", color:"#000"}
           • emoji: params: {type:"emoji", emoji:"🐶", fontSize:48}
           • image: params: {type:"image", url:"https://...", alt:"description"}
           • shape: params: {type:"shape", shape:"rectangle"|"circle"|"triangle", fill:"#3B82F6"}
           • gif: params: {type:"gif", url:"https://...gif"}
         
         VISUALIZATION COMMANDS (charts, graphs):
         - addVisualization: Add chart (params: type:"barChart"|"lineChart"|"pieChart", title, data?)
         
         CANVAS NAVIGATION:
         - arrangeGrid, align, distribute: Organize items
         - findEmptySpace, placeNear: Smart positioning
         
         DATA COMMANDS:
         - bindData: Connect data to charts
         - listDatasets: Show available data
         
         CRITICAL RULES:
         - For emojis: Use addElement with type:"emoji" and emoji parameter
         - For text: Use addElement with type:"text" and text parameter
         - For charts: Use addVisualization
         - Never confuse element types
         
         Examples:
         User: "add a dog emoji" → {"commands":[{"action":"addElement","params":{"type":"emoji","emoji":"🐶"}}]}
         User: "add text saying hello" → {"commands":[{"action":"addElement","params":{"type":"text","text":"hello"}}]}
         User: "add a bar chart" → {"commands":[{"action":"addVisualization","params":{"type":"barChart","title":"Chart"}}]}`
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