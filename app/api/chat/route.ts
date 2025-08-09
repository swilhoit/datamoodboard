import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Only initialize OpenAI if API key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

export async function POST(request: NextRequest) {
  try {
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
      ? `You are an action planner for a canvas dashboard app.
         Output ONLY a compact JSON object with a 'commands' array. No prose, no explanations, no markdown.
         Each command: { "action": string, "target"?: { "id"?: string, "title"?: string, "selector"?: "@selected"|"#last" }, "params"?: object }.
         Valid actions: addVisualization, updateItem, removeItem, moveItem, resizeItem, bindData, arrangeLayout, setTheme, listDatasets.
         Examples:
         {"commands":[{"action":"addVisualization","params":{"type":"barChart","title":"Revenue"}},{"action":"bindData","target":{"selector":"#last"},"params":{"table":"Orders","xField":"date","yField":"amount"}}]}
         Use the provided context to choose correct ids/titles/columns. Keep it minimal.`
      : mode === 'dashboard'
      ? `You are a data visualization assistant embedded in a canvas app.
         CRITICAL RULES:
         - Prefer taking actions and giving short confirmations over step-by-step instructions.
         - Do NOT provide procedural "click/drag/select" guidance unless explicitly asked for instructions.
         - Keep answers under 2 short sentences.
         - If the user requests creating or modifying visualizations, respond concisely with what will be created/changed and why.
         Context: ${JSON.stringify(context || {})}`
      : `You are a data engineering assistant embedded in a canvas app.
         CRITICAL RULES:
         - Prefer taking actions and giving short confirmations over step-by-step instructions.
         - Do NOT provide procedural instructions unless explicitly asked.
         - Keep answers under 2 short sentences.
         Context: ${JSON.stringify(context || {})}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
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