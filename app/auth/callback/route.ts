import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  const searchParams = requestUrl.searchParams
  const code = searchParams.get('code')
  
  // if "next" is in param, use it as the redirect URL, default to /auth/reset-password
  const next = searchParams.get('next') || '/auth/reset-password'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // If next is /auth/reset-password, skip checking profile and redirect there directly
      if (next === '/auth/reset-password' || next.startsWith('/auth/reset-password')) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Fetch user profile to determine role and redirect accordingly (for other flows)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile) {
          const role = profile.role
          if (role && next === '/') {
            return NextResponse.redirect(`${origin}/feed`)
          }
        }
      }

      // fallback
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('[AUTH_CALLBACK_EXCHANGE_FAILED]', {
        message: error.message,
        code: error.code,
        status: error.status,
        next,
        hasCode: Boolean(code)
      })
      return NextResponse.redirect(`${origin}/auth/forgot-password?error=token_invalid`)
    }
  }

  // Support implicit/hash flow when type=recovery (which exists only on client hash)
  return new NextResponse(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authenticating...</title>
    </head>
    <body>
      <script>
        if (window.location.hash) {
          const hash = window.location.hash;
          const params = new URLSearchParams(hash.slice(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const type = params.get('type');
          if (accessToken && refreshToken && type === 'recovery') {
            window.location.replace('${origin}/auth/reset-password' + hash);
          } else {
            window.location.replace('${origin}/auth/forgot-password?error=token_invalid');
          }
        } else {
          window.location.replace('${origin}/auth/forgot-password?error=token_invalid');
        }
      </script>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  })
}
