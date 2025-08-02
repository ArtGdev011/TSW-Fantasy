// src/firebaseConfig.js

// Import the necessary Firebase functions from the SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBkpza15mv5CswxyrknUX7hIUKmTLuX0D0",
  authDomain: "tsw-fantasy.firebaseapp.com",
  projectId: "tsw-fantasy",
  storageBucket: "tsw-fantasy.firebasestorage.app",
  messagingSenderId: "380158093213",
  appId: "1:380158093213:web:1f2b2651cc601e56faf174"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize and export Firestore database instance
export const db = getFirestore(app);

// Initialize and export Firebase Authentication instance
export const auth = getAuth(app);

// Optionally export the initialized app instance
export default app;
