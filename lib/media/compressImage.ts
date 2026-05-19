export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.75,
    mimeType = 'image/webp'
  } = options;

  // Don't compress GIFs or very small images (e.g. < 500KB)
  if (file.type === 'image/gif' || file.size < 500 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
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
          resolve(file); // Fallback to original if canvas fails
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const targetMime = mimeType;
        // Compress
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // WebP support detection via canvas fallback:
              // If requested mimeType is image/webp but browser returned image/png (standard fallback),
              // we manually compress to image/jpeg instead to avoid large PNG files.
              if (targetMime === 'image/webp' && blob.type !== 'image/webp') {
                canvas.toBlob(
                  (jpegBlob) => {
                    if (jpegBlob) {
                      const compressedFile = new File([jpegBlob], file.name.replace(/\.[^/.]+$/, "") + '.jpg', {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                      });
                      resolve(compressedFile.size > file.size ? file : compressedFile);
                    } else {
                      resolve(file);
                    }
                  },
                  'image/jpeg',
                  quality
                );
                return;
              }

              const extension = blob.type === 'image/webp' ? '.webp' : blob.type === 'image/jpeg' ? '.jpg' : '.png';
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + extension, {
                type: blob.type,
                lastModified: Date.now(),
              });
              
              // If compressed size is somehow larger, return original
              if (compressedFile.size > file.size) {
                resolve(file);
              } else {
                resolve(compressedFile);
              }
            } else {
              resolve(file); // Fallback
            }
          },
          targetMime,
          quality
        );
      };
      img.onerror = () => {
        resolve(file); // Fallback on error
      };
    };
    reader.onerror = () => {
      resolve(file); // Fallback on error
    };
  });
}
