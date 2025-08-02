/**
 * Scoring System Utility
 * Handles all point calculations for the TSW Fantasy League
 * Implements the complex scoring rules including captain multipliers
 */

/**
 * Calculate points for a single player's performance
 * @param {Object} player - Player object with weeklyStats
 * @param {string} role - 'starter', 'captain', 'vice-captain', 'bench'
 * @param {Object} modifiers - Additional modifiers (chips, etc.)
 */
function calculatePlayerPoints(player, role = 'starter', modifiers = {}) {
  if (!player.weeklyStats.played) {
    return 0;
  }
  
  let points = 0;
  const stats = player.weeklyStats;
  const position = player.position;
  
  // Base scoring system based on position
  switch (position) {
    case 'LW':
    case 'RW':
      points += stats.goals * 4;      // Goals = 4 points
      points += stats.assists * 2;    // Assists = 2 points
      points += stats.saves * 1;      // Saves = 1 point
      break;
      
    case 'CDM':
      points += stats.goals * 5;      // Goals = 5 points
      points += stats.assists * 3;    // Assists = 3 points
      points += stats.saves * 1;      // Saves = 1 point
      // Clean sheet bonus
      if (stats.cleanSheet) {
        points += 4;                  // Clean sheet = 4 points
      }
      break;
      
    case 'GK':
      points += stats.goals * 5;      // Goals = 5 points (rare!)
      points += stats.assists * 3;    // Assists = 3 points
      points += stats.saves * 0.5;    // Saves = 0.5 points
      // Clean sheet bonus
      if (stats.cleanSheet) {
        points += 5;                  // Clean sheet = 5 points
      }
      break;
  }
  
  // Own goal penalty
  points -= stats.ownGoals * 2;       // Own goal = -2 points
  
  // Apply role-based multipliers
  if (role === 'captain') {
    if (modifiers.tripleCaptain) {
      points *= 3;                    // Triple captain chip
    } else if (modifiers.bothCaptainsPlayed) {
      points *= 1.5;                  // Both captain and vice played
    } else {
      points *= 2;                    // Standard captain double
    }
  } else if (role === 'vice-captain') {
    if (modifiers.captainDidntPlay) {
      points *= 2;                    // Vice becomes captain
    } else if (modifiers.bothCaptainsPlayed) {
      points *= 1.5;                  // Both played
    }
  }
  
  return Math.round(points * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate total team points for a gameweek
 * @param {Object} team - Team object with populated players
 * @param {boolean} includeBench - Whether to include bench points (Bench Boost chip)
 */
async function calculateTeamPoints(team, includeBench = false) {
  await team.populate('starters subs captain viceCaptain');
  
  let totalPoints = 0;
  const captainPlayed = team.captain.weeklyStats.played;
  const viceCaptainPlayed = team.viceCaptain.weeklyStats.played;
  const bothCaptainsPlayed = captainPlayed && viceCaptainPlayed;
  
  // Determine captain modifiers
  const modifiers = {
    tripleCaptain: team.activeChip === 'tripleCaptain',
    bothCaptainsPlayed,
    captainDidntPlay: !captainPlayed
  };
  
  // Calculate starter points
  for (const player of team.starters) {
    let role = 'starter';
    
    // Determine if player is captain or vice-captain
    if (player._id.equals(team.captain._id)) {
      role = 'captain';
    } else if (player._id.equals(team.viceCaptain._id)) {
      role = 'vice-captain';
    }
    
    const playerPoints = calculatePlayerPoints(player, role, modifiers);
    totalPoints += playerPoints;
    
    console.log(`${player.name} (${role}): ${playerPoints} points`);
  }
  
  // Include bench points if Bench Boost is active
  if (includeBench || team.activeChip === 'benchBoost') {
    for (const player of team.subs) {
      const playerPoints = calculatePlayerPoints(player, 'bench');
      totalPoints += playerPoints;
      
      console.log(`${player.name} (bench): ${playerPoints} points`);
    }
  }
  
  // Deduct transfer costs
  const transferCost = team.transfers.cost || 0;
  totalPoints -= transferCost;
  
  if (transferCost > 0) {
    console.log(`Transfer cost deduction: -${transferCost} points`);
  }
  
  return Math.round(totalPoints * 10) / 10;
}

/**
 * Update all team points for the current gameweek
 * Should be called after player stats are updated
 */
async function updateAllTeamPoints() {
  const Team = require('../models/Team');
  
  try {
    console.log('🔄 Updating points for all teams...');
    
    const teams = await Team.find({})
      .populate('starters subs captain viceCaptain');
    
    let updatedCount = 0;
    
    for (const team of teams) {
      try {
        const includeBench = team.activeChip === 'benchBoost';
        const weeklyPoints = await calculateTeamPoints(team, includeBench);
        
        // Update team points
        team.weeklyPoints = weeklyPoints;
        team.points += weeklyPoints;
        
        await team.save();
        updatedCount++;
        
        console.log(`✅ ${team.name}: ${weeklyPoints} points (Total: ${team.points})`);
        
      } catch (teamError) {
        console.error(`❌ Error updating ${team.name}:`, teamError.message);
      }
    }
    
    console.log(`🎯 Updated points for ${updatedCount} teams`);
    return updatedCount;
    
  } catch (error) {
    console.error('❌ Failed to update team points:', error);
    throw error;
  }
}

/**
 * Get leaderboard with team rankings
 * @param {number} limit - Number of teams to return
 * @param {number} page - Page number for pagination
 */
async function getLeaderboard(limit = 50, page = 1) {
  const Team = require('../models/Team');
  
  try {
    const skip = (page - 1) * limit;
    
    const teams = await Team.find({})
      .populate('user', 'username')
      .sort({ points: -1, weeklyPoints: -1, createdAt: 1 }) // Sort by total points, then weekly, then creation time
      .skip(skip)
      .limit(limit)
      .select('name points weeklyPoints teamValue user');
    
    // Add rankings
    const rankedTeams = teams.map((team, index) => ({
      rank: skip + index + 1,
      name: team.name,
      owner: team.user.username,
      points: team.points,
      weeklyPoints: team.weeklyPoints,
      teamValue: team.teamValue
    }));
    
    const totalTeams = await Team.countDocuments({});
    
    return {
      teams: rankedTeams,
      pagination: {
        page,
        limit,
        total: totalTeams,
        pages: Math.ceil(totalTeams / limit)
      }
    };
    
  } catch (error) {
    console.error('❌ Failed to get leaderboard:', error);
    throw error;
  }
}

/**
 * Calculate points prediction for a potential team selection
 * Used by frontend to show expected points before confirming transfers
 */
function predictTeamPoints(players, captainId, viceCaptainId, activeChip = null) {
  // This would use historical averages or prediction models
  // For now, return a simple average based on player overall ratings
  
  let prediction = 0;
  const captain = players.find(p => p._id === captainId);
  const viceCaptain = players.find(p => p._id === viceCaptainId);
  
  players.forEach(player => {
    // Simple prediction based on overall rating
    let basePoints = (player.overall - 50) / 10; // Convert 50-100 rating to 0-5 points
    
    if (player._id === captainId) {
      basePoints *= (activeChip === 'tripleCaptain' ? 3 : 2);
    } else if (player._id === viceCaptainId) {
      basePoints *= 1.5;
    }
    
    prediction += basePoints;
  });
  
  return Math.round(prediction * 10) / 10;
}

module.exports = {
  calculatePlayerPoints,
  calculateTeamPoints,
  updateAllTeamPoints,
  getLeaderboard,
  predictTeamPoints
};
