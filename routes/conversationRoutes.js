const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const activityLogController = require('../controllers/activityLogController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin, restrictTo } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(protect);

// View routes
router.get('/new', conversationController.showCreateTicketPage);

// API routes
router.get('/', conversationController.getConversations);
router.post('/', conversationController.createConversation);
router.get('/:id', conversationController.getConversationById);

// Admin only - add IT staff
router.post('/:id/add-it-staff', isAdmin, conversationController.addITStaff);

// IT Staff only - close conversation
router.post('/:id/close', restrictTo('it_staff', 'admin'), conversationController.closeConversation);

// Activity logs
router.get('/:id/logs', activityLogController.getLogsByConversation);

module.exports = router;
