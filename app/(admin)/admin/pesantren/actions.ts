'use server'
import { canAccessAdmin } from '@/lib/auth/roles';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function setPesantrenStatus(formData: FormData) {
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

  if (!profile || (!canAccessAdmin(profile))) {
    throw new Error('Akses ditolak. Anda bukan admin atau operator.');
  }

  const payload: any = { 
    status,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString()
  };

  if (status === 'rejected') {
    payload.rejection_reason = formData.get('rejection_reason') as string;
  } else {
    payload.rejection_reason = null;
  }

  const { error } = await supabase
    .from('pesantren')
    .update(payload)
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/pesantren');
  revalidatePath('/admin');
  revalidatePath('/pesantren');
}
