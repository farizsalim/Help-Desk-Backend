const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const multer = require('multer');

// Configure multer for form-data parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// All routes require authentication
router.use(protect);

// Handle both JSON and multipart/form-data
router.post('/', (req, res, next) => {
  // Check content-type
  const contentType = req.headers['content-type'];
  
  if (contentType && contentType.includes('multipart/form-data')) {
    // Use multer to parse form data (no files expected)
    upload.none()(req, res, function(err) {
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err.message);
        return res.status(400).json({
          success: false,
          message: 'File upload error: ' + err.message
        });
      } else if (err) {
        console.error('Form data parsing error:', err.message);
        return res.status(400).json({
          success: false,
          message: 'Form data parsing error: ' + err.message
        });
      }
      next();
    });
  } else {
    // JSON request - proceed normally
    next();
  }
}, messageController.sendMessage);

router.get('/:conversation_id', messageController.getMessages);
router.delete('/:id', isAdmin, messageController.deleteMessage);

module.exports = router;
