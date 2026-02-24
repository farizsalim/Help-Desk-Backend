const ActivityLog = require('../models/ActivityLog');

// @desc    Create activity log (internal use)
// @access  Internal
exports.createLog = async (conversationId, action, actorId, targetUserId = null, details = '') => {
  try {
    const log = await ActivityLog.create({
      conversation_id: conversationId,
      action,
      actor_id: actorId,
      target_user_id: targetUserId,
      details
    });

    return log;
  } catch (error) {
    console.error('Create activity log error:', error);
    throw error;
  }
};

// @desc    Get logs for a conversation
// @route   GET /conversations/:id/logs
// @access  Private
exports.getLogsByConversation = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ conversation_id: req.params.id })
      .populate('actor_id', 'nama role')
      .populate('target_user_id', 'nama role')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all logs (admin only)
// @route   GET /logs
// @access  Private (Admin only)
exports.getAllLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate('conversation_id', 'subject')
      .populate('actor_id', 'nama role')
      .populate('target_user_id', 'nama role')
      .sort({ timestamp: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('Get all logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
