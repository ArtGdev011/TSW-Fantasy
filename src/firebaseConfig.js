import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBkpza15mv5CswxyrknUX7hIUKmTLuX0D0",
  authDomain: "tsw-fantasy.firebaseapp.com",
  projectId: "tsw-fantasy",
  storageBucket: "tsw-fantasy.appspot.com",
  messagingSenderId: "380158093213",
  appId: "1:380158093213:web:1f2b2651cc601e56faf174"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

  