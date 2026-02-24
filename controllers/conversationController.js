const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Message = require('../models/Message');
const activityLogController = require('./activityLogController');

// @desc    Create new conversation/ticket
// @route   POST /conversations
// @access  Private (User role)
exports.createConversation = async (req, res) => {
  try {
    const { subject } = req.body;

    if (!subject || subject.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Subject is required'
      });
    }

    // Find admin to add as participant
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      return res.status(500).json({
        success: false,
        message: 'No admin available'
      });
    }

    // Create conversation with user and admin as participants
    const conversation = await Conversation.create({
      subject: subject.trim(),
      participants: [req.user._id, admin._id],
      status: 'open'
    });

    // Create activity log for conversation creation
    await activityLogController.createLog(
      conversation._id,
      'CREATED',
      req.user._id,
      null,
      `Ticket created: ${subject}`
    );

    // Populate conversation for socket emit
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'nama email role work_id')
      .populate('closed_by', 'nama role work_id');

    // Emit socket event for new ticket notification
    if (global.io) {
      global.io.emit('new_ticket', {
        conversation: populatedConversation,
        createdBy: req.user
      });
    }

    res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all conversations for current user
// @route   GET /conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    let query = {};
    
    // Regular users only see their own conversations
    if (req.user.role === 'user') {
      query = { participants: req.user._id };
    }
    // Admin and IT Staff can see all conversations
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    const conversations = await Conversation.find(query)
      .populate('participants', 'nama email role work_id')
      .populate('closed_by', 'nama role work_id')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get conversation detail with messages
// @route   GET /conversations/:id
// @access  Private
exports.getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'nama email role work_id')
      .populate('closed_by', 'nama role');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get messages for this conversation
    const messages = await Message.find({ conversation_id: req.params.id })
      .populate('sender_id', 'nama role')
      .sort({ sent_at: 1 });

    res.status(200).json({
      success: true,
      data: {
        conversation,
        messages
      }
    });
  } catch (error) {
    console.error('Get conversation by ID error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add IT staff to conversation
// @route   POST /conversations/:id/add-it-staff
// @access  Private (Admin only)
exports.addITStaff = async (req, res) => {
  try {
    const { it_staff_id } = req.body;

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (conversation.is_locked) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify closed conversation'
      });
    }

    // Check if IT staff exists
    const itStaff = await User.findById(it_staff_id);
    if (!itStaff || itStaff.role !== 'it_staff') {
      return res.status(400).json({
        success: false,
        message: 'Invalid IT staff'
      });
    }

    // Check if already a participant
    if (conversation.participants.includes(it_staff_id)) {
      return res.status(400).json({
        success: false,
        message: 'IT staff already added'
      });
    }

    // Add IT staff to participants
    conversation.participants.push(it_staff_id);
    conversation.status = 'in_progress';
    await conversation.save();

    // Create activity log
    await activityLogController.createLog(
      conversation._id,
      'ADD_IT_STAFF',
      req.user._id,
      it_staff_id,
      `${itStaff.nama} added to ticket`
    );

    // Populate conversation for socket emit
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'nama email role work_id')
      .populate('closed_by', 'nama role work_id');

    // Emit socket event to all clients
    if (global.io) {
      global.io.emit('it_staff_added', {
        conversation: populatedConversation,
        itStaff: itStaff
      });
    }

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Add IT staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Close conversation/ticket
// @route   POST /conversations/:id/close
// @access  Private (IT Staff only)
exports.closeConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (conversation.is_locked) {
      return res.status(400).json({
        success: false,
        message: 'Conversation already closed'
      });
    }

    // Update conversation status
    conversation.status = 'closed';
    conversation.is_locked = true;
    conversation.closed_by = req.user._id;
    conversation.closed_at = new Date();
    await conversation.save();

    // Create activity log
    await activityLogController.createLog(
      conversation._id,
      'CLOSED',
      req.user._id,
      null,
      'Ticket closed'
    );

    // Populate conversation for socket emit
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'nama email role work_id')
      .populate('closed_by', 'nama role work_id');

    // Emit socket event to all clients
    if (global.io) {
      global.io.emit('ticket_closed', {
        conversation: populatedConversation,
        closedBy: req.user
      });
    }

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Close conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Show create ticket page info
// @route   GET /conversations/new
// @access  Private
exports.showCreateTicketPage = (req, res) => {
  res.json({ 
    message: 'Create conversation endpoint - Use POST /conversations',
    method: 'POST',
    requiredFields: ['subject']
  });
};
