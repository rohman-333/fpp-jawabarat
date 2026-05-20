import { createClient } from '@/lib/supabase/client';

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_POST_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface ProgressPayload {
  progress: number;
  stage: string;
  loaded?: number;
  total?: number;
}

export function validateImageFile(file: File, type: 'logo' | 'photo' | 'avatar' | 'product' | 'post'): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Tipe file tidak didukung. Gunakan JPG, PNG, atau WEBP.';
  }

  const maxSize = (type === 'photo' || type === 'product' || type === 'post') ? MAX_PHOTO_SIZE : MAX_LOGO_SIZE;
  if (file.size > maxSize) {
    return `Ukuran file terlalu besar. Maksimal ${maxSize / (1024 * 1024)}MB.`;
  }

  return null;
}

export async function uploadFileToBucket(
  bucket: string,
  file: File,
  userId: string
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const fileName = `${Date.now()}-${randomStr}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error(`Upload error (${bucket}):`, uploadError.message);
      return { url: null, error: 'Gagal mengunggah gambar. ' + uploadError.message };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return { url: data.publicUrl, error: null };
  } catch (err: any) {
    console.error(`Upload exception (${bucket}):`, err.message);
    return { url: null, error: 'Terjadi kesalahan sistem saat mengunggah gambar.' };
  }
}

export async function uploadPesantrenLogo(file: File, userId: string) {
  const validationError = validateImageFile(file, 'logo');
  if (validationError) return { url: null, error: validationError };
  return uploadFileToBucket('pesantren_logos', file, userId);
}

export async function uploadPesantrenPhoto(file: File, userId: string) {
  const validationError = validateImageFile(file, 'photo');
  if (validationError) return { url: null, error: validationError };
  return uploadFileToBucket('pesantren_photos', file, userId);
}

export async function uploadAvatar(file: File, userId: string) {
  const validationError = validateImageFile(file, 'avatar');
  if (validationError) return { url: null, error: validationError };
  return uploadFileToBucket('avatars', file, userId);
}

export async function uploadProductImage(file: File, userId: string) {
  const validationError = validateImageFile(file, 'product');
  if (validationError) return { url: null, error: validationError };
  return uploadFileToBucket('product_images', file, userId);
}

export async function uploadPostImage(file: File, userId: string) {
  const validationError = validateImageFile(file, 'post');
  if (validationError) return { url: null, error: validationError };
  return uploadFileToBucket('post_images', file, userId);
}

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export function validateVideoFile(file: File): string | null {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return 'Tipe video tidak didukung. Gunakan MP4, WEBM, atau Quicktime.';
  }
  if (file.size > 50 * 1024 * 1024) {
    return `Ukuran video terlalu besar. Maksimal 50MB.`;
  }
  return null;
}

export async function uploadSocialImage(file: File, userId: string) {
  const validationError = validateImageFile(file, 'post');
  if (validationError) return { url: null, error: validationError };
  return uploadFileToBucket('social_images', file, userId);
}

export async function uploadSocialVideo(file: File, userId: string) {
  const validationError = validateVideoFile(file);
  if (validationError) return { url: null, error: validationError };
  return uploadFileToBucket('social_videos', file, userId);
}

// Robust fallback progress controller helper
export function createUploadProgressController(options: {
  onProgress: (payload: ProgressPayload) => void;
  min?: number;
  maxBeforeComplete?: number;
  stage?: string;
  tag?: string; // e.g. FEED or STATUS for logs
  id?: string;
}) {
  const { onProgress, min = 25, maxBeforeComplete = 85, stage = 'upload_progress', tag = 'UPLOAD', id = '' } = options;
  let currentProgress = min;
  let lastProgressUpdateTime = Date.now();
  let timer: NodeJS.Timeout | null = null;
  let completed = false;

  const report = (progress: number, overrideStage?: string, loaded?: number, total?: number) => {
    currentProgress = progress;
    lastProgressUpdateTime = Date.now();
    onProgress({
      progress,
      stage: overrideStage || stage,
      loaded,
      total
    });
  };

  const startFallbackTimer = () => {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (completed) {
        if (timer) clearInterval(timer);
        return;
      }
      
      const timeSinceLastUpdate = Date.now() - lastProgressUpdateTime;
      if (timeSinceLastUpdate >= 2000 && currentProgress < maxBeforeComplete) {
        const nextProgress = Math.min(currentProgress + 5, maxBeforeComplete);
        console.log(`[${tag}_PROGRESS_FALLBACK_TICK] ${id} progress fallback incremented from ${currentProgress} to ${nextProgress}`);
        report(nextProgress, stage);
      }
    }, 1000);
  };

  const handleXHRProgress = (loaded: number, total: number) => {
    const percent = total > 0 ? (loaded / total) : 0;
    const mapped = min + Math.round(percent * (maxBeforeComplete - min));
    if (mapped > currentProgress && mapped <= maxBeforeComplete) {
      report(mapped, stage, loaded, total);
    }
  };

  const stop = () => {
    completed = true;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  return {
    report,
    handleXHRProgress,
    startFallbackTimer,
    stop,
    getCurrentProgress: () => currentProgress
  };
}

export async function uploadFileToBucketWithProgress(
  bucket: string,
  file: File,
  userId: string,
  onProgress?: (payload: ProgressPayload) => void,
  logTag: string = 'UPLOAD',
  postIdOrStoryId: string = ''
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const fileName = `${Date.now()}-${randomStr}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`;
    
    return new Promise((resolve) => {
      const progressController = createUploadProgressController({
        onProgress: onProgress || (() => {}),
        min: 25,
        maxBeforeComplete: 85,
        stage: 'upload_progress',
        tag: logTag,
        id: postIdOrStoryId
      });

      // 1. Mark upload started and kick off fallback timer
      console.log(`[${logTag}_PROGRESS_STAGE] ${postIdOrStoryId} stage=upload_started progress=25`);
      progressController.report(25, 'upload_started');
      progressController.startFallbackTimer();

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('apikey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      xhr.setRequestHeader('Content-Type', file.type);
      
      // XHR upload progress hookup prior to calling send()
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const loaded = event.loaded;
          const total = event.total;
          const pct = Math.round((loaded / total) * 100);
          console.log(`[${logTag}_XHR_PROGRESS] ${postIdOrStoryId} loaded=${loaded} total=${total} progress=${pct}`);
          progressController.handleXHRProgress(loaded, total);
        } else {
          // If length is not computable, trigger fallback tick manually
          const current = progressController.getCurrentProgress();
          const next = Math.min(current + 5, 85);
          console.log(`[${logTag}_XHR_PROGRESS_NON_COMPUTABLE] ${postIdOrStoryId} incrementing progress to ${next}`);
          progressController.report(next, 'upload_progress');
        }
      };

      xhr.onload = () => {
        progressController.stop();
        if (xhr.status >= 200 && xhr.status < 300) {
          const publicUrl = supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
          console.log(`[${logTag}_UPLOAD_DONE] ${postIdOrStoryId} url=${publicUrl}`);
          
          if (onProgress) {
            onProgress({ progress: 92, stage: 'upload_finishing' });
          }
          resolve({ url: publicUrl, error: null });
        } else {
          console.error(`[${logTag}_UPLOAD_ERROR]`, xhr.status, xhr.responseText);
          resolve({ url: null, error: `Gagal mengunggah (${xhr.status})` });
        }
      };

      xhr.onerror = () => {
        progressController.stop();
        console.error(`[${logTag}_UPLOAD_NETWORK_ERROR] ${postIdOrStoryId}`);
        resolve({ url: null, error: 'Koneksi gagal saat mengunggah' });
      };

      xhr.send(file);
    });
  } catch (err: any) {
    console.error(`[${logTag}_UPLOAD_EXCEPTION] ${postIdOrStoryId}`, err);
    return { url: null, error: 'Terjadi kesalahan saat mengunggah: ' + err.message };
  }
}

export async function uploadPostImageWithProgress(
  file: File, 
  userId: string, 
  onProgress?: (payload: ProgressPayload) => void,
  postId: string = ''
) {
  const validationError = validateImageFile(file, 'post');
  if (validationError) return { url: null, error: validationError };
  return uploadFileToBucketWithProgress('post_images', file, userId, onProgress, 'FEED', postId);
}

export async function uploadSocialVideoWithProgress(
  file: File, 
  userId: string, 
  onProgress?: (payload: ProgressPayload) => void,
  postId: string = ''
) {
  if (file.size > 50 * 1024 * 1024) {
    return { url: null, error: 'Video terlalu besar. Maksimal 50MB.' };
  }
  return uploadFileToBucketWithProgress('social_videos', file, userId, onProgress, 'FEED', postId);
}
