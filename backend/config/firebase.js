// Firebase Configuration for TSW Fantasy League Backend
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableNetwork } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBkpza15mv5CswxyrknUX7hIUKmTLuX0D0",
  authDomain: "tsw-fantasy.firebaseapp.com",
  projectId: "tsw-fantasy",
  storageBucket: "tsw-fantasy.appspot.com",
  messagingSenderId: "380158093213",
  appId: "1:380158093213:web:1f2b2651cc601e56faf174"
};

// Initialize Firebase (avoid multiple initialization)
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('🔥 Firebase initialized for backend');
} else {
  app = getApps()[0];
}

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence and network
export { app, auth, db };
export const enableOnline = () => enableNetwork(db);
export default app;
