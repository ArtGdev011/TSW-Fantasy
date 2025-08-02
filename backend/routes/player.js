const express = require('express');
const Player = require('../models/Player');
const { authenticateSession } = require('../middleware/auth');
const { validateRequest, playerFilterSchema, validateObjectId } = require('../middleware/validate');
const { getAvailablePlayers } = require('../utils/seedPlayers');

const router = express.Router();

/**
 * GET /api/players
 * Get players from the market with filtering and pagination
 * 
 * Query Parameters:
 * - position: Filter by position (GK, CDM, LW, RW)
 * - region: Filter by region (partial match)
 * - minPrice: Minimum price filter
 * - maxPrice: Maximum price filter
 * - available: Show only available players (true/false)
 * - sortBy: Sort field (price, overall, name, position)
 * - sortOrder: Sort direction (asc, desc)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
router.get('/', authenticateSession, validateRequest(playerFilterSchema, 'query'), async (req, res) => {
  try {
    const filters = req.query;
    
    // Build query
    const query = {};
    
    // Position filter
    if (filters.position) {
      query.position = filters.position;
    }
    
    // Region filter (case-insensitive partial match)
    if (filters.region) {
      query.region = { $regex: new RegExp(filters.region, 'i') };
    }
    
    // Price range filters
    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice) query.price.$gte = filters.minPrice;
      if (filters.maxPrice) query.price.$lte = filters.maxPrice;
    }
    
    // Availability filter
    if (filters.available !== undefined) {
      query.owner = filters.available ? null : { $ne: null };
    }
    
    // Sorting
    const sortBy = filters.sortBy || 'overall';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };
    
    // Add secondary sort for consistency
    if (sortBy !== 'name') {
      sort.name = 1;
    }
    
    // Pagination
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;
    
    // Execute query
    const [players, totalCount] = await Promise.all([
      Player.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('owner', 'name', 'Team')
        .select('-weeklyStats -seasonStats'), // Exclude detailed stats from market view
      Player.countDocuments(query)
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Format response
    const formattedPlayers = players.map(player => ({
      id: player._id,
      name: player.name,
      position: player.position,
      region: player.region,
      price: player.price,
      overall: player.overall,
      isAvailable: !player.owner,
      ownedBy: player.owner ? player.owner.name : null
    }));
    
    res.json({
      players: formattedPlayers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages,
        hasNext: hasNextPage,
        hasPrev: hasPrevPage
      },
      filters: {
        applied: Object.keys(filters).length > 0 ? filters : null,
        available: {
          positions: ['GK', 'CDM', 'LW', 'RW'],
          regions: await Player.distinct('region'),
          priceRange: {
            min: await Player.findOne({}).sort({ price: 1 }).select('price').then(p => p?.price || 0),
            max: await Player.findOne({}).sort({ price: -1 }).select('price').then(p => p?.price || 50)
          }
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Players query error:', error);
    res.status(500).json({
      error: 'Failed to fetch players',
      message: 'Unable to retrieve player data.'
    });
  }
});

/**
 * GET /api/players/available
 * Get only available (unowned) players - optimized endpoint
 */
router.get('/available', authenticateSession, async (req, res) => {
  try {
    const { position, limit = 50 } = req.query;
    
    const query = { owner: null };
    if (position && ['GK', 'CDM', 'LW', 'RW'].includes(position)) {
      query.position = position;
    }
    
    const players = await Player.find(query)
      .sort({ overall: -1, price: 1 }) // Best players first, then cheapest
      .limit(parseInt(limit))
      .select('name position region price overall');
    
    // Group by position for easier frontend consumption
    const grouped = {
      GK: [],
      CDM: [],
      LW: [],
      RW: []
    };
    
    players.forEach(player => {
      grouped[player.position].push({
        id: player._id,
        name: player.name,
        region: player.region,
        price: player.price,
        overall: player.overall
      });
    });
    
    res.json({
      players: grouped,
      total: players.length,
      summary: {
        GK: grouped.GK.length,
        CDM: grouped.CDM.length,
        LW: grouped.LW.length,
        RW: grouped.RW.length
      }
    });
    
  } catch (error) {
    console.error('❌ Available players error:', error);
    res.status(500).json({
      error: 'Failed to fetch available players'
    });
  }
});

/**
 * GET /api/players/search/:query
 * Search players by name (for autocomplete/search functionality)
 */
router.get('/search/:query', authenticateSession, async (req, res) => {
  try {
    const { query } = req.params;
    const { available = false, limit = 10 } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters'
      });
    }
    
    const searchQuery = {
      name: { $regex: new RegExp(query, 'i') }
    };
    
    if (available === 'true') {
      searchQuery.owner = null;
    }
    
    const players = await Player.find(searchQuery)
      .sort({ overall: -1 })
      .limit(parseInt(limit))
      .populate('owner', 'name', 'Team')
      .select('name position region price overall owner');
    
    const results = players.map(player => ({
      id: player._id,
      name: player.name,
      position: player.position,
      region: player.region,
      price: player.price,
      overall: player.overall,
      isAvailable: !player.owner,
      ownedBy: player.owner ? player.owner.name : null
    }));
    
    res.json({
      query,
      results,
      count: results.length
    });
    
  } catch (error) {
    console.error('❌ Player search error:', error);
    res.status(500).json({
      error: 'Search failed'
    });
  }
});

/**
 * GET /api/players/:id
 * Get detailed information about a specific player
 */
router.get('/:id', authenticateSession, validateObjectId('id'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const player = await Player.findById(id)
      .populate('owner', 'name user', 'Team')
      .populate({
        path: 'owner',
        populate: {
          path: 'user',
          select: 'username'
        }
      });
    
    if (!player) {
      return res.status(404).json({
        error: 'Player not found'
      });
    }
    
    // Calculate performance metrics
    const seasonStats = player.seasonStats;
    const averagePoints = seasonStats.appearances > 0 
      ? (seasonStats.totalPoints / seasonStats.appearances).toFixed(1)
      : 0;
    
    const formGoalsPerGame = seasonStats.appearances > 0
      ? (seasonStats.goals / seasonStats.appearances).toFixed(2)
      : 0;
    
    const formAssistsPerGame = seasonStats.appearances > 0
      ? (seasonStats.assists / seasonStats.appearances).toFixed(2)
      : 0;
    
    res.json({
      player: {
        id: player._id,
        name: player.name,
        position: player.position,
        region: player.region,
        price: player.price,
        overall: player.overall,
        isAvailable: !player.owner,
        owner: player.owner ? {
          teamName: player.owner.name,
          username: player.owner.user?.username
        } : null,
        
        // Current gameweek performance
        weeklyStats: {
          goals: player.weeklyStats.goals,
          assists: player.weeklyStats.assists,
          saves: player.weeklyStats.saves,
          cleanSheet: player.weeklyStats.cleanSheet,
          ownGoals: player.weeklyStats.ownGoals,
          points: player.weeklyStats.points,
          played: player.weeklyStats.played
        },
        
        // Season totals
        seasonStats: {
          appearances: seasonStats.appearances,
          goals: seasonStats.goals,
          assists: seasonStats.assists,
          saves: seasonStats.saves,
          cleanSheets: seasonStats.cleanSheets,
          ownGoals: seasonStats.ownGoals,
          totalPoints: seasonStats.totalPoints,
          averagePoints: parseFloat(averagePoints)
        },
        
        // Performance metrics
        form: {
          goalsPerGame: parseFloat(formGoalsPerGame),
          assistsPerGame: parseFloat(formAssistsPerGame),
          pointsPerGame: parseFloat(averagePoints)
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Player details error:', error);
    res.status(500).json({
      error: 'Failed to fetch player details'
    });
  }
});

/**
 * GET /api/players/position/:position
 * Get all players by position with basic info
 */
router.get('/position/:position', authenticateSession, async (req, res) => {
  try {
    const { position } = req.params;
    
    if (!['GK', 'CDM', 'LW', 'RW'].includes(position)) {
      return res.status(400).json({
        error: 'Invalid position',
        message: 'Position must be one of: GK, CDM, LW, RW'
      });
    }
    
    const { available, sortBy = 'overall', sortOrder = 'desc' } = req.query;
    
    const query = { position };
    if (available === 'true') {
      query.owner = null;
    }
    
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const players = await Player.find(query)
      .sort(sort)
      .populate('owner', 'name', 'Team')
      .select('name region price overall owner seasonStats');
    
    const formattedPlayers = players.map(player => ({
      id: player._id,
      name: player.name,
      region: player.region,
      price: player.price,
      overall: player.overall,
      isAvailable: !player.owner,
      ownedBy: player.owner ? player.owner.name : null,
      totalPoints: player.seasonStats.totalPoints,
      appearances: player.seasonStats.appearances
    }));
    
    res.json({
      position,
      players: formattedPlayers,
      count: formattedPlayers.length,
      available: formattedPlayers.filter(p => p.isAvailable).length
    });
    
  } catch (error) {
    console.error('❌ Position query error:', error);
    res.status(500).json({
      error: 'Failed to fetch players by position'
    });
  }
});

/**
 * GET /api/players/stats/top
 * Get top performing players by various metrics
 */
router.get('/stats/top', authenticateSession, async (req, res) => {
  try {
    const { metric = 'points', limit = 10 } = req.query;
    
    let sortField;
    switch (metric) {
      case 'points':
        sortField = 'seasonStats.totalPoints';
        break;
      case 'goals':
        sortField = 'seasonStats.goals';
        break;
      case 'assists':
        sortField = 'seasonStats.assists';
        break;
      case 'saves':
        sortField = 'seasonStats.saves';
        break;
      case 'cleanSheets':
        sortField = 'seasonStats.cleanSheets';
        break;
      default:
        sortField = 'seasonStats.totalPoints';
    }
    
    const players = await Player.find({})
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .populate('owner', 'name', 'Team')
      .select('name position region price overall seasonStats owner');
    
    const topPlayers = players.map((player, index) => ({
      rank: index + 1,
      id: player._id,
      name: player.name,
      position: player.position,
      region: player.region,
      price: player.price,
      overall: player.overall,
      isAvailable: !player.owner,
      ownedBy: player.owner ? player.owner.name : null,
      stat: player.seasonStats[metric.replace('cleanSheets', 'cleanSheets')] || player.seasonStats.totalPoints,
      appearances: player.seasonStats.appearances
    }));
    
    res.json({
      metric,
      players: topPlayers,
      count: topPlayers.length
    });
    
  } catch (error) {
    console.error('❌ Top players error:', error);
    res.status(500).json({
      error: 'Failed to fetch top players'
    });
  }
});

module.exports = router;
