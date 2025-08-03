const mongoose = require('mongoose');

/**
 * Player Schema - Represents a player in the TSW Fantasy League
 * Players are seeded from players.js and can be owned by only one team at a time
 */
const PlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    enum: ['GK', 'CDM', 'LW', 'RW'],
    uppercase: true
  },
  region: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    max: 50 // Maximum price in millions
  },
  overall: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  // Stats for current gameweek (reset weekly)
  weeklyStats: {
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    cleanSheet: { type: Boolean, default: false },
    ownGoals: { type: Number, default: 0 },
    played: { type: Boolean, default: false },
    points: { type: Number, default: 0 }
  },
  // Season totals
  seasonStats: {
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    cleanSheets: { type: Number, default: 0 },
    ownGoals: { type: Number, default: 0 },
    appearances: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Compound index for unique player identification
PlayerSchema.index({ name: 1, position: 1 }, { unique: true });
// Index for market filtering
PlayerSchema.index({ position: 1, region: 1, price: 1 });
// Index for ownership queries
PlayerSchema.index({ owner: 1 });

/**
 * Calculate weekly points based on performance
 * Called when weekly stats are updated
 */
PlayerSchema.methods.calculateWeeklyPoints = function() {
  let points = 0;
  
  // Goals scoring system
  if (this.position === 'LW' || this.position === 'RW') {
    points += this.weeklyStats.goals * 4;
    points += this.weeklyStats.assists * 2;
    points += this.weeklyStats.saves * 1;
  } else if (this.position === 'CDM' || this.position === 'GK') {
    points += this.weeklyStats.goals * 5;
    points += this.weeklyStats.assists * 3;
    points += this.weeklyStats.saves * (this.position === 'GK' ? 0.5 : 1);
  }
  
  // Clean sheet bonuses
  if (this.weeklyStats.cleanSheet) {
    points += this.position === 'GK' ? 5 : (this.position === 'CDM' ? 4 : 0);
  }
  
  // Own goal penalty
  points -= this.weeklyStats.ownGoals * 2;
  
  this.weeklyStats.points = points;
  return points;
};

module.exports = mongoose.model('Player', PlayerSchema);
