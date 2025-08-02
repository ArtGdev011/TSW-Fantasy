import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, User } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string, email?: string, firstName?: string, lastName?: string) => Promise<boolean>;
  logout: () => void;
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
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to verify session with backend - no localStorage dependency
        const response = await authAPI.verify();
        if (response.valid && response.user) {
          setUser(response.user);
          setToken('session-valid'); // Don't need to store actual token
        }
      } catch (error) {
        console.log('🔐 No valid session found, user needs to login');
        // No localStorage cleanup needed - everything is session-based
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authAPI.login({ username, password });
      
      // Session-based auth - no localStorage needed, backend handles session
      setToken('session-valid');
      setUser(response.user);
      setShowAuthModal(false);
      
      toast.success(`Welcome back, ${response.user.username}!`);
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username: string, password: string, email?: string, firstName?: string, lastName?: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authAPI.signup({ username, password, email, firstName, lastName });
      
      // Session-based auth - no localStorage needed, backend handles session
      setToken('session-valid');
      setUser(response.user);
      setShowAuthModal(false);
      
      toast.success(`Welcome to TSW Fantasy League, ${response.user.username}!`);
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout to invalidate session
      await authAPI.logout();
    } catch (error) {
      console.log('Backend logout failed, proceeding with local logout');  
    }
    
    // Clear local state - no localStorage needed
    setToken(null);
    setUser(null);
    setShowAuthModal(true);
    toast.success('Logged out successfully');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    signup,
    logout,
    loading,
    isAuthenticated: !!user && !!token,
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
