import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResult {
  user: {
    uid: string;
    email: string;
    username: string;
    budget: number;
    totalPoints: number;
    gameweekPoints: number;
    rank: number;
  };
}

/**
 * Login user with Firebase Auth and return user data from Firestore
 */
export const loginUser = async (data: LoginData): Promise<LoginResult> => {
  try {
    const { email, password } = data;

    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Get user data from Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const userData = userDoc.data();

    // Update last active time
    await updateDoc(userDocRef, {
      lastActive: serverTimestamp()
    });

    return {
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        username: userData.username,
        budget: userData.budget,
        totalPoints: userData.totalPoints,
        gameweekPoints: userData.gameweekPoints,
        rank: userData.rank
      }
    };

  } catch (error: any) {
    // Re-throw with clean error message
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please try again later.');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled');
    } else {
      throw new Error('Login failed. Please try again.');
    }
  }
};
