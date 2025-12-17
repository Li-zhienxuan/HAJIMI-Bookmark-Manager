import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Configuration handling
// In a real production app, use process.env.REACT_APP_*
// Here we attempt to read from the global variables if injected (as per original code), 
// otherwise fall back to environment variables or a placeholder.

const getFirebaseConfig = () => {
  if (typeof window !== 'undefined' && window.__firebase_config) {
    return typeof window.__firebase_config === 'string' 
      ? JSON.parse(window.__firebase_config) 
      : window.__firebase_config;
  }
  
  // Fallback for standard development
  return {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "YOUR_APP_ID"
  };
};

const config = getFirebaseConfig();
export const appId = (typeof window !== 'undefined' && window.__app_id) ? window.__app_id : 'default-app-id';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase Initialization Error:", error);
  // Re-throw or handle gracefully depending on app needs
  throw error;
}

export { app, auth, db };