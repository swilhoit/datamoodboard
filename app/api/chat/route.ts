import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { messages, mode, context } = await request.json()

    // Create a system message based on the mode
    const systemMessage = mode === 'dashboard' 
      ? `You are a helpful data visualization assistant. You help users create charts, analyze data, and build interactive dashboards. 
         You can suggest chart types, data transformations, and design improvements. 
         When users ask about data or visualizations, provide actionable suggestions.
         Context about the canvas: ${JSON.stringify(context || {})}`
      : `You are a data engineering assistant. You help users with database connections, SQL queries, data transformations, and ETL pipelines.
         You can suggest table structures, relationships, and data modeling best practices.
         Context about the data workspace: ${JSON.stringify(context || {})}`

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