import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  const searchParams = requestUrl.searchParams
  const code = searchParams.get('code')
  
  const type = searchParams.get('type')
  
  // if "next" is in param, use it as the redirect URL
  // if type is recovery, default to /auth/reset-password
  let next = searchParams.get('next')
  if (!next) {
    if (type === 'recovery') {
      next = '/auth/reset-password'
    } else {
      next = '/'
    }
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // If next is /auth/reset-password, skip checking profile and redirect there directly
      if (next === '/auth/reset-password') {
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }

      // Fetch user profile to determine role and redirect accordingly
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

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
