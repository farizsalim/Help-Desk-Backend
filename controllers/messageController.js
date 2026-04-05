const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// @desc    Send message in a conversation
// @route   POST /messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    
    const { conversation_id, isi_pesan } = req.body || {};

    console.log('Parsed conversation_id:', conversation_id);
    console.log('Parsed isi_pesan:', isi_pesan);

    if (!conversation_id || !isi_pesan || isi_pesan.trim() === '') {
      console.error('Validation failed - Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Conversation ID and message content are required'
      });
    }

    // Check if conversation exists
    const conversation = await Conversation.findById(conversation_id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if conversation is locked
    if (conversation.is_locked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot send message to closed conversation'
      });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user._id.toString()
    );

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    // Create message
    const message = await Message.create({
      conversation_id,
      sender_id: req.user._id,
      isi_pesan: isi_pesan.trim()
    });

    // Update conversation updatedAt
    conversation.updatedAt = new Date();
    await conversation.save();

    // Populate sender info
    await message.populate('sender_id', 'nama role');

    // Emit socket event to all users in the conversation
    if (global.io) {
      global.io.to(`conversation_${conversation_id}`).emit('new_message', {
        message: message
      });
    }

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get messages for a conversation
// @route   GET /messages/:conversation_id
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { conversation_id } = req.params;

    // Check if conversation exists
    const conversation = await Conversation.findById(conversation_id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user._id.toString()
    );

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get messages
    const messages = await Message.find({ conversation_id })
      .populate('sender_id', 'nama role')
      .sort({ sent_at: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete a message (admin only)
// @route   DELETE /messages/:id
// @access  Private (Admin only)
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
