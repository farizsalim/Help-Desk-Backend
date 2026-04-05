const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
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

// Get allowed origins from environment or use default
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
const frontendOrigin = process.env.FRONTEND_URL || 'https://frontend.helpdesk54321.online';

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Specific origins for development and production
      const allowed = [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://frontend.helpdesk54321.online',
        'https://api.helpdesk54321.online',
        frontendOrigin
      ];
      
      if (allowed.includes(origin)) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  // Trust proxy for Cloudflare tunnel
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  perMessageDeflate: false
});

const PORT = process.env.PORT || 8000;

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Trust proxy for Cloudflare tunnel
app.set('trust proxy', true);

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

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Socket.IO is ready for real-time chat`);
  console.log(`Accessible via Cloudflare tunnel at: ${process.env.FRONTEND_URL || 'https://api.helpdesk54321.online'}`);
});
