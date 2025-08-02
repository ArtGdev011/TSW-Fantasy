/**
 * Session-based Authentication Middleware
 * Replaces JWT-based authentication with session-based auth
 */

/**
 * Middleware to check if user is authenticated via session
 * Replaces the old JWT authenticateToken middleware
 */
const authenticateSession = (req, res, next) => {
  // Check if user has active session
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Please log in to access this resource.'
    });
  }
  
  // Add user info to request object for easy access
  req.userId = req.session.userId;
  req.username = req.session.username;
  
  next();
};

/**
 * Optional authentication - allows both authenticated and anonymous access
 * Sets req.userId if session exists, otherwise continues
 */
const optionalAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
    req.username = req.session.username;
  }
  
  next();
};

/**
 * Admin-only authentication middleware
 * Checks for admin role in session
 */
const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Please log in to access this resource.'
    });
  }
  
  // Check if user has admin role (you can implement role checking here)
  if (!req.session.isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required.'
    });
  }
  
  req.userId = req.session.userId;
  req.username = req.session.username;
  
  next();
};

/**
 * Middleware to ensure user doesn't have a team yet
 */
const requireNoTeam = async (req, res, next) => {
  try {
    const Team = require('../models/Team');
    const existingTeam = await Team.findOne({ user: req.session.userId });
    
    if (existingTeam) {
      return res.status(409).json({
        error: 'Team already exists',
        message: 'You already have a team. Delete it first to create a new one.'
      });
    }
    
    next();
  } catch (error) {
    console.error('❌ Error checking existing team:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to check team status.'
    });
  }
};

/**
 * Middleware to ensure user has a team
 */
const requireTeam = async (req, res, next) => {
  try {
    const Team = require('../models/Team');
    const team = await Team.findOne({ user: req.session.userId });
    
    if (!team) {
      return res.status(404).json({
        error: 'No team found',
        message: 'You need to create a team first.'
      });
    }
    
    req.team = team; // Attach team to request
    next();
  } catch (error) {
    console.error('❌ Error checking team:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to check team status.'
    });
  }
};

/**
 * Game lock middleware - prevent actions during locked periods
 */
const checkGameLock = (req, res, next) => {
  // For now, always allow - implement game lock logic later
  next();
};

module.exports = {
  authenticateSession,
  optionalAuth,
  requireAdmin,
  requireNoTeam,
  requireTeam,
  checkGameLock,
  // Keep old name for compatibility
  authenticateToken: authenticateSession
};
