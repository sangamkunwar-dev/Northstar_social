import { gateway } from '@ai-sdk/gateway'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

const MODEL = 'google/gemini-2.5-flash'

function parseCaption(text: string) {
  const lines = text
    .replace(/```(?:text|markdown)?/gi, '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*]\s*/, '').trim())
    .filter(Boolean)

  const values = { caption: '', hashtags: '', cta: '' }
  const labeled = /^(caption|hashtags?|call\s*to\s*action|cta)\s*:\s*(.*)$/i
  const unlabeled: string[] = []

  for (const line of lines) {
    const match = line.match(labeled)
    if (!match) {
      unlabeled.push(line)
      continue
    }
    const key = match[1].toLowerCase().replace(/\s+/g, '')
    if (key === 'caption') values.caption = match[2]
    else if (key === 'hashtag' || key === 'hashtags') values.hashtags = match[2]
    else values.cta = match[2]
  }

  const fallback = [values.caption, values.hashtags, values.cta]
  for (const line of unlabeled) {
    const index = fallback.findIndex((value) => !value)
    if (index !== -1) fallback[index] = line
  }

  return { caption: fallback[0] || '', hashtags: fallback[1] || '', cta: fallback[2] || '' }
}

export async function POST(request: Request) {
  let topic = ''

  try {
    const body = await request.json()
    topic = typeof body.topic === 'string' ? body.topic.trim() : ''

    if (!topic) return NextResponse.json({ error: 'Add a post topic first.' }, { status: 400 })
    if (topic.length > 2_000) return NextResponse.json({ error: 'Keep the topic under 2,000 characters.' }, { status: 400 })

    const result = await generateText({
      model: gateway(MODEL),
      system: 'You write concise, warm social media captions. Return exactly three lines in this order: caption, hashtags, call to action. Do not use labels, markdown, or extra commentary.',
      prompt: `Create a social post about: ${topic}`,
    })

    return NextResponse.json(parseCaption(result.text))
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    console.error('[v0] Gemini caption generation failed:', error)
    const billingError = /credit card|billing|free credits/i.test(message)
    const configurationError = /api.?key|authentication|unauthorized|credential|gateway|token|401|403/i.test(message)
    const fallback = `A thoughtful take on ${topic} — made to start a conversation and bring your audience along.`
    const hashtags = topic.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => `#${word.replace(/[^a-z0-9]/gi, '')}`).join(' ') || '#northstarsocial'
    return NextResponse.json({
      caption: fallback,
      hashtags,
      cta: 'What do you think? Share your perspective below.',
      fallback: true,
    })
  }
}

export const runtime = 'edge'
