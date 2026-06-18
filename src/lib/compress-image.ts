export async function compressImage(file: File, maxSizeMB = 1): Promise<File> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  // If the file is already smaller than the max size, return it as is
  if (file.size <= maxSizeBytes) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimensions to avoid memory issues and help with compression
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1920;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Attempt compression
        let quality = 0.9;
        const targetMimeType = 'image/jpeg'; // JPEG provides better compression than PNG
        
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas to Blob failed'));
                return;
              }
              
              if (blob.size <= maxSizeBytes || quality <= 0.3) {
                // Return the compressed file
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                  type: targetMimeType,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                // If still too large, reduce quality and try again
                quality -= 0.15;
                tryCompress();
              }
            },
            targetMimeType,
            quality
          );
        };

        tryCompress();
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}
