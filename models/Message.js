const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isi_pesan: {
    type: String,
    required: function() {
      return !this.attachment; // Required only if no attachment
    },
    trim: true
  },
  attachment: {
    filename: {
      type: String,
      default: null
    },
    originalname: {
      type: String,
      default: null
    },
    mimetype: {
      type: String,
      default: null
    },
    size: {
      type: Number,
      default: null
    },
    url: {
      type: String,
      default: null
    }
  },
  sent_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ conversation_id: 1, sent_at: -1 });

module.exports = mongoose.model('Message', messageSchema);
