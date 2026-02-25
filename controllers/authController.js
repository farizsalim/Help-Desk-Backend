const User = require('../models/User');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register a new user
// @route   POST /auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    console.log('Register request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { work_id, nama, email, password } = req.body;
    
    // Validate required fields
    if (!work_id || !nama || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: work_id, nama, email, password'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { work_id }] });
    if (existingUser) {
      const message = existingUser.email === email 
        ? 'Email already registered' 
        : 'Work ID already exists';
      
      return res.status(400).json({ 
        success: false, 
        message 
      });
    }

    // Create user with default role 'user'
    const user = await User.create({
      work_id,
      nama,
      email,
      password,
      role: 'user'
    });

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      data: {
        id: user._id,
        work_id: user.work_id,
        nama: user.nama,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      data: {
        id: user._id,
        work_id: user.work_id,
        nama: user.nama,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Logout user
// @route   POST /auth/logout
// @access  Private
exports.logout = (req, res) => {
  // For JWT, logout is handled client-side by removing the token
  // Optionally: Add token to blacklist in database if needed
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Get current user
// @route   GET /auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

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
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Show login page info
// @route   GET /auth/login
// @access  Public
exports.showLoginPage = (req, res) => {
  res.json({ 
    message: 'Login endpoint - Use POST /auth/login with email and password',
    method: 'POST',
    requiredFields: ['email', 'password']
  });
};

// @desc    Show register page info
// @route   GET /auth/register
// @access  Public
exports.showRegisterPage = (req, res) => {
  res.json({ 
    message: 'Register endpoint - Use POST /auth/register',
    method: 'POST',
    requiredFields: ['work_id', 'nama', 'email', 'password']
  });
};
