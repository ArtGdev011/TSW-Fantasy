const express = require('express');
const mongoose = require('mongoose');
const Team = require('../models/Team');
const Player = require('../models/Player');
const User = require('../models/User');
const { authenticateSession, requireNoTeam, requireTeam, checkGameLock } = require('../middleware/auth');
const { validateRequest, createTeamSchema, transferPlayerSchema, validateObjectId } = require('../middleware/validate');
const { checkGameLockMiddleware } = require('../utils/gameLock');
const { calculateTeamPoints } = require('../utils/scoring');

const router = express.Router();

// Constants from environment
const BUDGET_LIMIT = parseFloat(process.env.BUDGET_LIMIT) || 150;
const TRANSFER_COST_POINTS = parseInt(process.env.TRANSFER_COST_POINTS) || 4;

/**
 * POST /api/team/create
 * Create a new fantasy team for the authenticated user
 * 
 * Business Rules:
 * - User can only have one team
 * - Must select exactly 5 starters: 1 GK, 2 CDM, 1 LW, 1 RW
 * - Must select exactly 2 subs: 1 defender (GK/CDM), 1 attacker (LW/RW)
 * - Total budget cannot exceed €150M
 * - All selected players must be available (unowned)
 * - Captain and vice-captain must be in the team
 */
router.post('/create', 
  authenticateSession, 
  requireNoTeam, 
  validateRequest(createTeamSchema), 
  async (req, res) => {
    
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { name, starters, subs, captain, viceCaptain } = req.body;
    const userId = req.user.id;
    
    // Combine all player IDs for validation
    const allPlayerIds = [...starters, ...subs];
    const uniquePlayerIds = [...new Set(allPlayerIds)];
    
    // Validate no duplicate players
    if (uniquePlayerIds.length !== allPlayerIds.length) {
      return res.status(400).json({
        error: 'Duplicate players not allowed',
        message: 'Each player can only be selected once.'
      });
    }
    
    // Validate captain and vice-captain are in the team
    if (!allPlayerIds.includes(captain) || !allPlayerIds.includes(viceCaptain)) {
      return res.status(400).json({
        error: 'Invalid captain selection',
        message: 'Captain and vice-captain must be selected players.'
      });
    }
    
    if (captain === viceCaptain) {
      return res.status(400).json({
        error: 'Invalid captain selection',
        message: 'Captain and vice-captain must be different players.'
      });
    }
    
    // Fetch all selected players
    const players = await Player.find({ 
      _id: { $in: uniquePlayerIds } 
    }).session(session);
    
    if (players.length !== uniquePlayerIds.length) {
      return res.status(400).json({
        error: 'Invalid players',
        message: 'One or more selected players do not exist.'
      });
    }
    
    // Check if any players are already owned
    const ownedPlayers = players.filter(p => p.owner !== null);
    if (ownedPlayers.length > 0) {
      return res.status(400).json({
        error: 'Players unavailable',
        message: `These players are already owned: ${ownedPlayers.map(p => p.name).join(', ')}`
      });
    }
    
    // Validate formation
    const starterPlayers = players.filter(p => starters.includes(p._id.toString()));
    const subPlayers = players.filter(p => subs.includes(p._id.toString()));
    
    // Count positions in starters
    const starterPositions = { GK: 0, CDM: 0, LW: 0, RW: 0 };
    starterPlayers.forEach(player => {
      starterPositions[player.position]++;
    });
    
    // Validate starter formation: 1 GK, 2 CDM, 1 LW, 1 RW
    if (starterPositions.GK !== 1 || starterPositions.CDM !== 2 || 
        starterPositions.LW !== 1 || starterPositions.RW !== 1) {
      return res.status(400).json({
        error: 'Invalid formation',
        message: 'Starters must include: 1 GK, 2 CDM, 1 LW, 1 RW'
      });
    }
    
    // Count positions in subs
    const subPositions = { GK: 0, CDM: 0, LW: 0, RW: 0 };
    subPlayers.forEach(player => {
      subPositions[player.position]++;
    });
    
    // Validate subs: 1 defender + 1 attacker
    const defenders = subPositions.GK + subPositions.CDM;
    const attackers = subPositions.LW + subPositions.RW;
    
    if (subPlayers.length !== 2 || defenders !== 1 || attackers !== 1) {
      return res.status(400).json({
        error: 'Invalid bench',
        message: 'Bench must have 1 defender (GK/CDM) and 1 attacker (LW/RW)'
      });
    }
    
    // Calculate total cost
    const totalCost = players.reduce((sum, player) => sum + player.price, 0);
    
    if (totalCost > BUDGET_LIMIT) {
      return res.status(400).json({
        error: 'Budget exceeded',
        message: `Total cost (€${totalCost}M) exceeds budget limit (€${BUDGET_LIMIT}M)`
      });
    }
    
    // Create team
    const team = new Team({
      user: userId,
      name,
      players: uniquePlayerIds,
      starters,
      subs,
      captain,
      viceCaptain,
      budget: BUDGET_LIMIT - totalCost,
      teamValue: totalCost
    });
    
    await team.save({ session });
    
    // Update player ownership
    await Player.updateMany(
      { _id: { $in: uniquePlayerIds } },
      { owner: team._id },
      { session }
    );
    
    // Update user with team reference
    await User.findByIdAndUpdate(
      userId,
      { team: team._id },
      { session }
    );
    
    await session.commitTransaction();
    
    // Populate team data for response
    await team.populate([
      { path: 'players', select: 'name position price overall' },
      { path: 'captain', select: 'name position' },
      { path: 'viceCaptain', select: 'name position' }
    ]);
    
    console.log(`✅ Team created: ${name} by user ${req.user.username}`);
    
    res.status(201).json({
      message: 'Team created successfully',
      team: {
        id: team._id,
        name: team.name,
        budget: team.budget,
        teamValue: team.teamValue,
        points: team.points,
        players: team.players,
        starters: team.starters,
        subs: team.subs,
        captain: team.captain,
        viceCaptain: team.viceCaptain,
        chips: team.chips
      }
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Team creation error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Team creation failed',
      message: 'Unable to create team. Please try again.'
    });
  } finally {
    session.endSession();
  }
});

/**
 * GET /api/team/dashboard
 * Get comprehensive team dashboard data
 */
router.get('/dashboard', authenticateSession, requireTeam, async (req, res) => {
  try {
    const team = await Team.findById(req.user.team)
      .populate([
        { 
          path: 'players', 
          select: 'name position price overall weeklyStats seasonStats owner' 
        },
        { path: 'captain', select: 'name position' },
        { path: 'viceCaptain', select: 'name position' }
      ]);
    
    if (!team) {
      return res.status(404).json({
        error: 'Team not found',
        message: 'Your team could not be found.'
      });
    }
    
    // Separate starters and subs with full player data
    const startersData = team.starters.map(starterId => 
      team.players.find(p => p._id.equals(starterId))
    );
    
    const subsData = team.subs.map(subId => 
      team.players.find(p => p._id.equals(subId))
    );
    
    // Calculate team statistics
    const stats = {
      totalPlayers: team.players.length,
      weeklyPoints: team.weeklyPoints,
      totalPoints: team.points,
      teamValue: team.teamValue,
      budget: team.budget,
      transfers: team.transfers,
      usedChips: Object.keys(team.chips).filter(chip => team.chips[chip]),
      availableChips: Object.keys(team.chips).filter(chip => !team.chips[chip])
    };
    
    res.json({
      team: {
        id: team._id,
        name: team.name,
        points: team.points,
        weeklyPoints: team.weeklyPoints,
        budget: team.budget,
        teamValue: team.teamValue,
        starters: startersData,
        subs: subsData,
        captain: team.captain,
        viceCaptain: team.viceCaptain,
        chips: team.chips,
        activeChip: team.activeChip,
        transfers: team.transfers,
        stats
      },
      gameInfo: req.gameInfo // Added by game lock middleware
    });
    
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({
      error: 'Failed to load dashboard',
      message: 'Unable to retrieve team data.'
    });
  }
});

/**
 * POST /api/team/buy
 * Buy a player (transfer in)
 */
router.post('/buy', 
  authenticateSession, 
  requireTeam, 
  checkGameLockMiddleware,
  validateRequest(transferPlayerSchema), 
  async (req, res) => {
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { playerId, replacementId } = req.body;
    const teamId = req.user.team;
    
    // Get team and target player
    const [team, player] = await Promise.all([
      Team.findById(teamId).populate('players').session(session),
      Player.findById(playerId).session(session)
    ]);
    
    if (!team || !player) {
      return res.status(404).json({
        error: 'Team or player not found'
      });
    }
    
    // Check if player is available
    if (player.owner) {
      return res.status(400).json({
        error: 'Player unavailable',
        message: `${player.name} is already owned by another team.`
      });
    }
    
    // Check budget
    if (player.price > team.budget) {
      return res.status(400).json({
        error: 'Insufficient budget',
        message: `${player.name} costs €${player.price}M but you only have €${team.budget}M available.`
      });
    }
    
    let replacementPlayer = null;
    
    // If replacement specified, validate it's owned by this team and same position
    if (replacementId) {
      replacementPlayer = await Player.findById(replacementId).session(session);
      
      if (!replacementPlayer || !replacementPlayer.owner?.equals(teamId)) {
        return res.status(400).json({
          error: 'Invalid replacement',
          message: 'Replacement player must be owned by your team.'
        });
      }
      
      if (replacementPlayer.position !== player.position) {
        return res.status(400).json({
          error: 'Position mismatch',
          message: 'Replacement must be the same position as the new player.'
        });
      }
    }
    
    // Calculate transfer cost
    let transferCost = 0;
    if (team.transfers.free <= 0) {
      transferCost = TRANSFER_COST_POINTS;
    }
    
    // Execute transfer
    if (replacementPlayer) {
      // Swap players
      player.owner = teamId;
      replacementPlayer.owner = null;
      
      // Update team budget
      team.budget = team.budget + replacementPlayer.price - player.price;
      
      // Update team players array
      const playerIndex = team.players.findIndex(p => p._id.equals(replacementId));
      if (playerIndex !== -1) {
        team.players[playerIndex] = player._id;
      }
      
      // Update formations if needed
      const starterIndex = team.starters.findIndex(p => p.equals(replacementId));
      if (starterIndex !== -1) {
        team.starters[starterIndex] = player._id;
      }
      
      const subIndex = team.subs.findIndex(p => p.equals(replacementId));
      if (subIndex !== -1) {
        team.subs[subIndex] = player._id;
      }
      
      // Update captain/vice-captain if replaced
      if (team.captain.equals(replacementId)) {
        team.captain = player._id;
      }
      if (team.viceCaptain.equals(replacementId)) {
        team.viceCaptain = player._id;
      }
      
      await replacementPlayer.save({ session });
      
    } else {
      // Simple purchase (expand squad - not allowed in this format)
      return res.status(400).json({
        error: 'Replacement required',
        message: 'You must sell a player of the same position to buy a new one.'
      });
    }
    
    // Update transfer tracking
    if (team.transfers.free > 0) {
      team.transfers.free--;
    } else {
      team.transfers.cost += transferCost;
    }
    team.transfers.made++;
    
    await Promise.all([
      player.save({ session }),
      team.save({ session })
    ]);
    
    await session.commitTransaction();
    
    console.log(`✅ Transfer: ${team.name} bought ${player.name}${replacementPlayer ? ` for ${replacementPlayer.name}` : ''}`);
    
    res.json({
      message: 'Transfer completed successfully',
      transfer: {
        playerIn: {
          id: player._id,
          name: player.name,
          position: player.position,
          price: player.price
        },
        playerOut: replacementPlayer ? {
          id: replacementPlayer._id,
          name: replacementPlayer.name,
          position: replacementPlayer.position,
          price: replacementPlayer.price
        } : null,
        cost: transferCost,
        newBudget: team.budget
      }
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Transfer error:', error);
    res.status(500).json({
      error: 'Transfer failed',
      message: 'Unable to complete transfer. Please try again.'
    });
  } finally {
    session.endSession();
  }
});

/**
 * POST /api/team/sell
 * Sell a player (transfer out)
 */
router.post('/sell', 
  authenticateSession, 
  requireTeam, 
  checkGameLockMiddleware,
  validateRequest(transferPlayerSchema), 
  async (req, res) => {
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { playerId } = req.body;
    const teamId = req.user.team;
    
    // Get team and player
    const [team, player] = await Promise.all([
      Team.findById(teamId).session(session),
      Player.findOne({ _id: playerId, owner: teamId }).session(session)
    ]);
    
    if (!team || !player) {
      return res.status(404).json({
        error: 'Player not found',
        message: 'Player not found in your team.'
      });
    }
    
    // Remove player from team
    player.owner = null;
    team.budget += player.price;
    
    // Remove from team arrays
    team.players = team.players.filter(p => !p.equals(playerId));
    team.starters = team.starters.filter(p => !p.equals(playerId));
    team.subs = team.subs.filter(p => !p.equals(playerId));
    
    // Reset captain/vice-captain if sold
    if (team.captain?.equals(playerId)) {
      // Auto-assign new captain from remaining players
      const remainingPlayers = await Player.find({ 
        _id: { $in: team.players }, 
        owner: teamId 
      }).session(session);
      
      if (remainingPlayers.length > 0) {
        team.captain = remainingPlayers[0]._id;
      }
    }
    
    if (team.viceCaptain?.equals(playerId)) {
      // Auto-assign new vice-captain
      const remainingPlayers = await Player.find({ 
        _id: { $in: team.players }, 
        owner: teamId 
      }).session(session);
      
      const newViceCaptain = remainingPlayers.find(p => !p._id.equals(team.captain));
      if (newViceCaptain) {
        team.viceCaptain = newViceCaptain._id;
      }
    }
    
    await Promise.all([
      player.save({ session }),
      team.save({ session })
    ]);
    
    await session.commitTransaction();
    
    console.log(`✅ Sale: ${team.name} sold ${player.name} for €${player.price}M`);
    
    res.json({
      message: 'Player sold successfully',
      sale: {
        player: {
          id: player._id,
          name: player.name,
          position: player.position,
          price: player.price
        },
        newBudget: team.budget
      }
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Sale error:', error);
    res.status(500).json({
      error: 'Sale failed',
      message: 'Unable to sell player. Please try again.'
    });
  } finally {
    session.endSession();
  }
});

module.exports = router;
