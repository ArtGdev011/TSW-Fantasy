const mongoose = require('mongoose');

/**
 * Ticket Schema - Represents support tickets created by users
 * For issues, Robux purchases, or general support requests
 */
const TicketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ticketId: {
    type: String,
    unique: true,
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'robux', 'gameplay', 'account', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: {
    type: String,
    default: null // Admin username who handles the ticket
  },
  // Communication thread
  messages: [{
    sender: {
      type: String,
      required: true // 'user' or admin username
    },
    message: {
      type: String,
      required: true,
      maxlength: 500
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isAdminResponse: {
      type: Boolean,
      default: false
    }
  }],
  // Billing specific fields
  billingInfo: {
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    transactionId: { type: String, default: null },
    paymentMethod: { type: String, default: null }
  },
  resolution: {
    type: String,
    trim: true,
    maxlength: 500,
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Auto-generate ticket ID before saving
TicketSchema.pre('save', function(next) {
  if (!this.ticketId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.ticketId = `TSW-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Indexes for efficient queries
TicketSchema.index({ user: 1, createdAt: -1 });
TicketSchema.index({ ticketId: 1 }, { unique: true });
TicketSchema.index({ status: 1, priority: 1 });
TicketSchema.index({ category: 1 });

/**
 * Add a new message to the ticket thread
 */
TicketSchema.methods.addMessage = function(sender, message, isAdmin = false) {
  this.messages.push({
    sender,
    message,
    isAdminResponse: isAdmin,
    timestamp: new Date()
  });
  
  // Update status if user responds to resolved ticket
  if (!isAdmin && this.status === 'resolved') {
    this.status = 'open';
  }
  
  return this.save();
};

/**
 * Resolve the ticket with optional resolution message
 */
TicketSchema.methods.resolve = function(resolution = null, resolvedBy = null) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.assignedTo = resolvedBy || this.assignedTo;
  
  if (resolution) {
    this.resolution = resolution;
  }
  
  return this.save();
};

module.exports = mongoose.model('Ticket', TicketSchema);
