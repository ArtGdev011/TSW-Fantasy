const mongoose = require('mongoose');

/**
 * User Schema - Represents a registered user in the TSW Fantasy League
 * Each user can have only one team and maintains their inbox/tickets
 */
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/ // Only alphanumeric and underscore
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  email: {
    type: String,
    sparse: true, // Optional field
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  inbox: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inbox'
  }],
  tickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  }],
  lastActive: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster lookups
UserSchema.index({ username: 1 });
UserSchema.index({ team: 1 });

module.exports = mongoose.model('User', UserSchema);
