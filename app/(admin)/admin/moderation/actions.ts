'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'superadmin', 'team'].includes(profile.role)) {
    return null;
  }
  
  return { supabase, user };
}

export async function updateReportStatus(reportId: string, status: string) {
  const admin = await checkAdmin();
  if (!admin) return { error: 'Not authorized' };

  const { error } = await admin.supabase
    .from('post_reports')
    .update({ 
      status, 
      reviewed_by: admin.user.id, 
      reviewed_at: new Date().toISOString() 
    })
    .eq('id', reportId);

  if (error) return { error: error.message };
  revalidatePath('/admin/moderation');
  return { success: true };
}

export async function hideReportedPost(postId: string, reportId: string) {
  const admin = await checkAdmin();
  if (!admin) return { error: 'Not authorized' };

  // Hide the post
  const { error: postError } = await admin.supabase
    .from('social_posts')
    .update({ status: 'hidden' })
    .eq('id', postId);

  if (postError) return { error: postError.message };

  // Update report status
  await admin.supabase
    .from('post_reports')
    .update({ 
      status: 'resolved', 
      reviewed_by: admin.user.id, 
      reviewed_at: new Date().toISOString() 
    })
    .eq('id', reportId);

  revalidatePath('/admin/moderation');
  revalidatePath('/feed');
  return { success: true };
}

export async function deleteReportedPost(postId: string, reportId: string) {
  const admin = await checkAdmin();
  if (!admin) return { error: 'Not authorized' };

  // Delete the post
  const { error: postError } = await admin.supabase
    .from('social_posts')
    .delete()
    .eq('id', postId);

  if (postError) return { error: postError.message };

  // Update report status
  await admin.supabase
    .from('post_reports')
    .update({ 
      status: 'resolved', 
      reviewed_by: admin.user.id, 
      reviewed_at: new Date().toISOString() 
    })
    .eq('id', reportId);

  revalidatePath('/admin/moderation');
  revalidatePath('/feed');
  return { success: true };
}
