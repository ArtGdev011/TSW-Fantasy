import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContextFirebase';
import { User, Lock, Mail } from 'lucide-react';
import './Auth.css';

// 🔍 Debug Logger for Register Component
const debugLog = {
  success: (msg: string, data?: any) => {
    console.log(`%c✅ REGISTER SUCCESS: ${msg}`, 'color: #10b981; font-weight: bold;');
    if (data) console.log('📊 Data:', data);
  },
  error: (msg: string, error?: any) => {
    console.error(`%c❌ REGISTER ERROR: ${msg}`, 'color: #ef4444; font-weight: bold;');
    if (error) {
      console.group('🔍 Error Details:');
      console.error('  • Code:', error.code);
      console.error('  • Message:', error.message);
      console.error('  • Full Error:', error);
      console.groupEnd();
    }
  },
  info: (msg: string, data?: any) => {
    console.log(`%c📝 REGISTER INFO: ${msg}`, 'color: #3b82f6; font-weight: bold;');
    if (data) console.log('📊 Data:', data);
  },
  formData: (formData: any) => {
    console.group('%c📝 Register Form Data', 'color: #8b5cf6; font-weight: bold;');
    console.log('Username:', formData.username);
    console.log('Email:', formData.email);
    console.log('Password:', '*'.repeat(formData.password.length), `(${formData.password.length} characters)`);
    console.log('Confirm Password:', '*'.repeat(formData.confirmPassword.length), `(${formData.confirmPassword.length} characters)`);
    console.groupEnd();
  }
};

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { signup } = useAuth();
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
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 20) {
      newErrors.username = 'Username cannot exceed 20 characters';
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters and numbers';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    debugLog.info("🚀 Register form submitted");
    
    if (!validateForm()) {
      debugLog.error("Form validation failed", errors);
      return;
    }

    debugLog.formData(formData);
    setIsLoading(true);
    
    try {
      debugLog.info("🔐 Attempting registration with AuthContext");
      
      const success = await signup(
        formData.username, 
        formData.password, 
        formData.email || undefined
      );
      
      if (success) {
        debugLog.success("Registration successful", { username: formData.username });
        navigate('/dashboard');
      } else {
        debugLog.error("Registration returned false (failed)");
      }
      
    } catch (error: any) {
      debugLog.error("Registration failed", error);
      console.error('Registration error:', error);
      
      // Handle specific Firebase errors for user feedback
      let errorMessage = "Registration failed. Please try again.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Email is already registered. Try logging in instead.";
        debugLog.error("Email already in use");
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please use at least 6 characters.";
        debugLog.error("Weak password provided");
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format. Please check your email.";
        debugLog.error("Invalid email format");
      } else if (error.code === 'permission-denied') {
        errorMessage = "Database access denied. Please contact support.";
        debugLog.error("Firestore permission denied");
      } else if (error.message && error.message.includes('Username already exists')) {
        errorMessage = "Username is already taken. Please choose a different one.";
        debugLog.error("Username already exists");
      } else {
        debugLog.error("Unknown registration error", error);
      }
      
      setErrors({ general: errorMessage });
      
    } finally {
      setIsLoading(false);
      debugLog.info("Registration attempt completed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Create Account</h1>
            <p>Join the TSW Fantasy League community</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Username *</label>
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
              <label htmlFor="email">Email (Optional)</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={errors.email ? 'error' : ''}
                />
              </div>
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
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

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'error' : ''}
                />
              </div>
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            <button 
              type="submit" 
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
