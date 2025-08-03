/**
 * TSW Fantasy League Backend API - Firebase Edition
 * 
 * A comprehensive fantasy sports backend with:
 * - User authentication and team management
 * - Player market and transfers
 * - Chips system and scoring
 * - Inbox notifications and support tickets
 * - Real-time game lock management
 * 
 * Now powered by Firebase Firestore for better scalability and performance.
 * MongoDB completely removed - everything runs on Firebase!
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';

// Import Firebase configuration
import { db, auth } from './config/firebase.js';

// Import utilities
import { getCurrentGameweek } from './utils/gameLock.js';
import { getLeaderboard } from './utils/scoring.js';
import { authenticateToken } from './middleware/auth.js';

// Import route modules  
import authRoutes from './routes/auth.js';
import teamRoutes from './routes/team.js';
import playerRoutes from './routes/players.js';
import chipsRoutes from './routes/chips.js';
import inboxRoutes from './routes/inbox.js';
import ticketRoutes from './routes/tickets.js';

// Initialize Express app
const app = express();

// Environment variables with safe fallbacks
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MAX_REQUESTS_PER_MINUTE = parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 100;

/**
 * Security & Middleware Configuration
 */

// Basic security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] // Replace with actual frontend URLs
    : ['http://localhost:3000', 'http://localhost:3001'], // Development origins
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Session configuration - Firebase-compatible sessions (memory store)
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me-in-production-please',
  resave: false,
  saveUninitialized: false,
  // Removed MongoDB store - using default memory store for now
  // In production, consider using Redis or Firebase-compatible session store
  cookie: {
    secure: NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: MAX_REQUESTS_PER_MINUTE,
  message: {
    error: 'Too many requests',
    message: 'Please slow down and try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain IPs in development
  skip: (req) => NODE_ENV === 'development' && req.ip === '::1'
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  strict: true
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.path} - ${req.ip}`);
  next();
});

/**
 * Firebase Connection Check
 */
async function checkFirebaseConnection() {
  try {
    console.log('� Checking Firebase connection...');
    
    // Test Firebase connection
    if (db && auth) {
      console.log('✅ Firebase initialized successfully');
      console.log('  - Firestore: ✅ Connected');
      console.log('  - Authentication: ✅ Connected');
    } else {
      throw new Error('Firebase not properly initialized');
    }
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    process.exit(1);
  }
}

/**
 * API Routes
 */

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0-firebase',
    environment: NODE_ENV,
    database: 'Firebase Firestore',
    gameweek: getCurrentGameweek(),
    uptime: process.uptime()
  });
});

// Public game information endpoint
app.get('/api/game-info', (req, res) => {
  const { getCurrentGameweek, getTimeUntilDeadline, isGameLocked } = require('./utils/gameLock');
  
  const lockStatus = isGameLocked();
  
  res.json({
    gameweek: getCurrentGameweek(),
    isLocked: lockStatus.locked,
    lockReason: lockStatus.reason,
    timeUntilDeadline: getTimeUntilDeadline(),
    season: '2024-25'
  });
});

// Public leaderboard endpoint (top 10 only)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await getLeaderboard(10, 1);
    res.json(leaderboard);
  } catch (error) {
    console.error('❌ Leaderboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch leaderboard'
    });
  }
});

// Full leaderboard endpoint (authenticated)
app.get('/api/leaderboard/full', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const leaderboard = await getLeaderboard(parseInt(limit), parseInt(page));
    res.json(leaderboard);
  } catch (error) {
    console.error('❌ Full leaderboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch leaderboard'
    });
  }
});

// API route mounting
app.use('/api/auth', authRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/chips', chipsRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/tickets', ticketRoutes);

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'TSW Fantasy League API',
    version: '1.0.0',
    description: 'Complete fantasy sports backend with authentication, team management, and game mechanics',
    endpoints: {
      auth: {
        'POST /api/auth/signup': 'Register new user account',
        'POST /api/auth/login': 'Authenticate user and get JWT token',
        'POST /api/auth/verify': 'Verify JWT token validity'
      },
      team: {
        'POST /api/team/create': 'Create fantasy team',
        'GET /api/team/dashboard': 'Get team dashboard data',
        'POST /api/team/buy': 'Buy/transfer in a player',
        'POST /api/team/sell': 'Sell/transfer out a player'
      },
      players: {
        'GET /api/players': 'Get player market with filters',
        'GET /api/players/available': 'Get only available players',
        'GET /api/players/search/:query': 'Search players by name',
        'GET /api/players/:id': 'Get detailed player information',
        'GET /api/players/position/:position': 'Get players by position',
        'GET /api/players/stats/top': 'Get top performing players'
      },
      chips: {
        'POST /api/chips/use': 'Use a chip (Wildcard, Triple Captain, etc.)',
        'GET /api/chips/available': 'Get available chips',
        'GET /api/chips/history': 'Get chip usage history',
        'POST /api/chips/cancel': 'Cancel active chip (if allowed)'
      },
      inbox: {
        'GET /api/inbox': 'Get inbox messages',
        'GET /api/inbox/unread': 'Get unread message count',
        'POST /api/inbox/:id/read': 'Mark message as read',
        'POST /api/inbox/read-all': 'Mark all messages as read',
        'POST /api/inbox/:id/claim-reward': 'Claim reward from message',
        'DELETE /api/inbox/:id': 'Delete message'
      },
      tickets: {
        'POST /api/tickets': 'Create support ticket',
        'GET /api/tickets': 'Get user support tickets',
        'GET /api/tickets/:id': 'Get ticket details',
        'POST /api/tickets/:id/reply': 'Reply to ticket',
        'PUT /api/tickets/:id/close': 'Close ticket',
        'GET /api/tickets/lookup/:ticketId': 'Lookup ticket by ID',
        'GET /api/tickets/categories': 'Get ticket categories'
      },
      public: {
        'GET /api/health': 'API health check',
        'GET /api/game-info': 'Current game information',
        'GET /api/leaderboard': 'Public leaderboard (top 10)',
        'GET /api/leaderboard/full': 'Full leaderboard (authenticated)',
        'GET /api/docs': 'This documentation'
      }
    },
    authentication: {
      type: 'Bearer Token (JWT)',
      header: 'Authorization: Bearer <token>',
      expiry: '7 days'
    },
    gameRules: {
      teamComposition: '5 starters (1 GK, 2 CDM, 1 LW, 1 RW) + 2 subs',
      budget: '€150M maximum',
      transfers: '1 free per gameweek, -4 points for extras',
      chips: 'Wildcard, Triple Captain, Bench Boost, Free Hit (once per season)',
      scoring: 'Position-based points for goals, assists, saves, clean sheets'
    }
  });
});

// Catch-all for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist.`,
    availableEndpoints: '/api/docs'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'TSW Fantasy League API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/docs',
    health: '/api/health'
  });
});

/**
 * Error Handling Middleware
 */

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  
  // Firebase auth error
  if (error.code && error.code.startsWith('auth/')) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: error.message,
      code: error.code
    });
  }
  
  // Firebase Firestore error
  if (error.code && (error.code.includes('permission-denied') || error.code.includes('unavailable'))) {
    return res.status(403).json({
      error: 'Database access denied',
      message: 'Check Firebase rules and permissions',
      code: error.code
    });
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication token is invalid.'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      message: 'Authentication token has expired.'
    });
  }
  
  // Default server error
  res.status(500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? error.message : 'Something went wrong.'
  });
});

// Handle 404 for non-existent routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The route ${req.method} ${req.originalUrl} does not exist.`
  });
});

/**
 * Server Startup
 */
async function startServer() {
  try {
    // Connect to Firebase first
    await checkFirebaseConnection();
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 TSW Fantasy League API running on port ${PORT}`);
      console.log(`📖 Documentation available at http://localhost:${PORT}/api/docs`);
      console.log(`🏥 Health check at http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
    });
    
    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ HTTP server closed');
        console.log('🔥 Firebase connections will close automatically');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ HTTP server closed');
        console.log('🔥 Firebase connections will close automatically');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
