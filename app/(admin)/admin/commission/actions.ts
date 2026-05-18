'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateCommissionSetting(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'superadmin', 'team'].includes(profile.role)) return { error: 'Forbidden' };

  const type = formData.get('commission_type') as string;
  const rate = parseFloat(formData.get('percentage_rate') as string) || 0;
  const fixed = parseFloat(formData.get('fixed_amount') as string) || 0;

  // Deactivate old settings
  await supabase.from('platform_commission_settings').update({ is_active: false }).eq('is_active', true);

  // Insert new
  const { error } = await supabase.from('platform_commission_settings').insert({
    commission_type: type,
    percentage_rate: rate,
    fixed_amount: fixed,
    is_active: true
  });

  if (error) throw error;
  revalidatePath('/admin/commission');
  return { success: true };
}
