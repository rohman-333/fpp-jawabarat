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
    }
  }

  // If there's an error or no code, redirect to forgot-password with token_invalid error
  return NextResponse.redirect(`${origin}/auth/forgot-password?error=token_invalid`)
}
