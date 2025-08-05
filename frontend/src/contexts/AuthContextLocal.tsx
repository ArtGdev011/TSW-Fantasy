import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, AuthUser, LoginData, SignupData } from '../services/localAuth';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: AuthUser | null;
  login: (data: LoginData) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  updateUser: (updates: any) => Promise<void>;
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
    // Set up authentication state listener
    const unsubscribe = authService.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (data: LoginData): Promise<boolean> => {
    try {
      setLoading(true);

      const user = await authService.login(data);
      
      toast.success(`Welcome back, ${user.username}!`);
      setShowAuthModal(false);
      return true;
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(error.message || 'Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    try {
      setLoading(true);

      const user = await authService.signup(data);
      
      toast.success(`Welcome to TSW Fantasy League, ${user.username}!`);
      setShowAuthModal(false);
      return true;
    } catch (error: any) {
      console.error('Signup failed:', error);
      toast.error(error.message || 'Signup failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await authService.logout();
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('Logout failed:', error);
      toast.error('Logout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updates: any): Promise<void> => {
    try {
      await authService.updateUser(updates);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Update failed:', error);
      toast.error(error.message || 'Update failed. Please try again.');
    }
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    loading,
    isAuthenticated: authService.isAuthenticated(),
    showAuthModal,
    setShowAuthModal,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
