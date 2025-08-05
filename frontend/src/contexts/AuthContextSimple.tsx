import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { simpleAuth, AuthUser, LoginData, SignupData } from '../services/simpleAuth';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  login: (data: LoginData) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: any) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    console.log('🚀 AuthProvider initializing...');
    
    // Set up authentication state listener
    const unsubscribe = simpleAuth.onAuthStateChanged((authUser) => {
      console.log('🔔 Auth state changed:', authUser?.username || 'none');
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (data: LoginData): Promise<boolean> => {
    try {
      console.log('📥 AuthContext login attempt for:', data.username);
      setLoading(true);

      const user = await simpleAuth.login(data);
      
      toast.success(`Welcome back, ${user.username}!`);
      setShowAuthModal(false);
      return true;
    } catch (error: any) {
      console.error('❌ AuthContext login failed:', error);
      toast.error(error.message || 'Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    try {
      console.log('📝 AuthContext signup attempt for:', data.username);
      setLoading(true);

      const user = await simpleAuth.signup(data);
      
      toast.success(`Welcome to TSW Fantasy League, ${user.username}!`);
      setShowAuthModal(false);
      return true;
    } catch (error: any) {
      console.error('❌ AuthContext signup failed:', error);
      toast.error(error.message || 'Signup failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await simpleAuth.logout();
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('❌ Logout failed:', error);
      toast.error('Logout failed');
    }
  };

  const updateUser = async (updates: any): Promise<AuthUser> => {
    return await simpleAuth.updateUser(updates);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: simpleAuth.isAuthenticated(),
    loading,
    showAuthModal,
    setShowAuthModal,
    login,
    signup,
    logout,
    updateUser,
  };

  console.log('🔍 AuthProvider render:', { 
    hasUser: !!user, 
    isAuthenticated: value.isAuthenticated, 
    loading 
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
