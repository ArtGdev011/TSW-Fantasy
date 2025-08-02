const express = require('express');
const Inbox = require('../models/Inbox');
const User = require('../models/User');
const { authenticateSession } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');

const router = express.Router();

/**
 * GET /api/inbox
 * Get all inbox messages for the authenticated user
 * 
 * Query Parameters:
 * - type: Filter by message type (pack, notification, system, reward)
 * - isRead: Filter by read status (true/false)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 50)
 */
router.get('/', authenticateSession, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, isRead, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = { user: userId };
    
    if (type && ['pack', 'notification', 'system', 'reward'].includes(type)) {
      query.type = type;
    }
    
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    
    // Get messages and total count
    const [messages, totalCount, unreadCount] = await Promise.all([
      Inbox.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Inbox.countDocuments(query),
      Inbox.countDocuments({ user: userId, isRead: false })
    ]);
    
    // Format messages
    const formattedMessages = messages.map(message => ({
      id: message._id,
      type: message.type,
      title: message.title,
      message: message.message,
      isRead: message.isRead,
      priority: message.priority,
      reward: message.reward.type ? {
        type: message.reward.type,
        value: message.reward.value,
        claimed: message.reward.claimed
      } : null,
      createdAt: message.createdAt,
      timeAgo: getTimeAgo(message.createdAt)
    }));
    
    res.json({
      messages: formattedMessages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
        hasNext: pageNum < Math.ceil(totalCount / limitNum),
        hasPrev: pageNum > 1
      },
      summary: {
        total: totalCount,
        unread: unreadCount,
        byType: await getMessageCountsByType(userId)
      }
    });
    
  } catch (error) {
    console.error('❌ Inbox fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch inbox',
      message: 'Unable to retrieve messages.'
    });
  }
});

/**
 * GET /api/inbox/unread
 * Get count of unread messages
 */
router.get('/unread', authenticateSession, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const unreadCount = await Inbox.countDocuments({ 
      user: userId, 
      isRead: false 
    });
    
    const unreadByType = await Inbox.aggregate([
      { $match: { user: userId, isRead: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    const typeBreakdown = {};
    unreadByType.forEach(item => {
      typeBreakdown[item._id] = item.count;
    });
    
    res.json({
      unreadCount,
      breakdown: typeBreakdown
    });
    
  } catch (error) {
    console.error('❌ Unread count error:', error);
    res.status(500).json({
      error: 'Failed to fetch unread count'
    });
  }
});

/**
 * POST /api/inbox/:id/read
 * Mark a message as read
 */
router.post('/:id/read', authenticateSession, validateObjectId('id'), async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;
    
    const message = await Inbox.findOneAndUpdate(
      { _id: messageId, user: userId },
      { isRead: true },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({
        error: 'Message not found',
        message: 'Message not found or you do not have permission to access it.'
      });
    }
    
    res.json({
      message: 'Message marked as read',
      messageId: message._id,
      isRead: message.isRead
    });
    
  } catch (error) {
    console.error('❌ Mark read error:', error);
    res.status(500).json({
      error: 'Failed to mark message as read'
    });
  }
});

/**
 * POST /api/inbox/read-all
 * Mark all messages as read
 */
router.post('/read-all', authenticateSession, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.body; // Optional: mark only specific type as read
    
    const query = { user: userId, isRead: false };
    if (type && ['pack', 'notification', 'system', 'reward'].includes(type)) {
      query.type = type;
    }
    
    const result = await Inbox.updateMany(query, { isRead: true });
    
    res.json({
      message: 'Messages marked as read',
      markedCount: result.modifiedCount,
      type: type || 'all'
    });
    
  } catch (error) {
    console.error('❌ Mark all read error:', error);
    res.status(500).json({
      error: 'Failed to mark messages as read'
    });
  }
});

/**
 * POST /api/inbox/:id/claim-reward
 * Claim a reward from a message
 */
router.post('/:id/claim-reward', authenticateSession, validateObjectId('id'), async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;
    
    const message = await Inbox.findOne({ 
      _id: messageId, 
      user: userId,
      'reward.type': { $ne: null },
      'reward.claimed': false
    });
    
    if (!message) {
      return res.status(404).json({
        error: 'Reward not found',
        message: 'No claimable reward found for this message.'
      });
    }
    
    // Apply reward based on type
    const rewardApplied = await applyReward(userId, message.reward);
    
    if (rewardApplied) {
      // Mark reward as claimed
      message.reward.claimed = true;
      message.isRead = true;
      await message.save();
      
      console.log(`✅ Reward claimed: ${req.user.username} claimed ${message.reward.type} worth ${message.reward.value}`);
      
      res.json({
        message: 'Reward claimed successfully',
        reward: {
          type: message.reward.type,
          value: message.reward.value,
          description: getRewardDescription(message.reward)
        }
      });
    } else {
      res.status(500).json({
        error: 'Failed to apply reward',
        message: 'Could not process reward. Please try again.'
      });
    }
    
  } catch (error) {
    console.error('❌ Claim reward error:', error);
    res.status(500).json({
      error: 'Failed to claim reward'
    });
  }
});

/**
 * DELETE /api/inbox/:id
 * Delete a message
 */
router.delete('/:id', authenticateSession, validateObjectId('id'), async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;
    
    const message = await Inbox.findOneAndDelete({ 
      _id: messageId, 
      user: userId 
    });
    
    if (!message) {
      return res.status(404).json({
        error: 'Message not found',
        message: 'Message not found or you do not have permission to delete it.'
      });
    }
    
    // Remove from user's inbox array
    await User.findByIdAndUpdate(userId, {
      $pull: { inbox: messageId }
    });
    
    res.json({
      message: 'Message deleted successfully',
      messageId: message._id
    });
    
  } catch (error) {
    console.error('❌ Delete message error:', error);
    res.status(500).json({
      error: 'Failed to delete message'
    });
  }
});

/**
 * POST /api/inbox/create-system-message
 * Create a system message (Admin only - for testing)
 * In production, this would be protected by admin middleware
 */
router.post('/create-system-message', authenticateSession, async (req, res) => {
  try {
    const { title, message, type = 'system', priority = 'medium', reward } = req.body;
    const userId = req.user.id;
    
    if (!title || !message) {
      return res.status(400).json({
        error: 'Title and message are required'
      });
    }
    
    const inboxMessage = new Inbox({
      user: userId,
      type,
      title,
      message,
      priority,
      reward: reward || { type: null, value: 0, claimed: false }
    });
    
    await inboxMessage.save();
    
    // Add to user's inbox
    await User.findByIdAndUpdate(userId, {
      $push: { inbox: inboxMessage._id }
    });
    
    res.status(201).json({
      message: 'System message created',
      inboxMessage: {
        id: inboxMessage._id,
        title: inboxMessage.title,
        message: inboxMessage.message,
        type: inboxMessage.type,
        priority: inboxMessage.priority
      }
    });
    
  } catch (error) {
    console.error('❌ Create system message error:', error);
    res.status(500).json({
      error: 'Failed to create system message'
    });
  }
});

// Helper Functions

/**
 * Get message counts by type for a user
 */
async function getMessageCountsByType(userId) {
  const counts = await Inbox.aggregate([
    { $match: { user: userId } },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);
  
  const result = {};
  counts.forEach(item => {
    result[item._id] = item.count;
  });
  
  return result;
}

/**
 * Apply reward to user account
 */
async function applyReward(userId, reward) {
  const Team = require('../models/Team');
  
  try {
    switch (reward.type) {
      case 'points':
        // Add points to team
        await Team.findOneAndUpdate(
          { user: userId },
          { $inc: { points: reward.value } }
        );
        return true;
        
      case 'transfer':
        // Add free transfers
        await Team.findOneAndUpdate(
          { user: userId },
          { $inc: { 'transfers.free': reward.value } }
        );
        return true;
        
      case 'chip':
        // This would require more complex logic to give back a used chip
        // For now, just log it
        console.log(`Chip reward: ${reward.value} for user ${userId}`);
        return true;
        
      default:
        console.log(`Unknown reward type: ${reward.type}`);
        return false;
    }
  } catch (error) {
    console.error('❌ Apply reward error:', error);
    return false;
  }
}

/**
 * Get human-readable reward description
 */
function getRewardDescription(reward) {
  switch (reward.type) {
    case 'points':
      return `${reward.value} fantasy points`;
    case 'transfer':
      return `${reward.value} free transfer${reward.value > 1 ? 's' : ''}`;
    case 'chip':
      return `${reward.value} chip restore`;
    default:
      return 'Unknown reward';
  }
}

/**
 * Get human-readable time ago
 */
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

module.exports = router;
