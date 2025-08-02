const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { validateRequest, registerSchema, loginSchema } = require('../middleware/validate');

const router = express.Router();

// Environment variables with safe fallbacks
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-in-production';
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
 * Register a new user account
 * 
 * Business Rules:
 * - Username must be unique and 3-20 characters (alphanumeric + underscore)
 * - Password must be at least 6 characters
 * - Email is optional but must be valid if provided
 * - Returns JWT token for immediate login
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
    
    // Create user
    const user = await User.create({
      username,
      password: hashedPassword,
      email: email || undefined // Don't save empty string
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        username: user.username 
      }, 
      JWT_SECRET, 
      { 
        expiresIn: '7d',
        issuer: 'tsw-fantasy-league'
      }
    );
    
    console.log(`✅ New user registered: ${username}`);
    
    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        hasTeam: false
      }
    });
    
  } catch (error) {
    console.error('❌ Signup error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        error: `${field} already exists`,
        message: `This ${field} is already registered.`
      });
    }
    
    res.status(500).json({
      error: 'Registration failed',
      message: 'Unable to create account. Please try again.'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * 
 * Business Rules:
 * - Username/password are required
 * - Password must match hashed password in database
 * - Updates user's last active timestamp
 * - Returns user info including team status
 */
router.post('/login', authLimiter, validateRequest(loginSchema), async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user (case-insensitive username lookup)
    const user = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    }).populate('team', 'name points teamValue');
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect.'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your account has been suspended. Please contact support.'
      });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect.'
      });
    }
    
    // Update last active timestamp
    user.lastActive = new Date();
    await user.save();
    
    // Store user in session instead of JWT
    req.session.userId = user._id;
    req.session.username = user.username;
    
    console.log(`✅ User logged in: ${username}`);
    
    res.json({
      message: `Welcome back, ${user.username}!`,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        budget: user.budget,
        totalPoints: user.totalPoints,
        gameweekPoints: user.gameweekPoints,
        rank: user.rank,
        team: user.team,
        lastActive: user.lastActive,
        createdAt: user.createdAt
      },
      token: 'session-based' // For frontend compatibility
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    
    res.status(500).json({
      error: 'Login failed',
      message: 'Unable to authenticate. Please try again.'
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify session and return user info
 * Session-based authentication instead of JWT
 */
router.post('/verify', async (req, res) => {
  try {
    // Check if user has active session
    if (!req.session.userId) {
      return res.json({ 
        valid: false,
        message: 'No active session'
      });
    }
    
    // Get user info from database
    const user = await User.findById(req.session.userId)
      .populate('team', 'name totalPoints totalValue')
      .select('-password');
    
    if (!user || !user.isActive) {
      // Clear invalid session
      req.session.destroy((err) => {
        if (err) console.error('Session destroy error:', err);
      });
      
      return res.json({ 
        valid: false,
        message: 'User not found or inactive'
      });
    }
    
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
        team: user.team,
        lastActive: user.lastActive,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Session verification error:', error);
    
    res.json({ 
      valid: false,
      message: 'Session verification failed'
    });
  }
});

/**
 * POST /api/auth/logout
 * Destroy user session
 */
router.post('/logout', (req, res) => {
  if (req.session.userId) {
    const username = req.session.username;
    
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ Session destroy error:', err);
        return res.status(500).json({
          error: 'Logout failed',
          message: 'Unable to destroy session'
        });
      }
      
      console.log(`✅ User logged out: ${username}`);
      res.json({
        message: 'Logged out successfully'
      });
    });
  } else {
    res.json({
      message: 'No active session to logout'
    });
  }
});

module.exports = router;
