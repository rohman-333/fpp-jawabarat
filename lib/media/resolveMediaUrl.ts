/**
 * Helper to resolve media URLs, especially for legacy migrated data.
 * 
 * Resolution strategy:
 * 1. If null/empty → return null
 * 2. If already http/https URL → return as-is
 * 3. If starts with / → return as-is (local public path)
 * 4. If has LEGACY_UPLOADS_BASE_URL → prepend it
 * 5. If looks like a Supabase storage path (bucket/filename) → construct storage URL
 * 6. If just a filename (file_xxx.jpg) → try Supabase storage public URL with bucket fallback
 * 7. Otherwise → return null
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const LEGACY_BASE = process.env.NEXT_PUBLIC_LEGACY_UPLOADS_BASE_URL || '';

export const FALLBACK_IMAGE = '/branding/logo-square.png';
export const FALLBACK_COVER = '/branding/logo.png';

// Common Supabase Storage buckets to try for bare filenames
const STORAGE_BUCKETS = ['media', 'pesantren', 'avatars', 'covers', 'products', 'uploads'];

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Clean up any accidental whitespace
  const cleanUrl = url.trim();
  if (!cleanUrl) return null;
  
  // Already a full URL
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }
  
  // Local public asset path
  if (cleanUrl.startsWith('/')) {
    return cleanUrl;
  }
  
  // Try legacy uploads base URL first
  if (LEGACY_BASE) {
    const separator = LEGACY_BASE.endsWith('/') || cleanUrl.startsWith('/') ? '' : '/';
    return `${LEGACY_BASE}${separator}${cleanUrl}`;
  }
  
  // Try Supabase Storage public URL
  if (SUPABASE_URL) {
    // If it has a slash, assume it's "bucket/path"
    if (cleanUrl.includes('/')) {
      return `${SUPABASE_URL}/storage/v1/object/public/${cleanUrl}`;
    }
    
    // Just a filename — try in the "media" bucket as default
    // For legacy filenames like file_xxx.jpg, try 'media' bucket first
    return `${SUPABASE_URL}/storage/v1/object/public/media/${cleanUrl}`;
  }
  
  // Cannot resolve
  return null;
}

/**
 * Get a resolved URL with automatic fallback if source is empty/null
 */
export function resolveMediaUrlWithFallback(
  url: string | null | undefined, 
  fallback: string = FALLBACK_IMAGE
): string {
  return resolveMediaUrl(url) || fallback;
}

/**
 * Generate multiple candidate URLs for a media file to try as fallbacks.
 * Useful for <img> onError handlers to try different buckets.
 */
export function getMediaCandidates(url: string | null | undefined): string[] {
  if (!url) return [FALLBACK_IMAGE];
  
  const cleanUrl = url.trim();
  if (!cleanUrl) return [FALLBACK_IMAGE];
  
  // If already a full URL or local path, just return it + fallback
  if (cleanUrl.startsWith('http') || cleanUrl.startsWith('/')) {
    return [cleanUrl, FALLBACK_IMAGE];
  }
  
  if (!SUPABASE_URL) return [FALLBACK_IMAGE];
  
  const candidates: string[] = [];
  
  // If has slash, it's bucket/path already
  if (cleanUrl.includes('/')) {
    candidates.push(`${SUPABASE_URL}/storage/v1/object/public/${cleanUrl}`);
  } else {
    // Try each bucket for bare filenames like file_xxx.jpg
    for (const bucket of STORAGE_BUCKETS) {
      candidates.push(`${SUPABASE_URL}/storage/v1/object/public/${bucket}/${cleanUrl}`);
    }
  }
  
  // Always end with fallback
  candidates.push(FALLBACK_IMAGE);
  return candidates;
}
