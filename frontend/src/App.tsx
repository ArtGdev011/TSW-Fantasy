import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContextFirebase';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import EnhancedCreateTeamPage from './components/EnhancedCreateTeamPage';
import TeamPage from './components/TeamPage';
import Navbar from './components/Navbar';
import LoginFirebase from './pages/LoginFirebase';
import RegisterFirebase from './pages/RegisterFirebase';
import Login from './pages/Login';
import FirebaseAuthTest from './components/FirebaseAuthTest';
import './App.css';

// 🔍 Extend Window interface for debug info
declare global {
  interface Window {
    tswDebugInfo: any;
    tswTest: any;
    tswDebug: any;
  }
}

// Main App component with auth logic
const AppContent: React.FC = () => {
  const { isAuthenticated, loading, showAuthModal, setShowAuthModal } = useAuth();

  // 🔍 Initialize Debug Logger on App Start
  useEffect(() => {
    console.log("%c🚀 TSW Fantasy League - Debug Mode Enabled", "color: #00ff00; font-size: 18px; font-weight: bold;");
    console.log("%c📊 Open Developer Tools to see detailed auth debugging", "color: #3b82f6; font-weight: bold;");
    console.log("%c🧪 Use window.tswTest commands for manual testing", "color: #8b5cf6; font-weight: bold;");
    
    // Add debug info to window
    window.tswDebugInfo = {
      appStarted: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV,
      firebase: {
        projectId: "tsw-fantasy",
        authDomain: "tsw-fantasy.firebaseapp.com"
      }
    };
    
    console.log("🔧 Debug info available at window.tswDebugInfo");
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tsw-black via-tsw-dark to-tsw-gray flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-tsw-blue/30 border-t-tsw-blue rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Loading TSW Guru</h2>
          <p className="text-gray-400">Preparing your fantasy experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App min-h-screen bg-gradient-to-br from-tsw-black via-tsw-dark to-tsw-gray">
      {/* Auth Modal - Shows on first load or when not authenticated */}
      <AuthModal 
        isOpen={showAuthModal || !isAuthenticated} 
        onClose={() => setShowAuthModal(false)}
      />

      {/* Main App Content - Only show when authenticated */}
      {isAuthenticated && (
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/create-team" element={<EnhancedCreateTeamPage />} />
            <Route path="/login-firebase" element={<LoginFirebase />} />
            <Route path="/register-firebase" element={<RegisterFirebase />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth-test" element={<FirebaseAuthTest />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      )}

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #3b82f6',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

// Root App component with providers
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
