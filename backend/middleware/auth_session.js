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

module.exports = {
  authenticateSession,
  optionalAuth,
  requireAdmin,
  // Keep old name for compatibility
  authenticateToken: authenticateSession
};
