export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
  onProgress?: (progress: number, stage: string) => void;
}

export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.75,
    mimeType = 'image/jpeg',
    onProgress
  } = options;

  // Rule 1: Skip compression if file <= 1.5MB
  if (file.size <= 1.5 * 1024 * 1024) {
    console.log('[IMAGE_COMPRESS_SKIPPED] File size is <= 1.5MB:', (file.size / (1024 * 1024)).toFixed(2), 'MB');
    if (onProgress) {
      onProgress(18, 'image_compress_skipped');
    }
    return file;
  }

  // Rule 2: Start compression
  console.log('[IMAGE_COMPRESS_START] Original size:', (file.size / (1024 * 1024)).toFixed(2), 'MB');
  if (onProgress) {
    onProgress(20, 'compressing_image');
  }

  return new Promise((resolve) => {
    // Rule 4: Fallback to original file if compression takes > 4 seconds
    const timeoutId = setTimeout(() => {
      console.warn('[IMAGE_COMPRESS_TIMEOUT] Compression took > 4 seconds, falling back to original');
      if (onProgress) {
        onProgress(25, 'image_compress_timeout_fallback');
      }
      resolve(file);
    }, 4000);

    let objectUrl: string | null = null;
    try {
      objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = objectUrl;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          clearTimeout(timeoutId);
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          if (onProgress) {
            onProgress(25, 'image_compress_failed');
          }
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            clearTimeout(timeoutId);
            if (objectUrl) URL.revokeObjectURL(objectUrl);

            if (blob) {
              const extension = blob.type === 'image/webp' ? '.webp' : '.jpg';
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + extension, {
                type: blob.type,
                lastModified: Date.now(),
              });

              console.log('[IMAGE_COMPRESS_DONE] New size:', (compressedFile.size / (1024 * 1024)).toFixed(2), 'MB');
              
              // Rule 3: Compression complete
              if (onProgress) {
                onProgress(25, 'image_compress_done');
              }

              if (compressedFile.size > file.size) {
                resolve(file);
              } else {
                resolve(compressedFile);
              }
            } else {
              if (onProgress) {
                onProgress(25, 'image_compress_failed');
              }
              resolve(file);
            }
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        if (onProgress) {
          onProgress(25, 'image_compress_failed');
        }
        resolve(file);
      };
    } catch (err) {
      console.error('[IMAGE_COMPRESS_EXCEPTION]', err);
      clearTimeout(timeoutId);
      if (objectUrl) {
        try { URL.revokeObjectURL(objectUrl); } catch (e) {}
      }
      if (onProgress) {
        onProgress(25, 'image_compress_failed');
      }
      resolve(file);
    }
  });
}
