/**
 * Utility functions for local image processing and compression.
 * Converts local image files to high-quality, lightweight Base64 Data URLs
 * so they can be stored directly in data.json and never get lost or broken across computers.
 */

export interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  maxSizeMB?: number;
}

/**
 * Processes an image file from the user's computer:
 * 1. Reads the file as a Data URL.
 * 2. Loads into an HTML image.
 * 3. Scales down proportionally if dimensions exceed maxWidth/maxHeight.
 * 4. Compresses into WebP (or JPEG fallback) format.
 * 5. Returns the optimized Base64 data URL string.
 */
export async function processImageFile(
  file: File,
  options: ProcessImageOptions = {}
): Promise<{ dataUrl: string; originalSizeKB: number; compressedSizeKB: number }> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.85,
    maxSizeMB = 15
  } = options;

  if (!file.type.startsWith("image/")) {
    throw new Error("Zəhmət olmasa yalnız şəkil faylı seçin (JPG, PNG, WEBP və s.)");
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`Şəkil həcmi çox böyükdür (Maksimum ${maxSizeMB} MB).`);
  }

  const originalSizeKB = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        return reject(new Error("Şəkil faylı oxuna bilmədi."));
      }

      // If SVG, return as-is (vector doesn't need canvas downscaling)
      if (file.type === "image/svg+xml") {
        return resolve({
          dataUrl: src,
          originalSizeKB,
          compressedSizeKB: originalSizeKB
        });
      }

      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions keeping aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            return resolve({
              dataUrl: src,
              originalSizeKB,
              compressedSizeKB: originalSizeKB
            });
          }

          // Render image on canvas with smooth scaling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          // Prefer WebP for high compression, fallback to JPEG
          let compressedUrl = canvas.toDataURL("image/webp", quality);
          if (!compressedUrl || !compressedUrl.startsWith("data:image/webp")) {
            compressedUrl = canvas.toDataURL("image/jpeg", quality);
          }

          const compressedSizeKB = Math.round((compressedUrl.length * (3 / 4)) / 1024);

          resolve({
            dataUrl: compressedUrl,
            originalSizeKB,
            compressedSizeKB
          });
        } catch (canvasErr) {
          // Fallback to original DataURL if canvas operations fail
          resolve({
            dataUrl: src,
            originalSizeKB,
            compressedSizeKB: originalSizeKB
          });
        }
      };

      img.onerror = () => {
        reject(new Error("Şəkil yüklənərkən xəta baş verdi."));
      };

      img.src = src;
    };

    reader.onerror = () => {
      reject(new Error("Fayl oxunarkən xəta baş verdi."));
    };

    reader.readAsDataURL(file);
  });
}
