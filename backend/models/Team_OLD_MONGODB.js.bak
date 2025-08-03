const mongoose = require('mongoose');

/**
 * Team Schema - Represents a user's fantasy team
 * Each user can have only one team with specific formation and budget constraints
 */
const TeamSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  budget: {
    type: Number,
    default: 150,
    min: 0,
    max: 200 // Allow some flexibility for selling
  },
  points: {
    type: Number,
    default: 0
  },
  weeklyPoints: {
    type: Number,
    default: 0
  },
  // All 6 players (5 starters + 1 bench)
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  // Starting XI formation: 1 GK, 2 CDM, 1 LW, 1 RW
  starters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  // Bench: 1 defender (GK/CDM), 1 attacker (LW/RW)
  subs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  viceCaptain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  // Transfers tracking
  transfers: {
    free: { type: Number, default: 1 }, // Free transfers available
    made: { type: Number, default: 0 }, // Transfers made this gameweek
    cost: { type: Number, default: 0 }  // Points deducted for extra transfers
  },
  // Chips - can only be used once per season
  chips: {
    wildcard: { type: Boolean, default: false },
    tripleCaptain: { type: Boolean, default: false },
    benchBoost: { type: Boolean, default: false },
    freeHit: { type: Boolean, default: false }
  },
  // Active chip for current gameweek
  activeChip: {
    type: String,
    enum: ['wildcard', 'tripleCaptain', 'benchBoost', 'freeHit', null],
    default: null
  },
  // Team value calculation
  teamValue: {
    type: Number,
    default: 150
  },
  // Season statistics
  seasonStats: {
    highestWeeklyScore: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    totalTransfers: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes for performance
TeamSchema.index({ user: 1 }, { unique: true });
TeamSchema.index({ points: -1 }); // For leaderboard
TeamSchema.index({ 'seasonStats.rank': 1 });

/**
 * Validate team formation before saving
 * Must have: 1 GK, 2 CDM, 1 LW, 1 RW in starters
 * Must have: 1 defender (GK/CDM), 1 attacker (LW/RW) in subs
 */
TeamSchema.methods.validateFormation = async function() {
  await this.populate('starters subs');
  
  // Count positions in starters
  const starterPositions = { GK: 0, CDM: 0, LW: 0, RW: 0 };
  this.starters.forEach(player => {
    starterPositions[player.position]++;
  });
  
  // Validate starter formation: 1 GK, 2 CDM, 1 LW, 1 RW
  if (starterPositions.GK !== 1 || starterPositions.CDM !== 2 || 
      starterPositions.LW !== 1 || starterPositions.RW !== 1) {
    throw new Error('Invalid formation: Must have 1 GK, 2 CDM, 1 LW, 1 RW in starters');
  }
  
  // Count positions in subs
  const subPositions = { GK: 0, CDM: 0, LW: 0, RW: 0 };
  this.subs.forEach(player => {
    subPositions[player.position]++;
  });
  
  // Validate subs: 1 defender + 1 attacker
  const defenders = subPositions.GK + subPositions.CDM;
  const attackers = subPositions.LW + subPositions.RW;
  
  if (defenders !== 1 || attackers !== 1) {
    throw new Error('Invalid bench: Must have 1 defender (GK/CDM) and 1 attacker (LW/RW)');
  }
  
  return true;
};

/**
 * Calculate total team value based on current player prices
 */
TeamSchema.methods.calculateTeamValue = async function() {
  await this.populate('players');
  const totalValue = this.players.reduce((sum, player) => sum + player.price, 0);
  this.teamValue = totalValue;
  return totalValue;
};

/**
 * Calculate weekly points with captain/vice-captain multipliers
 */
TeamSchema.methods.calculateWeeklyPoints = async function() {
  await this.populate('starters subs captain viceCaptain');
  
  let totalPoints = 0;
  const activeChip = this.activeChip;
  
  // Calculate starter points
  this.starters.forEach(player => {
    let playerPoints = player.weeklyStats.points;
    
    // Captain scoring (if played)
    if (player._id.equals(this.captain._id) && player.weeklyStats.played) {
      if (activeChip === 'tripleCaptain') {
        playerPoints *= 3; // Triple captain chip
      } else if (this.viceCaptain.weeklyStats.played) {
        playerPoints *= 1.5; // Both captain and vice played
      } else {
        playerPoints *= 2; // Only captain played
      }
    }
    // Vice-captain scoring
    else if (player._id.equals(this.viceCaptain._id) && player.weeklyStats.played) {
      if (!this.captain.weeklyStats.played) {
        playerPoints *= 2; // Vice becomes captain
      } else {
        playerPoints *= 1.5; // Both played
      }
    }
    
    totalPoints += playerPoints;
  });
  
  // Bench boost chip includes bench points
  if (activeChip === 'benchBoost') {
    this.subs.forEach(player => {
      totalPoints += player.weeklyStats.points;
    });
  }
  
  // Deduct transfer costs
  totalPoints -= this.transfers.cost;
  
  this.weeklyPoints = totalPoints;
  this.points += totalPoints;
  
  return totalPoints;
};

module.exports = mongoose.model('Team', TeamSchema);
