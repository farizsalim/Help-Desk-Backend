const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  conversation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  action: {
    type: String,
    enum: ['ADD_IT_STAFF', 'CLOSED', 'CREATED', 'REOPENED', 'STATUS_CHANGED'],
    required: true
  },
  actor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  target_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  details: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
activityLogSchema.index({ conversation_id: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
