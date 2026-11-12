import React, { useState, useRef, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { getAllCounties, getConstituenciesByCountyId, getWardsByConstituencyId } from '../data/kenyaLocations';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  loadFaceDetectionModels,
  isFaceDetectionAvailable,
  detectFace,
  checkFacePosition,
} from '../utils/faceDetection';
import { validatePdfFile, uploadVoterIdDocument } from '../services/storageService';

const RegistrationPage = ({
  onConnectWallet,
  isConnected,
  account,
  onNavigate,
}) => {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Step 1: Personal Details
  const [personalDetails, setPersonalDetails] = useState({
    fullName: '',
    nationalId: '',
    pin: '',
    confirmPin: '',
  });
  const [personalErrors, setPersonalErrors] = useState({});

  // Step 2: Voting Area
  const [votingArea, setVotingArea] = useState({
    county: '',
    constituency: '',
    ward: '',
  });
  const [votingAreaErrors, setVotingAreaErrors] = useState({});
  const [counties, setCounties] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [wards, setWards] = useState([]);
  const [dataLoadingError, setDataLoadingError] = useState(false);

  // Step 3: ID Document (PDF) & Selfie
  const [idDocument, setIdDocument] = useState(null);
  const [idDocumentName, setIdDocumentName] = useState('');
  const [idDocumentUploaded, setIdDocumentUploaded] = useState(false);
  const [idDocumentUrl, setIdDocumentUrl] = useState('');
  const [idDocumentProgress, setIdDocumentProgress] = useState(0);
  const [isUploadingIdDoc, setIsUploadingIdDoc] = useState(false);
  const [selfie, setSelfie] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [showWebcamModal, setShowWebcamModal] = useState(false);
  const [idDocumentError, setIdDocumentError] = useState('');
  const [selfieError, setSelfieError] = useState('');

  // Face detection state
  const [faceDetectionReady, setFaceDetectionReady] = useState(false);
  const [faceDetectionError, setFaceDetectionError] = useState('');
  const [guidanceMessage, setGuidanceMessage] = useState('Position your face within the oval');
  const [countdown, setCountdown] = useState(null);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [videoPreviewFailed, setVideoPreviewFailed] = useState(false);
  const [cameraInitializing, setCameraInitializing] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [streamObtained, setStreamObtained] = useState(false);

  // Webcam refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const holdTimerRef = useRef(null);
  const holdStartTimeRef = useRef(null);

  // Strong stop camera function - ensures complete cleanup
  const stopCamera = () => {
    console.log('Force stopping camera');

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    console.log('Camera force stopped');
  };

  // Load counties on mount
  useEffect(() => {
    const loadedCounties = getAllCounties();
    setCounties(loadedCounties);
  }, []);

  // Update constituencies when county changes
  useEffect(() => {
    if (votingArea.county) {
      console.log('[RegistrationPage] Loading constituencies for county:', votingArea.county);
      try {
        const loadedConstituencies = getConstituenciesByCountyId(votingArea.county);
        console.log('[RegistrationPage] Loaded constituencies:', loadedConstituencies);
        if (loadedConstituencies && loadedConstituencies.length > 0) {
          setConstituencies(loadedConstituencies);
          setDataLoadingError(false);
        } else {
          console.warn('[RegistrationPage] No constituencies found for county:', votingArea.county);
          setConstituencies([]);
          setDataLoadingError(true);
        }
      } catch (error) {
        console.error('[RegistrationPage] Error loading constituencies:', error);
        setConstituencies([]);
        setDataLoadingError(true);
      }
      setVotingArea(prev => ({ ...prev, constituency: '', ward: '' }));
      setWards([]);
    } else {
      setConstituencies([]);
      setWards([]);
      setDataLoadingError(false);
    }
  }, [votingArea.county]);

  // Update wards when constituency changes
  useEffect(() => {
    if (votingArea.constituency && votingArea.county) {
      const loadedWards = getWardsByConstituencyId(votingArea.county, votingArea.constituency);
      setWards(loadedWards);
      setVotingArea(prev => ({ ...prev, ward: '' }));
    } else {
      setWards([]);
    }
  }, [votingArea.constituency, votingArea.county]);

  // Cleanup on unmount - ensure camera stream is stopped
  useEffect(() => {
    return () => {
      console.log('[RegistrationPage] Component unmounting, cleaning up camera stream');
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      stopCamera();
    };
  }, []);

  // Step 1: Personal Details handlers
  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalDetails(prev => ({ ...prev, [name]: value }));
    if (personalErrors[name]) {
      setPersonalErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const errors = {};
    if (!personalDetails.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    if (!personalDetails.nationalId.trim()) {
      errors.nationalId = 'National ID number is required';
    } else if (!/^\d{8}$/.test(personalDetails.nationalId.trim())) {
      errors.nationalId = 'National ID must contain 7 to 9 digits';
    }
    if (!personalDetails.pin.trim()) {
      errors.pin = 'Voting PIN is required';
    } else if (!/^\d{4,6}$/.test(personalDetails.pin.trim())) {
      errors.pin = 'PIN must be 4-6 digits';
    }
    if (!personalDetails.confirmPin.trim()) {
      errors.confirmPin = 'Please confirm your PIN';
    } else if (personalDetails.pin !== personalDetails.confirmPin) {
      errors.confirmPin = 'PINs do not match';
    }
    setPersonalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextToStep2 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  // Step 2: Voting Area handlers
  const handleVotingAreaChange = (e) => {
    const { name, value } = e.target;
    setVotingArea(prev => ({ ...prev, [name]: value }));
    if (votingAreaErrors[name]) {
      setVotingAreaErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep2 = () => {
    const errors = {};
    if (!votingArea.county) {
      errors.county = 'Please select a county';
    }
    if (!votingArea.constituency) {
      errors.constituency = 'Please select a constituency';
    }
    if (!votingArea.ward) {
      errors.ward = 'Please select a ward';
    }
    setVotingAreaErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextToStep3 = () => {
    if (validateStep2()) {
      setCurrentStep(3);
    }
  };

  // Step 3: ID Document (PDF) handlers
  const handleIdDocumentSelect = (e) => {
    const file = e.target.files[0];
    console.log("============================================");
    console.log("[DIAG] handleIdDocumentSelect FIRED");
    console.log("[DIAG] Event target:", e.target);
    console.log("[DIAG] Event target.files:", e.target.files);
    console.log("[DIAG] file:", file?.name, file?.size, file?.type);
    if (!file) {
      console.log("[DIAG] No file in event, returning early");
      return;
    }

    const validation = validatePdfFile(file);
    console.log("[DIAG] validatePdfFile result:", JSON.stringify(validation));
    if (!validation.valid) {
      console.log("[DIAG] Validation FAILED:", validation.error);
      setIdDocumentError(validation.error);
      setIdDocument(null);
      setIdDocumentName('');
      setIdDocumentUploaded(false);
      return;
    }

    console.log("[DIAG] Validation PASSED, about to set state");
    setIdDocumentError('');
    setIdDocument(file);
    setIdDocumentName(file.name);
    setIdDocumentUploaded(true);
    console.log("[DIAG] State set. idDocument =", file.name, "| idDocumentUploaded = true");
    console.log("============================================");
  };

  const handleUploadIdDocument = async () => {
    // Stub - actual upload logic would go here
    if (!idDocument) {
      setIdDocumentError('Please select a PDF file first');
      return;
    }
    setIsUploadingIdDoc(true);
    setIdDocumentError('');
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIdDocumentUploaded(true);
      setIdDocumentProgress(100);
    } catch (err) {
      setIdDocumentError(err.message || 'Upload failed');
    } finally {
      setIsUploadingIdDoc(false);
    }
  };

  const handleReplaceIdDocument = () => {
    setIdDocument(null);
    setIdDocumentName('');
    setIdDocumentUploaded(false);
    setIdDocumentUrl('');
    setIdDocumentProgress(0);
    setIdDocumentError('');
    const fileInput = document.getElementById('national-id-pdf-upload');
    if (fileInput) fileInput.value = '';
  };

  // Face detection for auto-capture
  const startFaceDetection = useCallback(async () => {
    // Only start face detection if camera is ready
    if (!cameraReady) {
      console.log('[RegistrationPage] Camera not ready yet, waiting...');
      return;
    }

    // Load face detection models if not already loaded
    const modelsReady = await loadFaceDetectionModels();
    
    if (!modelsReady) {
      setFaceDetectionError('Auto-detection unavailable. You can capture manually.');
      setFaceDetectionReady(false);
      console.warn('[RegistrationPage] Face detection models failed to load');
      return;
    }

    setFaceDetectionReady(true);
    setFaceDetectionError('');
    console.log('[RegistrationPage] Face detection model loaded');

    // Start detection loop directly since video is already playing
    startDetectionLoop();
  }, [cameraReady]);

  const startDetectionLoop = () => {
    // Clear any existing interval
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    // Run detection every 400ms
    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !isFaceDetectionAvailable()) {
        return;
      }

      const video = videoRef.current;
      
      // Skip if video is not ready
      if (video.readyState !== 4 || isAutoCapturing) {
        return;
      }

      try {
        const detection = await detectFace(video);
        
        if (!detection) {
          setGuidanceMessage('Position your face within the oval');
          holdStartTimeRef.current = null;
          return;
        }

        console.log('[RegistrationPage] Face detected:', {
          box: detection.detection.box,
          landmarks: detection.landmarks ? 'loaded' : 'none'
        });

        // Check face position (oval is 192px x 240px approximately)
        const positionCheck = checkFacePosition(
          detection,
          video.videoWidth,
          video.videoHeight,
          192, // oval width (w-48 = 12rem = 192px)
          240  // oval height (h-60 = 15rem = 240px)
        );

        setGuidanceMessage(positionCheck.message);

        if (positionCheck.isValid) {
          // Face is properly positioned
          if (!holdStartTimeRef.current) {
            holdStartTimeRef.current = Date.now();
            console.log('[RegistrationPage] Auto-capture conditions met - starting hold timer');
          }

          const holdDuration = Date.now() - holdStartTimeRef.current;
          
          // If held for 2 seconds, start countdown
          if (holdDuration >= 2000 && !isAutoCapturing) {
            startAutoCaptureCountdown();
          }
        } else {
          holdStartTimeRef.current = null;
        }
      } catch (error) {
        console.error('[RegistrationPage] Face detection error:', error);
      }
    }, 400);
  };

  const startAutoCaptureCountdown = () => {
    if (isAutoCapturing) return;
    
    setIsAutoCapturing(true);
    let count = 3;
    setCountdown(count);
    setGuidanceMessage(`${count}…`);
    console.log('[RegistrationPage] Starting auto-capture countdown:', count);

    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        setGuidanceMessage(`${count}…`);
      } else {
        clearInterval(countdownInterval);
        setCountdown(null);
        setGuidanceMessage('Capturing…');
        console.log('[RegistrationPage] Selfie auto-captured');
        captureSelfie();
        setIsAutoCapturing(false);
      }
    }, 1000);
  };

  const stopDetectionLoop = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    holdStartTimeRef.current = null;
  };

  // Webcam functions - COMPLETELY REWRITTEN for reliable video preview
  const startWebcam = async () => {
    console.log('Starting webcam');
    console.log('[RegistrationPage] startWebcam called');
    
    // Always stop any existing stream before starting a new one
    stopCamera();
    
    // Reset all states
    setCameraReady(false);
    setVideoPreviewFailed(false);
    setFaceDetectionReady(false);
    setCameraError('');
    setGuidanceMessage('Position your face within the oval');
    setCountdown(null);
    setIsAutoCapturing(false);
    holdStartTimeRef.current = null;

    // Check for browser compatibility
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('[RegistrationPage] navigator.mediaDevices.getUserMedia is not available');
      setCameraError('Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.');
      setShowWebcamModal(true);
      return;
    }

    // Check for secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      console.warn('[RegistrationPage] Not in a secure context - camera may not work');
      // Allow localhost for development
      const isLocalhost = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname === '::1';
      if (!isLocalhost) {
        setCameraError('Camera access requires a secure connection (HTTPS). Please use HTTPS or localhost for development.');
        setShowWebcamModal(true);
        return;
      }
    }

    // Show modal first - video element will be rendered, then camera starts
    setShowWebcamModal(true);
  };

  // Effect to start camera when modal opens and video element exists
  useEffect(() => {
    if (!showWebcamModal || !videoRef.current) {
      return;
    }

    const video = videoRef.current;

    console.log('[RegistrationPage] useEffect: Modal open, video ref:', video);

    // Stop any existing stream first
    if (streamRef.current) {
      console.log('[RegistrationPage] useEffect: Stopping existing stream');
      stopCamera();
    }

    // Small delay to ensure video element is fully rendered
    const startCamera = async () => {
      try {
        console.log('[RegistrationPage] useEffect: Requesting camera...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });

        console.log('[RegistrationPage] useEffect: Stream received:', stream);
        console.log('[RegistrationPage] useEffect: Stream tracks:', stream.getVideoTracks().map(t => ({ id: t.id, label: t.label })));

        streamRef.current = stream;

        // Assign stream to video
        console.log('[RegistrationPage] useEffect: Assigning stream to video...');
        video.srcObject = stream;
        console.log('[RegistrationPage] useEffect: Video srcObject:', video.srcObject);

        // Force video playback
        console.log('[RegistrationPage] useEffect: Calling video.play()');
        await video.play();
        console.log('[RegistrationPage] useEffect: Video playing');

        // Wait for video dimensions
        const checkDimensions = () => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            console.log('[RegistrationPage] useEffect: Video dimensions:', video.videoWidth, video.videoHeight);
            setCameraReady(true);
          } else {
            setTimeout(checkDimensions, 100);
          }
        };
        checkDimensions();

      } catch (err) {
        console.error('[RegistrationPage] useEffect: Camera error:', err);
        
        let errorMessage = 'Unable to access webcam. ';
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage += 'Camera permission was denied. Please allow camera access in your browser settings and try again.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage += 'No camera device found. Please connect a camera and try again.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage += 'Camera is already in use by another application. Please close other apps using the camera and try again.';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage += 'Camera does not support the required settings. Please try a different camera.';
        } else {
          errorMessage += 'Please check your camera settings and try again.';
        }
        
        setCameraError(errorMessage);
      }
    };

    // Start camera after a short delay to ensure video element is ready
    const timer = setTimeout(startCamera, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [showWebcamModal]);

  // Effect to start face detection when camera becomes ready
  useEffect(() => {
    if (cameraReady && showWebcamModal && !faceDetectionReady && !faceDetectionError) {
      console.log('[RegistrationPage] Camera ready detected, starting face detection');
      // Clear the polling interval if it exists
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      startFaceDetection();
    }
  }, [cameraReady, showWebcamModal, faceDetectionReady, faceDetectionError, startFaceDetection]);

  const retryCamera = async () => {
    console.log('[RegistrationPage] Retrying camera...');
    
    // Stop existing stream using strong stop function
    stopCamera();

    // Reset states
    setCameraReady(false);
    setVideoPreviewFailed(false);
    setFaceDetectionReady(false);
    setCameraError('');
    setCameraInitializing(false);

    // Restart camera
    await startWebcam();
  };

  const stopWebcam = () => {
    console.log('[RegistrationPage] Stopping webcam');
    stopDetectionLoop();
    
    // Clear polling interval
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    
    stopCamera();
  };

  const closeWebcamModal = () => {
    console.log('[RegistrationPage] Closing webcam modal');
    console.log('[AUDIT] closeWebcamModal: currentStep before close =', currentStep);
    console.log('[AUDIT] closeWebcamModal: showWebcamModal before close =', showWebcamModal);
    stopWebcam();
    setShowWebcamModal(false);
    setCameraReady(false);
    setCameraInitializing(false);
    setVideoPreviewFailed(false);
    setCameraError('');
    setFaceDetectionReady(false);
    setFaceDetectionError('');
    setGuidanceMessage('Position your face within the oval');
    setCountdown(null);
    setIsAutoCapturing(false);
    holdStartTimeRef.current = null;
    console.log('[AUDIT] closeWebcamModal: state updates queued, showWebcamModal set to false');
  };

  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      console.log('[RegistrationPage] Capturing selfie, video dimensions:', video.videoWidth, video.videoHeight);
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error('[RegistrationPage] Cannot capture - video dimensions are 0');
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('[RegistrationPage] Failed to create blob from canvas');
          return;
        }
        
        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
        setSelfie(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setSelfiePreview(e.target.result);
          console.log('[RegistrationPage] Selfie captured and preview set');
        };
        reader.readAsDataURL(file);
        closeWebcamModal();
      }, 'image/jpeg', 0.8);
    }
  };

  const retakeSelfie = () => {
    console.log('[RegistrationPage] Retaking selfie');
    setSelfie(null);
    setSelfiePreview(null);
    startWebcam();
  };

  // Compress image to base64 with max width and JPEG quality
  const compressImageToBase64 = (file, maxWidth = 500, quality = 0.5) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Scale down if width exceeds max
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG base64 with quality setting
          const base64 = canvas.toDataURL('image/jpeg', quality);
          resolve(base64);
        };
        img.onerror = () => {
          console.error('[RegistrationPage] Image loading failed for compression');
          reject(new Error('Failed to load image for compression'));
        };
        img.src = e.target.result;
      };
      reader.onerror = () => {
        console.error('[RegistrationPage] FileReader failed for compression');
        reject(new Error('Failed to read file for compression'));
      };
      reader.readAsDataURL(file);
    });
  };

  // Submit registration
  const submitRegistration = async () => {
    console.log('========================================');
    console.log('STEP 1: Submit clicked - starting registration');
    console.log('========================================');
    console.log('selfiePreview available:', !!selfiePreview);
    console.log('selfiePreview length:', selfiePreview ? selfiePreview.length : 0);
    console.log('selfie File available:', !!selfie);
    console.log('idDocumentUrl:', idDocumentUrl);
    console.log('idDocumentUploaded:', idDocumentUploaded);
    
    try {
      console.log('STEP 2: Validation passed, building registration data');
      
      // TEMPORARY EXHIBITION FALLBACK:
      // Use selfiePreview (already-encoded Base64 data URL) directly instead of
      // re-compressing via compressImageToBase64 which can hang indefinitely
      // if the Image loading from FileReader data URL never completes.
      let selfieBase64 = '';
      if (selfiePreview) {
        console.log('STEP 3: Using selfiePreview Base64 data directly (length: ' + selfiePreview.length + ')');
        selfieBase64 = selfiePreview;
      } else if (selfie) {
        console.log('STEP 3: selfiePreview not available, attempting compressImageToBase64 with timeout');
        // Add a timeout to prevent hanging
        try {
          selfieBase64 = await Promise.race([
            compressImageToBase64(selfie, 500, 0.5),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('compressImageToBase64 timed out after 10 seconds')), 10000)
            )
          ]);
          console.log('STEP 4: compressImageToBase64 completed, length: ' + selfieBase64.length);
        } catch (compressError) {
          console.error('compressImageToBase64 failed or timed out:', compressError);
          // Fallback: use raw selfie as base64 via FileReader directly
          console.log('STEP 3b: Falling back to direct FileReader for selfie');
          selfieBase64 = await new Promise((resolve, reject) => {
            const fallbackReader = new FileReader();
            fallbackReader.onload = () => resolve(fallbackReader.result);
            fallbackReader.onerror = () => reject(new Error('Fallback FileReader failed'));
            // Add timeout for fallback too
            setTimeout(() => reject(new Error('Fallback FileReader timed out')), 10000);
            fallbackReader.readAsDataURL(selfie);
          });
          console.log('STEP 4b: Fallback FileReader completed, length: ' + selfieBase64.length);
        }
      } else {
        console.log('STEP 3: No selfie data available');
      }

      console.log('STEP 5: Building Firestore document');
      const registrationData = {
        walletAddress: account || "",
        fullName: personalDetails.fullName,
        idNumber: personalDetails.nationalId,
        county: votingArea.county,
        constituency: votingArea.constituency,
        ward: votingArea.ward,
        pin: personalDetails.pin,
        idDocumentUrl: idDocumentUrl,
        selfieBase64: selfieBase64,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('STEP 6: Saving registration to Firestore...');
      console.log('Document size estimate:', JSON.stringify(registrationData).length, 'bytes');
      
      const docRef = await addDoc(
        collection(db, "voterRegistrationRequests"),
        registrationData
      );

      console.log('STEP 7: Firestore save completed - Document ID:', docRef.id);
      console.log('STEP 8: Registration completed successfully');
      console.log('========================================');

      // Show success
      setShowSuccessModal(true);

      // Reset form
      setPersonalDetails({ fullName: '', nationalId: '', pin: '', confirmPin: '' });
      setVotingArea({ county: '', constituency: '', ward: '' });
      setIdDocument(null);
      setIdDocumentName('');
      setIdDocumentUploaded(false);
      setIdDocumentUrl('');
      setIdDocumentProgress(0);
      setIsUploadingIdDoc(false);
      setSelfie(null);
      setSelfiePreview(null);
      setCurrentStep(1);

    } catch (error) {
      console.error('========================================');
      console.error("Registration failed:", error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('========================================');
      alert('Registration failed: ' + (error.message || 'Unknown error. Please try again.'));
    } finally {
      console.log('STEP 9: Finally block - re-enabling submit button');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    console.log("BUTTON CLICKED");
    // Prevent double submit
    if (isSubmitting) {
      console.log('[RegistrationPage] Already submitting, ignoring duplicate click');
      return;
    }

    if (!idDocumentUploaded) {
      setIdDocumentError('Please select a valid National ID PDF');
      return;
    }
    if (!selfie) {
      setSelfieError('Please take a selfie');
      return;
    }

    console.log('[RegistrationPage] handleSubmit: Setting isSubmitting=true');
    setIsSubmitting(true);

    // Upload ID document if not yet uploaded
    if (idDocument && !idDocumentUrl) {
      console.log('[RegistrationPage] Uploading ID document before submission...');
      const voterId = `voter_${personalDetails.nationalId}_${Date.now()}`;
      try {
        const downloadUrl = await uploadVoterIdDocument(idDocument, voterId);
        console.log('[RegistrationPage] ID document uploaded, URL:', downloadUrl);
        setIdDocumentUrl(downloadUrl);
      } catch (uploadError) {
        console.error('[RegistrationPage] Failed to upload ID document:', uploadError);
        setIdDocumentError('Failed to upload PDF. Please check your connection and try again.');
        setIsSubmitting(false);
        return;
      }
    }
    
    try {
      await submitRegistration();
    } catch (error) {
      // Safety net: catch any unhandled errors from submitRegistration
      console.error('[RegistrationPage] Unhandled error in handleSubmit:', error);
      setIsSubmitting(false);
    }
  };

  // Progress indicator component
  const StepIndicator = ({ step, title, isActive, isCompleted }) => (
    <div className="flex items-center">
      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold transition-all ${
        isCompleted 
          ? 'bg-green-600 border-green-600 text-white' 
          : isActive 
          ? 'bg-dark-green-600 border-dark-green-600 text-white' 
          : 'bg-gray-200 border-gray-300 text-gray-500'
      }`}>
        {isCompleted ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          step
        )}
      </div>
      <span className={`ml-3 text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
        {title}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onConnectWallet={onConnectWallet}
        isConnected={isConnected}
        account={account}
        onNavigate={onNavigate}
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Voter Registration</h1>
          <p className="text-gray-600 text-lg">
            Register to vote in the upcoming elections. Complete all steps to submit your registration request.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex justify-between items-center">
            <StepIndicator 
              step={1} 
              title="Personal Details" 
              isActive={currentStep === 1} 
              isCompleted={currentStep > 1} 
            />
            <div className={`flex-1 h-1 mx-4 ${currentStep > 1 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
            <StepIndicator 
              step={2} 
              title="Voting Area" 
              isActive={currentStep === 2} 
              isCompleted={currentStep > 2} 
            />
            <div className={`flex-1 h-1 mx-4 ${currentStep > 2 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
            <StepIndicator 
              step={3} 
              title="ID & Selfie" 
              isActive={currentStep === 3} 
              isCompleted={false} 
            />
          </div>
        </div>

        {/* Step 1: Personal Details */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Details</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={personalDetails.fullName}
                  onChange={handlePersonalChange}
                  placeholder="e.g. JOHN KAMAU NJOROGE"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${
                    personalErrors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {personalErrors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{personalErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  National ID Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nationalId"
                  value={personalDetails.nationalId}
                  onChange={handlePersonalChange}
                  placeholder="e.g. 1234567"
                  maxLength={9}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${
                    personalErrors.nationalId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {personalErrors.nationalId && (
                  <p className="mt-1 text-sm text-red-600">{personalErrors.nationalId}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Set Voting PIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="pin"
                    value={personalDetails.pin}
                    onChange={handlePersonalChange}
                    placeholder="4-6 digits"
                    maxLength={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${
                      personalErrors.pin ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {personalErrors.pin && (
                    <p className="mt-1 text-sm text-red-600">{personalErrors.pin}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Choose a 4-6 digit PIN for voting</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Voting PIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPin"
                    value={personalDetails.confirmPin}
                    onChange={handlePersonalChange}
                    placeholder="Re-enter PIN"
                    maxLength={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${
                      personalErrors.confirmPin ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {personalErrors.confirmPin && (
                    <p className="mt-1 text-sm text-red-600">{personalErrors.confirmPin}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleNextToStep2}
                  className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all shadow-md"
                >
                  Next: Voting Area
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Voting Area */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Voting Area</h2>
            <p className="text-gray-600 mb-6">Select your location to determine your voting constituency and ward.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  County <span className="text-red-500">*</span>
                </label>
                <select
                  name="county"
                  value={votingArea.county}
                  onChange={handleVotingAreaChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${
                    votingAreaErrors.county ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select County</option>
                  {counties.map(county => (
                    <option key={county.id} value={county.id}>{county.name}</option>
                  ))}
                </select>
                {votingAreaErrors.county && (
                  <p className="mt-1 text-sm text-red-600">{votingAreaErrors.county}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Constituency <span className="text-red-500">*</span>
                </label>
                <select
                  name="constituency"
                  value={votingArea.constituency}
                  onChange={handleVotingAreaChange}
                  disabled={!votingArea.county}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${
                    votingAreaErrors.constituency ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Constituency</option>
                  {constituencies.map((constituency, idx) => (
                    <option key={idx} value={constituency.name}>{constituency.name}</option>
                  ))}
                </select>
                {votingAreaErrors.constituency && (
                  <p className="mt-1 text-sm text-red-600">{votingAreaErrors.constituency}</p>
                )}
                {!votingArea.county && (
                  <p className="mt-1 text-sm text-gray-500">Please select a county first</p>
                )}
                {votingArea.county && dataLoadingError && (
                  <p className="mt-1 text-sm text-yellow-600">⚠️ No constituencies found for selected county. Please try a different county or contact support.</p>
                )}
                {votingArea.county && constituencies.length === 0 && !dataLoadingError && (
                  <p className="mt-1 text-sm text-gray-500">Loading constituencies...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ward <span className="text-red-500">*</span>
                </label>
                <select
                  name="ward"
                  value={votingArea.ward}
                  onChange={handleVotingAreaChange}
                  disabled={!votingArea.constituency}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${
                    votingAreaErrors.ward ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Ward</option>
                  {wards.map((ward, idx) => (
                    <option key={idx} value={ward}>{ward}</option>
                  ))}
                </select>
                {votingAreaErrors.ward && (
                  <p className="mt-1 text-sm text-red-600">{votingAreaErrors.ward}</p>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleNextToStep3}
                  className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all shadow-md"
                >
                  Next: ID & Selfie
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: ID & Selfie */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">National ID & Selfie</h2>
            <p className="text-gray-600 mb-6">Upload your National ID scan (PDF) and take a selfie for verification.</p>

            <div className="space-y-8">
              {/* National ID PDF Upload - Replaces image upload */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">1. National ID Scan (PDF)</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-500 transition-colors">
                  {idDocumentUploaded ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-green-700 font-semibold">✓ PDF Uploaded Successfully</p>
                      <p className="text-sm text-gray-600">{idDocumentName}</p>
                      <button
                        onClick={handleReplaceIdDocument}
                        className="text-sm text-blue-600 hover:text-blue-700 underline font-medium"
                      >
                        Replace PDF
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      
                      {!idDocument ? (
                        <div>
                          <label className="cursor-pointer">
                            <span className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-block">
                              Select PDF
                            </span>
                            <input
                              id="national-id-pdf-upload"
                              type="file"
                              accept=".pdf,application/pdf"
                              onChange={handleIdDocumentSelect}
                              className="hidden"
                            />
                          </label>
                          <p className="text-sm text-gray-500 mt-2">
                            Only PDF files are accepted (Max 10 MB)
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="bg-gray-50 rounded-lg p-3 inline-block mx-auto">
                            <p className="text-sm font-medium text-gray-700">{idDocumentName}</p>
                            <p className="text-xs text-gray-500">
                              {(idDocument.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>
                          
                          {/* Upload Progress Bar */}
                          {isUploadingIdDoc && (
                            <div className="mt-3">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Uploading PDF...</span>
                                <span>{Math.round(idDocumentProgress)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                                  style={{ width: `${idDocumentProgress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={handleUploadIdDocument}
                              disabled={isUploadingIdDoc}
                              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {isUploadingIdDoc ? 'Uploading...' : 'Upload PDF'}
                            </button>
                            <button
                              onClick={handleReplaceIdDocument}
                              disabled={isUploadingIdDoc}
                              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {idDocumentError && (
                  <p className="mt-2 text-sm text-red-600">{idDocumentError}</p>
                )}
              </div>

              {/* Selfie Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Live Selfie — Your Face</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  {selfiePreview ? (
                    <div className="space-y-4">
                      <div className="relative inline-block">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-32 h-40 rounded-full border-4 border-green-400 opacity-50"></div>
                        </div>
                        <img 
                          src={selfiePreview} 
                          alt="Selfie Preview" 
                          className="w-40 h-40 object-cover rounded-full mx-auto shadow-md"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Selfie captured successfully</p>
                        <button
                          onClick={retakeSelfie}
                          className="text-sm text-blue-600 hover:text-blue-700 underline"
                        >
                          Retake Selfie
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a9 9 0 0118 0v1a9 9 0 01-18 0V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <button
                          onClick={startWebcam}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Take Selfie
                        </button>
                        <p className="text-sm text-gray-500 mt-2">
                          Use your camera to take a selfie
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {selfieError && (
                  <p className="mt-2 text-sm text-red-600">{selfieError}</p>
                )}
              </div>

              {/* Security Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800">
                    <strong>Privacy Notice:</strong> Your documents are uploaded securely and only visible to IEBC staff for verification purposes. They are never stored on the blockchain.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all"
                >
                  Back
                </button>
                {console.log("Button disabled:", isSubmitting || !idDocumentUploaded)}
                {console.log("isSubmitting =", isSubmitting)}
                {console.log("idDocumentUploaded =", idDocumentUploaded)}
                {console.log("Rendering Submit Button")}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !idDocumentUploaded}
                  className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Registration Request'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Webcam Modal */}
      {showWebcamModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-green-800 text-white p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Take Your Selfie</h3>
              <button
                onClick={closeWebcamModal}
                className="text-white hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Video container - always visible */}
            <div className="relative bg-black overflow-hidden" style={{ height: '384px' }}>
              {/* Video element - always rendered */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  backgroundColor: "black"
                }}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Camera error overlay - only show if error exists */}
              {cameraError && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black bg-opacity-80">
                  <svg className="w-16 h-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-white text-lg mb-2">Camera Access Error</p>
                  <p className="text-gray-400 text-sm mb-6 px-4 text-center">{cameraError}</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={retryCamera}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Retry
                    </button>
                    <button
                      onClick={closeWebcamModal}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Loading indicator - small label, not blocking overlay */}
              {!cameraReady && !cameraError && (
                <div className="absolute top-4 left-0 right-0 text-center z-10">
                  <p className="text-sm text-white bg-black bg-opacity-50 px-4 py-2 rounded-full inline-block">
                    Starting camera...
                  </p>
                </div>
              )}

              {/* Oval guide overlay - z-10, pointer-events-none */}
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <div className={`w-48 h-60 rounded-full border-4 transition-colors duration-300 ${
                  isAutoCapturing ? 'border-green-400 opacity-80' : 'border-white opacity-60'
                }`}></div>
              </div>

              {/* Countdown overlay */}
              {countdown && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                  <div className="text-8xl font-bold text-white drop-shadow-lg animate-pulse">
                    {countdown}
                  </div>
                </div>
              )}

              {/* Guidance message */}
              <div className="absolute bottom-4 left-0 right-0 text-center z-10">
                <p className={`text-sm px-4 py-2 rounded-full inline-block ${
                  faceDetectionError 
                    ? 'bg-yellow-600 bg-opacity-80 text-yellow-100' 
                    : 'bg-black bg-opacity-50 text-white'
                }`}>
                  {faceDetectionError || guidanceMessage}
                </p>
              </div>

              {/* Face detection status indicator */}
              {faceDetectionReady && !faceDetectionError && (
                <div className="absolute top-4 right-4 z-10">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                    isAutoCapturing 
                      ? 'bg-green-500 text-white' 
                      : 'bg-green-600 bg-opacity-50 text-green-100'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      isAutoCapturing ? 'bg-white animate-pulse' : 'bg-green-300'
                    }`}></div>
                    {isAutoCapturing ? 'Capturing...' : 'Auto-detect ON'}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons - show when stream exists and no error */}
            {streamRef.current && !cameraError && (
              <div className="p-4 flex flex-col items-center gap-3">
                {/* Manual capture button */}
                <button
                  onClick={captureSelfie}
                  disabled={isAutoCapturing}
                  className="px-8 py-3 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a9 9 0 0118 0v1a9 9 0 01-18 0V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {isAutoCapturing ? 'Capturing...' : 'Capture Photo'}
                </button>

                {/* Help text */}
                {faceDetectionError && (
                  <p className="text-xs text-yellow-600 text-center">
                    {faceDetectionError}
                  </p>
                )}
                {faceDetectionReady && !faceDetectionError && (
                  <p className="text-xs text-gray-500">
                    Hold still for auto-capture, or click the button
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Registration Submitted!
            </h2>
            <p className="text-gray-600 mb-6">
              Your registration request has been sent successfully. IEBC will review it shortly and you'll be notified once approved.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Next Steps:</strong> Once your registration is approved, you'll be able to access the voting page and cast your vote.
              </p>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                if (onNavigate) {
                  onNavigate('home');
                } else {
                  window.location.hash = '';
                }
              }}
              className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all"
            >
              Go to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationPage;





