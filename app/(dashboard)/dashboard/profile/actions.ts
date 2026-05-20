'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function saveProfile(formData: FormData) {
  console.log('[PROFILE_SAVE_START]');
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Sesi telah berakhir. Silakan login ulang.', profile: null };
  }

  const instagram = formData.get('instagram') as string;
  const facebook = formData.get('facebook') as string;
  const tiktok = formData.get('tiktok') as string;

  const social_links = {
    ...(instagram && { instagram }),
    ...(facebook && { facebook }),
    ...(tiktok && { tiktok }),
  };

  const payload = {
    name: formData.get('name') as string,
    avatar_url: formData.get('avatar_url') as string || null,
    cover_url: formData.get('cover_url') as string || null,
    bio: formData.get('bio') as string || null,
    location: formData.get('location') as string || null,
    website: formData.get('website') as string || null,
    birth_date: formData.get('birth_date') as string || null,
    phone: formData.get('phone') as string || null,
    social_links,
    profile_completed: true,
  };

  try {
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select('id, name, username, avatar_url, cover_url, bio, location, website, birth_date, phone, social_links, role, profile_completed, email')
      .single();

    if (error) {
      console.error('[PROFILE_SAVE_FAILED]', error.message);
      return { success: false, error: 'Gagal menyimpan profil: ' + error.message, profile: null };
    }

    console.log('[PROFILE_SAVE_SUCCESS]', user.id);

    revalidatePath('/dashboard', 'layout');
    revalidatePath('/admin', 'layout');
    revalidatePath('/dashboard/profile');

    return { success: true, error: null, profile: updatedProfile };
  } catch (err: any) {
    console.error('[PROFILE_SAVE_FAILED]', err);
    return { success: false, error: 'Terjadi kesalahan internal.', profile: null };
  }
}
