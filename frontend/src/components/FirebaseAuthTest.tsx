import React, { useState } from 'react';
import { signupUser, loginUser, logoutUser } from '../services/authService';

/**
 * ✅ FIREBASE AUTH TEST COMPONENT
 * Following your step-by-step guide to test Firebase Auth properly
 */
const FirebaseAuthTest: React.FC = () => {
  const [email, setEmail] = useState('test@tswfantasy.com');
  const [password, setPassword] = useState('password123');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testSignup = async () => {
    setLoading(true);
    setResult('Testing signup...');
    
    try {
      // ✅ Step 1: Test pure Firebase Auth signup first
      const user = await signupUser(email, password);
      setResult(`✅ Signup Success! User ID: ${user.uid}`);
      console.log("✅ Firebase Auth user created:", user);
    } catch (error: any) {
      setResult(`❌ Signup Failed: ${error.code} - ${error.message}`);
      console.error("❌ Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setResult('Testing login...');
    
    try {
      // ✅ Step 2: Test Firebase Auth login
      const user = await loginUser(email, password);
      setResult(`✅ Login Success! User: ${user.email}`);
      console.log("✅ Firebase Auth login successful:", user);
    } catch (error: any) {
      setResult(`❌ Login Failed: ${error.code} - ${error.message}`);
      console.error("❌ Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const testLogout = async () => {
    setLoading(true);
    setResult('Testing logout...');
    
    try {
      // ✅ Step 3: Test Firebase Auth logout
      await logoutUser();
      setResult('✅ Logout Success!');
      console.log("✅ User signed out");
    } catch (error: any) {
      setResult(`❌ Logout Failed: ${error.message}`);
      console.error("❌ Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>🔥 Firebase Auth Test - Following Your Guide</h2>
      <p>Test Firebase Auth step-by-step (no MongoDB, no complex logic)</p>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', width: '250px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', width: '250px' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testSignup} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px 20px' }}
        >
          Test Signup
        </button>
        
        <button 
          onClick={testLogin} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px 20px' }}
        >
          Test Login
        </button>
        
        <button 
          onClick={testLogout} 
          disabled={loading}
          style={{ padding: '10px 20px' }}
        >
          Test Logout
        </button>
      </div>

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '5px',
        minHeight: '100px',
        fontFamily: 'monospace'
      }}>
        <strong>Result:</strong><br />
        {loading ? '⏳ Loading...' : result}
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h4>✅ What this test does RIGHT (following your guide):</h4>
        <ul>
          <li>✅ Imports Firebase auth from your config</li>
          <li>✅ Uses separate authService.js helper functions</li>
          <li>✅ Wraps everything in try/catch</li>
          <li>✅ Logs errors properly</li>
          <li>✅ Tests Firebase Auth BEFORE touching Firestore</li>
          <li>✅ No MongoDB assumptions</li>
          <li>✅ Proper async/await usage</li>
        </ul>
      </div>
    </div>
  );
};

export default FirebaseAuthTest;
