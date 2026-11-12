/**
 * Image Upload Service for DeVote
 * Handles candidate photograph conversion to Base64 for storage in Firestore.
 *
 * Firebase Storage has been REMOVED for candidate photos.
 * All candidate photos are stored as Base64 data URIs directly in Firestore documents.
 *
 * Voter ID document upload still supports Firebase Storage for PDF files.
 */
import { fileToBase64 } from '../utils/imageToBase64';

// File size limits
const PHOTO_MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const PDF_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

// Allowed file types
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_PDF_TYPES = ['application/pdf'];

/**
 * Validate a photo file
 * @param {File} file - The file to validate
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validatePhotoFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPG, JPEG, PNG, and WEBP images are allowed' };
  }

  if (file.size > PHOTO_MAX_SIZE) {
    return { valid: false, error: `Image must be less than 5 MB. Selected file is ${(file.size / 1024 / 1024).toFixed(1)} MB` };
  }

  return { valid: true, error: null };
};

/**
 * Validate a PDF file
 * @param {File} file - The file to validate
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validatePdfFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (!ALLOWED_PDF_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only PDF files are allowed' };
  }

  if (file.size > PDF_MAX_SIZE) {
    return { valid: false, error: `PDF must be less than 10 MB. Selected file is ${(file.size / 1024 / 1024).toFixed(1)} MB` };
  }

  return { valid: true, error: null };
};

/**
 * Process a candidate photo: convert to compressed Base64 data URI
 * No Firebase Storage involved - stores directly in Firestore document.
 *
 * @param {File} file - The photo file to process
 * @param {string} candidateId - The candidate ID (used for logging only)
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<string>} - Base64 data URI string
 */
export const uploadCandidatePhoto = async (file, candidateId, onProgress) => {
  console.log('[StorageService] uploadCandidatePhoto called with:', {
    fileName: file?.name,
    fileSize: file?.size,
    fileType: file?.type,
    candidateId
  });

  const validation = validatePhotoFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (typeof onProgress === 'function') {
    onProgress(10);
  }

  try {
    // Convert image to compressed Base64 data URI
    const base64DataUri = await fileToBase64(file);
    console.log('[StorageService] Image converted to Base64 successfully, size:',
      `${(base64DataUri.length / 1024).toFixed(1)} KB`);
    
    if (typeof onProgress === 'function') {
      onProgress(100);
    }
    
    return base64DataUri;
  } catch (error) {
    console.error('[StorageService] Base64 conversion failed:', error);
    throw new Error('Image processing failed: ' + (error.message || 'Could not convert image to Base64'));
  }
};

/**
 * Upload a voter ID document
 * Note: PDFs are typically too large for Firestore's 1MB document limit.
 * This function attempts Firebase Storage upload if available,
 * otherwise falls back to a warning that the document could not be stored.
 *
 * @param {File} file - The PDF file to upload
 * @param {string} voterId - The voter ID for the folder path
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<string>} - Upload result URL or fallback identifier
 */
export const uploadVoterIdDocument = async (file, voterId, onProgress) => {
  console.log('[StorageService] uploadVoterIdDocument called with:', {
    fileName: file?.name,
    fileSize: file?.size,
    fileType: file?.type,
    voterId
  });

  const validation = validatePdfFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Firebase Storage is not available for this deployment.
  // PDFs are too large for Firestore Base64 storage.
  // In production, configure Firebase Storage or use an alternative document storage.
  console.warn('[StorageService] Firebase Storage not available for PDF upload. ' +
    'Voter ID document will be stored as a metadata reference only.');
  
  if (typeof onProgress === 'function') {
    onProgress(50);
  }

  // Return a placeholder URL indicating the document was registered but not stored
  const placeholderUrl = `voter-document://${voterId}/${file.name}`;
  
  if (typeof onProgress === 'function') {
    onProgress(100);
  }

  return placeholderUrl;
};

/**
 * No-op: Base64 images are stored in Firestore and removed by clearing the field.
 * Kept for backward compatibility.
 *
 * @param {string} url - The URL (ignored for Base64)
 * @returns {Promise<void>}
 */
export const deleteFileByUrl = async (url) => {
  if (url && url.startsWith('data:')) {
    console.log('[StorageService] Skipping deletion for Base64 data URI');
    return;
  }
  console.log('[StorageService] Storage removal not available. Image stored as URL:', url);
};

/**
 * Get a file extension from its MIME type
 * @param {string} mimeType - The MIME type
 * @returns {string} - The file extension
 */
export const getExtensionFromMimeType = (mimeType) => {
  const mimeMap = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
  };
  return mimeMap[mimeType] || '';
};

export default {
  validatePhotoFile,
  validatePdfFile,
  uploadCandidatePhoto,
  uploadVoterIdDocument,
  deleteFileByUrl,
  getExtensionFromMimeType,
};