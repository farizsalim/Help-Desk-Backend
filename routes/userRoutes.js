const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// Route FCM token — hanya butuh autentikasi, tidak perlu admin
router.post('/fcm-token', protect, userController.saveFcmToken);
router.delete('/fcm-token', protect, userController.removeFcmToken);

// Routes berikut memerlukan autentikasi & peran admin
router.use(protect);
router.use(isAdmin);

router.get('/', userController.getAllUsers);
router.get('/role/:role', userController.getUsersByRole);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
