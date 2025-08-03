import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export interface SignupData {
  username: string;
  email: string;
  password: string;
}

export interface SignupResult {
  user: {
    uid: string;
    email: string;
    username: string;
  };
}

/**
 * Register a new user with Firebase Auth and create user document in Firestore
 */
export const signupUser = async (data: SignupData): Promise<SignupResult> => {
  try {
    const { username, email, password } = data;

    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update Firebase Auth profile with username
    await updateProfile(firebaseUser, {
      displayName: username
    });

    // Create user document in Firestore
    const userData = {
      uid: firebaseUser.uid,
      username: username,
      email: email,
      budget: 300000000, // £300M starting budget
      totalPoints: 0,
      gameweekPoints: 0,
      rank: 0,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp()
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    return {
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        username: username
      }
    };

  } catch (error: any) {
    // Re-throw with clean error message
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    } else {
      throw new Error('Registration failed. Please try again.');
    }
  }
};
