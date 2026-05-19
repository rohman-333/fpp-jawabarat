'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function changePassword(prevState: any, formData: FormData) {
  try {
    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!currentPassword) {
      return { error: 'Password saat ini wajib diisi.' }
    }
    
    if (!newPassword || newPassword.length < 8) {
      return { error: 'Password baru minimal 8 karakter.' }
    }
    
    if (newPassword !== confirmPassword) {
      return { error: 'Konfirmasi password tidak sama.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return { error: 'Sesi login tidak ditemukan.' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('must_change_password, password_changed_at, legacy_import_id')
      .eq('id', user.id)
      .single()

    const isLegacy = profile?.must_change_password === true || 
                     profile?.password_changed_at === null || 
                     profile?.legacy_import_id !== null

    if (isLegacy) {
      const supabaseAdmin = await import('@/lib/supabase/admin').then(m => m.getSupabaseAdmin())
      if (!supabaseAdmin) {
        return { error: 'Reset password migrasi belum dikonfigurasi server.' }
      }

      // 3. Update password directly via Admin API
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { 
        password: newPassword 
      })

      if (updateError) {
        console.error('[CHANGE_PASSWORD_ERROR_ADMIN]', updateError)
        return { error: `Gagal mengganti password: ${updateError.message}` }
      }
    } else {
      // 7. Verifikasi password lama dulu (normal user)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        return { error: 'Password saat ini salah.' }
      }

      // 8. Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        console.error('[CHANGE_PASSWORD_ERROR]', updateError)
        return { error: `Gagal mengganti password: ${updateError.message}` }
      }
    }

    // 9. Update profiles safely
    // Ignore error if column doesn't exist yet, but try to update both
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        must_change_password: false,
        password_changed_at: new Date().toISOString()
      })
      .eq('id', user.id)
      
    if (profileError) {
      // Just fallback to updating only password_changed_at if must_change_password fails
      await supabase
        .from('profiles')
        .update({ 
          password_changed_at: new Date().toISOString()
        })
        .eq('id', user.id)
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/security')

    return { success: true, message: 'Password berhasil diganti.' }

  } catch (err: any) {
    console.error('[CHANGE_PASSWORD_ERROR]', err)
    return { error: 'Terjadi kesalahan sistem.' }
  }
}
