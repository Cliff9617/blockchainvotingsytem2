/**
 * Netlify Serverless Function: smile-callback
 * POST /.netlify/functions/smile-callback (proxied as POST /api/smile-callback)
 *
 * Webhook handler for Smile Identity asynchronous verification results.
 * Validates the callback signature, updates Firestore records, and flags
 * unverified/borderline cases for administrator review.
 */

'use strict';

const crypto = require('crypto');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Lazy initialization of Firebase Admin
function getDb() {
  if (!getApps().length) {
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64 
      ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64, 'base64').toString('utf8')
      : process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!rawKey) {
      console.warn('[smile-callback] Warning: FIREBASE_SERVICE_ACCOUNT_KEY not set.');
      return null;
    }
    const serviceAccount = JSON.parse(rawKey);
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

/**
 * Verify Smile ID Webhook signature
 */
function verifySmileSignature(timestamp, signature, apiKey) {
  if (!signature || !apiKey || !timestamp) return false;
  try {
    const hmac = crypto.createHmac('sha256', apiKey);
    hmac.update(timestamp);
    const expected = hmac.digest('base64');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch (err) {
    console.error('[smile-callback] Signature verification error:', err.message);
    return false;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Smile-Signature',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON payload' })
    };
  }

  const apiKey = process.env.SMILE_API_KEY;
  const signature = event.headers['x-smile-signature'] || payload.signature;
  const timestamp = event.headers['x-smile-timestamp'] || payload.timestamp;

  // In production or when API key is configured, verify signature
  if (apiKey && signature && timestamp) {
    const isValid = verifySmileSignature(timestamp, signature, apiKey);
    if (!isValid) {
      console.warn('[smile-callback] Invalid signature detected.');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized callback signature' })
      };
    }
  }

  const partnerParams = payload.partner_params || {};
  const jobId = partnerParams.job_id || payload.job_id;
  const userId = partnerParams.user_id || payload.user_id;

  if (!jobId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing job_id in callback payload' })
    };
  }

  const resultCode = String(payload.ResultCode || '');
  const resultText = payload.ResultText || '';
  const actions = payload.Actions || {};

  // Decision logic based on Smile ID response codes and actions
  let verificationStatus = 'PENDING_REVIEW';
  
  const isVerified = (
    resultCode === '0810' || // Document and Face match
    resultCode === '1012' || // Enhanced KYC match
    actions.Return_Personal_Info === 'Verified' ||
    actions.Verify_ID_Number === 'Passed'
  );

  const isRejected = (
    resultCode === '0811' || // ID does not match
    actions.Return_Personal_Info === 'Not Verified' ||
    actions.Verify_ID_Number === 'Failed'
  );

  if (isVerified) {
    verificationStatus = 'VERIFIED';
  } else if (isRejected) {
    verificationStatus = 'REJECTED';
  } else {
    verificationStatus = 'PENDING_REVIEW';
  }

  const db = getDb();
  if (db) {
    try {
      // 1. Update verification jobs table
      const jobRef = db.collection('smileVerificationJobs').doc(jobId);
      const jobDoc = await jobRef.get();

      let walletAddress = null;
      if (jobDoc.exists) {
        walletAddress = jobDoc.data().walletAddress;
      }

      await jobRef.set({
        jobId,
        userId: userId || null,
        status: verificationStatus,
        resultCode,
        resultText,
        actions,
        confidence: payload.ConfidenceValue || null,
        callbackReceivedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      // 2. Update voter registration requests
      if (walletAddress) {
        const querySnap = await db.collection('voterRegistrationRequests')
          .where('walletAddress', '==', walletAddress)
          .limit(1)
          .get();

        if (!querySnap.empty) {
          const reqDoc = querySnap.docs[0];
          const newStatus = verificationStatus === 'VERIFIED' ? 'smile_verified' :
                            verificationStatus === 'REJECTED' ? 'smile_rejected' : 'pending_review';

          await reqDoc.ref.update({
            smileStatus: newStatus,
            smileResultCode: resultCode,
            smileResultText: resultText,
            smileReviewedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
          });
        }
      }
    } catch (dbErr) {
      console.error('[smile-callback] Database update error:', dbErr.message);
      // Return 200 anyway so Smile ID webhook does not repeatedly retry failing webhook
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: true,
      jobId,
      status: verificationStatus
    })
  };
};
