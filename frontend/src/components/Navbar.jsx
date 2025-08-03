import React, { useState, useEffect } from 'react';
import { logout, onAuthChange } from '../authService.js';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      // Success handled in authService
    } catch (error) {
      // Error handled in authService
    }
  };

  return (
    <nav style={{ 
      backgroundColor: '#007bff', 
      padding: '15px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <Link 
          to="/dashboard" 
          style={{ 
            color: 'white', 
            textDecoration: 'none', 
            fontSize: '20px',
            fontWeight: 'bold'
          }}
        >
          TSW Fantasy League
        </Link>
      </div>

      <div>
        {user ? (
          // Logged in user nav
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ color: 'white' }}>
              Welcome, {user.email}
            </span>
            <Link 
              to="/dashboard" 
              style={{ color: 'white', textDecoration: 'none' }}
            >
              Dashboard
            </Link>
            <button 
              onClick={handleLogout}
              style={{ 
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          // Not logged in nav
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link 
              to="/login" 
              style={{ color: 'white', textDecoration: 'none' }}
            >
              Login
            </Link>
            <Link 
              to="/signup" 
              style={{ 
                color: '#007bff',
                backgroundColor: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                textDecoration: 'none'
              }}
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
