/**
 * Firebase Authentication Service
 * Clean, separated auth logic following best practices
 */

// 🔍 Enhanced Debug Logger for Auth Service
const debugLog = {
  success: (msg: string, data?: any) => {
    console.log(`%c✅ AUTH SUCCESS: ${msg}`, 'color: #10b981; font-weight: bold;');
    if (data) console.log('📊 Data:', data);
  },
  error: (msg: string, error?: any) => {
    console.error(`%c❌ AUTH ERROR: ${msg}`, 'color: #ef4444; font-weight: bold;');
    if (error) {
      console.error('🔍 Error Details:');
      console.error('  • Code:', error.code);
      console.error('  • Message:', error.message);
      console.error('  • Full Error:', error);
    }
  },
  warning: (msg: string, data?: any) => {
    console.warn(`%c⚠️ AUTH WARNING: ${msg}`, 'color: #f59e0b; font-weight: bold;');
    if (data) console.log('📊 Data:', data);
  },
  info: (msg: string, data?: any) => {
    console.log(`%c📝 AUTH INFO: ${msg}`, 'color: #3b82f6; font-weight: bold;');
    if (data) console.log('📊 Data:', data);
  },
  firebase: (msg: string, data?: any) => {
    console.log(`%c🔥 FIREBASE: ${msg}`, 'color: #ff6b35; font-weight: bold;');
    if (data) console.log('📊 Data:', data);
  },
  step: (step: number, msg: string, data?: any) => {
    console.log(`%c🔢 STEP ${step}: ${msg}`, 'color: #8b5cf6; font-weight: bold;');
    if (data) console.log('📊 Data:', data);
  },
  formData: (formData: any, operation: string) => {
    console.group(`%c📝 Form Data for ${operation}`, 'color: #8b5cf6; font-weight: bold;');
    Object.entries(formData).forEach(([key, value]: [string, any]) => {
      if (key.toLowerCase().includes('password')) {
        console.log(`${key}: ${'*'.repeat(value.length)} (${value.length} characters)`);
      } else {
        console.log(`${key}: ${value}`);
      }
    });
    console.groupEnd();
  }
};

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
  debugLog.step(1, "Starting Firebase Auth signup");
  debugLog.info("Signup attempt", { email, passwordLength: password.length });
  
  try {
    debugLog.firebase("Calling createUserWithEmailAndPassword");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    debugLog.success("Firebase Auth signup successful", { 
      uid: userCredential.user.uid,
      email: userCredential.user.email 
    });
    
    return userCredential.user;
  } catch (error: any) {
    debugLog.error("Signup failed", error);
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
  debugLog.step(1, "Starting signup with username");
  debugLog.formData({ username, email, password }, "signupWithUsername");
  
  try {
    // Step 4a: Check if username exists in Firestore
    debugLog.step(2, "Checking if username exists", { username });
    const usernameRef = doc(db, 'users', username.toLowerCase());
    const usernameDoc = await getDoc(usernameRef);
    
    if (usernameDoc.exists()) {
      debugLog.error("Username already exists", { username });
      throw new Error('Username already exists. Please choose a different username.');
    }
    debugLog.success("Username is available", { username });

    // Step 4b: Create Firebase Auth user
    debugLog.step(3, "Creating Firebase Auth user");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    debugLog.success("Firebase Auth user created", { 
      uid: firebaseUser.uid, 
      email: firebaseUser.email 
    });

    // Step 4c: Update Firebase Auth profile with username
    debugLog.step(4, "Updating Firebase Auth profile");
    await updateProfile(firebaseUser, {
      displayName: username
    });
    debugLog.success("Firebase Auth profile updated", { displayName: username });

    debugLog.step(5, "Creating user document in Firestore");
    debugLog.info("About to write to Firestore", {
      docPath: `users/${username.toLowerCase()}`,
      userId: firebaseUser.uid,
      email: email
    });
    
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

    try {
      await setDoc(usernameRef, userData);
      debugLog.success("User document created in Firestore", { 
        docPath: `users/${username.toLowerCase()}`,
        userData: { ...userData, createdAt: '[ServerTimestamp]', lastActive: '[ServerTimestamp]' }
      });
    } catch (firestoreError: any) {
      debugLog.error("Firestore write failed", firestoreError);
      debugLog.info("Firestore error details", {
        code: firestoreError.code,
        message: firestoreError.message,
        authUser: firebaseUser.uid,
        docPath: `users/${username.toLowerCase()}`
      });
      
      // If Firestore fails, we should delete the Firebase Auth user to avoid orphaned accounts
      debugLog.warning("Cleaning up Firebase Auth user due to Firestore failure");
      try {
        await firebaseUser.delete();
        debugLog.info("Firebase Auth user deleted successfully");
      } catch (deleteError: any) {
        debugLog.error("Failed to delete Firebase Auth user", deleteError);
      }
      
      throw firestoreError;
    }
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
  debugLog.step(1, "Starting login with username");
  debugLog.formData({ username, password }, "loginWithUsername");
  
  try {
    // Get user document to find email
    debugLog.step(2, "Looking up user document", { username });
    const usernameRef = doc(db, 'users', username.toLowerCase());
    const userDoc = await getDoc(usernameRef);
    
    if (!userDoc.exists()) {
      debugLog.error("Username not found in Firestore", { 
        username, 
        docPath: `users/${username.toLowerCase()}` 
      });
      throw new Error('Username not found');
    }
    
    const userData = userDoc.data();
    const email = userData.email;
    debugLog.success("User document found", { 
      username, 
      email, 
      uid: userData.uid 
    });
    
    // Login with email
    debugLog.step(3, "Attempting Firebase Auth login", { email });
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    debugLog.success("Firebase Auth login successful", { 
      uid: userCredential.user.uid,
      email: userCredential.user.email 
    });
    
    // Update last active
    debugLog.step(4, "Updating last active timestamp");
    await updateDoc(usernameRef, {
      lastActive: serverTimestamp()
    });
    debugLog.success("Last active timestamp updated");
    
    debugLog.success("Username login completed successfully", { username });
    return {
      firebaseUser: userCredential.user,
      userData
    };
  } catch (error: any) {
    debugLog.error("Username login failed", error);
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
