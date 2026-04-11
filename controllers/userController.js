const User = require('../models/User');

// @desc    Get all users
// @route   GET /users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user by ID
// @route   GET /users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get users by role (for finding IT staff to add)
// @route   GET /users/role/:role
// @access  Private (Admin only)
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    if (!['user', 'admin', 'it_staff'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const users = await User.find({ role }).select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user
// @route   PUT /users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const { nama, email, role } = req.body;
    
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (nama) user.nama = nama;
    if (email) user.email = email;
    if (role) user.role = role;

    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete user
// @route   DELETE /users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Simpan / update FCM token untuk device pengguna
// @route   POST /users/fcm-token
// @access  Private
exports.saveFcmToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'FCM token wajib diisi'
      });
    }

    // Tambahkan token jika belum ada ($addToSet mencegah duplikat)
    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { fcm_tokens: token.trim() } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'FCM token berhasil disimpan'
    });
  } catch (error) {
    console.error('Save FCM token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Hapus FCM token (logout device)
// @route   DELETE /users/fcm-token
// @access  Private
exports.removeFcmToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'FCM token wajib diisi' });
    }

    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { fcm_tokens: token } }
    );

    res.status(200).json({ success: true, message: 'FCM token berhasil dihapus' });
  } catch (error) {
    console.error('Remove FCM token error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
