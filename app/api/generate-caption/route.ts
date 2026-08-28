import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const topic = typeof body.topic === 'string' ? body.topic.trim() : ''

    if (!topic) {
      return NextResponse.json({ error: 'Add a post topic first.' }, { status: 400 })
    }

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: 'You write concise, warm social media captions. Return exactly three lines: caption, hashtags, call to action. No labels or markdown.',
      prompt: `Create a social post about: ${topic}`,
    })

    const [caption = '', hashtags = '', cta = ''] = result.text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    return NextResponse.json({ caption, hashtags, cta })
  } catch (error) {
    console.error('[v0] Caption generation failed:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 503 })
  }
}

export const runtime = 'edge'