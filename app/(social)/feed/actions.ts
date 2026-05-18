'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  const content = formData.get('content') as string;
  const type = formData.get('type') as string;
  const image_url = formData.get('image_url') as string;
  const video_url = formData.get('video_url') as string;
  const media_type = formData.get('media_type') as string;

  if (!content && !image_url && !video_url) {
    return { error: 'Content or media is required' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('social_posts')
    .insert([{
      author_id: user.id,
      content,
      type: type || 'kabar',
      image_url: image_url || null,
      video_url: video_url || null,
      media_type: media_type || 'text',
    }]);

  if (error) return { error: error.message };
  return { success: true };
}

export async function toggleLike(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Check if liked
  const { data: existing } = await supabase
    .from('social_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    // Unlike
    const { error } = await supabase.from('social_likes').delete().eq('id', existing.id);
    if (error) return { error: error.message };
    return { liked: false };
  } else {
    // Like
    const { error } = await supabase.from('social_likes').insert([{ post_id: postId, user_id: user.id }]);
    if (error) return { error: error.message };
    return { liked: true };
  }
}

export async function createComment(postId: string, content: string) {
  if (!content.trim()) return { error: 'Komentar tidak boleh kosong' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error, data } = await supabase
    .from('social_comments')
    .insert([{ post_id: postId, author_id: user.id, content }])
    .select('*, profiles:author_id(name, avatar_url, role, account_type, is_verified)')
    .single();

  if (error) return { error: error.message };
  return { success: true, comment: data };
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('social_comments').delete().eq('id', commentId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function toggleFollow(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  if (user.id === targetUserId) return { error: 'Cannot follow yourself' };

  const { data: existing } = await supabase
    .from('social_follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .single();

  if (existing) {
    const { error } = await supabase.from('social_follows').delete().eq('id', existing.id);
    if (error) return { error: error.message };
    return { following: false };
  } else {
    const { error } = await supabase.from('social_follows').insert([{ follower_id: user.id, following_id: targetUserId }]);
    if (error) return { error: error.message };
    return { following: true };
  }
}

export async function toggleSave(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: existing } = await supabase
    .from('social_saves')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    const { error } = await supabase.from('social_saves').delete().eq('id', existing.id);
    if (error) return { error: error.message };
    return { saved: false };
  } else {
    const { error } = await supabase.from('social_saves').insert([{ post_id: postId, user_id: user.id }]);
    if (error) return { error: error.message };
    return { saved: true };
  }
}
