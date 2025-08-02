const express = require('express');
const rateLimit = require('express-rate-limit');
const { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} = require('firebase/auth');
const { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} = require('firebase/firestore');

// Import Firebase config
const { auth, db } = require('../config/firebase');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * POST /api/auth/signup
 * Register a new user account using Firebase Auth
 */
router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Username and password are required.'
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        error: 'Invalid username',
        message: 'Username must be at least 3 characters long.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check if username already exists in Firestore
    const usernameRef = doc(db, 'users', username.toLowerCase());
    const usernameDoc = await getDoc(usernameRef);
    
    if (usernameDoc.exists()) {
      return res.status(409).json({
        error: 'Username already exists',
        message: 'Please choose a different username.'
      });
    }

    // Create user with Firebase Auth (using email if provided, otherwise generate one)
    const userEmail = email || `${username.toLowerCase()}@tswfantasy.local`;
    const userCredential = await createUserWithEmailAndPassword(auth, userEmail, password);
    const firebaseUser = userCredential.user;

    // Update Firebase Auth profile with username
    await updateProfile(firebaseUser, {
      displayName: username
    });

    // Create user document in Firestore
    const userData = {
      uid: firebaseUser.uid,
      username: username,
      email: userEmail,
      displayName: username,
      budget: 300000000, // £300M starting budget
      totalPoints: 0,
      gameweekPoints: 0,
      rank: 0,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      isAdmin: false,
      profileImage: null,
      preferences: {
        notifications: true,
        emailUpdates: email ? true : false
      }
    };

    await setDoc(usernameRef, userData);
    console.log(`✅ New user registered: ${username} (UID: ${firebaseUser.uid})`);

    // Store user in session
    req.session.userId = firebaseUser.uid;
    req.session.username = username;

    // Return user data without sensitive info
    const userResponse = {
      uid: firebaseUser.uid,
      username: userData.username,
      email: userData.email,
      budget: userData.budget,
      totalPoints: userData.totalPoints,
      gameweekPoints: userData.gameweekPoints,
      rank: userData.rank,
      createdAt: userData.createdAt,
      lastActive: userData.lastActive
    };

    res.status(201).json({
      message: `Welcome to TSW Fantasy League, ${username}!`,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Firebase signup error:', error);
    
    let errorMessage = 'An error occurred while creating your account. Please try again.';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered. Please use a different email.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please choose a stronger password.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.';
    }

    res.status(500).json({
      error: 'Registration failed',
      message: errorMessage
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user using Firebase Auth
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required.'
      });
    }

    // Get user document from Firestore by username
    const usernameRef = doc(db, 'users', username.toLowerCase());
    const userDoc = await getDoc(usernameRef);

    if (!userDoc.exists()) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect.'
      });
    }

    const userData = userDoc.data();
    
    // Sign in with Firebase Auth using the stored email
    const userCredential = await signInWithEmailAndPassword(auth, userData.email, password);
    const firebaseUser = userCredential.user;

    // Update last active time
    await updateDoc(usernameRef, {
      lastActive: serverTimestamp()
    });

    // Store user in session
    req.session.userId = firebaseUser.uid;
    req.session.username = userData.username;
    req.session.isAdmin = userData.isAdmin || false;

    console.log(`✅ User logged in: ${userData.username} (UID: ${firebaseUser.uid})`);

    // Return user data
    const userResponse = {
      uid: firebaseUser.uid,
      username: userData.username,
      email: userData.email,
      budget: userData.budget,
      totalPoints: userData.totalPoints,
      gameweekPoints: userData.gameweekPoints,
      rank: userData.rank,
      createdAt: userData.createdAt,
      lastActive: serverTimestamp()
    };

    res.json({
      message: `Welcome back, ${userData.username}!`,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Firebase login error:', error);
    
    let errorMessage = 'Login failed. Please try again.';
    
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      errorMessage = 'Username or password is incorrect.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Please try again later.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'This account has been disabled. Please contact support.';
    }

    res.status(401).json({
      error: 'Authentication failed',
      message: errorMessage
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify current session
 */
router.post('/verify', async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.json({ valid: false });
    }

    // Get user data from Firestore
    const usernameRef = doc(db, 'users', req.session.username.toLowerCase());
    const userDoc = await getDoc(usernameRef);

    if (!userDoc.exists()) {
      req.session.destroy();
      return res.json({ valid: false });
    }

    const userData = userDoc.data();

    res.json({
      valid: true,
      user: {
        uid: userData.uid,
        username: userData.username,
        email: userData.email,
        budget: userData.budget,
        totalPoints: userData.totalPoints,
        gameweekPoints: userData.gameweekPoints,
        rank: userData.rank,
        createdAt: userData.createdAt,
        lastActive: userData.lastActive
      }
    });

  } catch (error) {
    console.error('❌ Session verification error:', error);
    res.json({ valid: false });
  }
});

/**
 * POST /api/auth/logout
 * Logout user and destroy session
 */
router.post('/logout', (req, res) => {
  const username = req.session?.username || 'Unknown user';
  
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Session destruction error:', err);
      return res.status(500).json({
        error: 'Logout failed',
        message: 'An error occurred while logging out.'
      });
    }
    
    console.log(`✅ User logged out: ${username}`);
    res.json({ message: 'Logged out successfully' });
  });
});

/**
 * POST /api/auth/forgot-password
 * Send password reset email using Firebase Auth
 */
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        error: 'Username required',
        message: 'Please provide your username.'
      });
    }

    // Get user email from Firestore
    const usernameRef = doc(db, 'users', username.toLowerCase());
    const userDoc = await getDoc(usernameRef);

    if (!userDoc.exists()) {
      // Don't reveal if username exists or not for security
      return res.json({
        message: 'If your username is registered, you will receive a password reset email.'
      });
    }

    const userData = userDoc.data();
    
    // Send password reset email via Firebase Auth
    await sendPasswordResetEmail(auth, userData.email);

    console.log(`✅ Password reset email sent to: ${userData.email}`);

    res.json({
      message: 'If your username is registered, you will receive a password reset email.'
    });

  } catch (error) {
    console.error('❌ Password reset error:', error);
    res.status(500).json({
      error: 'Password reset failed',
      message: 'An error occurred while sending the password reset email.'
    });
  }
});

module.exports = router;
