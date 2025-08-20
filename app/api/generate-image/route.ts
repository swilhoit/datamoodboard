import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

// Only initialize OpenAI if API key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Atomically check and increment today's usage before calling OpenAI
    const { data: inc, error: incError } = await (supabase as any).rpc('increment_ai_image_usage')
    if (incError) {
      console.error('Error incrementing AI image usage:', incError)
      return NextResponse.json({ error: 'Failed to check usage' }, { status: 500 })
    }
    const allowed = Array.isArray(inc) ? inc[0]?.allowed : (inc as any)?.allowed
    const used = Array.isArray(inc) ? inc[0]?.used : (inc as any)?.used
    const daily_limit = Array.isArray(inc) ? inc[0]?.daily_limit : (inc as any)?.daily_limit

    if (!allowed) {
      return NextResponse.json(
        { error: 'Out of daily credits', used, daily_limit },
        { status: 429 }
      )
    }
    // Return early if OpenAI is not configured
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. AI image generation is not available.' },
        { status: 503 }
      )
    }
    const { prompt, size = '512x512' } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: size as '1024x1024' | '1792x1024' | '1024x1792',
      quality: 'standard',
      style: 'vivid',
    })

    const imageUrl = response.data?.[0]?.url

    return NextResponse.json({ 
      imageUrl: imageUrl,
      revised_prompt: response.data?.[0]?.revised_prompt 
    })
  } catch (error: any) {
    console.error('DALL-E API error:', error)
    // Best-effort rollback of usage increment when OpenAI fails
    try {
      const supabase = await createClient()
      await (supabase as any).rpc('decrement_ai_image_usage')
    } catch {}
    
    // Handle specific OpenAI errors
    if (error?.error?.code === 'billing_hard_limit_reached') {
      return NextResponse.json(
        { error: 'OpenAI API billing limit reached. Please check your account.' },
        { status: 402 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate image. Please try again.' },
      { status: 500 }
    )
  }
}