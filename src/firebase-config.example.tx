// src/firebase-config.example.ts

/**
 * Firebase Configuration Example
 * -------------------------------
 * ⚠️ This file is a placeholder and **does not contain real credentials**.
 * ➔ To use Firebase authentication in this project:
 *    1. Copy this file and rename it to: firebase-config.ts
 *    2. Replace the placeholder strings with your actual Firebase project credentials.
 *    3. Never commit your real firebase-config.ts to version control (add it to .gitignore).
 * 
 * ✅ You can find your Firebase config in:
 *    - Firebase Console → Project Settings → General → Your apps → SDK setup
 */

import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

// Example placeholder configuration — replace with your own
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Export Firebase Auth instance
export const auth: Auth = getAuth(app);
