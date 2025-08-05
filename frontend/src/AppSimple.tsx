import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContextSimple';
import { playerService } from './services/playerService';
import { inboxService } from './services/inboxService';
import AuthModal from './components/AuthModalSimple';
import Dashboard from './components/Dashboard';
import TeamPage from './components/TeamPage';
import Navbar from './components/Navbar';
import CreateTeamPage from './components/CreateTeamPage';
import PlayersPage from './components/PlayersPage';
import InboxPage from './components/InboxPage';
import LeaderboardPage from './components/LeaderboardPage';
import SettingsPage from './components/SettingsPage';

// Simple inline styles to avoid CSS issues
const globalStyles = {
  body: {
    margin: 0,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#f8fafc',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    marginBottom: '1rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.2s',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    flexDirection: 'column' as const,
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
};

// Inject spinner animation
const styleSheet = document.createElement('style');
styleSheet.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={globalStyles.loading}>
        <div style={globalStyles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

// Public Route Component
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={globalStyles.loading}>
        <div style={globalStyles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

// Landing Page Component
const LandingPage: React.FC = () => {
  const { setShowAuthModal } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={globalStyles.container}>
        <div style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: 'bold' }}>
            TSW Fantasy League
          </h1>
          <p style={{ fontSize: '1.25rem', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Create your dream team, compete with friends, and become the ultimate fantasy manager. 
            All data stored locally - no external dependencies!
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            style={{
              ...globalStyles.button,
              ...globalStyles.primaryButton,
              fontSize: '1.125rem',
              padding: '1rem 2rem',
            }}
          >
            Get Started
          </button>
          
          <div style={{
            marginTop: '3rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            maxWidth: '800px',
            margin: '3rem auto 0',
          }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '1.5rem',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚽</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Create Your Team</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Build your squad with £300M budget</p>
            </div>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '1.5rem',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏆</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Compete & Win</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Climb the leaderboard and prove yourself</p>
            </div>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '1.5rem',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💾</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Local Storage</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>All data stored securely in your browser</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App component
const AppContent: React.FC = () => {
  const { isAuthenticated, loading, showAuthModal, user } = useAuth();

  // Initialize app
  useEffect(() => {
    console.log('🚀 TSW Fantasy League - Simple Edition Started');
    console.log('💾 Using IndexedDB for local storage');
    console.log('🔧 All Firebase dependencies removed');
    
    // Initialize default players
    const initializeApp = async () => {
      try {
        await playerService.initializeDefaultPlayers();
        console.log('✅ Default players initialized');
      } catch (error) {
        console.error('❌ Failed to initialize default players:', error);
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
      <div style={globalStyles.loading}>
        <div style={globalStyles.spinner}></div>
        <p style={{ color: '#6b7280' }}>Loading TSW Fantasy League...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Router>
        {isAuthenticated && <Navbar />}
        
        <main style={isAuthenticated ? { paddingTop: '4rem' } : {}}>
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
