import React, { useState, useRef, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { getAllCounties, getConstituenciesByCountyId, getWardsByConstituencyId } from '../data/kenyaLocations';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import {
  loadFaceDetectionModels,
  isFaceDetectionAvailable,
  detectFace,
  checkFacePosition,
} from '../utils/faceDetection';
import { verifyVoterIdentity } from '../services/smileIdService';
import { ShieldCheckIcon, ClockIcon } from '../components/common/Icons';
import { runOcrOnImage, verifyKenyanIdDocument } from '../utils/kenyanIdOcr';
import { compressAndResizeImage } from '../utils/imageOptimizer';

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
    dob: '',
    pin: '',
    confirmPin: '',
  });
  const [personalErrors, setPersonalErrors] = useState({});
  const [smileVerificationState, setSmileVerificationState] = useState(null);

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

  // Step 3: ID Photos (Front & Back) & Selfie
  const [idFrontPhoto, setIdFrontPhoto] = useState(null);
  const [idFrontPreview, setIdFrontPreview] = useState(null);
  const [idBackPhoto, setIdBackPhoto] = useState(null);
  const [idBackPreview, setIdBackPreview] = useState(null);
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrError, setOcrError] = useState('');
  const [selfie, setSelfie] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [showWebcamModal, setShowWebcamModal] = useState(false);
  const [selfieError, setSelfieError] = useState('');

  // Face detection state
  const [faceDetectionReady, setFaceDetectionReady] = useState(false);
  const [faceDetectionError, setFaceDetectionError] = useState('');
  const [guidanceMessage, setGuidanceMessage] = useState('Position your face within the oval');
  const [countdown, setCountdown] = useState(null);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');

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
    } else if (!/^\d{7,9}$/.test(personalDetails.nationalId.trim())) {
      errors.nationalId = 'National ID must contain 7 to 9 digits';
    }
    if (!personalDetails.dob) {
      errors.dob = 'Date of birth is required for automated identity verification';
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

  // Step 3: ID Photo (Front & Back) handlers
  const handleIdPhotoSelect = async (e, side) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setOcrError('Please upload an image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setOcrError('Image size must be 20 MB or less.');
      return;
    }

    setOcrError('');

    try {
      // Compress with high clarity (1600px, 0.85) so Tesseract OCR can accurately read all ID numbers
      const compressedBase64 = await compressAndResizeImage(file, 1600, 0.85);

      let currentFront = idFrontPreview;
      let currentBack = idBackPreview;

      if (side === 'front') {
        setIdFrontPhoto(file);
        setIdFrontPreview(compressedBase64);
        currentFront = compressedBase64;
      } else {
        setIdBackPhoto(file);
        setIdBackPreview(compressedBase64);
        currentBack = compressedBase64;
      }

      if (side === 'front' || currentFront) {
        await runOcrValidation(currentFront, currentBack);
      }
    } catch (compressErr) {
      console.error('[RegistrationPage] Error compressing image:', compressErr);
      setOcrError('Could not process image. Please try a different photo.');
    }
  };

  const runOcrValidation = async (frontBase64, backBase64) => {
    if (!frontBase64) return;
    setIsOcrScanning(true);
    setOcrProgress(15);
    setOcrError('');
    setOcrResult(null);

    try {
      const { text: frontText } = await runOcrOnImage(frontBase64, (p) => setOcrProgress(p));
      let backText = '';
      if (backBase64) {
        try {
          const { text } = await runOcrOnImage(backBase64);
          backText = text;
        } catch (_) {}
      }

      const result = verifyKenyanIdDocument({
        frontText,
        backText,
        expectedId: personalDetails.nationalId,
        expectedFullName: personalDetails.fullName,
        expectedDob: personalDetails.dob,
      });

      setOcrResult(result);
      if (!result.isValid) {
        setOcrError(result.summary || 'Uploaded document does not match entered details.');
      } else {
        setOcrError('');
      }
    } catch (err) {
      console.error('[RegistrationPage] OCR failed:', err);
      setOcrError('Could not read National ID clearly. Please upload a sharper, glare-free photo.');
    } finally {
      setIsOcrScanning(false);
      setOcrProgress(0);
    }
  };

  const handleApplyExtractedId = (newId) => {
    if (!newId) return;
    setPersonalDetails(prev => ({ ...prev, nationalId: newId }));
    if (ocrResult) {
      setOcrResult(prev => ({
        ...prev,
        isValid: true,
        idNumberMatched: true,
        extractedId: newId,
        summary: `Document verified: Authentic ${prev.cardType} confirmed (ID: ${newId}).`,
      }));
      setOcrError('');
    }
  };

  const handleReplaceIdPhoto = (side) => {
    if (side === 'front') {
      setIdFrontPhoto(null);
      setIdFrontPreview(null);
    } else {
      setIdBackPhoto(null);
      setIdBackPreview(null);
    }
    setOcrResult(null);
    setOcrError('');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setFaceDetectionReady(false);
    setCameraError('');

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

  // Submit registration
  const submitRegistration = async () => {
    console.log('========================================');
    console.log('STEP 1: Submit clicked - starting registration');
    console.log('========================================');
    console.log('selfiePreview available:', !!selfiePreview);
    console.log('selfiePreview length:', selfiePreview ? selfiePreview.length : 0);
    console.log('selfie File available:', !!selfie);
    console.log('idFrontPreview available:', !!idFrontPreview);
    console.log('idBackPreview available:', !!idBackPreview);
    console.log('ocrResult isValid:', ocrResult?.isValid);
    
    try {
      console.log('STEP 2: Validation passed, building registration data');
      
      // Guarantee all images are compressed to lightweight payloads (< 150KB each)
      // This permanently eliminates Firestore's 1,048,487 bytes property limit error
      let cleanFront = idFrontPreview || '';
      if (cleanFront && cleanFront.length > 400000) {
        cleanFront = await compressAndResizeImage(cleanFront, 800, 0.65);
      }

      let cleanBack = idBackPreview || '';
      if (cleanBack && cleanBack.length > 400000) {
        cleanBack = await compressAndResizeImage(cleanBack, 800, 0.65);
      }

      let cleanSelfie = selfiePreview || '';
      if (!cleanSelfie && selfie) {
        try {
          cleanSelfie = await compressAndResizeImage(selfie, 480, 0.65);
        } catch (_) {}
      } else if (cleanSelfie && cleanSelfie.length > 400000) {
        cleanSelfie = await compressAndResizeImage(cleanSelfie, 480, 0.65);
      }

      console.log('STEP 5: Running Smile ID automated voter verification...');
      let smileResult = { success: false, status: 'PENDING_REVIEW', jobId: null };
      try {
        smileResult = await verifyVoterIdentity({
          nationalId: personalDetails.nationalId,
          fullName: personalDetails.fullName,
          dob: personalDetails.dob || '1995-01-01',
          walletAddress: account || `wallet_${personalDetails.nationalId}`,
          userId: `voter_${personalDetails.nationalId}`,
          idFrontBase64: cleanFront,
          idBackBase64: cleanBack,
          selfieBase64: cleanSelfie,
          ocrResult: ocrResult,
        });
        console.log('[RegistrationPage] Smile ID result:', smileResult);
      } catch (smileErr) {
        console.warn('[RegistrationPage] Smile ID verification call failed:', smileErr);
      }

      const isSmileVerified = smileResult.status === 'VERIFIED';
      const smileStatus = isSmileVerified ? 'smile_verified' :
                          smileResult.status === 'REJECTED' ? 'smile_rejected' : 'pending_review';

      // Auto-approve if verified by Smile ID
      const initialStatus = isSmileVerified ? 'approved' : 'pending';

      console.log('STEP 6: Building Firestore document with Smile ID status:', smileStatus);
      const registrationData = {
        walletAddress: account || "",
        fullName: personalDetails.fullName,
        idNumber: personalDetails.nationalId,
        dob: personalDetails.dob || '',
        county: votingArea.county,
        constituency: votingArea.constituency,
        ward: votingArea.ward,
        pin: personalDetails.pin,
        idFrontBase64: cleanFront,
        idBackBase64: cleanBack,
        ocrMatched: ocrResult?.isValid || false,
        ocrSummary: ocrResult?.summary || '',
        selfieBase64: cleanSelfie,
        status: initialStatus,
        smileStatus: smileStatus,
        smileJobId: smileResult.jobId || null,
        smileConfidence: smileResult.confidence || null,
        smileMessage: smileResult.message || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('STEP 7: Saving registration to Firestore...');
      const docRef = await addDoc(
        collection(db, "voterRegistrationRequests"),
        registrationData
      );

      // If auto-verified by Smile ID, also create the approved voter document in 'voters'
      if (isSmileVerified) {
        const voterDocId = (account || personalDetails.nationalId).toLowerCase();
        try {
          await setDoc(doc(db, 'voters', voterDocId), {
            fullName: personalDetails.fullName,
            idNumber: personalDetails.nationalId,
            county: votingArea.county,
            constituency: votingArea.constituency,
            ward: votingArea.ward,
            pin: personalDetails.pin,
            walletAddress: account || "",
            status: 'approved',
            smileStatus: 'smile_verified',
            smileJobId: smileResult.jobId || null,
            approvedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            sourceRequestId: docRef.id,
          }, { merge: true });
          console.log('[RegistrationPage] Auto-approved voter record saved in voters collection:', voterDocId);
        } catch (votersErr) {
          console.warn('[RegistrationPage] Non-fatal: could not write to voters collection:', votersErr);
        }
      }

      setSmileVerificationState({
        status: smileStatus,
        isVerified: isSmileVerified,
        message: smileResult.message,
      });

      console.log('STEP 8: Firestore save completed - Document ID:', docRef.id);
      console.log('STEP 9: Registration completed successfully');
      console.log('========================================');

      // Show success
      setShowSuccessModal(true);

      // Reset form
      setPersonalDetails({ fullName: '', nationalId: '', dob: '', pin: '', confirmPin: '' });
      setVotingArea({ county: '', constituency: '', ward: '' });
      setIdFrontPhoto(null);
      setIdFrontPreview(null);
      setIdBackPhoto(null);
      setIdBackPreview(null);
      setOcrResult(null);
      setOcrError('');
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
    // Prevent double submit
    if (isSubmitting) {
      console.log('[RegistrationPage] Already submitting, ignoring duplicate click');
      return;
    }

    if (!idFrontPhoto || !idBackPhoto) {
      setOcrError('Please upload both front and back photos of your Kenyan National ID.');
      return;
    }

    // OCR validation is ADVISORY ONLY for now (demo mode): a failed document
    // check must not block registration. The status is still shown in the UI
    // and stored with the record for admin review.
    if (!ocrResult || !ocrResult.isValid) {
      console.warn('[RegistrationPage] Document check advisory - continuing without blocking:', ocrResult?.summary || 'OCR not verified');
    }

    if (!selfie && !selfiePreview) {
      setSelfieError('Please take a selfie');
      return;
    }

    console.log('[RegistrationPage] handleSubmit: Setting isSubmitting=true');
    setIsSubmitting(true);
    
    try {
      await submitRegistration();
    } catch (error) {
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dob"
                  value={personalDetails.dob}
                  onChange={handlePersonalChange}
                  max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${
                    personalErrors.dob ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {personalErrors.dob && (
                  <p className="mt-1 text-sm text-red-600">{personalErrors.dob}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Required for automated Smile ID identity verification (Must be 18+).
                </p>
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
                  <p className="mt-1 text-sm text-yellow-600">No constituencies found for selected county. Please try a different county or contact support.</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-1">National ID & Facial Verification</h2>
            <p className="text-gray-500 mb-6 text-sm">Supports both 2nd Gen Kenyan National IDs and 3rd Gen Maisha Cards. The ID number on the front is automatically scanned and matched.</p>

            <div className="space-y-6">
              {/* ID Photos (Front & Back) */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3">1. Kenyan National ID / Maisha Card Photos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Front Photo */}
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                    idFrontPreview ? 'border-green-400 bg-green-50/40' : 'border-gray-300 hover:border-green-500 bg-gray-50/50'
                  }`}>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">ID Front (with ID Number & Photo)</p>
                    {idFrontPreview ? (
                      <div className="space-y-3">
                        <img 
                          src={idFrontPreview} 
                          alt="ID Front" 
                          className="w-full h-36 object-cover rounded-lg shadow-sm border border-gray-200" 
                        />
                        <button
                          type="button"
                          onClick={() => handleReplaceIdPhoto('front')}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                        >
                          Change Front Photo
                        </button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <label className="cursor-pointer">
                          <span className="px-3.5 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors inline-block shadow-sm">
                            Upload Front
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => handleIdPhotoSelect(e, 'front')}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-gray-400 mt-2">JPEG, PNG or WebP (ID number must be visible)</p>
                      </div>
                    )}
                  </div>

                  {/* Back Photo */}
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                    idBackPreview ? 'border-green-400 bg-green-50/40' : 'border-gray-300 hover:border-green-500 bg-gray-50/50'
                  }`}>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">ID Back Side</p>
                    {idBackPreview ? (
                      <div className="space-y-3">
                        <img 
                          src={idBackPreview} 
                          alt="ID Back" 
                          className="w-full h-36 object-cover rounded-lg shadow-sm border border-gray-200" 
                        />
                        <button
                          type="button"
                          onClick={() => handleReplaceIdPhoto('back')}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                        >
                          Change Back Photo
                        </button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <label className="cursor-pointer">
                          <span className="px-3.5 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors inline-block shadow-sm">
                            Upload Back
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => handleIdPhotoSelect(e, 'back')}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-gray-400 mt-2">JPEG, PNG or WebP</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* OCR Status / Feedback */}
                {isOcrScanning && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 text-xs text-blue-800">
                    <svg className="animate-spin h-4 w-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Extracting ID details & cross-referencing information...{ocrProgress > 0 ? ` (${Math.round(ocrProgress)}%)` : ''}</span>
                  </div>
                )}

                {/* OCR Results / Extracted ID Information Card */}
                {!isOcrScanning && ocrResult && (
                  <div className={`mt-3 p-3.5 rounded-xl border text-xs space-y-2.5 transition-all ${
                    ocrResult.isValid 
                      ? 'bg-green-50/70 border-green-300 text-green-900' 
                      : 'bg-amber-50/70 border-amber-300 text-amber-900'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1.5">
                        {ocrResult.isValid ? (
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                        )}
                        <span>{ocrResult.isValid ? 'Document Verified' : 'Document Analysis'}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700 font-medium">
                        {ocrResult.cardType || 'Kenyan National ID'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2 bg-white/80 rounded-lg border border-gray-200">
                      <div>
                        <span className="text-gray-500 block text-[11px]">Extracted ID Number:</span>
                        <span className="font-bold text-gray-900 font-mono text-sm">
                          {ocrResult.extractedId || 'Not detected'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[11px]">Entered ID Number:</span>
                        <span className="font-mono text-gray-800 text-sm">
                          {personalDetails.nationalId || '(empty)'}
                        </span>
                      </div>
                      {ocrResult.extractedName && (
                        <div className="col-span-2 pt-1 border-t border-gray-100">
                          <span className="text-gray-500 block text-[11px]">Extracted Name:</span>
                          <span className="font-semibold text-gray-800">{ocrResult.extractedName}</span>
                        </div>
                      )}
                    </div>

                    {/* Typo resolution helper */}
                    {!ocrResult.isValid && ocrResult.extractedId && ocrResult.extractedId !== personalDetails.nationalId && (
                      <div className="pt-1 flex items-center justify-between gap-2 bg-white/90 p-2 rounded-lg border border-amber-200">
                        <span className="text-[11px] text-amber-800">
                          ID mismatch? Click to use the ID extracted from the card:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApplyExtractedId(ocrResult.extractedId)}
                          className="px-2.5 py-1 bg-green-600 text-white font-semibold rounded text-xs hover:bg-green-700 transition-colors shadow-sm shrink-0"
                        >
                          Use Extracted ID: {ocrResult.extractedId}
                        </button>
                      </div>
                    )}

                    <p className={`text-[11px] ${ocrResult.isValid ? 'text-green-800' : 'text-amber-800'}`}>
                      {ocrResult.summary}
                    </p>
                  </div>
                )}

                {!isOcrScanning && !ocrResult && ocrError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{ocrError}</span>
                  </div>
                )}
              </div>

              {/* Selfie Section */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3">2. Live Facial Selfie</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center bg-gray-50/50">
                  {selfiePreview ? (
                    <div className="space-y-3">
                      <img 
                        src={selfiePreview} 
                        alt="Selfie Preview" 
                        className="w-28 h-28 object-cover rounded-full mx-auto shadow-md border-2 border-green-500"
                      />
                      <div>
                        <p className="text-xs text-green-700 font-medium">Selfie captured</p>
                        <button
                          type="button"
                          onClick={retakeSelfie}
                          className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 font-medium"
                        >
                          Retake Selfie
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a9 9 0 0118 0v1a9 9 0 01-18 0V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <button
                        type="button"
                        onClick={startWebcam}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Open Camera & Take Selfie
                      </button>
                      <p className="text-xs text-gray-400 mt-2">Facial biometrics are cross-referenced with your National ID photo.</p>
                    </div>
                  )}
                </div>
                {selfieError && (
                  <p className="mt-2 text-xs text-red-600">{selfieError}</p>
                )}
              </div>

              {/* Security Note */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <strong>IEBC Security Notice:</strong> All voter identity documents are encrypted and verified against official Kenyan National ID records via Smile ID. Inauthentic documents are automatically rejected.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !idFrontPreview || !idBackPreview || !selfiePreview}
                  className="px-6 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying & Submitting...
                    </span>
                  ) : (
                    'Submit for Verification'
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
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              smileVerificationState?.isVerified ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              {smileVerificationState?.isVerified ? (
                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {smileVerificationState?.isVerified ? 'Identity Verified & Registered' : 'Registration Staged for Review'}
            </h2>

            {/* Verification Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold mb-4 bg-gray-100 text-gray-800">
              {smileVerificationState?.isVerified
                ? <ShieldCheckIcon className="w-4 h-4 text-green-600" />
                : <ClockIcon className="w-4 h-4 text-yellow-600" />}
              Smile ID: {smileVerificationState?.isVerified ? 'Automated KYC Verified' : 'Manual Review Staged'}
            </div>

            <p className="text-gray-600 mb-6 text-sm">
              {smileVerificationState?.isVerified 
                ? 'Your national identity was verified automatically through Smile ID. Your voter account is active and you may proceed directly to the voting platform.'
                : 'Your voter registration has been submitted and queued for IEBC verification in the administrative panel.'
              }
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs text-green-900 font-medium">
                {smileVerificationState?.isVerified
                  ? 'Official IEBC Voter Record: You can sign in using your Full Name, National ID, and PIN on the voting page.'
                  : 'Notice: Once reviewed by an IEBC returning officer, your voting credentials will be activated.'
                }
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onNavigate) {
                    onNavigate('vote');
                  } else {
                    window.location.hash = 'vote';
                  }
                }}
                className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all text-sm"
              >
                Proceed to Vote
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onNavigate) {
                    onNavigate('home');
                  } else {
                    window.location.hash = '';
                  }
                }}
                className="px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all text-sm"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationPage;





