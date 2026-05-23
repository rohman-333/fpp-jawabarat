'use server';

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// Helper to check if email exists in legacy users.csv
// TODO: Jangan bergantung penuh pada migration/data/users.csv untuk production jangka panjang.
// Buat tabel legacy_user_imports di database dan sinkronisasi datanya di sana agar lebih scalable.
function getLegacyEmails(): string[] {
  try {
    const csvPath = path.join(process.cwd(), 'migration', 'data', 'users.csv');
    if (!fs.existsSync(csvPath)) return [];
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const records = parse(csvContent, { columns: true, skip_empty_lines: true, relax_quotes: true });
    return records.map((r: any) => r.email?.toLowerCase().trim()).filter(Boolean);
  } catch (e) {
    console.error('Error reading legacy users CSV:', e);
    return [];
  }
}

/**
 * Flow 1: Activate legacy migrated account
 */
export async function activateLegacyAccount(email: string) {
  try {
    const cleanedEmail = email.toLowerCase().trim();
    if (!cleanedEmail) {
      return { success: false, error: 'Email wajib diisi.' };
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return { success: false, error: 'Admin database connection error.' };
    }

    // Fetch all auth.users using admin client
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('[ACTIVATE_LIST_USERS_ERROR]', listError);
      return { success: false, error: 'Terjadi kesalahan sistem. Coba lagi nanti.' };
    }

    const userExistsInAuth = users.some(u => u.email?.toLowerCase() === cleanedEmail);

    if (userExistsInAuth) {
      // Send reset password email via public client
      const supabase = await createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(cleanedEmail);
      if (error) {
        console.error('[ACTIVATE_RESET_PASSWORD_ERROR]', error);
        return { success: false, error: 'Gagal mengirim email aktivasi: ' + error.message };
      }
      return { success: true, message: 'Jika email terdaftar, tautan aktivasi akan dikirim.' };
    }

    // Check legacy CSV
    const legacyEmails = getLegacyEmails();
    const isLegacyOnly = legacyEmails.includes(cleanedEmail);

    if (isLegacyOnly) {
      return { 
        success: false, 
        error: 'Akun Anda terdaftar di sistem lama tetapi belum dipindahkan. Silakan hubungi admin untuk bantuan aktivasi.' 
      };
    }

    // Default safe response (implicit)
    return { success: true, message: 'Jika email terdaftar, tautan aktivasi akan dikirim.' };

  } catch (err: any) {
    console.error('[ACTIVATE_LEGACY_EXCEPTION]', err);
    return { success: false, error: 'Terjadi kesalahan internal.' };
  }
}

/**
 * Flow 2: Forgot password
 */
export async function forgotPassword(email: string) {
  try {
    const cleanedEmail = email.toLowerCase().trim();
    if (!cleanedEmail) {
      return { success: false, error: 'Email wajib diisi.' };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(cleanedEmail);
    
    if (error) {
      console.error('[FORGOT_PASSWORD_ERROR]', error);
      return { success: false, error: 'Gagal mengirim link reset password: ' + error.message };
    }

    return { success: true, message: 'Jika email terdaftar, tautan reset password akan dikirim.' };
  } catch (err: any) {
    console.error('[FORGOT_PASSWORD_EXCEPTION]', err);
    return { success: false, error: 'Terjadi kesalahan internal.' };
  }
}

/**
 * Flow 3: Reset password
 */
export async function resetPassword(password: string) {
  try {
    if (!password || password.length < 6) {
      return { success: false, error: 'Password minimal 6 karakter.' };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error('[RESET_PASSWORD_ERROR]', error);
      return { success: false, error: 'Gagal memperbarui password: ' + error.message };
    }

    return { success: true, message: 'Password Anda berhasil diperbarui.' };
  } catch (err: any) {
    console.error('[RESET_PASSWORD_EXCEPTION]', err);
    return { success: false, error: 'Terjadi kesalahan internal.' };
  }
}

/**
 * Flow 4: Get Auth Migration Stats (Admin Only)
 */
export async function getAuthMigrationStats() {
  try {
    const supabase = await createClient();
    
    // Check if current user is admin/superadmin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['superadmin', 'admin'].includes(profile.role)) {
      return { success: false, error: 'Unauthorized: Admin role required' };
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return { success: false, error: 'Admin database connection error.' };
    }

    // Fetch all profiles from public.profiles
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, name, role, account_type, status, legacy_user_id, phone, username, created_at');

    if (pError) {
      console.error('[STATS_PROFILES_ERROR]', pError);
      return { success: false, error: 'Gagal mengambil data profiles: ' + pError.message };
    }

    // Fetch all auth.users using admin client
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
      console.error('[STATS_AUTH_USERS_ERROR]', authError);
      return { success: false, error: 'Gagal mengambil data auth users: ' + authError.message };
    }

    // Left Join memory computation
    const joined = profiles.map(p => {
      const au = users.find(u => u.id === p.id);
      return {
        ...p,
        auth_email: au?.email || null,
        auth_id: au?.id || null,
        last_sign_in: au?.last_sign_in_at || null
      };
    });

    const totalProfiles = profiles.length;
    const totalAuthUsers = users.length;
    const profilesWithAuth = joined.filter(j => j.auth_id !== null).length;
    const profilesWithoutAuth = joined.filter(j => j.auth_id === null).length;
    const authUsersWithLocalEmail = users.filter(u => u.email?.endsWith('.local')).map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at
    }));

    return {
      success: true,
      stats: {
        totalProfiles,
        totalAuthUsers,
        profilesWithAuth,
        profilesWithoutAuth,
        localEmailCount: authUsersWithLocalEmail.length
      },
      profiles: joined,
      localUsers: authUsersWithLocalEmail
    };
  } catch (err: any) {
    console.error('[GET_STATS_EXCEPTION]', err);
    return { success: false, error: 'Terjadi kesalahan internal.' };
  }
}

/**
 * Flow 5: Send reset password email (Admin trigger)
 */
export async function sendResetPasswordAdmin(userId: string, email: string) {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['superadmin', 'admin'].includes(profile.role)) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return { success: false, error: 'Admin connection error' };

    // Generate link for password reset
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (error) {
      console.error('[ADMIN_GENERATE_LINK_ERROR]', error);
      return { success: false, error: 'Gagal membuat tautan reset: ' + error.message };
    }

    const isSuperAdmin = profile.role === 'superadmin';

    return { 
      success: true, 
      message: `Tautan reset berhasil dibuat. Email pemulihan telah dikirim oleh Supabase.`,
      recoveryLink: isSuperAdmin ? (data.properties?.action_link || null) : null
    };
  } catch (err: any) {
    console.error('[SEND_RESET_ADMIN_EXCEPTION]', err);
    return { success: false, error: 'Terjadi kesalahan internal.' };
  }
}

/**
 * Flow 6: Update email for legacy user (Admin trigger)
 */
export async function updateLegacyEmailAdmin(userId: string, newEmail: string) {
  try {
    const cleanEmail = newEmail.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Email baru tidak valid.' };
    }

    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['superadmin', 'admin'].includes(profile.role)) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return { success: false, error: 'Admin connection error' };

    // Update the email address and confirm immediately to bypass verify loop
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { 
        email: cleanEmail,
        email_confirm: true 
      }
    );

    if (error) {
      console.error('[ADMIN_UPDATE_EMAIL_ERROR]', error);
      return { success: false, error: 'Gagal memperbarui email: ' + error.message };
    }

    return { success: true, message: 'Email akun berhasil diperbarui dan diverifikasi.' };
  } catch (err: any) {
    console.error('[UPDATE_EMAIL_ADMIN_EXCEPTION]', err);
    return { success: false, error: 'Terjadi kesalahan internal.' };
  }
}
