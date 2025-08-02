const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { validateRequest, registerSchema, loginSchema } = require('../middleware/validate');

const router = express.Router();

// Environment variables with safe fallbacks
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

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
 * Register a new user account - Session-based authentication
 */
router.post('/signup', authLimiter, validateRequest(registerSchema), async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // Check if username already exists (case-insensitive)
    const existingUser = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Username already exists',
        message: 'Please choose a different username.'
      });
    }
    
    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(409).json({ 
          error: 'Email already registered',
          message: 'An account with this email already exists.'
        });
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    
    // Create new user with 300M budget (£300,000,000)
    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      budget: 300000000, // £300M starting budget
      totalPoints: 0,
      gameweekPoints: 0,
      rank: 0, // Will be calculated when leaderboard is generated
      lastActive: new Date()
    });
    
    await newUser.save();
    console.log(`✅ New user registered: ${username} (ID: ${newUser._id})`);
    
    // Store user in session instead of JWT
    req.session.userId = newUser._id;
    req.session.username = newUser.username;
    
    // Return user data without password
    const userResponse = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      budget: newUser.budget,
      totalPoints: newUser.totalPoints,
      gameweekPoints: newUser.gameweekPoints,
      rank: newUser.rank,
      createdAt: newUser.createdAt,
      lastActive: newUser.lastActive
    };
    
    res.status(201).json({
      message: `Welcome to TSW Fantasy League, ${username}!`,
      user: userResponse
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        error: 'Duplicate field',
        message: `${field} already exists. Please choose a different one.`
      });
    }
    
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred while creating your account. Please try again.'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and create session
 */
router.post('/login', authLimiter, validateRequest(loginSchema), async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username (case-insensitive)
    const user = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect.'
      });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect.'
      });
    }
    
    // Update last active timestamp
    user.lastActive = new Date();
    await user.save();
    
    // Store user in session
    req.session.userId = user._id;
    req.session.username = user.username;
    
    console.log(`✅ User logged in: ${username} (ID: ${user._id})`);
    
    // Return user data without password
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      budget: user.budget,
      totalPoints: user.totalPoints,
      gameweekPoints: user.gameweekPoints,
      rank: user.rank,
      createdAt: user.createdAt,
      lastActive: user.lastActive
    };
    
    res.json({
      message: `Welcome back, ${username}!`,
      user: userResponse
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred while logging in. Please try again.'
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify current session
 */
router.post('/verify', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({ valid: false });
    }
    
    // Find user by session ID
    const user = await User.findById(req.session.userId).select('-password');
    
    if (!user) {
      // User not found, destroy session
      req.session.destroy();
      return res.json({ valid: false });
    }
    
    // Update last active
    user.lastActive = new Date();
    await user.save();
    
    res.json({
      valid: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        budget: user.budget,
        totalPoints: user.totalPoints,
        gameweekPoints: user.gameweekPoints,
        rank: user.rank,
        createdAt: user.createdAt,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    console.error('❌ Session verification error:', error);
    res.json({ valid: false });
  }
});

/**
 * POST /api/auth/logout
 * Destroy session and logout
 */
router.post('/logout', (req, res) => {
  if (req.session.userId) {
    console.log(`✅ User logged out: ${req.session.username} (ID: ${req.session.userId})`);
  }
  
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Session destroy error:', err);
      return res.status(500).json({
        error: 'Logout failed',
        message: 'An error occurred while logging out.'
      });
    }
    
    res.clearCookie('connect.sid'); // Clear session cookie
    res.json({ message: 'Logged out successfully' });
  });
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Please log in to update your profile.'
      });
    }
    
    const { email, firstName, lastName } = req.body;
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found.'
      });
    }
    
    // Update fields if provided
    if (email !== undefined) user.email = email;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    
    user.lastActive = new Date();
    await user.save();
    
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      budget: user.budget,
      totalPoints: user.totalPoints,
      gameweekPoints: user.gameweekPoints,
      rank: user.rank,
      createdAt: user.createdAt,
      lastActive: user.lastActive
    };
    
    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({
      error: 'Update failed',
      message: 'An error occurred while updating your profile.'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh session (extend expiry)
 */
router.post('/refresh', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      error: 'No session',
      message: 'No active session to refresh.'
    });
  }
  
  // Touch session to extend expiry
  req.session.touch();
  
  res.json({
    message: 'Session refreshed successfully'
  });
});

module.exports = router;
