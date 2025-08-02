// Firebase Configuration for TSW Fantasy League Frontend
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  connectFirestoreEmulator,
  enableNetwork,
  disableNetwork 
} from "firebase/firestore";
import { 
  getAuth, 
  connectAuthEmulator 
} from "firebase/auth";
import { 
  getStorage, 
  connectStorageEmulator 
} from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBkpza15mv5CswxyrknUX7hIUKmTLuX0D0",
  authDomain: "tsw-fantasy.firebaseapp.com",
  projectId: "tsw-fantasy",
  storageBucket: "tsw-fantasy.firebasestorage.app",
  messagingSenderId: "380158093213",
  appId: "1:380158093213:web:1f2b2651cc601e56faf174"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Enable offline persistence
export const enableOffline = () => disableNetwork(db);
export const enableOnline = () => enableNetwork(db);

// Firebase collections
export const COLLECTIONS = {
  USERS: 'users',
  PLAYERS: 'players',
  TEAMS: 'teams',
  TICKETS: 'tickets',
  INBOX: 'inbox'
};

export default app;
