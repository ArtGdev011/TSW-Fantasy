import React, { useState, useEffect } from 'react';
import { onAuthChange } from '../authService.js';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        console.log("✅ User is logged in:", user.email);
      } else {
        console.log("❌ User is not logged in");
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>❌ Not Logged In</h2>
        <p>Please log in to access the dashboard.</p>
        <a href="/login" style={{ color: '#007bff' }}>Go to Login</a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
      <h1>✅ Welcome to TSW Fantasy League Dashboard!</h1>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>User Information:</h3>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>User ID:</strong> {user.uid}</p>
        <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
        <p><strong>Account Created:</strong> {new Date(user.metadata.creationTime).toLocaleDateString()}</p>
        <p><strong>Last Login:</strong> {new Date(user.metadata.lastSignInTime).toLocaleDateString()}</p>
      </div>

      <div style={{ 
        backgroundColor: '#d4edda', 
        padding: '15px', 
        borderRadius: '8px',
        border: '1px solid #c3e6cb'
      }}>
        <h4>🎉 Firebase Authentication Working!</h4>
        <p>You are successfully logged in with Firebase Auth.</p>
        <p>This proves your Firebase configuration is working correctly.</p>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>What's Next?</h3>
        <ul>
          <li>✅ Firebase Auth is working</li>
          <li>✅ User state is being tracked</li>
          <li>✅ Protected routes are working</li>
          <li>🔄 Add your fantasy league features</li>
          <li>🔄 Add Firestore database operations</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
