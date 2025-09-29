import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
dotenv.config();
import userRoutes from './routes/user.route.js';
import productRoutes from './routes/product.route.js';
import authRoutes from './routes/auth.route.js';
import chatRoutes from './routes/chat.route.js';
import orderRoutes from './routes/order.route.js';
import sellerProductRoutes from './routes/sellerProduct.route.js';
import faqRoutes from './routes/faq.route.js';
import depositRoutes from './routes/deposit.route.js';
import { connectDB } from './lib/db.js';
import { createAdmin } from './controllers/user.controller.js';

const app = express();
app.use(cookieParser());

// noman
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json({ limit: '10mb' })); // or higher, e.g. '20mb'

// Simple CORS configuration with PATCH method support
app.use(cors({
  origin: [
    'https://shoppingcom.vercel.app', 
    
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200
}));

const PORT = process.env.PORT || 5001;


// API Routes
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/orders', orderRoutes);
app.use('/seller-products', sellerProductRoutes); // Seller product routes
app.use('/faqs', faqRoutes); // FAQ routes
app.use('/deposits', depositRoutes); // Deposit routes

// Create HTTP server
const server = createServer(app);

// Create Socket.io server
const io = new Server(server, {
  cors: {
    origin: [
      'https://shoppingcom.vercel.app',
      
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handling
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.user.id} with socket ID: ${socket.id}`);
  
  // Add user to online users
  onlineUsers.set(socket.user.id, socket.id);
  socket.join(socket.user.id);
  
  console.log(`👥 Online users count: ${onlineUsers.size}`);
  console.log(`📋 Online users:`, Array.from(onlineUsers.keys()));

  // Handle new messages (real-time only, not DB save)
  socket.on('send_message', async ({ conversationId, recipientId, content, imageUrl, _id, senderId, createdAt, sender }) => {
    // This event is now only for real-time delivery, not DB save
    // The actual DB save and socket emit is handled in the REST API (chat.controller.js)
    // This handler is kept for backward compatibility or extra real-time needs
    const messageData = {
      conversationId,
      senderId,
      content,
      imageUrl,
      _id,
      createdAt,
      sender
    };
    if (onlineUsers.has(recipientId)) {
      io.to(recipientId).emit('new_message', messageData);
    }
    socket.emit('message_sent', messageData);
  });

  // Handle test messages
  socket.on('test_message', (data) => {
    console.log(`🧪 TEST: Received test message from ${socket.user.id}:`, data);
    socket.emit('test_response', { 
      message: 'Test received successfully', 
      timestamp: new Date().toISOString(),
      userId: socket.user.id
    });
  });

  // Handle typing
  socket.on('typing', ({ conversationId, recipientId }) => {
    console.log(`⌨️ TYPING: ${socket.user.id} is typing to ${recipientId}`);
    if (onlineUsers.has(recipientId)) {
      io.to(recipientId).emit('typing', {
        conversationId,
        userId: socket.user.id
      });
    }
  });

  socket.on('stop_typing', ({ conversationId, recipientId }) => {
    console.log(`⏹️ STOP_TYPING: ${socket.user.id} stopped typing to ${recipientId}`);
    if (onlineUsers.has(recipientId)) {
      io.to(recipientId).emit('stop_typing', {
        conversationId,
        userId: socket.user.id
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.user.id}`);
    onlineUsers.delete(socket.user.id);
    console.log(`👥 Remaining online users: ${onlineUsers.size}`);
  });
});

// Make io instance and online users available to routes
app.set('io', io);
app.set('onlineUsers', onlineUsers);

// Database initialization with fallback
const initializeApp = async () => {
  try {
    await connectDB();
    await createAdmin();
    console.log('✅ Database and admin initialized');
  } catch (err) {
    console.error('❌ MongoDB Atlas connection failed:', err.message);
    console.log('🔄 Server will start anyway for development...');
    console.log('💡 Try these solutions:');
    console.log('   1. Use mobile hotspot');
    console.log('   2. Change DNS to 8.8.8.8');
    console.log('   3. Try again later when internet is stable');
  }
};

// Start server
initializeApp().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});