/**
 * Image to Base64 conversion utility
 * Resizes/compresses images and converts them to Base64 data URIs
 * Used as a fallback when Firebase Storage is unavailable
 */

const MAX_IMAGE_WIDTH = 400;
const MAX_IMAGE_HEIGHT = 400;
const JPEG_QUALITY = 0.7; // 70% quality for JPEG compression
const MAX_BASE64_SIZE = 500 * 1024; // 500 KB max for Base64 string (roughly 375 KB raw)

/**
 * Convert a File object to a Base64 data URI string
 * Resizes the image if it exceeds maximum dimensions
 * Compresses JPEG images to reduce size
 * @param {File} file - The image file to convert
 * @returns {Promise<string>} - Base64 data URI string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const result = await resizeAndCompressImage(event.target.result, file.type);
        resolve(result);
      } catch (err) {
        // If compression fails, return the original (may be large but functional)
        console.warn('[imageToBase64] Compression failed, using original:', err.message);
        resolve(event.target.result);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Resize and compress an image from a data URI
 * @param {string} dataUri - The original data URI
 * @param {string} mimeType - The MIME type of the image
 * @returns {Promise<string>} - Compressed data URI
 */
const resizeAndCompressImage = (dataUri, mimeType) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
          const ratio = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Determine output format
        // Convert PNG to JPEG for smaller size (if no transparency detected)
        let outputType = mimeType;
        let quality = JPEG_QUALITY;
        
        // For PNG, try JPEG if it's not too large (transparency will be lost)
        if (mimeType === 'image/png' || mimeType === 'image/webp') {
          // Try JPEG first for better compression
          outputType = 'image/jpeg';
        }
        
        // Get compressed data URI
        let compressedDataUri = canvas.toDataURL(outputType, quality);
        
        // If still too large, reduce quality further
        let attempts = 0;
        while (compressedDataUri.length > MAX_BASE64_SIZE && quality > 0.1 && attempts < 5) {
          quality -= 0.15;
          compressedDataUri = canvas.toDataURL(outputType, Math.max(quality, 0.1));
          attempts++;
        }
        
        // If still too large after quality reduction, reduce dimensions
        if (compressedDataUri.length > MAX_BASE64_SIZE) {
          const scaleFactor = Math.sqrt(MAX_BASE64_SIZE / compressedDataUri.length) * 0.9;
          const newWidth = Math.round(width * scaleFactor);
          const newHeight = Math.round(height * scaleFactor);
          
          canvas.width = newWidth;
          canvas.height = newHeight;
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          compressedDataUri = canvas.toDataURL(outputType, 0.5);
        }
        
        console.log('[imageToBase64] Image compressed:', {
          originalSize: `${(dataUri.length / 1024).toFixed(1)} KB`,
          compressedSize: `${(compressedDataUri.length / 1024).toFixed(1)} KB`,
          dimensions: `${width}x${height}`,
          type: outputType,
        });
        
        resolve(compressedDataUri);
      } catch (err) {
        reject(err);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
    
    img.src = dataUri;
  });
};

/**
 * Check if a string is a Base64 data URI
 * @param {string} str - The string to check
 * @returns {boolean} - Whether the string is a data URI
 */
export const isBase64Image = (str) => {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('data:image/');
};

/**
 * Get the approximate size of a Base64 image in KB
 * @param {string} base64Str - The Base64 data URI
 * @returns {number} - Size in KB
 */
export const getBase64ImageSizeKB = (base64Str) => {
  if (!base64Str) return 0;
  // Remove data URI prefix to get just the Base64 data
  const base64Data = base64Str.split(',')[1] || base64Str;
  return Math.round((base64Data.length * 0.75) / 1024);
};

const imageToBase64 = {
  fileToBase64,
  isBase64Image,
  getBase64ImageSizeKB,
};

export default imageToBase64;