import { createClient } from '@/lib/supabase/client';

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_POST_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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
  
  // Safe filename: userId/timestamp-random.ext
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

const MAX_VIDEO_SIZE = 30 * 1024 * 1024; // 30MB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export function validateVideoFile(file: File): string | null {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return 'Tipe video tidak didukung. Gunakan MP4, WEBM, atau Quicktime.';
  }
  if (file.size > MAX_VIDEO_SIZE) {
    return `Ukuran video terlalu besar. Maksimal 30MB.`;
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

export async function uploadFileToBucketWithProgress(
  bucket: string,
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
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
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('apikey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      xhr.setRequestHeader('Content-Type', file.type);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const publicUrl = supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
          resolve({ url: publicUrl, error: null });
        } else {
          console.error('[XHR_UPLOAD_ERROR]', xhr.status, xhr.responseText);
          resolve({ url: null, error: `Gagal mengunggah (${xhr.status})` });
        }
      };

      xhr.onerror = () => {
        console.error('[XHR_UPLOAD_NETWORK_ERROR]');
        resolve({ url: null, error: 'Koneksi gagal saat mengunggah' });
      };

      xhr.send(file);
    });
  } catch (err: any) {
    console.error('[XHR_UPLOAD_EXCEPTION]', err);
    return { url: null, error: 'Terjadi kesalahan saat mengunggah: ' + err.message };
  }
}

export async function uploadPostImageWithProgress(file: File, userId: string, onProgress?: (progress: number) => void) {
  const validationError = validateImageFile(file, 'post');
  if (validationError) return { url: null, error: validationError };
  return uploadFileToBucketWithProgress('post_images', file, userId, onProgress);
}

export async function uploadSocialVideoWithProgress(file: File, userId: string, onProgress?: (progress: number) => void) {
  // Max 50MB for video posting
  if (file.size > 50 * 1024 * 1024) {
    return { url: null, error: 'Video terlalu besar. Maksimal 50MB / 60 detik untuk versi awal.' };
  }
  return uploadFileToBucketWithProgress('social_videos', file, userId, onProgress);
}

