'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
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

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', user.id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard', 'layout');
  revalidatePath('/admin', 'layout');
  revalidatePath('/dashboard/profile');
}
