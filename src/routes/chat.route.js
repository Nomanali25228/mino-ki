import express from 'express';
import { 
  getConversations,
  getConversationsByUser,
  getOrCreateConversation, 
  getMessages,
  sendMessage as createMessage,
  createConversation,
  getUnreadCount,
  deleteMessage
} from '../controllers/chat.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();
// Delete a message by ID (admin only)
router.delete('/messages/:messageId', protectRoute, deleteMessage);

// Get all conversations (admin only)
router.get('/conversations', protectRoute, getConversations);

// Get conversations by user ID
router.get('/conversations/user/:userId', protectRoute, getConversationsByUser);

// Get or find conversation with another user
router.get('/conversations/with/:otherUserId', protectRoute, getOrCreateConversation);

// Create a new conversation
router.post('/conversations', protectRoute, createConversation);

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', protectRoute, getMessages);

// Create a new message
router.post('/conversations/:conversationId/messages', protectRoute, createMessage);

// Get unread message count
router.get('/messages/unread', protectRoute, getUnreadCount);

export default router;