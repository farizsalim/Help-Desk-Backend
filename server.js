const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load env vars
dotenv.config();

// Database connection
const connectDB = require('./config/database');

// Route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');

// Socket handler
const socketHandler = require('./socket/socketHandler');

const app = express();
const httpServer = createServer(app);
// CORS configuration for local network access
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://192.168.56.50:5173",
  // Allow any IP in 192.168.x.x network
  /^http:\/\/192\.168\.\d+\.\d+:5173$/
];

const io = new Server(httpServer, {
  cors: {
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      const allowed = ALLOWED_ORIGINS.some(allowed => {
        if (typeof allowed === 'string') return allowed === origin;
        if (allowed instanceof RegExp) return allowed.test(origin);
        return false;
      });
      
      if (allowed) {
        callback(null, true);
      } else {
        console.log('Socket.IO blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 8000;

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin
    if (!origin) return callback(null, true);
    
    const allowed = ALLOWED_ORIGINS.some(allowed => {
      if (typeof allowed === 'string') return allowed === origin;
      if (allowed instanceof RegExp) return allowed.test(origin);
      return false;
    });
    
    if (allowed) {
      callback(null, true);
    } else {
      console.log('Express CORS blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make io accessible to controllers
app.set('io', io);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Server is running successfully!',
    socket: 'Socket.IO enabled',
    endpoints: {
      auth: '/auth',
      users: '/users',
      conversations: '/conversations',
      messages: '/messages'
    }
  });
});

// Mount routers
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/conversations', conversationRoutes);
app.use('/messages', messageRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// Initialize socket handler
socketHandler(io);

// Start server - listen on all network interfaces
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on:`);
  console.log(`  - Local:   http://localhost:${PORT}`);
  console.log(`  - Network: http://192.168.56.50:${PORT}`);
  console.log(`Socket.IO is ready for real-time chat`);
});
