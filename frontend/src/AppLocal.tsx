import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContextLocal';
import { playerService } from './services/playerService';
import { inboxService } from './services/inboxService';
import AuthModal from './components/AuthModalLocal';
import Dashboard from './components/Dashboard';
import TeamPage from './components/TeamPage';
import Navbar from './components/Navbar';
import CreateTeamPage from './components/CreateTeamPage';
import PlayersPage from './components/PlayersPage';
import InboxPage from './components/InboxPage';
import LeaderboardPage from './components/LeaderboardPage';
import SettingsPage from './components/SettingsPage';
import './App.css';

// Extend Window interface for debug info
declare global {
  interface Window {
    tswDebugInfo: any;
    tswLocalStorage: any;
  }
}

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

// Public Route Component (redirects to dashboard if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

// Landing Page Component
const LandingPage: React.FC = () => {
  const { setShowAuthModal } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-6">
            TSW Fantasy League
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Create your dream team, compete with friends, and become the ultimate fantasy manager. 
            All data stored locally - no more external dependencies!
          </p>
          <div className="space-x-4">
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300"
            >
              Get Started
            </button>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl mb-4">⚽</div>
              <h3 className="text-xl font-bold mb-2">Create Your Team</h3>
              <p className="text-gray-300">Build your squad with £300M budget</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl mb-4">🏆</div>
              <h3 className="text-xl font-bold mb-2">Compete & Win</h3>
              <p className="text-gray-300">Climb the leaderboard and prove yourself</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl mb-4">💾</div>
              <h3 className="text-xl font-bold mb-2">Local Storage</h3>
              <p className="text-gray-300">All data stored securely in your browser</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App component with auth logic
const AppContent: React.FC = () => {
  const { isAuthenticated, loading, showAuthModal, user } = useAuth();

  // Initialize debug info and services
  useEffect(() => {
    console.log("%c🚀 TSW Fantasy League - Local Edition Started", "color: #00ff00; font-size: 18px; font-weight: bold;");
    console.log("%c💾 Using IndexedDB for local storage", "color: #3b82f6; font-weight: bold;");
    console.log("%c🔧 All Firebase dependencies removed", "color: #10b981; font-weight: bold;");
    
    // Add debug info to window
    window.tswDebugInfo = {
      appStarted: new Date().toISOString(),
      version: "2.0.0-local",
      environment: process.env.NODE_ENV,
      storage: "IndexedDB",
      firebaseRemoved: true,
    };

    // Add local storage debug utilities
    window.tswLocalStorage = {
      exportData: async () => {
        try {
          const { dbService } = await import('./services/indexedDB');
          return await dbService.exportData();
        } catch (error) {
          console.error('Export failed:', error);
        }
      },
      clearAllData: async () => {
        try {
          const { dbService } = await import('./services/indexedDB');
          await dbService.clearAllData();
          console.log('✅ All data cleared');
        } catch (error) {
          console.error('Clear failed:', error);
        }
      },
      initializePlayers: async () => {
        try {
          await playerService.initializeDefaultPlayers();
          console.log('✅ Default players initialized');
        } catch (error) {
          console.error('Initialization failed:', error);
        }
      }
    };
    
    console.log("🔧 Debug utilities available at window.tswLocalStorage");
    
    // Initialize default players if needed
    const initializeApp = async () => {
      try {
        await playerService.initializeDefaultPlayers();
      } catch (error) {
        console.error('Failed to initialize default players:', error);
      }
    };
    
    initializeApp();
  }, []);

  // Send welcome message for new users
  useEffect(() => {
    const sendWelcomeMessage = async () => {
      if (user && user.username) {
        try {
          await inboxService.sendWelcomeMessage(user.id, user.username);
        } catch (error) {
          console.error('Failed to send welcome message:', error);
        }
      }
    };

    if (isAuthenticated && user) {
      sendWelcomeMessage();
    }
  }, [isAuthenticated, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading TSW Fantasy League...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Router>
        {isAuthenticated && <Navbar />}
        
        <main className={isAuthenticated ? 'pt-16' : ''}>
          <Routes>
            <Route
              path="/"
              element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              }
            />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/team"
              element={
                <ProtectedRoute>
                  <TeamPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/create-team"
              element={
                <ProtectedRoute>
                  <CreateTeamPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/players"
              element={
                <ProtectedRoute>
                  <PlayersPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/inbox"
              element={
                <ProtectedRoute>
                  <InboxPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <LeaderboardPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            
            {/* Catch all route */}
            <Route
              path="*"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />
              }
            />
          </Routes>
        </main>
        
        {showAuthModal && <AuthModal />}
      </Router>
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
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

// Main App Component with Provider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
