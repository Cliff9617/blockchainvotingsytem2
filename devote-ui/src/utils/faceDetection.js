/**
 * Face Detection Utility
 * Uses @vladmandic/face-api for lightweight browser-based face detection
 */

import * as faceapi from '@vladmandic/face-api';

const FACE_API_BASE_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

let modelsLoaded = false;
let loadPromise = null;

/**
 * Load face detection models
 * Returns true if models loaded successfully, false otherwise
 */
export const loadFaceDetectionModels = async () => {
  if (modelsLoaded) {
    return true;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      console.log('Loading face detection models...');
      
      await faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_BASE_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(FACE_API_BASE_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(FACE_API_BASE_URL);
      
      modelsLoaded = true;
      console.log('Face detection model loaded');
      return true;
    } catch (error) {
      console.error('Failed to load face detection models:', error);
      return false;
    }
  })();

  return loadPromise;
};

/**
 * Check if face detection models are loaded
 */
export const isFaceDetectionAvailable = () => modelsLoaded;

/**
 * Detect face in an image or video element
 * @param {HTMLImageElement|HTMLVideoElement} element - The element to detect face in
 * @returns {Promise<Object|null>} - Detection result or null if no face found
 */
export const detectFace = async (element) => {
  if (!modelsLoaded) {
    return null;
  }

  try {
    const detection = await faceapi
      .detectSingleFace(element, new faceapi.TinyFaceDetectorOptions({ 
        inputSize: 320, 
        scoreThreshold: 0.5 
      }))
      .withFaceLandmarks();

    if (detection) {
      console.log('Face detected:', {
        box: detection.detection.box,
        landmarks: detection.landmarks ? 'loaded' : 'none'
      });
    }

    return detection || null;
  } catch (error) {
    console.error('Face detection error:', error);
    return null;
  }
};

/**
 * Check if face is properly positioned for capture
 * @param {Object} detection - Face detection result
 * @param {number} videoWidth - Video element width
 * @param {number} videoHeight - Video element height
 * @param {number} ovalWidth - Guide oval width
 * @param {number} ovalHeight - Guide oval height
 * @returns {Object} - Position check result with guidance message
 */
export const checkFacePosition = (detection, videoWidth, videoHeight, ovalWidth, ovalHeight) => {
  if (!detection) {
    return {
      isValid: false,
      message: 'Position your face inside the oval',
      issues: ['no_face']
    };
  }

  const issues = [];
  const box = detection.detection.box;
  
  // Calculate face center
  const faceCenterX = box.x + box.width / 2;
  const faceCenterY = box.y + box.height / 2;
  
  // Calculate oval center (assuming oval is centered in video)
  const ovalCenterX = videoWidth / 2;
  const ovalCenterY = videoHeight / 2;
  
  // Calculate face size relative to oval
  const faceSizeRatio = box.width / ovalWidth;
  
  // Check if exactly one face is detected (we're only detecting single face)
  // Check face size (not too small, not too big)
  if (faceSizeRatio < 0.3) {
    issues.push('move_closer');
  } else if (faceSizeRatio > 0.7) {
    issues.push('move_back');
  }
  
  // Check if face is centered (within 20% of oval center)
  const xOffset = Math.abs(faceCenterX - ovalCenterX) / (ovalWidth / 2);
  const yOffset = Math.abs(faceCenterY - ovalCenterY) / (ovalHeight / 2);
  
  if (xOffset > 0.3) {
    issues.push(faceCenterX < ovalCenterX ? 'move_right' : 'move_left');
  }
  
  if (yOffset > 0.3) {
    issues.push(faceCenterY < ovalCenterY ? 'move_down' : 'move_up');
  }
  
  // Check image brightness (simple check using canvas)
  // This would require additional canvas processing, skipping for performance
  
  const isValid = issues.length === 0;
  
  let message = 'Position your face inside the oval';
  if (isValid) {
    message = 'Hold still…';
  } else if (issues.includes('move_closer')) {
    message = 'Move closer';
  } else if (issues.includes('move_back')) {
    message = 'Move back slightly';
  } else if (issues.includes('move_left')) {
    message = 'Move left';
  } else if (issues.includes('move_right')) {
    message = 'Move right';
  } else if (issues.includes('move_up')) {
    message = 'Move up';
  } else if (issues.includes('move_down')) {
    message = 'Move down';
  }
  
  return {
    isValid,
    message,
    issues,
    faceCenter: { x: faceCenterX, y: faceCenterY },
    faceSizeRatio
  };
};

/**
 * Calculate image brightness
 * @param {HTMLVideoElement} video - Video element
 * @returns {number} - Average brightness (0-255)
 */
export const getBrightness = (video) => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let total = 0;
    
    // Sample every 10th pixel for performance
    for (let i = 0; i < data.length; i += 40) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      total += (r + g + b) / 3;
    }
    
    return total / (data.length / 40);
  } catch {
    return 128; // Default mid-brightness
  }
};

const faceDetection = {
  loadFaceDetectionModels,
  isFaceDetectionAvailable,
  detectFace,
  checkFacePosition,
  getBrightness,
};

export default faceDetection;