/**
 * Firebase Client SDK Configuration
 * تكوين Firebase للاستخدام في Server والClient
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * الحصول على Firebase App (singleton pattern)
 */
function getFirebaseApp(): FirebaseApp {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }
  return initializeApp(firebaseConfig);
}

// Initialize Firebase App
const app: FirebaseApp = getFirebaseApp();

// Initialize Firestore
const db: Firestore = getFirestore(app);

// Initialize Auth
const auth: Auth = getAuth(app);

/**
 * الحصول على Firestore Database
 */
export function getFirestoreDB(): Firestore {
  return db;
}

/**
 * الحصول على Firebase Auth
 */
export function getFirebaseAuth(): Auth {
  return auth;
}

// Exports
export { app, db, auth };
export default app;
