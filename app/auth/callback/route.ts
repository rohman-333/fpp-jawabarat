import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  const searchParams = requestUrl.searchParams
  const code = searchParams.get('code')
  
  // if "next" is in param, use it as the redirect URL, defaulting to /auth/reset-password
  const next = searchParams.get('next') || '/auth/reset-password'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // If it is a recovery flow (reset-password), redirect to next directly without profile/role checks
      if (next.startsWith('/auth/reset-password')) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Fetch user profile to determine role and redirect accordingly (for other flows like email confirmation)
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
      console.error('[AUTH_CALLBACK_EXCHANGE_FAILED]', error)
      return NextResponse.redirect(`${origin}/auth/forgot-password?error=token_invalid`)
    }
  }

  // If there's no code, redirect to forgot-password with token_invalid error
  return NextResponse.redirect(`${origin}/auth/forgot-password?error=token_invalid`)
}
