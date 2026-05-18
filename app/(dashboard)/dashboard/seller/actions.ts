'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function submitSellerApplication(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const shop_name = formData.get('shop_name') as string;
  const business_category = formData.get('business_category') as string;
  const description = formData.get('description') as string;
  const whatsapp = formData.get('whatsapp') as string;
  const address = formData.get('address') as string;
  const reason = formData.get('reason') as string;

  if (!shop_name || !whatsapp || !address) {
    return { error: 'Mohon lengkapi semua field yang wajib' };
  }

  const { error } = await supabase
    .from('seller_applications')
    .insert({
      user_id: user.id,
      shop_name,
      business_category,
      description,
      whatsapp,
      address,
      reason,
      status: 'pending'
    });

  if (error) {
    if (error.code === '23505') { // unique violation
      return { error: 'Anda sudah pernah mengajukan buka toko.' };
    }
    return { error: 'Gagal mengirim pengajuan: ' + error.message };
  }

  redirect('/dashboard/seller');
}

export async function updateSellerApplicationStatus(applicationId: string, newStatus: 'approved' | 'rejected') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('seller_applications')
    .update({ 
      status: newStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', applicationId);

  if (error) {
    return { error: 'Gagal memperbarui status: ' + error.message };
  }

  return { success: true };
}
