import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  initializeFirestore, 
  Firestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';

// Configuration handling
// Supports Vite environment variables (import.meta.env)
// Falls back to global window injection (legacy/dev) or process.env

const getFirebaseConfig = () => {
  // 1. Check for Window injection (Custom implementations)
  if (typeof window !== 'undefined' && window.__firebase_config) {
    return typeof window.__firebase_config === 'string' 
      ? JSON.parse(window.__firebase_config) 
      : window.__firebase_config;
  }
  
  // 2. Check for Vite Environment Variables (Standard for Cloudflare Pages/Vite)
  if (import.meta.env) {
    // Check if keys are set in Vite env
    if(import.meta.env.VITE_FIREBASE_API_KEY) {
        return {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID
        };
    }
  }

  // 3. Fallback / Placeholder
  return {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
};

const config = getFirebaseConfig();
export const appId = (typeof window !== 'undefined' && window.__app_id) ? window.__app_id : 'default-app-id';

// Flag to check if configuration is valid (not placeholder)
export const isConfigured = config.apiKey !== "YOUR_API_KEY" && config.apiKey !== "";

// Initialize Firebase (Modular SDK)
const app: FirebaseApp = initializeApp(config);
const auth: Auth = getAuth(app);

// Initialize Firestore with Persistent Local Cache (Critical for reducing costs on public reads)
const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export { app, auth, db };