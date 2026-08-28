import { NextResponse } from 'next/server'

const META_APP_ID = process.env.META_APP_ID || '1604738994727607'
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/meta/callback`

export async function GET(request: Request) {
  const url = new URL(request.url)
  const channel = url.searchParams.get('channel')
  if (channel !== 'facebook' && channel !== 'instagram') return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
  const state = crypto.randomUUID()
  const response = NextResponse.redirect(`https://www.facebook.com/v23.0/dialog/oauth?client_id=${encodeURIComponent(META_APP_ID)}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent('pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish')}`)
  response.cookies.set('meta_oauth_state', `${state}:${channel}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 600, path: '/' })
  return response
}
