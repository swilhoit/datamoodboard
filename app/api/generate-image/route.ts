import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
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

    const imageUrl = response.data[0]?.url

    return NextResponse.json({ 
      imageUrl: imageUrl,
      revised_prompt: response.data[0]?.revised_prompt 
    })
  } catch (error: any) {
    console.error('DALL-E API error:', error)
    
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