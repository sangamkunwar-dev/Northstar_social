import { gateway } from '@ai-sdk/gateway'
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

    // Use the Vercel AI Gateway for Gemini. It handles preview authentication securely.
    const model = gateway('google/gemini-2.5-flash')
    const result = await generateText({
      model,
      system: 'You are Northstar Social’s expert content strategist. Generate a specific, polished social media post from the user’s idea. Return exactly three lines in this order: caption, hashtags, call to action. Do not use labels, markdown, generic filler, or mention that you are AI.',
      prompt: `Write a thoughtful, informative social post about this idea. Match the clarity and specificity of a strong product description, not a vague motivational caption:\n\n${topic}`,
    })

    const parsed = parseCaption(result.text)
    if (!parsed.caption) throw new Error('Gemini returned an empty caption.')
    return NextResponse.json({ ...parsed, fallback: false })
  } catch (error) {
    const words = topic.split(/\s+/).filter(Boolean).slice(0, 5).map((word) => `#${word.replace(/[^a-z0-9]/gi, '')}`).join(' ') || '#northstarsocial'
    return NextResponse.json({ caption: `${topic.charAt(0).toUpperCase()}${topic.slice(1)} — shaped into a clear, thoughtful story for your audience.`, hashtags: words, cta: 'What would you add? Share your perspective below.', fallback: true })
  }
}


export const runtime = 'edge'
