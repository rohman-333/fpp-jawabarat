'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function claimInviteLoggedIn(formData: FormData) {
  const token = formData.get('token') as string;
  if (!token) return { error: 'Token tidak ditemukan' };

  const supabase = await createClient();
  
  // Claim invite via postgres function
  const { error: claimError } = await supabase.rpc('claim_team_invite', { p_token: token });

  if (claimError) {
    return { error: 'Gagal mengklaim undangan: ' + claimError.message };
  }

  // Check role to redirect properly
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role === 'admin' || profile?.role === 'superadmin') {
      redirect('/admin');
    }
  }
  
  redirect('/dashboard');
}

export async function acceptInvite(formData: FormData) {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;
  
  if (!token || !password) return { error: 'Data tidak lengkap' };

  const supabase = await createClient();

  // Validate token
  const { data: invite, error: fetchError } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('token', token)
    .single();

  if (fetchError || !invite) {
    return { error: 'Undangan tidak valid atau sudah kedaluwarsa' };
  }

  if (new Date(invite.expires_at) < new Date()) {
    return { error: 'Undangan telah kedaluwarsa' };
  }

  // Attempt to sign up
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: invite.email,
    password: password,
    options: {
      data: {
        name: invite.name
      }
    }
  });

  if (signUpError) {
    if (signUpError.message.includes('User already registered') || signUpError.message.includes('already exists')) {
      return { error: 'Email ini sudah terdaftar. Silakan login terlebih dahulu, lalu buka tautan undangan ini lagi.' };
    }
    return { error: signUpError.message };
  }

  // If email confirmation is required, session will be null
  if (!authData.session) {
    return { error: 'Pendaftaran berhasil, tetapi memerlukan verifikasi email. Silakan cek email Anda, verifikasi, login, lalu buka tautan ini lagi.' };
  }

  // Claim invite via postgres function
  const { error: claimError } = await supabase.rpc('claim_team_invite', { p_token: token });

  if (claimError) {
    return { error: 'Gagal mengklaim undangan: ' + claimError.message };
  }

  if (invite.role === 'admin') {
    redirect('/admin');
  } else {
    redirect('/dashboard');
  }
}
