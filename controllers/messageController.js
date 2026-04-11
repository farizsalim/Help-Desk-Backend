const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const path = require('path');
const { sendPushNotification } = require('../config/fcm_service');

// @desc    Send message in a conversation
// @route   POST /messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { conversation_id, isi_pesan } = req.body || {};
    const imageFile = req.file; // dari multer upload.single('image')

    // Harus ada salah satu: teks atau gambar
    const hasText = isi_pesan && isi_pesan.trim() !== '';
    const hasImage = !!imageFile;

    if (!conversation_id) {
      if (imageFile) {
        // Hapus file yang sudah terupload jika validasi gagal
        const fs = require('fs');
        fs.unlink(imageFile.path, () => {});
      }
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    if (!hasText && !hasImage) {
      return res.status(400).json({
        success: false,
        message: 'Message content or image is required'
      });
    }

    // Check if conversation exists
    const conversation = await Conversation.findById(conversation_id);
    if (!conversation) {
      if (imageFile) {
        const fs = require('fs');
        fs.unlink(imageFile.path, () => {});
      }
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Check if conversation is locked
    if (conversation.is_locked) {
      if (imageFile) {
        const fs = require('fs');
        fs.unlink(imageFile.path, () => {});
      }
      return res.status(403).json({ success: false, message: 'Cannot send message to closed conversation' });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user._id.toString()
    );

    if (!isParticipant && req.user.role !== 'admin') {
      if (imageFile) {
        const fs = require('fs');
        fs.unlink(imageFile.path, () => {});
      }
      return res.status(403).json({ success: false, message: 'You are not a participant in this conversation' });
    }

    // Build image_url jika ada file
    const image_url = imageFile
      ? `/uploads/chat/${imageFile.filename}`
      : null;

    // Create message
    const message = await Message.create({
      conversation_id,
      sender_id: req.user._id,
      isi_pesan: hasText ? isi_pesan.trim() : '',
      image_url
    });

    // Update conversation updatedAt
    conversation.updatedAt = new Date();
    await conversation.save();

    // Populate sender info
    await message.populate('sender_id', 'nama role');

    // Emit socket event
    if (global.io) {
      global.io.to(`conversation_${conversation_id}`).emit('new_message', {
        message: message
      });
    }

    // Kirim push notification ke peserta lain (non-pengirim)
    const otherParticipantIds = conversation.participants.filter(
      p => p.toString() !== req.user._id.toString()
    );

    if (otherParticipantIds.length > 0) {
      const recipients = await User.find(
        { _id: { $in: otherParticipantIds }, fcm_tokens: { $exists: true, $not: { $size: 0 } } },
        'fcm_tokens'
      );

      const allTokens = recipients.flatMap(u => u.fcm_tokens);

      if (allTokens.length > 0) {
        const notifTitle = `Pesan baru dari ${req.user.nama}`;
        const notifBody = hasImage ? '📷 Mengirim gambar' : (isi_pesan.length > 100 ? isi_pesan.substring(0, 100) + '...' : isi_pesan);

        const invalidTokens = await sendPushNotification(allTokens, notifTitle, notifBody, {
          conversation_id: conversation_id.toString(),
          sender_nama: req.user.nama,
          message_id: message._id.toString(),
        });

        // Bersihkan token yang sudah tidak valid
        if (invalidTokens && invalidTokens.length > 0) {
          await User.updateMany(
            { fcm_tokens: { $in: invalidTokens } },
            { $pull: { fcm_tokens: { $in: invalidTokens } } }
          );
        }
      }
    }

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
