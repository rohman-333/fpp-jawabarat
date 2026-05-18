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
