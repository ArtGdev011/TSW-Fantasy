import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import EnhancedCreateTeamPage from './components/EnhancedCreateTeamPage';
import TeamPage from './components/TeamPage';
import Navbar from './components/Navbar';
import './App.css';

// Main App component with auth logic
const AppContent: React.FC = () => {
  const { isAuthenticated, loading, showAuthModal, setShowAuthModal, user } = useAuth();

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
