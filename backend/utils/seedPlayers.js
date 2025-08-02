const Player = require('../models/Player');
const playersList = require('../tsw-players');

/**
 * Seed Players Database
 * Idempotent function to populate the players collection with initial data
 * This ensures all players from players.js are available in the database
 */
async function seedPlayers() {
  try {
    console.log('🌱 Starting player seeding process...');
    
    let createdCount = 0;
    let existingCount = 0;
    
    for (const playerData of playersList) {
      try {
        // Use upsert to avoid duplicates based on name and position
        const result = await Player.updateOne(
          { 
            name: playerData.name, 
            position: playerData.position 
          },
          { 
            $setOnInsert: {
              ...playerData,
              owner: null, // Ensure all seeded players start unowned
              weeklyStats: {
                goals: 0,
                assists: 0,
                saves: 0,
                cleanSheet: false,
                ownGoals: 0,
                played: false,
                points: 0
              },
              seasonStats: {
                goals: 0,
                assists: 0,
                saves: 0,
                cleanSheets: 0,
                ownGoals: 0,
                appearances: 0,
                totalPoints: 0
              }
            }
          },
          { upsert: true }
        );
        
        if (result.upsertedCount > 0) {
          createdCount++;
          console.log(`✅ Created player: ${playerData.name} (${playerData.position})`);
        } else {
          existingCount++;
        }
        
      } catch (playerError) {
        console.error(`❌ Error seeding player ${playerData.name}:`, playerError.message);
      }
    }
    
    console.log(`🎯 Player seeding completed:`);
    console.log(`   - Created: ${createdCount} players`);
    console.log(`   - Already existed: ${existingCount} players`);
    console.log(`   - Total in database: ${createdCount + existingCount} players`);
    
    // Verify player counts by position
    const positionCounts = await Player.aggregate([
      { $group: { _id: '$position', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('📊 Players by position:');
    positionCounts.forEach(pos => {
      console.log(`   - ${pos._id}: ${pos.count} players`);
    });
    
    return {
      success: true,
      created: createdCount,
      existing: existingCount,
      total: createdCount + existingCount,
      positionCounts
    };
    
  } catch (error) {
    console.error('❌ Player seeding failed:', error);
    throw new Error(`Player seeding failed: ${error.message}`);
  }
}

/**
 * Reset Weekly Stats
 * Resets all players' weekly stats for a new gameweek
 * Should be called at the start of each gameweek
 */
async function resetWeeklyStats() {
  try {
    console.log('🔄 Resetting weekly stats for all players...');
    
    const result = await Player.updateMany(
      {},
      {
        $set: {
          'weeklyStats.goals': 0,
          'weeklyStats.assists': 0,
          'weeklyStats.saves': 0,
          'weeklyStats.cleanSheet': false,
          'weeklyStats.ownGoals': 0,
          'weeklyStats.played': false,
          'weeklyStats.points': 0
        }
      }
    );
    
    console.log(`✅ Reset weekly stats for ${result.modifiedCount} players`);
    return result;
    
  } catch (error) {
    console.error('❌ Failed to reset weekly stats:', error);
    throw error;
  }
}

/**
 * Update Player Performance
 * Updates a player's weekly stats and recalculates points
 */
async function updatePlayerPerformance(playerId, stats) {
  try {
    const player = await Player.findById(playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    
    // Update weekly stats
    Object.assign(player.weeklyStats, stats);
    player.weeklyStats.played = true;
    
    // Calculate weekly points
    player.calculateWeeklyPoints();
    
    // Update season totals
    player.seasonStats.goals += stats.goals || 0;
    player.seasonStats.assists += stats.assists || 0;
    player.seasonStats.saves += stats.saves || 0;
    player.seasonStats.ownGoals += stats.ownGoals || 0;
    player.seasonStats.appearances += 1;
    player.seasonStats.totalPoints += player.weeklyStats.points;
    
    if (stats.cleanSheet) {
      player.seasonStats.cleanSheets += 1;
    }
    
    await player.save();
    
    console.log(`📈 Updated performance for ${player.name}: ${player.weeklyStats.points} points`);
    return player;
    
  } catch (error) {
    console.error('❌ Failed to update player performance:', error);
    throw error;
  }
}

/**
 * Get Available Players
 * Returns players that are not owned by any team
 */
async function getAvailablePlayers(filters = {}) {
  try {
    const query = { owner: null };
    
    // Apply filters
    if (filters.position) query.position = filters.position;
    if (filters.region) query.region = new RegExp(filters.region, 'i');
    if (filters.minPrice) query.price = { ...query.price, $gte: filters.minPrice };
    if (filters.maxPrice) query.price = { ...query.price, $lte: filters.maxPrice };
    
    // Sorting
    const sortBy = filters.sortBy || 'overall';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };
    
    // Pagination
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;
    
    const players = await Player.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-weeklyStats -seasonStats'); // Exclude stats for market view
    
    const total = await Player.countDocuments(query);
    
    return {
      players,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
  } catch (error) {
    console.error('❌ Failed to get available players:', error);
    throw error;
  }
}

/**
 * Validate Player Ownership
 * Checks if players are available for purchase
 */
async function validatePlayerOwnership(playerIds) {
  try {
    const players = await Player.find({ 
      _id: { $in: playerIds },
      owner: { $ne: null }
    }).select('name owner');
    
    if (players.length > 0) {
      const ownedPlayerNames = players.map(p => p.name);
      throw new Error(`Players already owned: ${ownedPlayerNames.join(', ')}`);
    }
    
    return true;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  seedPlayers,
  resetWeeklyStats,
  updatePlayerPerformance,
  getAvailablePlayers,
  validatePlayerOwnership
};
