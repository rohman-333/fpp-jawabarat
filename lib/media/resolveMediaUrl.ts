/**
 * Helper to resolve media URLs, especially for legacy migrated data.
 * If the URL is already an absolute HTTP/HTTPS URL, it returns it as is.
 * If the URL is just a filename (e.g., from old PHP system), it prepends the NEXT_PUBLIC_LEGACY_UPLOADS_BASE_URL.
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Clean up any accidental whitespace
  const cleanUrl = url.trim();
  
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_LEGACY_UPLOADS_BASE_URL;
  if (!baseUrl) {
    // If no base URL is configured, we can't reliably resolve relative legacy paths
    return null;
  }
  
  // Ensure we don't have double slashes if baseUrl ends with / and cleanUrl starts with /
  const separator = baseUrl.endsWith('/') || cleanUrl.startsWith('/') ? '' : '/';
  
  return `${baseUrl}${separator}${cleanUrl}`;
}
