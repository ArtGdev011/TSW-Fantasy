const mongoose = require('mongoose');

/**
 * Inbox Schema - Represents messages/notifications for users
 * Used for weekly packs, game updates, and system notifications
 */
const InboxSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['pack', 'notification', 'system', 'reward'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  // For pack rewards
  reward: {
    type: {
      type: String,
      enum: ['points', 'transfer', 'chip', null],
      default: null
    },
    value: {
      type: Number,
      default: 0
    },
    claimed: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
InboxSchema.index({ user: 1, createdAt: -1 });
InboxSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model('Inbox', InboxSchema);
