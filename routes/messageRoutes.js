const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { upload } = require('../config/upload');

// All routes require authentication
router.use(protect);

// Send message with optional image upload
router.post('/', upload.single('image'), messageController.sendMessage);

router.get('/:conversation_id', messageController.getMessages);
router.delete('/:id', isAdmin, messageController.deleteMessage);

module.exports = router;
