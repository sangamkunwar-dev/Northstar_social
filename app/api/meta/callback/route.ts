import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const META_APP_ID = process.env.META_APP_ID || '1604738994727607'
const META_APP_SECRET = process.env.META_APP_SECRET
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/meta/callback`

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const returnedState = requestUrl.searchParams.get('state')
  const oauthCookie = request.headers.get('cookie')?.match(/(?:^|; )meta_oauth_state=([^;]*)/)?.[1]
  const [savedState, channel] = decodeURIComponent(oauthCookie || ':').split(':')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const redirect = new URL('/', requestUrl.origin)
  redirect.searchParams.set('meta', 'error')

  if (!user || !code || !returnedState || returnedState !== savedState || !channel || !META_APP_SECRET) return NextResponse.redirect(redirect)

  try {
    const tokenResponse = await fetch(`https://graph.facebook.com/v23.0/oauth/access_token?client_id=${encodeURIComponent(META_APP_ID)}&client_secret=${encodeURIComponent(META_APP_SECRET)}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&code=${encodeURIComponent(code)}`)
    const token = await tokenResponse.json()
    if (!token.access_token) throw new Error('Token exchange failed')
    const pagesResponse = await fetch(`https://graph.facebook.com/v23.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(token.access_token)}`)
    const pages = await pagesResponse.json()
    const page = pages.data?.[0]
    if (!page) throw new Error('No Facebook Page found')
    const rows = [{ user_id: user.id, provider: 'facebook', account_name: page.name, account_handle: page.id, connected: true }, ...(page.instagram_business_account ? [{ user_id: user.id, provider: 'instagram', account_name: page.name, account_handle: page.instagram_business_account.id, connected: true }] : [])]
    const { error } = await supabase.from('social_connections').upsert(rows, { onConflict: 'user_id,provider' })
    if (error) throw error
    redirect.searchParams.set('meta', 'connected')
    redirect.searchParams.set('channel', channel)
  } catch {
    // Keep provider tokens server-side only; never expose them in the browser URL.
  }
  const response = NextResponse.redirect(redirect)
  response.cookies.delete('meta_oauth_state')
  return response
}
