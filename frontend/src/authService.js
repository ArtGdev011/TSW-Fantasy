// Firebase Authentication Service
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from './firebaseConfig.js';

// Signup function
export const signup = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("✅ Signup successful:", userCredential.user.email);
    alert("Signup successful! Welcome!");
    return userCredential.user;
  } catch (error) {
    console.error("❌ Signup failed:", error.code, error.message);
    alert(`Signup failed: ${error.message}`);
    throw error;
  }
};

// Login function
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ Login successful:", userCredential.user.email);
    alert("Login successful! Welcome back!");
    return userCredential.user;
  } catch (error) {
    console.error("❌ Login failed:", error.code, error.message);
    alert(`Login failed: ${error.message}`);
    throw error;
  }
};

// Logout function
export const logout = async () => {
  try {
    await signOut(auth);
    console.log("✅ Logout successful");
    alert("Logged out successfully!");
    return true;
  } catch (error) {
    console.error("❌ Logout failed:", error.code, error.message);
    alert(`Logout failed: ${error.message}`);
    throw error;
  }
};

// Check if user is logged in (returns user or null)
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
