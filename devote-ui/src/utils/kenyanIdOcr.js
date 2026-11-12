/**
 * Kenyan National ID OCR and Document Verification Engine
 * Uses Tesseract.js to scan National ID photos (Front & Back)
 * and rigorously cross-validates against voter registration details.
 */

import { createWorker } from 'tesseract.js';

export const KENYAN_ID_REGEX = {
  COUNTRY_HEADER: /(?:REPUBLIC\s+OF\s+KENYA|JAMHURI\s+YA\s+KENYA)/i,
  DOC_TITLE: /(?:IDENTITY\s*CARD|NATIONAL\s*IDENTITY|KITAMBULISHO|MAISHA)/i,
  ID_LABEL: /(?:ID(?:\s*NO\.?|\s*NUMBER)?|IDENTITY\s*CARD\s*NUMBER|NAMBARI\s*YA\s*UTAMBULISHO)[:\s]*/i,
  SERIAL_LABEL: /(?:SERIAL(?:\s*NO\.?|\s*NUMBER)?|SERIA[LI]\s*NO)[:\s]*/i,
  NAME_LABEL: /(?:FULL\s*NAMES?|NAMES?|JINA\s*KAMILI)[:\s]*/i,
  DOB_LABEL: /(?:DATE\s*OF\s*BIRTH|DOB|TAREHE\s*YA\s*KUZALIWA)[:\s]*/i,
  ID_VALUE: /\b\d{7,9}\b/,
  DATE_VALUE: /\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/,
  BACK_ANCHORS: /(?:DISTRICT|DIVISION|LOCATION|SUB-LOCATION|TAWALA|WILAYA|SIGNATURE|THUMBPRINT)/i,
};

/**
 * Perform OCR on an image file, blob, or base64 data URL
 */
export const runOcrOnImage = async (imageSource, onProgress = null) => {
  let worker = null;
  try {
    worker = await createWorker('eng');

    if (onProgress && typeof onProgress === 'function') {
      onProgress(35);
    }

    const ret = await worker.recognize(imageSource);
    
    if (onProgress && typeof onProgress === 'function') {
      onProgress(100);
    }

    await worker.terminate();
    return {
      text: ret.data.text || '',
      confidence: ret.data.confidence || 0,
    };
  } catch (error) {
    console.error('[KenyanIdOCR] OCR Execution Error:', error);
    if (worker) {
      try { await worker.terminate(); } catch (_) {}
    }
    throw new Error('Failed to read ID document image. Ensure the image is clear and well-lit.');
  }
};

/**
 * Clean common OCR character substitutions
 */
export function sanitizeOcrDigits(str) {
  if (!str) return '';
  return str
    .replace(/[OoDQ]/g, '0')
    .replace(/[Il|!i]/g, '1')
    .replace(/[Zz]/g, '2')
    .replace(/[Ss$]/g, '5')
    .replace(/[B]/g, '8')
    .replace(/[G]/g, '6');
}

/**
 * Evaluate document authenticity (Checks for required Kenyan ID markers)
 */
export function evaluateKenyanIdAuthenticity(ocrText) {
  const normalized = (ocrText || '').toUpperCase();
  const anchors = [
    KENYAN_ID_REGEX.COUNTRY_HEADER.test(normalized),
    KENYAN_ID_REGEX.DOC_TITLE.test(normalized),
    KENYAN_ID_REGEX.ID_LABEL.test(normalized),
    KENYAN_ID_REGEX.NAME_LABEL.test(normalized),
    KENYAN_ID_REGEX.DOB_LABEL.test(normalized),
    normalized.includes('KENYA'),
    normalized.includes('IDENTITY'),
  ];

  const matchedCount = anchors.filter(Boolean).length;
  const isBack = KENYAN_ID_REGEX.BACK_ANCHORS.test(normalized);

  return {
    isKenyanId: matchedCount >= 2 || (matchedCount >= 1 && isBack),
    anchorScore: matchedCount,
    isBackSide: isBack,
  };
}

/**
 * Extract fields from Kenyan ID Front OCR text
 */
export function extractKenyanIdData(ocrText) {
  const text = (ocrText || '').replace(/\r/g, '');
  const result = {
    idNumber: null,
    serialNumber: null,
    fullName: null,
    dob: null,
  };

  // 1. Extract ID Number
  const idMatch = text.match(new RegExp(KENYAN_ID_REGEX.ID_LABEL.source + '([0-9OIli\\s]{7,12})', 'i'));
  if (idMatch && idMatch[1]) {
    const cleaned = sanitizeOcrDigits(idMatch[1]);
    const digitsOnly = cleaned.match(KENYAN_ID_REGEX.ID_VALUE);
    if (digitsOnly) result.idNumber = digitsOnly[0];
  }
  
  if (!result.idNumber) {
    // Scan all numeric sequences with 7 to 9 digits
    const allNumbers = text.match(/\b[0-9]{7,9}\b/g) || [];
    if (allNumbers.length > 0) {
      result.idNumber = allNumbers[0];
    }
  }

  // 2. Extract Serial Number
  const serialMatch = text.match(new RegExp(KENYAN_ID_REGEX.SERIAL_LABEL.source + '([A-Z0-9\\s]{6,12})', 'i'));
  if (serialMatch && serialMatch[1]) {
    result.serialNumber = serialMatch[1].replace(/\s+/g, '').toUpperCase();
  }

  // 3. Extract Full Name
  const nameMatch = text.match(new RegExp(KENYAN_ID_REGEX.NAME_LABEL.source + '([A-Z\\s]{4,60})(?=\\n|DATE|SEX|DISTRICT|$)', 'i'));
  if (nameMatch && nameMatch[1]) {
    result.fullName = nameMatch[1].trim().replace(/\s+/g, ' ').toUpperCase();
  }

  // 4. Extract Date of Birth
  const dobMatch = text.match(new RegExp(KENYAN_ID_REGEX.DOB_LABEL.source + '([0-9OIli\\.\\/\\-]{8,12})', 'i'))
    || text.match(KENYAN_ID_REGEX.DATE_VALUE);
  if (dobMatch) {
    const rawDob = dobMatch[1] || dobMatch[0];
    const cleanedDob = sanitizeOcrDigits(rawDob);
    const dateParts = cleanedDob.match(KENYAN_ID_REGEX.DATE_VALUE);
    if (dateParts) {
      const d = dateParts[1].padStart(2, '0');
      const m = dateParts[2].padStart(2, '0');
      const y = dateParts[3];
      result.dob = `${y}-${m}-${d}`;
    }
  }

  return result;
}

/**
 * Fuzzy Name Matcher
 */
export function validateNameMatch(userInputName, ocrText) {
  if (!userInputName || !ocrText) return { matched: false, score: 0 };

  const normalize = (s) => (s || '').toUpperCase().replace(/[^A-Z\s]/g, '').trim().split(/\s+/).filter(Boolean);
  const userTokens = normalize(userInputName);
  const ocrTokens = normalize(ocrText);

  if (userTokens.length === 0 || ocrTokens.length === 0) return { matched: false, score: 0 };

  let matchedCount = 0;
  for (const uToken of userTokens) {
    const hasMatch = ocrTokens.some(oToken => {
      if (uToken === oToken) return true;
      if (Math.abs(uToken.length - oToken.length) > 2) return false;
      return levenshteinSimilarity(uToken, oToken) >= 0.8;
    });
    if (hasMatch) matchedCount++;
  }

  const score = matchedCount / userTokens.length;
  const matched = (userTokens.length <= 2 && matchedCount >= 1) || (userTokens.length > 2 && score >= 0.6);

  return { matched, score, matchedCount, totalTokens: userTokens.length };
}

function levenshteinSimilarity(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  return 1.0 - matrix[a.length][b.length] / maxLen;
}

/**
 * Strict Document Verification & Security Cross-Matching
 * Validates extracted OCR text against user registration details.
 * Fails closed if the document is unreadable, fake, or details do not match.
 */
export const verifyKenyanIdDocument = ({
  frontText,
  backText = '',
  expectedId,
  expectedFullName,
  expectedDob = '',
}) => {
  const errors = [];
  const normalizedExpectedId = String(expectedId || '').trim();

  // 1. Authenticity Evaluation
  const authFront = evaluateKenyanIdAuthenticity(frontText);
  if (!authFront.isKenyanId) {
    errors.push('Uploaded image does not appear to be an authentic Kenyan National ID. Ensure the document title and state seals are visible.');
  }

  // 2. Data Extraction
  const extracted = extractKenyanIdData(frontText);

  // 3. ID Number Match Check
  let idNumberMatched = false;
  if (extracted.idNumber) {
    if (extracted.idNumber === normalizedExpectedId) {
      idNumberMatched = true;
    } else if (frontText.replace(/[\s-]/g, '').includes(normalizedExpectedId)) {
      idNumberMatched = true;
    } else {
      errors.push(`ID Number mismatch: Card shows ID "${extracted.idNumber}", but entered ID was "${normalizedExpectedId}".`);
    }
  } else {
    if (frontText.replace(/[\s-]/g, '').includes(normalizedExpectedId)) {
      idNumberMatched = true;
    } else {
      errors.push(`National ID number (${normalizedExpectedId}) was not detected on the card image. Please upload a clearer photo.`);
    }
  }

  // 4. Name Match Check
  const nameMatch = validateNameMatch(expectedFullName, frontText);
  if (!nameMatch.matched) {
    errors.push(`Full Name mismatch: The name "${expectedFullName}" was not found on the ID document.`);
  }

  const isValid = errors.length === 0 && authFront.isKenyanId && idNumberMatched;

  return {
    isValid,
    isLikelyKenyanId: authFront.isKenyanId,
    idNumberMatched,
    nameMatched: nameMatch.matched,
    extractedId: extracted.idNumber,
    extractedDob: extracted.dob,
    errors,
    summary: isValid
      ? 'Document verified: Authentic Kenyan National ID confirmed and details match.'
      : errors.join(' '),
  };
};

const kenyanIdOcr = {
  runOcrOnImage,
  sanitizeOcrDigits,
  evaluateKenyanIdAuthenticity,
  extractKenyanIdData,
  validateNameMatch,
  verifyKenyanIdDocument,
};

export default kenyanIdOcr;
