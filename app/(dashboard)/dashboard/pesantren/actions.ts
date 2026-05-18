'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function savePesantren(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const payload = {
    name: formData.get('name') as string,
    pendiri: formData.get('pendiri') as string,
    pengasuh: formData.get('pengasuh') as string,
    phone: formData.get('phone') as string,
    alamat_desa: formData.get('alamat_desa') as string,
    kecamatan: formData.get('kecamatan') as string,
    tahun_berdiri: parseInt(formData.get('tahun_berdiri') as string) || null,
    jenis_pesantren: formData.get('jenis_pesantren') as string,
    program_unggulan: formData.get('program_unggulan') as string,
    potensi_ekonomi: formData.get('potensi_ekonomi') as string,
    kebutuhan_utama: formData.get('kebutuhan_utama') as string,
    minat_digital_ai: formData.get('minat_digital_ai') as string,
    logo_url: formData.get('logo_url') as string || null,
    foto_url: formData.get('foto_url') as string || null,
    profile_id: user.id
  };

  // Check if pesantren already exists for this user
  const { data: existing } = await supabase
    .from('pesantren')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  let pesantrenId = existing?.id;

  if (existing) {
    // Update
    const { error } = await supabase
      .from('pesantren')
      .update(payload)
      .eq('id', existing.id);
    
    if (error) throw new Error(error.message);
  } else {
    // Insert
    const { data, error } = await supabase
      .from('pesantren')
      .insert([payload])
      .select('id')
      .single();
      
    if (error) throw new Error(error.message);
    pesantrenId = data.id;

    // Update profile
    await supabase
      .from('profiles')
      .update({ pesantren_id: pesantrenId })
      .eq('id', user.id);
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pesantren');
  redirect('/dashboard/pesantren');
}
