'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error, data: authData } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  // Redirect based on role
  let redirectUrl = '/feed';
  
  if (authData?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    if (profile) {
      redirectUrl = '/feed';
    }
  }

  revalidatePath('/', 'layout')
  redirect(redirectUrl)
}

export async function register(formData: FormData) {
  const supabase = await createClient()
  
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (password !== confirmPassword) {
    redirect('/register?error=Passwords do not match')
  }

  const data = {
    email: formData.get('email') as string,
    password: password,
    options: {
      data: {
        name: formData.get('name') as string,
        role: 'user'
      }
    }
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/register?error=Could not create account')
  }

  revalidatePath('/', 'layout')
  redirect('/feed')
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
