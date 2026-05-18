'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function setProductStatus(formData: FormData) {
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;

  if (!id || !status) {
    throw new Error('ID dan status harus diisi');
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'operator')) {
    throw new Error('Akses ditolak.');
  }

  const { error } = await supabase
    .from('products')
    .update({ status })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/marketplace');
  revalidatePath('/marketplace');
}
