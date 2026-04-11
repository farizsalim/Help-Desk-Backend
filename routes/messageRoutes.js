const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const multer = require('multer');

// Pastikan folder uploads/chat ada
const uploadsDir = path.join(__dirname, '..', 'uploads', 'chat');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Gunakan memoryStorage agar buffer bisa diproses Sharp sebelum disimpan
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowedTypes.test(file.mimetype);
    if (extOk && mimeOk) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan (JPEG, PNG, GIF, WEBP)'));
    }
  }
});

// Middleware kompresi gambar dengan Sharp
async function compressImage(req, res, next) {
  if (!req.file) return next();

  try {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = 'chat-' + uniqueSuffix + '.webp';
    const outputPath = path.join(uploadsDir, filename);

    await sharp(req.file.buffer)
      .resize({ width: 1280, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    // Sesuaikan req.file agar controller tetap bisa membaca filename & path
    req.file.filename = filename;
    req.file.path = outputPath;

    next();
  } catch (err) {
    next(err);
  }
}

// All routes require authentication
router.use(protect);

// Handle both JSON dan multipart/form-data (dengan atau tanpa gambar)
router.post('/', (req, res, next) => {
  upload.single('image')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: 'Upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, compressImage, messageController.sendMessage);

router.get('/:conversation_id', messageController.getMessages);
router.delete('/:id', isAdmin, messageController.deleteMessage);

module.exports = router;
