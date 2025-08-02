const express = require('express');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { authenticateSession } = require('../middleware/auth');
const { validateRequest, createTicketSchema, validateObjectId } = require('../middleware/validate');

const router = express.Router();

/**
 * POST /api/tickets
 * Create a new support ticket
 * 
 * Business Rules:
 * - Users can create tickets for various categories
 * - Auto-generates unique ticket ID
 * - Initial message is added to thread
 * - Priority defaults to 'medium' unless specified
 */
router.post('/', authenticateSession, validateRequest(createTicketSchema), async (req, res) => {
  try {
    const { subject, description, category, priority = 'medium' } = req.body;
    const userId = req.user.id;
    
    // Create ticket
    const ticket = new Ticket({
      user: userId,
      subject,
      description,
      category,
      priority,
      messages: [{
        sender: req.user.username,
        message: description,
        isAdminResponse: false,
        timestamp: new Date()
      }]
    });
    
    await ticket.save();
    
    // Add ticket to user's tickets array
    await User.findByIdAndUpdate(userId, {
      $push: { tickets: ticket._id }
    });
    
    console.log(`✅ New ticket created: ${ticket.ticketId} by ${req.user.username}`);
    
    res.status(201).json({
      message: 'Support ticket created successfully',
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt,
        messageCount: ticket.messages.length
      }
    });
    
  } catch (error) {
    console.error('❌ Ticket creation error:', error);
    res.status(500).json({
      error: 'Failed to create ticket',
      message: 'Unable to create support ticket. Please try again.'
    });
  }
});

/**
 * GET /api/tickets
 * Get all tickets for the authenticated user
 * 
 * Query Parameters:
 * - status: Filter by status (open, in-progress, resolved, closed)
 * - category: Filter by category
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 50)
 */
router.get('/', authenticateSession, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, category, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = { user: userId };
    
    if (status && ['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
      query.status = status;
    }
    
    if (category && ['technical', 'billing', 'robux', 'gameplay', 'account', 'other'].includes(category)) {
      query.category = category;
    }
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    
    // Get tickets and total count
    const [tickets, totalCount] = await Promise.all([
      Ticket.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('ticketId subject category priority status createdAt messages assignedTo resolvedAt'),
      Ticket.countDocuments(query)
    ]);
    
    // Format tickets
    const formattedTickets = tickets.map(ticket => ({
      id: ticket._id,
      ticketId: ticket.ticketId,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      messageCount: ticket.messages.length,
      lastMessage: ticket.messages.length > 0 ? {
        sender: ticket.messages[ticket.messages.length - 1].sender,
        timestamp: ticket.messages[ticket.messages.length - 1].timestamp,
        isAdminResponse: ticket.messages[ticket.messages.length - 1].isAdminResponse
      } : null,
      assignedTo: ticket.assignedTo,
      createdAt: ticket.createdAt,
      resolvedAt: ticket.resolvedAt,
      timeAgo: getTimeAgo(ticket.createdAt)
    }));
    
    // Get status summary
    const statusSummary = await getTicketStatusSummary(userId);
    
    res.json({
      tickets: formattedTickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
        hasNext: pageNum < Math.ceil(totalCount / limitNum),
        hasPrev: pageNum > 1
      },
      summary: statusSummary
    });
    
  } catch (error) {
    console.error('❌ Tickets fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch tickets',
      message: 'Unable to retrieve support tickets.'
    });
  }
});

/**
 * GET /api/tickets/:id
 * Get detailed information about a specific ticket
 */
router.get('/:id', authenticateSession, validateObjectId('id'), async (req, res) => {
  try {
    const ticketId = req.params.id;
    const userId = req.user.id;
    
    const ticket = await Ticket.findOne({ 
      _id: ticketId, 
      user: userId 
    });
    
    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found',
        message: 'Ticket not found or you do not have permission to access it.'
      });
    }
    
    // Format full ticket details
    const ticketDetails = {
      id: ticket._id,
      ticketId: ticket.ticketId,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      assignedTo: ticket.assignedTo,
      createdAt: ticket.createdAt,
      resolvedAt: ticket.resolvedAt,
      resolution: ticket.resolution,
      tags: ticket.tags,
      
      // Billing info (if applicable)
      billingInfo: ticket.category === 'billing' || ticket.category === 'robux' ? {
        amount: ticket.billingInfo.amount,
        currency: ticket.billingInfo.currency,
        transactionId: ticket.billingInfo.transactionId,
        paymentMethod: ticket.billingInfo.paymentMethod
      } : null,
      
      // Message thread
      messages: ticket.messages.map(msg => ({
        sender: msg.sender,
        message: msg.message,
        timestamp: msg.timestamp,
        isAdminResponse: msg.isAdminResponse,
        timeAgo: getTimeAgo(msg.timestamp)
      })).sort((a, b) => a.timestamp - b.timestamp)
    };
    
    res.json({
      ticket: ticketDetails
    });
    
  } catch (error) {
    console.error('❌ Ticket details error:', error);
    res.status(500).json({
      error: 'Failed to fetch ticket details'
    });
  }
});

/**
 * POST /api/tickets/:id/reply
 * Add a reply to a ticket thread
 */
router.post('/:id/reply', authenticateSession, validateObjectId('id'), async (req, res) => {
  try {
    const ticketId = req.params.id;
    const userId = req.user.id;
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message is required',
        message: 'Reply message cannot be empty.'
      });
    }
    
    if (message.length > 500) {
      return res.status(400).json({
        error: 'Message too long',
        message: 'Reply message cannot exceed 500 characters.'
      });
    }
    
    const ticket = await Ticket.findOne({ 
      _id: ticketId, 
      user: userId 
    });
    
    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found',
        message: 'Ticket not found or you do not have permission to reply.'
      });
    }
    
    if (ticket.status === 'closed') {
      return res.status(400).json({
        error: 'Ticket closed',
        message: 'Cannot reply to a closed ticket.'
      });
    }
    
    // Add message to thread
    await ticket.addMessage(req.user.username, message.trim(), false);
    
    console.log(`✅ Ticket reply: ${req.user.username} replied to ${ticket.ticketId}`);
    
    res.json({
      message: 'Reply added successfully',
      reply: {
        sender: req.user.username,
        message: message.trim(),
        timestamp: new Date(),
        isAdminResponse: false
      },
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        status: ticket.status,
        messageCount: ticket.messages.length
      }
    });
    
  } catch (error) {
    console.error('❌ Ticket reply error:', error);
    res.status(500).json({
      error: 'Failed to add reply',
      message: 'Unable to add reply to ticket.'
    });
  }
});

/**
 * PUT /api/tickets/:id/close
 * Close a ticket (user can close their own tickets)
 */
router.put('/:id/close', authenticateSession, validateObjectId('id'), async (req, res) => {
  try {
    const ticketId = req.params.id;
    const userId = req.user.id;
    
    const ticket = await Ticket.findOne({ 
      _id: ticketId, 
      user: userId 
    });
    
    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found',
        message: 'Ticket not found or you do not have permission to close it.'
      });
    }
    
    if (ticket.status === 'closed') {
      return res.status(400).json({
        error: 'Ticket already closed',
        message: 'This ticket is already closed.'
      });
    }
    
    // Close ticket
    ticket.status = 'closed';
    ticket.resolvedAt = new Date();
    ticket.resolution = 'Closed by user';
    
    await ticket.save();
    
    console.log(`✅ Ticket closed: ${req.user.username} closed ${ticket.ticketId}`);
    
    res.json({
      message: 'Ticket closed successfully',
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        status: ticket.status,
        resolvedAt: ticket.resolvedAt
      }
    });
    
  } catch (error) {
    console.error('❌ Ticket close error:', error);
    res.status(500).json({
      error: 'Failed to close ticket'
    });
  }
});

/**
 * GET /api/tickets/lookup/:ticketId
 * Look up a ticket by its public ticket ID
 */
router.get('/lookup/:ticketId', authenticateSession, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;
    
    const ticket = await Ticket.findOne({ 
      ticketId: ticketId.toUpperCase(), 
      user: userId 
    }).select('_id ticketId subject status createdAt');
    
    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found',
        message: 'No ticket found with this ID.'
      });
    }
    
    res.json({
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Ticket lookup error:', error);
    res.status(500).json({
      error: 'Failed to lookup ticket'
    });
  }
});

/**
 * GET /api/tickets/categories
 * Get available ticket categories and their descriptions
 */
router.get('/categories', (req, res) => {
  const categories = [
    {
      id: 'technical',
      name: 'Technical Issues',
      description: 'Bugs, login problems, or technical difficulties'
    },
    {
      id: 'billing',
      name: 'Billing & Payments',
      description: 'Payment issues, refunds, or billing inquiries'
    },
    {
      id: 'robux',
      name: 'Robux Purchase',
      description: 'Request to purchase Robux or premium features'
    },
    {
      id: 'gameplay',
      name: 'Gameplay Issues',
      description: 'Game rules, scoring, or fantasy league questions'
    },
    {
      id: 'account',
      name: 'Account Issues',
      description: 'Account access, profile, or security concerns'
    },
    {
      id: 'other',
      name: 'Other',
      description: 'General inquiries or feedback'
    }
  ];
  
  const priorities = [
    {
      id: 'low',
      name: 'Low',
      description: 'General questions or minor issues'
    },
    {
      id: 'medium',
      name: 'Medium',
      description: 'Standard support requests'
    },
    {
      id: 'high',
      name: 'High',
      description: 'Urgent issues affecting gameplay'
    },
    {
      id: 'urgent',
      name: 'Urgent',
      description: 'Critical issues requiring immediate attention'
    }
  ];
  
  res.json({
    categories,
    priorities
  });
});

// Helper Functions

/**
 * Get ticket status summary for a user
 */
async function getTicketStatusSummary(userId) {
  const summary = await Ticket.aggregate([
    { $match: { user: userId } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  const result = {
    open: 0,
    'in-progress': 0,
    resolved: 0,
    closed: 0,
    total: 0
  };
  
  summary.forEach(item => {
    result[item._id] = item.count;
    result.total += item.count;
  });
  
  return result;
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
