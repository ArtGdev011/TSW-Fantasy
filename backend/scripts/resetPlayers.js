const mongoose = require('mongoose');
const Player = require('../models/Player');
const tswPlayers = require('../tsw-players');

// Connect to MongoDB
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tsw-fantasy-league';

async function clearAndReseedPlayers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // STEP 1: Delete ALL existing players
    console.log('🗑️  Deleting ALL existing players from database...');
    const deleteResult = await Player.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing players`);

    // STEP 2: Insert TSW players
    console.log('🌱 Inserting TSW players...');
    let createdCount = 0;

    for (const playerData of tswPlayers) {
      try {
        const player = await Player.create({
          ...playerData,
          owner: null, // All players start unowned
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
        });
        
        createdCount++;
        console.log(`✅ Created TSW player: ${playerData.name} (${playerData.position}) - ${playerData.region} - ${playerData.price}M - OVR ${playerData.overall}`);
        
      } catch (playerError) {
        console.error(`❌ Error creating player ${playerData.name}:`, playerError.message);
      }
    }

    // STEP 3: Verify results
    console.log('📊 Verification - Players by position:');
    const positionCounts = await Player.aggregate([
      { $group: { _id: '$position', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    positionCounts.forEach(pos => {
      console.log(`   - ${pos._id}: ${pos.count} players`);
    });

    console.log('📊 Verification - Players by region:');
    const regionCounts = await Player.aggregate([
      { $group: { _id: '$region', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    regionCounts.forEach(region => {
      console.log(`   - ${region._id}: ${region.count} players`);
    });

    console.log('🎯 Database reset completed successfully!');
    console.log(`   - Total TSW players created: ${createdCount}`);
    console.log(`   - All players are available for drafting`);

    // Show some example players
    console.log('🌟 Example TSW Players:');
    const examplePlayers = await Player.find().limit(5).select('name position region price overall');
    examplePlayers.forEach(player => {
      console.log(`   - ${player.name} (${player.position}) - ${player.region} - ${player.price}M - OVR ${player.overall}`);
    });

  } catch (error) {
    console.error('❌ Database reset failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  clearAndReseedPlayers();
}

module.exports = clearAndReseedPlayers;
