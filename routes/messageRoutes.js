const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(protect);

router.post('/', messageController.sendMessage);
router.get('/:conversation_id', messageController.getMessages);
router.delete('/:id', isAdmin, messageController.deleteMessage);

module.exports = router;
