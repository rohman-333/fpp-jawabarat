'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/lib/notifications/createNotification'

export async function submitCourierApplication(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const full_name = formData.get('full_name') as string;
  const whatsapp = formData.get('whatsapp') as string;
  const service_area = formData.get('service_area') as string;
  const vehicle_type = formData.get('vehicle_type') as string;
  const license_plate = formData.get('license_plate') as string;
  const experience = formData.get('experience') as string;

  if (!full_name || !whatsapp || !service_area || !vehicle_type) {
    return { error: 'Mohon lengkapi semua field yang wajib' };
  }

  const { error } = await supabase
    .from('courier_applications')
    .insert({
      user_id: user.id,
      full_name,
      whatsapp,
      service_area,
      vehicle_type,
      license_plate: license_plate || null,
      experience: experience || null,
      status: 'pending'
    });

  if (error) {
    if (error.code === '23505') { // unique violation
      return { error: 'Anda sudah pernah melamar menjadi kurir.' };
    }
    return { error: 'Gagal mengirim pengajuan: ' + error.message };
  }

  revalidatePath('/dashboard/courier');
  redirect('/dashboard/courier');
}

export async function updateCourierApplicationStatus(formData: FormData) {
  const applicationId = formData.get('id') as string;
  const newStatus = formData.get('status') as string;
  const rejectionReason = formData.get('rejection_reason') as string;

  if (!applicationId || !newStatus) {
    return { error: 'Data tidak lengkap' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin' && profile.role !== 'team')) {
    return { error: 'Akses ditolak' };
  }

  const payload: any = { 
    status: newStatus,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString()
  };

  if (newStatus === 'rejected') {
    payload.rejection_reason = rejectionReason;
  } else {
    payload.rejection_reason = null;
  }

  // Fetch applicant user_id for notification
  const { data: application } = await supabase
    .from('courier_applications')
    .select('user_id')
    .eq('id', applicationId)
    .single();

  const { error } = await supabase
    .from('courier_applications')
    .update(payload)
    .eq('id', applicationId);

  if (error) {
    return { error: 'Gagal memperbarui status: ' + error.message };
  }

  // Send notification to applicant
  if (application?.user_id) {
    try {
      if (newStatus === 'approved') {
        await createNotification({
          userId: application.user_id,
          actorId: user.id,
          type: 'courier_approved',
          title: 'Lamaran Kurir Disetujui 🎉',
          body: 'Selamat! Lamaran kurir Anda telah disetujui. Siap menerima pesanan sekarang.',
          href: '/dashboard/courier',
        });
      } else {
        await createNotification({
          userId: application.user_id,
          actorId: user.id,
          type: 'courier_rejected',
          title: 'Lamaran Kurir Ditolak',
          body: rejectionReason || 'Lamaran kurir Anda belum dapat disetujui saat ini.',
          href: '/dashboard/courier',
        });
      }
    } catch (notifErr) {
      console.error('[COURIER_APPROVAL_NOTIF_ERROR]', notifErr);
    }
  }

  revalidatePath('/admin/courier-applications');
  return { success: true };
}
