import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

const MODEL = 'gemini-2.5-flash'

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

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini key is missing at runtime. Add the key value to GEMINI_API_KEY in Project Settings → Vars, then restart the preview.' }, { status: 503 })
    }
    const model = google(MODEL, { apiKey: geminiApiKey })
    const result = await generateText({
      model,
      system: 'You are Northstar Social’s expert content strategist. Generate a specific, polished social media post from the user’s idea. Return exactly three lines in this order: caption, hashtags, call to action. Do not use labels, markdown, generic filler, or mention that you are AI.',
      prompt: `Write a thoughtful, informative social post about this idea. Match the clarity and specificity of a strong product description, not a vague motivational caption:\n\n${topic}`,
    })

    const parsed = parseCaption(result.text)
    if (!parsed.caption) throw new Error('Gemini returned an empty caption.')
    return NextResponse.json(parsed)
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    console.error('[v0] Gemini caption generation failed:', error)
    const safeMessage = message.replace(/AIza[\w-]+/gi, '[redacted]').slice(0, 240)
    return NextResponse.json({
      error: `Gemini generation failed: ${safeMessage || 'The AI service did not return a response.'}`,
    }, { status: 502 })
  }
}

export const runtime = 'edge'
