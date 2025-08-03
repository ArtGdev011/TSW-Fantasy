/**
 * Firebase Authentication Service
 * Clean, separated auth logic following best practices
 */

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

/**
 * Step 1: Pure Firebase Auth Signup (no Firestore yet)
 */
export const signupUser = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("✅ Firebase Auth signup successful:", userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error("❌ Signup failed:", error.code, error.message);
    throw error;
  }
};

/**
 * Step 2: Login with Firebase Auth
 */
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ Firebase Auth login successful:", userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error("❌ Login failed:", error.code, error.message);
    throw error;
  }
};

/**
 * Step 3: Logout
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log("✅ User signed out successfully");
    return true;
  } catch (error: any) {
    console.error("❌ Logout failed:", error.code, error.message);
    throw error;
  }
};

/**
 * Step 4: Enhanced signup with username and Firestore
 */
export const signupWithUsername = async (username: string, email: string, password: string) => {
  try {
    // Step 4a: Check if username exists in Firestore
    const usernameRef = doc(db, 'users', username.toLowerCase());
    const usernameDoc = await getDoc(usernameRef);
    
    if (usernameDoc.exists()) {
      throw new Error('Username already exists. Please choose a different username.');
    }

    // Step 4b: Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Step 4c: Update Firebase Auth profile with username
    await updateProfile(firebaseUser, {
      displayName: username
    });

    // Step 4d: Create user document in Firestore
    const userData = {
      uid: firebaseUser.uid,
      username: username,
      email: email,
      displayName: username,
      budget: 150000000, // €150M starting budget  
      totalPoints: 0,
      gameweekPoints: 0,
      rank: 0,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      isAdmin: false,
      hasTeam: false
    };

    await setDoc(usernameRef, userData);
    console.log("✅ User document created in Firestore:", username);

    return {
      firebaseUser,
      userData
    };
  } catch (error: any) {
    console.error("❌ Enhanced signup failed:", error.code, error.message);
    throw error;
  }
};

/**
 * Step 5: Login with username (convert to email internally)
 */
export const loginWithUsername = async (username: string, password: string) => {
  try {
    // Get user document to find email
    const usernameRef = doc(db, 'users', username.toLowerCase());
    const userDoc = await getDoc(usernameRef);
    
    if (!userDoc.exists()) {
      throw new Error('Username not found');
    }
    
    const userData = userDoc.data();
    const email = userData.email;
    
    // Login with email
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Update last active
    await updateDoc(usernameRef, {
      lastActive: serverTimestamp()
    });
    
    console.log("✅ Username login successful:", username);
    return {
      firebaseUser: userCredential.user,
      userData
    };
  } catch (error: any) {
    console.error("❌ Username login failed:", error.code, error.message);
    throw error;
  }
};

/**
 * Step 6: Get user data from Firestore
 */
export const getUserData = async (username: string) => {
  try {
    const usernameRef = doc(db, 'users', username.toLowerCase());
    const userDoc = await getDoc(usernameRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    }
    
    return null;
  } catch (error: any) {
    console.error("❌ Failed to get user data:", error.code, error.message);
    throw error;
  }
};
