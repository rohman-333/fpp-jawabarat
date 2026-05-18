'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function submitSellerApplication(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const store_name = formData.get('shop_name') as string;
  const category = formData.get('business_category') as string;
  const description = formData.get('description') as string;
  const whatsapp = formData.get('whatsapp') as string;
  const address = formData.get('address') as string;
  const reason = formData.get('reason') as string;

  if (!store_name || !whatsapp || !address) {
    return { error: 'Mohon lengkapi semua field yang wajib' };
  }

  const { error } = await supabase
    .from('seller_applications')
    .insert({
      user_id: user.id,
      applicant_email: user.email,
      store_name,
      category,
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

  await supabase
    .from('profiles')
    .update({ seller_status: 'pending' })
    .eq('id', user.id);

  redirect('/dashboard/seller');
}

export async function updateSellerApplicationStatus(applicationId: string, newStatus: 'approved' | 'rejected') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: 'Not authenticated' };

  const isFallback = applicationId.startsWith('fallback-');
  let realApplicationId = applicationId;
  let targetUserId = null;

  if (isFallback) {
    targetUserId = applicationId.replace('fallback-', '');
    // Insert into seller_applications first to have a record
    const { data: newApp, error: insertError } = await supabase
      .from('seller_applications')
      .insert({
        user_id: targetUserId,
        store_name: 'Toko FPP',
        applicant_email: null,
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .select('id')
      .single();
      
    if (insertError) return { error: 'Failed to create fallback application record' };
    realApplicationId = newApp.id;
  } else {
    const { data: application, error: fetchError } = await supabase
      .from('seller_applications')
      .select('user_id')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) return { error: 'Application not found' };
    targetUserId = application.user_id;

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
  }

  await supabase
    .from('profiles')
    .update({ 
      is_seller: newStatus === 'approved',
      seller_status: newStatus 
    })
    .eq('id', targetUserId);

  return { success: true };
}
