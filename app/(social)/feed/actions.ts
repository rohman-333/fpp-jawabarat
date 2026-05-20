'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/lib/notifications/createNotification';

export async function createPost(formData: FormData) {
  try {
    const content = formData.get('content') as string;
    const type = formData.get('type') as string;
    const image_url = formData.get('image_url') as string;
    const video_url = formData.get('video_url') as string;
    const media_type = formData.get('media_type') as string;

    if (!content && !image_url && !video_url) {
      return { success: false, error: 'Konten atau media diperlukan', debugCode: 'FEED_EMPTY_CONTENT' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Anda belum login. Silakan login kembali.', debugCode: 'FEED_NOT_AUTHENTICATED' };

    const basePayload = {
      author_id: user.id,
      content,
      type: type || 'kabar',
      image_url: image_url || null,
      video_url: video_url || null,
      media_type: media_type || 'text',
      status: 'active',
      visibility: 'public'
    };

    let post: any = null;
    let dbError: any = null;

    try {
      // First, try inserting with media_url column (if 052 migration is applied)
      const { data, error } = await supabase
        .from('social_posts')
        .insert([{
          ...basePayload,
          media_url: image_url || video_url || null
        }])
        .select(`
          id, content, type, image_url, video_url, media_type, media_url, author_id, product_id,
          visibility, status, created_at, updated_at
        `)
        .single();
      
      post = data;
      dbError = error;
    } catch (e: any) {
      dbError = e;
    }

    // Fallback: If insertion failed due to missing media_url column, insert without it
    if (dbError && (dbError.message?.includes('media_url') || dbError.code === '42703')) {
      console.log('[FEED_CREATE_POST_FALLBACK] media_url column not present, inserting legacy columns only.');
      const { data, error } = await supabase
        .from('social_posts')
        .insert([basePayload])
        .select(`
          id, content, type, image_url, video_url, media_type, author_id, product_id,
          visibility, status, created_at, updated_at
        `)
        .single();
      
      post = data;
      dbError = error;
    }

    if (dbError || !post) {
      console.error('[FEED_CREATE_POST_ERROR]', dbError?.message || 'No post data returned', dbError?.code);
      return { success: false, error: 'Gagal menyimpan postingan. Silakan coba lagi.', debugCode: 'FEED_INSERT_FAILED' };
    }

    // Fetch author profile to complete the response
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url, role, has_pesantren, is_seller, seller_status, is_courier, courier_status, team_division, is_verified, followers:social_follows!social_follows_following_id_fkey(count)')
      .eq('id', user.id)
      .single();

    const fullPost = {
      ...post,
      author: authorProfile || {
        id: user.id,
        name: user.user_metadata?.name || 'Pengguna',
        username: user.user_metadata?.username || 'pengguna',
        avatar_url: user.user_metadata?.avatar_url || null,
        role: 'member'
      },
      likes_count: [{ count: 0 }],
      reactions: [],
      comments_count: [{ count: 0 }],
      has_liked: false,
      has_saved: false,
      author_followed: false,
      my_reaction: null
    };

    // Parse mentions (best-effort, don't fail post if this errors)
    try {
      if (content) {
        const mentionRegex = /@([a-zA-Z0-9_.-]+)/g;
        const matches = Array.from(content.matchAll(mentionRegex));
        const usernames = matches.map(m => m[1]);

        if (usernames.length > 0) {
          const { data: mentionedUsers } = await supabase
            .from('profiles')
            .select('id, username')
            .in('username', usernames);

          if (mentionedUsers && mentionedUsers.length > 0) {
            const mentionPayloads = mentionedUsers.map(u => ({
              post_id: post.id,
              mentioned_user_id: u.id,
              created_by: user.id
            }));
            await supabase.from('post_mentions').insert(mentionPayloads);

            const { data: actor } = await supabase.from('profiles').select('name').eq('id', user.id).single();
            const actorName = actor?.name || 'Seseorang';

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
    } catch (mentionErr) {
      console.error('[FEED_MENTION_ERROR]', mentionErr);
      // Don't fail the entire post creation
    }

    revalidatePath('/feed');
    revalidatePath('/');
    return { success: true, post: fullPost };

  } catch (err: any) {
    console.error('[FEED_CREATE_POST_EXCEPTION]', err);
    return { success: false, error: 'Terjadi kesalahan server. Silakan coba lagi.', debugCode: 'FEED_SERVER_EXCEPTION' };
  }
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

export async function createPostDraft(formData: FormData) {
  try {
    const content = formData.get('content') as string;
    const type = formData.get('type') as string;
    const media_type = formData.get('media_type') as string;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Anda belum login. Silakan login kembali.', debugCode: 'FEED_NOT_AUTHENTICATED' };

    const basePayload = {
      author_id: user.id,
      content: content || '',
      type: type || 'kabar',
      media_type: media_type || 'text',
      status: 'uploading',
      visibility: 'public'
    };

    let post: any = null;
    let dbError: any = null;

    try {
      const { data, error } = await supabase
        .from('social_posts')
        .insert([{
          ...basePayload,
          media_url: null,
          image_url: null,
          video_url: null
        }])
        .select(`
          id, content, type, image_url, video_url, media_type, media_url, author_id, product_id,
          visibility, status, created_at, updated_at
        `)
        .single();
      post = data;
      dbError = error;
    } catch (e: any) {
      dbError = e;
    }

    if (dbError && (dbError.message?.includes('media_url') || dbError.code === '42703')) {
      const { data, error } = await supabase
        .from('social_posts')
        .insert([basePayload])
        .select(`
          id, content, type, image_url, video_url, media_type, author_id, product_id,
          visibility, status, created_at, updated_at
        `)
        .single();
      post = data;
      dbError = error;
    }

    if (dbError || !post) {
      console.error('[FEED_CREATE_DRAFT_ERROR]', dbError);
      return { success: false, error: 'Gagal menyimpan draft postingan.' };
    }

    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url, role, has_pesantren, is_seller, seller_status, is_courier, courier_status, team_division, is_verified')
      .eq('id', user.id)
      .single();

    const fullPost = {
      ...post,
      author: authorProfile || {
        id: user.id,
        name: user.user_metadata?.name || 'Pengguna',
        username: user.user_metadata?.username || 'pengguna',
        avatar_url: user.user_metadata?.avatar_url || null,
        role: 'member'
      },
      likes_count: [{ count: 0 }],
      reactions: [],
      comments_count: [{ count: 0 }],
      has_liked: false,
      has_saved: false,
      author_followed: false,
      my_reaction: null
    };

    return { success: true, post: fullPost };
  } catch (err) {
    console.error('[FEED_CREATE_DRAFT_EXCEPTION]', err);
    return { success: false, error: 'Terjadi kesalahan internal.' };
  }
}

export async function finalizePostMedia(postId: string, mediaData: { image_url?: string; video_url?: string; media_url?: string; media_type: string }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Check ownership
    const { data: postCheck } = await supabase.from('social_posts').select('author_id, content').eq('id', postId).single();
    if (!postCheck || postCheck.author_id !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const updatePayload: any = {
      status: 'active',
      media_type: mediaData.media_type,
      image_url: mediaData.image_url || null,
      video_url: mediaData.video_url || null
    };

    let post: any = null;
    let dbError: any = null;

    try {
      const { data, error } = await supabase
        .from('social_posts')
        .update({
          ...updatePayload,
          media_url: mediaData.media_url || mediaData.image_url || mediaData.video_url || null
        })
        .eq('id', postId)
        .select(`
          id, content, type, image_url, video_url, media_type, media_url, author_id, product_id,
          visibility, status, created_at, updated_at
        `)
        .single();
      post = data;
      dbError = error;
    } catch (e) {
      dbError = e;
    }

    if (dbError && (dbError.message?.includes('media_url') || dbError.code === '42703')) {
      const { data, error } = await supabase
        .from('social_posts')
        .update(updatePayload)
        .eq('id', postId)
        .select(`
          id, content, type, image_url, video_url, media_type, author_id, product_id,
          visibility, status, created_at, updated_at
        `)
        .single();
      post = data;
      dbError = error;
    }

    if (dbError || !post) {
      console.error('[FEED_FINALIZE_ERROR]', dbError);
      return { success: false, error: 'Gagal menyelesaikan postingan.' };
    }

    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url, role, has_pesantren, is_seller, seller_status, is_courier, courier_status, team_division, is_verified')
      .eq('id', user.id)
      .single();

    const fullPost = {
      ...post,
      author: authorProfile || {
        id: user.id,
        name: user.user_metadata?.name || 'Pengguna',
        username: user.user_metadata?.username || 'pengguna',
        avatar_url: user.user_metadata?.avatar_url || null,
        role: 'member'
      },
      likes_count: [{ count: 0 }],
      reactions: [],
      comments_count: [{ count: 0 }],
      has_liked: false,
      has_saved: false,
      author_followed: false,
      my_reaction: null
    };

    // Parse mentions (best-effort, don't fail post if this errors)
    try {
      const content = postCheck.content;
      if (content) {
        const mentionRegex = /@([a-zA-Z0-9_.-]+)/g;
        const matches = Array.from(content.matchAll(mentionRegex));
        const usernames = matches.map((m: any) => m[1]);

        if (usernames.length > 0) {
          const { data: mentionedUsers } = await supabase
            .from('profiles')
            .select('id, username')
            .in('username', usernames);

          if (mentionedUsers && mentionedUsers.length > 0) {
            const mentionPayloads = mentionedUsers.map(u => ({
              post_id: post.id,
              mentioned_user_id: u.id,
              created_by: user.id
            }));
            await supabase.from('post_mentions').insert(mentionPayloads);

            const { data: actor } = await supabase.from('profiles').select('name').eq('id', user.id).single();
            const actorName = actor?.name || 'Seseorang';

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
    } catch (mentionErr) {
      console.error('[FEED_MENTION_ERROR]', mentionErr);
    }

    revalidatePath('/feed');
    revalidatePath('/');
    return { success: true, post: fullPost };
  } catch (err) {
    console.error('[FEED_FINALIZE_EXCEPTION]', err);
    return { success: false, error: 'Terjadi kesalahan internal.' };
  }
}

export async function markPostUploadFailed(postId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
      .from('social_posts')
      .update({ status: 'upload_failed' })
      .eq('id', postId)
      .eq('author_id', user.id);

    if (error) {
      console.error('[MARK_FAILED_ERROR]', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('[MARK_FAILED_EXCEPTION]', err);
    return { success: false, error: 'Terjadi kesalahan internal.' };
  }
}

export async function createStoryDraft(content: string, mediaType: string, durationHours: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + durationHours);

    const { data: story, error } = await supabase
      .from('social_stories')
      .insert({
        author_id: user.id,
        content: content || '',
        media_type: mediaType || 'text',
        expires_at: expiresAt.toISOString(),
        status: 'uploading',
        upload_status: 'uploading',
        visibility: 'public'
      })
      .select('*, author:author_id(name, avatar_url, username)')
      .single();

    if (error || !story) {
      console.error('[CREATE_STORY_DRAFT_ERROR]', error);
      return { success: false, error: 'Gagal membuat draft status.' };
    }

    return { success: true, story };
  } catch (err) {
    console.error('[CREATE_STORY_DRAFT_EXCEPTION]', err);
    return { success: false, error: 'Terjadi kesalahan internal.' };
  }
}

export async function finalizeStoryMedia(storyId: string, mediaData: { image_url?: string; video_url?: string; media_url?: string; media_type: string }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: story, error } = await supabase
      .from('social_stories')
      .update({
        media_url: mediaData.media_url || mediaData.image_url || mediaData.video_url || null,
        image_url: mediaData.image_url || null,
        video_url: mediaData.video_url || null,
        media_type: mediaData.media_type,
        status: 'active',
        upload_status: 'completed'
      })
      .eq('id', storyId)
      .eq('author_id', user.id)
      .select('*, author:author_id(name, avatar_url, username)')
      .single();

    if (error || !story) {
      console.error('[FINALIZE_STORY_ERROR]', error);
      return { success: false, error: 'Gagal merilis status.' };
    }

    return { success: true, story };
  } catch (err) {
    console.error('[FINALIZE_STORY_EXCEPTION]', err);
    return { success: false, error: 'Terjadi kesalahan internal.' };
  }
}

export async function markStoryUploadFailed(storyId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
      .from('social_stories')
      .update({
        status: 'upload_failed',
        upload_status: 'failed'
      })
      .eq('id', storyId)
      .eq('author_id', user.id);

    if (error) {
      console.error('[MARK_STORY_FAILED_ERROR]', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('[MARK_STORY_FAILED_EXCEPTION]', err);
    return { success: false, error: 'Terjadi kesalahan internal.' };
  }
}

