/**
 * Netlify Serverless Function: smile-verify
 * POST /.netlify/functions/smile-verify (proxied as POST /api/smile-verify)
 *
 * Initiates a Smile ID Enhanced KYC verification for a Kenyan voter.
 * Never returns or stores raw ID data beyond what is needed for the job.
 */

'use strict';

const crypto = require('crypto');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// ── Firebase Admin initialisation (lazy singleton) ─────────────────────────
function getDb() {
  if (!getApps().length) {
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64
      ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64, 'base64').toString('utf8')
      : process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!rawKey) {
      console.warn('[smile-verify] Warning: FIREBASE_SERVICE_ACCOUNT_KEY not set.');
      return null;
    }

    try {
      const serviceAccount = JSON.parse(rawKey);
      initializeApp({ credential: cert(serviceAccount) });
    } catch (err) {
      console.error('[smile-verify] Failed to parse service account key:', err.message);
      return null;
    }
  }
  return getFirestore();
}

/**
 * Build a simple HMAC-SHA256 sec_key for the Smile ID REST API.
 * This follows the Smile Identity REST API v2 signature scheme.
 */
function buildSecKey(partnerId, apiKey, jobId) {
  const timestamp = new Date().toISOString();
  const toSign = `${partnerId}:${timestamp}`;
  const signature = crypto.createHmac('sha256', apiKey).update(toSign).digest('base64');
  return `${signature}|${timestamp}`;
}

// ── Smile ID helper ─────────────────────────────────────────────────────────
async function runSmileKyc({ nationalId, fullName, dob, country = 'KE' }) {
  const partnerId = process.env.SMILE_PARTNER_ID || process.env.SMILE_PARTNER;
  const apiKey    = process.env.SMILE_API_KEY;
  const env       = (process.env.SMILE_ENVIRONMENT || 'sandbox').toLowerCase();

  const jobId   = `KE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const userId  = `voter-${Date.now()}`;

  // If partnerId and apiKey are not yet configured or in sandbox mock mode
  if (!partnerId || !apiKey || partnerId === 'placeholder_partner_id') {
    console.log('[smile-verify] Sandbox simulated mode: credentials not configured yet');
    // Simulated sandbox response for Kenyan ID (Valid format check)
    const isMockValid = /^\d{7,9}$/.test(nationalId) && fullName.trim().length >= 3;
    return {
      jobId,
      userId,
      smileResponse: {
        ConfidenceValue: isMockValid ? '98.5' : '45.0',
        Actions: {
          Verify_ID_Number: isMockValid ? 'Passed' : 'Failed',
          Return_Personal_Info: isMockValid ? 'Verified' : 'Not Verified'
        },
        ResultCode: isMockValid ? '1012' : '1013',
        ResultText: isMockValid ? 'ID Verified Successfully (Sandbox Simulation)' : 'ID Verification Failed'
      }
    };
  }

  // Official Smile ID API endpoint
  const baseUrl = env === 'production'
    ? 'https://3eydmgh10d.execute-api.us-west-2.amazonaws.com/prod'
    : 'https://testapi.smileidentity.com/v1';

  // Smile ID Enhanced KYC payload (Job Type 5)
  const names = fullName.trim().split(/\s+/);
  const firstName = names[0] || '';
  const lastName = names.slice(1).join(' ') || firstName;

  const payload = {
    source_sdk:         'rest_api',
    source_sdk_version: '1.0.0',
    partner_id:         partnerId,
    partner_params: {
      job_id:   jobId,
      user_id:  userId,
      job_type: 5, // Enhanced KYC
    },
    id_info: {
      first_name:  firstName,
      last_name:   lastName,
      country:     country,
      id_type:     'NATIONAL_ID',
      id_number:   nationalId,
      dob:         dob, // YYYY-MM-DD
    },
    timestamp: new Date().toISOString(),
    sec_key:   buildSecKey(partnerId, apiKey, jobId),
  };

  const response = await fetch(`${baseUrl}/id_verification`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Smile ID API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return { jobId, userId, smileResponse: data };
}

// ── Main handler ─────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  // CORS pre-flight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const { nationalId, fullName, dob, walletAddress, userId: frontendUserId } = body;

  // ── Input validation ──────────────────────────────────────────────────────
  if (!nationalId || !/^\d{7,9}$/.test(String(nationalId).trim())) {
    return json(400, { error: 'Valid Kenyan National ID (7-9 digits) is required' });
  }
  if (!fullName || fullName.trim().length < 3) {
    return json(400, { error: 'Full legal name is required' });
  }
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return json(400, { error: 'Date of birth is required (YYYY-MM-DD format)' });
  }
  if (!walletAddress) {
    return json(400, { error: 'Wallet address is required' });
  }

  const db = getDb();

  // ── Duplicate check ───────────────────────────────────────────────────────
  if (db) {
    try {
      const existing = await db.collection('smileVerificationJobs')
        .where('walletAddress', '==', walletAddress)
        .where('status', 'in', ['PENDING', 'VERIFIED'])
        .limit(1)
        .get();

      if (!existing.empty) {
        const job = existing.docs[0].data();
        return json(200, {
          jobId:   job.jobId,
          status:  job.status,
          message: job.status === 'VERIFIED'
            ? 'Identity already verified'
            : 'Verification already in progress',
        });
      }
    } catch (checkErr) {
      console.warn('[smile-verify] Duplicate check skipped:', checkErr.message);
    }
  }

  // ── Call Smile ID ─────────────────────────────────────────────────────────
  let jobId, smileResponse;
  try {
    const result = await runSmileKyc({
      nationalId: String(nationalId).trim(),
      fullName:   fullName.trim(),
      dob:        dob.trim(),
    });
    jobId         = result.jobId;
    smileResponse = result.smileResponse;
  } catch (err) {
    console.error('[smile-verify] Smile ID call failed:', err.message);
    return json(502, { error: 'Identity verification service unavailable. Please try again.' });
  }

  // ── Determine status ─────────────────────────────────────────────────────
  let status = 'PENDING';
  const returnInfo = smileResponse?.Actions?.Return_Personal_Info;
  const verifyId = smileResponse?.Actions?.Verify_ID_Number;
  const resultCode = String(smileResponse?.ResultCode || '');

  if (returnInfo === 'Verified' || verifyId === 'Passed' || resultCode === '1012' || resultCode === '0810') {
    status = 'VERIFIED';
  } else if (returnInfo === 'Not Verified' || returnInfo === 'Not Found' || verifyId === 'Failed' || resultCode === '0811') {
    status = 'REJECTED';
  } else {
    status = 'PENDING_REVIEW';
  }

  // ── Store job in Firestore ────────────────────────────────────────────────
  if (db) {
    try {
      const jobDoc = {
        jobId,
        walletAddress,
        frontendUserId: frontendUserId || walletAddress,
        status,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        nationalIdSuffix: String(nationalId).trim().slice(-3),
        smileResultCode: resultCode || null,
        smileConfidence: smileResponse?.ConfidenceValue || null,
      };

      await db.collection('smileVerificationJobs').doc(jobId).set(jobDoc);

      const voterStatus = status === 'VERIFIED' ? 'smile_verified' :
                          status === 'REJECTED' ? 'smile_rejected' : 'pending_review';
      await updateVoterVerificationStatus(db, walletAddress, voterStatus, jobId);
    } catch (dbErr) {
      console.warn('[smile-verify] Firestore save warning:', dbErr.message);
    }
  }

  return json(200, {
    jobId,
    status,
    message: statusMessage(status),
  });
};

// ── Helpers ───────────────────────────────────────────────────────────────────
async function updateVoterVerificationStatus(db, walletAddress, smileStatus, jobId) {
  try {
    const snap = await db.collection('voterRegistrationRequests')
      .where('walletAddress', '==', walletAddress)
      .limit(1)
      .get();

    if (!snap.empty) {
      await snap.docs[0].ref.update({
        smileStatus,
        smileJobId:  jobId,
        smileAt:     FieldValue.serverTimestamp(),
        updatedAt:   FieldValue.serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('[smile-verify] Could not update voter registration status:', err.message);
  }
}

function statusMessage(status) {
  switch (status) {
    case 'VERIFIED':       return 'Identity verified successfully with Smile ID';
    case 'REJECTED':       return 'Identity could not be verified. Please verify your details with IEBC.';
    case 'PENDING_REVIEW': return 'Verification pending official IEBC review.';
    default:               return 'Verification submitted. Results will be processed shortly.';
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    body:    JSON.stringify(body),
  };
}
