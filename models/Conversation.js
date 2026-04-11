const mongoose = require('mongoose');
const Counter = require('./Counter');

const conversationSchema = new mongoose.Schema({
  ticket_id: {
    type: String,
    unique: true,
    index: true
  },
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

// Auto-generate ticket_id on new document
conversationSchema.pre('save', async function () {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      'ticket',
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true }
    );
    this.ticket_id = `TKT-${String(counter.seq).padStart(4, '0')}`;
  }
});

// Index for faster queries
conversationSchema.index({ participants: 1, status: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
