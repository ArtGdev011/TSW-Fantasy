const User = require('../models/User');

/**
 * Session-based Authentication Middleware
 * Verifies user session and attaches user info to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Check if user has active session
    if (!req.session.userId) {
      return res.status(401).json({ 
        error: 'Access denied. No active session.' 
      });
    }
    
    // Check if user still exists and is active
    const user = await User.findById(req.session.userId).select('-password');
    if (!user || !user.isActive) {
      // Clear invalid session
      req.session.destroy((err) => {
        if (err) console.error('Session destroy error:', err);
      });
      
      return res.status(401).json({ 
        error: 'Access denied. User not found or inactive.' 
      });
    }
    
    // Update last active timestamp
    user.lastActive = new Date();
    await user.save();
    
    // Attach user info to request
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      team: user.team,
      budget: user.budget
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Access denied. Invalid token.' 
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Access denied. Token expired.' 
      });
    } else {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ 
        error: 'Internal server error during authentication.' 
      });
    }
  }
};

/**
 * Team Required Middleware
 * Ensures user has a team before accessing team-specific endpoints
 */
const requireTeam = async (req, res, next) => {
  try {
    if (!req.user.team) {
      return res.status(400).json({ 
        error: 'Team required. Please create a team first.' 
      });
    }
    next();
  } catch (error) {
    console.error('Team requirement middleware error:', error);
    return res.status(500).json({ 
      error: 'Internal server error.' 
    });
  }
};

/**
 * No Team Required Middleware
 * Ensures user doesn't have a team (for team creation)
 */
const requireNoTeam = async (req, res, next) => {
  try {
    if (req.user.team) {
      return res.status(400).json({ 
        error: 'Team already exists. Cannot create another team.' 
      });
    }
    next();
  } catch (error) {
    console.error('No team requirement middleware error:', error);
    return res.status(500).json({ 
      error: 'Internal server error.' 
    });
  }
};

/**
 * Game Lock Middleware
 * Prevents changes during game lock periods (60 minutes before matches)
 */
const checkGameLock = (req, res, next) => {
  // TODO: Implement actual game lock logic based on match schedules
  // For now, allow all operations
  // In production, this would check against match kickoff times
  
  const isLocked = false; // Placeholder - implement actual lock logic
  
  if (isLocked) {
    return res.status(423).json({ 
      error: 'Game is locked. No changes allowed 60 minutes before kickoff.' 
    });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  requireTeam,
  requireNoTeam,
  checkGameLock
};
