const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['open', 'in_progress', 'closed'],
    default: 'open'
  },
  is_locked: {
    type: Boolean,
    default: false
  },
  closed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  closed_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
conversationSchema.index({ participants: 1, status: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
