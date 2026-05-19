'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/lib/notifications/createNotification';

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

  const { data: post, error } = await supabase
    .from('social_posts')
    .insert([{
      author_id: user.id,
      content,
      type: type || 'kabar',
      image_url: image_url || null,
      video_url: video_url || null,
      media_type: media_type || 'text',
      status: 'active',
      visibility: 'public'
    }])
    .select('id')
    .single();

  if (error) {
    console.error('[CREATE_POST_ERROR]', error);
    return { success: false, error: error.message };
  }

  // Parse mentions
  if (content) {
    const mentionRegex = /@([a-zA-Z0-9_.-]+)/g;
    const matches = Array.from(content.matchAll(mentionRegex));
    const usernames = matches.map(m => m[1]);

    if (usernames.length > 0) {
      // Find valid users
      const { data: mentionedUsers } = await supabase
        .from('profiles')
        .select('id, username')
        .in('username', usernames);

      if (mentionedUsers && mentionedUsers.length > 0) {
        // Insert to post_mentions
        const mentionPayloads = mentionedUsers.map(u => ({
          post_id: post.id,
          mentioned_user_id: u.id,
          created_by: user.id
        }));
        await supabase.from('post_mentions').insert(mentionPayloads);

        // Fetch author name for notification
        const { data: actor } = await supabase.from('profiles').select('name').eq('id', user.id).single();
        const actorName = actor?.name || 'Seseorang';

        // Notify mentioned users
        for (const u of mentionedUsers) {
          if (u.id === user.id) continue;
          await createNotification({
            userId: u.id,
            actorId: user.id,
            type: 'mention',
            title: `${actorName} menyebut Anda dalam sebuah kiriman`,
            body: content.length > 50 ? content.substring(0, 50) + '...' : content,
            href: `/post/${post.id}`
          });
        }
      }
    }
  }

  revalidatePath('/feed');
  revalidatePath('/');
  return { success: true, post };
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
    
    // Fetch post author to send notification
    const { data: post } = await supabase.from('social_posts').select('author_id, content').eq('id', postId).single();
    if (post && post.author_id !== user.id) {
      const { data: actor } = await supabase.from('profiles').select('name').eq('id', user.id).single();
      const actorName = actor?.name || 'Seseorang';
      
      // Upsert notification or just insert (better insert unique or just insert)
      await createNotification({
        userId: post.author_id,
        actorId: user.id,
        type: 'like',
        title: `${actorName} menyukai kiriman Anda`,
        body: post.content ? (post.content.length > 30 ? post.content.substring(0, 30) + '...' : post.content) : 'Kiriman Anda mendapat suka baru.',
        href: `/post/${postId}`
      });
    }
    
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

  // Notify post author
  const { data: post } = await supabase.from('social_posts').select('author_id').eq('id', postId).single();
  if (post && post.author_id !== user.id) {
    const { data: actor } = await supabase.from('profiles').select('name').eq('id', user.id).single();
    const actorName = actor?.name || 'Seseorang';
    
    await createNotification({
      userId: post.author_id,
      actorId: user.id,
      type: 'comment',
      title: `${actorName} mengomentari kiriman Anda`,
      body: content.length > 50 ? content.substring(0, 50) + '...' : content,
      href: `/post/${postId}`
    });
  }

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
    
    // Notify followed user
    const { data: actor } = await supabase.from('profiles').select('name, username').eq('id', user.id).single();
    const actorName = actor?.name || 'Seseorang';
    
    await createNotification({
      userId: targetUserId,
      actorId: user.id,
      type: 'follow',
      title: `${actorName} mulai mengikuti Anda`,
      body: 'Lihat profil pengikut baru Anda.',
      href: `/u/${actor?.username || user.id}`
    });
    
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

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Check role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'superadmin' || profile?.role === 'admin' || profile?.role === 'team';

  // Check ownership
  const { data: post } = await supabase.from('social_posts').select('author_id').eq('id', postId).single();
  if (!post) return { error: 'Post not found' };

  if (post.author_id !== user.id && !isAdmin) {
    return { error: 'Not authorized' };
  }

  // Soft delete
  const { error } = await supabase
    .from('social_posts')
    .update({ status: 'deleted', deleted_at: new Date().toISOString() })
    .eq('id', postId);

  if (error) return { error: error.message };
  
  revalidatePath('/feed');
  return { success: true };
}

export async function setReaction(postId: string, reactionType: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const validTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry', 'pray'];
  if (!validTypes.includes(reactionType)) {
    return { error: 'Invalid reaction type' };
  }

  // Upsert reaction using onConflict
  const { error } = await supabase
    .from('social_reactions')
    .upsert(
      { post_id: postId, user_id: user.id, reaction_type: reactionType },
      { onConflict: 'post_id, user_id' }
    );

  if (error) return { error: error.message };
  
  // Notify post author
  const { data: post } = await supabase.from('social_posts').select('author_id, content').eq('id', postId).single();
  if (post && post.author_id !== user.id) {
    const { data: actor } = await supabase.from('profiles').select('name').eq('id', user.id).single();
    const actorName = actor?.name || 'Seseorang';
    
    await createNotification({
      userId: post.author_id,
      actorId: user.id,
      type: 'reaction',
      title: `${actorName} bereaksi ${reactionType} pada kiriman Anda`,
      body: post.content ? (post.content.length > 30 ? post.content.substring(0, 30) + '...' : post.content) : 'Kiriman Anda mendapat reaksi baru.',
      href: `/post/${postId}`
    });
  }
  
  // revalidatePath('/feed'); // Soft UI handles this usually, but let's revalidate
  return { success: true, reaction: reactionType };
}

export async function removeReaction(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('social_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function hidePost(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Check role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'superadmin' || profile?.role === 'admin' || profile?.role === 'team';

  if (!isAdmin) {
    // Normal user hides it ONLY for themselves? Actually the prompt says:
    // "Admin/superadmin bisa hide post: - status = 'hidden' - hidden_at = now()"
    // But what does the EyeOff button do for normal users? "Sembunyikan dari Feed". 
    // Ideally this inserts into a social_hidden_posts table for the current user.
    // If it's just a local UI hide, returning success is enough. We won't mutate the global post.
    return { success: true };
  }

  const { error } = await supabase
    .from('social_posts')
    .update({ status: 'hidden', hidden_at: new Date().toISOString() })
    .eq('id', postId);

  if (error) return { error: error.message };
  return { success: true };
}
