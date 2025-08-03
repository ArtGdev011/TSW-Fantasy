import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithUsername } from '../services/authService';
import { User, Lock } from 'lucide-react';
import './Auth.css';

// 🔍 Debug Logger for Login Component
const debugLog = {
  success: (msg: string, data?: any) => {
    console.log(`%c✅ LOGIN SUCCESS: ${msg}`, 'color: #10b981; font-weight: bold;');
    if (data) console.log('📊 Data:', data);
  },
  error: (msg: string, error?: any) => {
    console.error(`%c❌ LOGIN ERROR: ${msg}`, 'color: #ef4444; font-weight: bold;');
    if (error) {
      console.group('🔍 Error Details:');
      console.error('  • Code:', error.code);
      console.error('  • Message:', error.message);
      console.error('  • Full Error:', error);
      console.groupEnd();
    }
  },
  info: (msg: string, data?: any) => {
    console.log(`%c📝 LOGIN INFO: ${msg}`, 'color: #3b82f6; font-weight: bold;');
    if (data) console.log('📊 Data:', data);
  },
  formData: (formData: any) => {
    console.group('%c📝 Login Form Data', 'color: #8b5cf6; font-weight: bold;');
    console.log('Username:', formData.username);
    console.log('Password:', '*'.repeat(formData.password.length), `(${formData.password.length} characters)`);
    console.groupEnd();
  }
};

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    debugLog.info("🚀 Login form submitted");
    
    if (!validateForm()) {
      debugLog.error("Form validation failed", errors);
      return;
    }

    debugLog.formData(formData);
    setIsLoading(true);
    
    try {
      debugLog.info("🔐 Attempting login with authService");
      
      // ✅ Using proper authService following best practices
      const result = await loginWithUsername(formData.username, formData.password);
      
      debugLog.success("Login successful", {
        uid: result.firebaseUser.uid,
        email: result.firebaseUser.email,
        username: result.userData.username
      });
      
      console.log("✅ Login successful:", result);
      navigate('/dashboard');
      
    } catch (error: any) {
      debugLog.error("Login failed", error);
      console.error("❌ Login error:", error);
      
      // Handle specific Firebase errors
      let errorMessage = "Login failed. Please check your credentials.";
      
      if (error.code === 'auth/user-not-found' || error.message.includes('Username not found')) {
        errorMessage = "Username not found. Please check your username.";
        debugLog.error("Username not found in database");
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again.";
        debugLog.error("Incorrect password provided");
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
        debugLog.error("Rate limited due to too many failed attempts");
      } else if (error.code === 'permission-denied') {
        errorMessage = "Database access denied. Please contact support.";
        debugLog.error("Firestore permission denied");
      } else {
        debugLog.error("Unknown login error", error);
      }
      
      setErrors({ general: errorMessage });
      
    } finally {
      setIsLoading(false);
      debugLog.info("Login attempt completed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Welcome Back</h1>
            <p>Sign in to your TSW Fantasy League account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {errors.general && (
              <div className="error-banner">
                {errors.general}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  className={errors.username ? 'error' : ''}
                />
              </div>
              {errors.username && <span className="error-message">{errors.username}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={errors.password ? 'error' : ''}
                />
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <button 
              type="submit" 
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account? <Link to="/register">Create one here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
