import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import toast from 'react-hot-toast';

interface User {
  uid: string;
  username: string;
  email: string;
  budget: number;
  totalPoints: number;
  gameweekPoints: number;
  rank: number;
  createdAt?: any;
  lastActive?: any;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string, email?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        try {
          // Get user data from Firestore using display name (username)
          if (firebaseUser.displayName) {
            const usernameRef = doc(db, 'users', firebaseUser.displayName.toLowerCase());
            const userDoc = await getDoc(usernameRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUser({
                uid: firebaseUser.uid,
                username: userData.username,
                email: userData.email,
                budget: userData.budget,
                totalPoints: userData.totalPoints,
                gameweekPoints: userData.gameweekPoints,
                rank: userData.rank,
                createdAt: userData.createdAt,
                lastActive: userData.lastActive,
                isAdmin: userData.isAdmin || false
              });
              
              // Update last active
              await updateDoc(usernameRef, {
                lastActive: serverTimestamp()
              });
            }
          }
          setFirebaseUser(firebaseUser);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (username: string, password: string, email?: string): Promise<boolean> => {
    try {
      setLoading(true);

      // Validation
      if (!username || !password) {
        toast.error('Username and password are required');
        return false;
      }

      if (username.length < 3) {
        toast.error('Username must be at least 3 characters long');
        return false;
      }

      if (password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return false;
      }

      // Check if username already exists in Firestore
      const usernameRef = doc(db, 'users', username.toLowerCase());
      const usernameDoc = await getDoc(usernameRef);
      
      if (usernameDoc.exists()) {
        toast.error('Username already exists. Please choose a different username.');
        return false;
      }

      // Create user with Firebase Auth
      const userEmail = email || `${username.toLowerCase()}@tswfantasy.local`;
      const userCredential = await createUserWithEmailAndPassword(auth, userEmail, password);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile with username
      await updateProfile(firebaseUser, {
        displayName: username
      });

      // Create user document in Firestore
      const userData = {
        uid: firebaseUser.uid,
        username: username,
        email: userEmail,
        displayName: username,
        budget: 300000000, // £300M starting budget
        totalPoints: 0,
        gameweekPoints: 0,
        rank: 0,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        isAdmin: false,
        profileImage: null,
        preferences: {
          notifications: true,
          emailUpdates: email ? true : false
        }
      };

      await setDoc(usernameRef, userData);
      
      setShowAuthModal(false);
      toast.success(`Welcome to TSW Fantasy League, ${username}!`);
      return true;

    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please use a different email.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);

      if (!username || !password) {
        toast.error('Username and password are required');
        return false;
      }

      // Get user document from Firestore by username
      const usernameRef = doc(db, 'users', username.toLowerCase());
      const userDoc = await getDoc(usernameRef);

      if (!userDoc.exists()) {
        toast.error('Username or password is incorrect');
        return false;
      }

      const userData = userDoc.data();
      
      // Sign in with Firebase Auth using the stored email
      await signInWithEmailAndPassword(auth, userData.email, password);
      
      setShowAuthModal(false);
      toast.success(`Welcome back, ${userData.username}!`);
      return true;

    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Username or password is incorrect.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      }
      
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    login,
    signup,
    logout,
    loading,
    isAuthenticated: !!user && !!firebaseUser,
    showAuthModal,
    setShowAuthModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
