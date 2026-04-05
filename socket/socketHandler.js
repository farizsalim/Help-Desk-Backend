const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        console.log('Socket connection rejected: No token provided');
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.log('Socket connection rejected: User not found');
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      console.log(`Socket authentication successful: ${user.nama} (${user._id})`);
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.nama} (${socket.user._id})`);
    console.log(`Connection ID: ${socket.id}`);

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`${socket.user.nama} joined conversation: ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`${socket.user.nama} left conversation: ${conversationId}`);
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
        userId: socket.user._id,
        nama: socket.user.nama
      });
    });

    // Handle stop typing
    socket.on('stop_typing', (data) => {
      socket.to(`conversation_${data.conversationId}`).emit('user_stop_typing', {
        userId: socket.user._id
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.nama}:`, error);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.nama} (${socket.user._id})`);
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error(`Socket connection error: ${error.message}`);
    });
  });

  // Make io available globally for controllers
  global.io = io;
};