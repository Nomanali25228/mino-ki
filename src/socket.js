import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

export default function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  // Store online users
  const onlineUsers = new Map();

  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token not provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}`);
    
    // Add user to online users
    onlineUsers.set(socket.user.id, socket.id);

    // Join a room for this user to receive direct messages
    socket.join(socket.user.id);

    // Handle new messages
    socket.on('send_message', ({ conversationId, recipientId, content }) => {
      console.log(`SOCKET: Message from ${socket.user?.id} to ${recipientId}: "${content}"`);
      console.log(`SOCKET: Recipient socket ID: ${onlineUsers.get(recipientId) || 'offline'}`);
      
      const messageData = {
        conversationId,
        senderId: socket.user?.id,
        content,
        createdAt: new Date().toISOString()
      };
      
      // Emit to recipient if online
      if (onlineUsers.has(recipientId)) {
        console.log(`SOCKET: Emitting message to recipient ${recipientId}`);
        io.to(recipientId).emit('new_message', messageData);
      } else {
        console.log(`SOCKET: Recipient ${recipientId} is offline`);
      }

      // Also emit to sender for confirmation (optional)
      socket.emit('message_sent', messageData);
    });

    // Handle typing indicator
    socket.on('typing', ({ conversationId, recipientId }) => {
      if (onlineUsers.has(recipientId)) {
        io.to(recipientId).emit('typing', {
          conversationId,
          userId: socket.user.id
        });
      }
    });

    // Handle stop typing
    socket.on('stop_typing', ({ conversationId, recipientId }) => {
      if (onlineUsers.has(recipientId)) {
        io.to(recipientId).emit('stop_typing', {
          conversationId,
          userId: socket.user.id
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
      onlineUsers.delete(socket.user.id);
    });
  });

  return io;
}