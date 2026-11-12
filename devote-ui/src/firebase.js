import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase config from environment variables
// In production, these should be set as REACT_APP_FIREBASE_* environment variables
// Note: Firebase config values are safe to expose client-side as they only identify your project
// Security is handled through Firebase Security Rules, not by hiding these values
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCmQ80bQ8vqORjuhpPsoiTYFRk3f4kPlUQ",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "blockchain-election-system.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "blockchain-election-system",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "blockchain-election-system.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "419059385621",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:419059385621:web:cf2c1d4fe4298e272ad51c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Note: Candidate photographs are now stored as Base64 in Firestore documents.
// Firebase Storage is no longer used for candidate photos.

export default app;