// Delete a message by ID (admin only)
export const deleteMessage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete messages.' });
    }
    const { messageId } = req.params;
    const deleted = await Message.findByIdAndDelete(messageId);
    if (!deleted) {
      return res.status(404).json({ message: 'Message not found.' });
    }
    res.status(200).json({ message: 'Message deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message', error: error.message });
  }
};
import Message from '../models/message.model.js';
import Conversation from '../models/conversation.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';
import { safeCreateConversation } from '../lib/conversationHelper.js';
import { createConversation as createConversationImpl } from './create-conversation.js';
import cloudinary from '../lib/cloudinary.js';

// Get or create a conversation between current user and another user
export const getOrCreateConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { otherUserId } = req.params;
    
    console.log(`getOrCreateConversation: currentUser=${currentUserId}, otherUser=${otherUserId}`);

    // Verify that both users exist
    const currentUser = await User.findById(currentUserId);
    const otherUser = await User.findById(otherUserId);

    if (!currentUser || !otherUser) {
      console.log('User not found:', { currentUserFound: !!currentUser, otherUserFound: !!otherUser });
      return res.status(404).json({ 
        message: 'User not found',
        currentUserFound: !!currentUser,
        otherUserFound: !!otherUser
      });
    }

    // Check if one is admin and the other is seller
    const isValidConversation = 
      (currentUser.role === 'admin' && otherUser.role === 'seller') ||
      (currentUser.role === 'seller' && otherUser.role === 'admin');

    if (!isValidConversation) {
      console.log('Invalid conversation - wrong user roles:', { currentUserRole: currentUser.role, otherUserRole: otherUser.role });
      return res.status(403).json({ 
        message: 'Invalid conversation. Sellers can only chat with admin.' 
      });
    }

    // Sort participants to ensure consistent lookup
    const sortedParticipantIds = [currentUserId, otherUserId].sort();
    
    // Find existing conversation with a more precise query
    console.log('Looking for existing conversation between users');
    let conversation = await Conversation.findOne({
      participants: { $size: 2, $all: sortedParticipantIds }
    }).populate({
      path: 'participants',
      select: 'name email role profile shopName'
    });

    if (!conversation) {
      console.log('No existing conversation, creating a new one');
      try {
        // Create a new conversation with sorted participants
        const newConversation = new Conversation({
          participants: sortedParticipantIds
        });
        
        // Save with explicit error handling
        const savedConversation = await newConversation.save();
        console.log('New conversation created:', savedConversation._id);
        
        // Repopulate participants after save
        conversation = await Conversation.findById(savedConversation._id).populate({
          path: 'participants',
          select: 'name email role profile shopName'
        });
        
        if (!conversation) {
          throw new Error('Failed to retrieve conversation after save');
        }
      } catch (error) {
        // Check for duplicate key error (conversation already exists)
        if (error.code === 11000) {
          console.log('Duplicate conversation detected, trying to find existing one');
          
          // Try with a delay to account for race conditions
          await new Promise(resolve => setTimeout(resolve, 100));
          
          conversation = await Conversation.findOne({
            participants: { $size: 2, $all: sortedParticipantIds }
          }).populate({
            path: 'participants',
            select: 'name email role profile shopName'
          });
          
          if (conversation) {
            console.log('Found existing conversation after duplicate key error');
            return res.status(200).json(conversation);
          }
        }
        
        // If we still don't have a conversation, create a new one with force flag
        if (!conversation) {
          console.log('Attempting to force create conversation');
          const forceConversation = new Conversation({
            participants: sortedParticipantIds,
            _forcedCreation: true
          });
          
          const forcedConversation = await forceConversation.save();
          conversation = await Conversation.findById(forcedConversation._id).populate({
            path: 'participants',
            select: 'name email role profile shopName'
          });
          
          if (!conversation) {
            throw new Error('Failed to create conversation even with forced attempt');
          }
        }
      }
    } else {
      console.log('Found existing conversation:', conversation._id);
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    res.status(500).json({ 
      message: 'Error getting or creating conversation', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all conversations for current user (admin sees all seller conversations)
export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find all conversations where current user is a participant
    const conversations = await Conversation.find({
      participants: currentUserId
    })
    .populate({
      path: 'participants',
      select: 'name email role profile shopName'
    })
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
};

// Get conversations where a specific user is a participant
export const getConversationsByUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;
    
    console.log(`getConversationsByUser: currentUser=${currentUserId}, targetUser=${userId}`);
    
    // Verify permissions
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }
    
    let queryUserId = userId;
    
    // If userId is 'admin' and current user is not admin, we need to find the admin user
    if (userId === 'admin' && currentUser.role !== 'admin') {
      console.log('Looking up admin user ID for special "admin" parameter');
      const adminUser = await User.findOne({ role: 'admin' });
      
      if (!adminUser) {
        return res.status(404).json({ message: 'Admin user not found' });
      }
      
      queryUserId = adminUser._id;
      console.log(`Resolved "admin" to user ID: ${queryUserId}`);
      
      // For seller users, only find conversations where both the seller AND admin are participants
      // This ensures sellers can only see their own conversations with admin
      if (currentUser.role === 'seller') {
        console.log('Seller user looking for admin conversations - restricting to conversations with both users');
        
        const conversations = await Conversation.find({
          participants: { $all: [currentUserId, queryUserId] }
        })
        .populate({
          path: 'participants',
          select: 'name email role profile shopName'
        })
        .populate('lastMessage')
        .sort({ updatedAt: -1 });
        
        console.log(`Found ${conversations.length} conversations between seller and admin`);
        
        return res.status(200).json(conversations);
      }
    }
    // If user ID is the string 'me', use the current user's ID
    else if (userId === 'me') {
      console.log('Using current user ID for "me" parameter');
      queryUserId = currentUserId;
    }
    // Otherwise, enforce permissions
    else if (currentUser.role !== 'admin' && currentUserId !== userId) {
      console.log('Permission denied: non-admin trying to access another user conversations');
      return res.status(403).json({ 
        message: 'Not authorized to view these conversations',
        details: 'Only admins can view conversations of other users'
      });
    }
    
    // For admin users or when requesting your own conversations
    let query = {};
    
    // If we're looking for conversations with a specific user
    if (queryUserId !== 'me' && queryUserId !== currentUserId) {
      // For conversations between the current user and another specific user
      query = { participants: { $all: [currentUserId, queryUserId] } };
      console.log('Finding conversations between specific users:', currentUserId, queryUserId);
    } else {
      // For all conversations where the specified user is a participant
      query = { participants: queryUserId };
      console.log('Finding all conversations for user:', queryUserId);
    }
    
    // Find conversations that match our query
    const conversations = await Conversation.find(query)
    .populate({
      path: 'participants',
      select: 'name email role profile shopName'
    })
    .populate('lastMessage')
    .sort({ updatedAt: -1 });
    
    console.log(`Found ${conversations.length} conversations for user ${queryUserId}`);
    
    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error fetching conversations by user:', error);
    res.status(500).json({ 
      message: 'Error fetching conversations', 
      error: error.message,
      details: error.stack
    });
  }
};

// Get messages for a specific conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user.id || (req.user._id ? req.user._id.toString() : null);

    console.log(`getMessages: conversationId=${conversationId}, currentUser=${currentUserId}`);
    console.log('Current user ID type:', typeof currentUserId);
    console.log('User object from request:', { 
      id: req.user.id, 
      _id: req.user._id?.toString(),
      name: req.user.name,
      role: req.user.role
    });

    // Check if this is a "temp" ID from the frontend (these are not real MongoDB IDs)
    if (conversationId.startsWith('temp-')) {
      console.log('Temp conversation ID detected, returning empty array');
      return res.status(200).json([]);
    }

    // Verify that the conversation exists
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      console.log('Conversation not found');
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Convert ObjectIds to strings for reliable comparison
    const participantIds = conversation.participants.map(id => id.toString());
    const currentUserIdStr = currentUserId.toString();

    console.log('Checking if user is authorized to view conversation');
    console.log('Conversation Participants:', participantIds);
    console.log('Current user ID:', currentUserIdStr);
    
    // Debug each participant comparison
    participantIds.forEach((partId, index) => {
      console.log(`Comparing participant ${index}: "${partId}" with user ID: "${currentUserIdStr}"`);
      console.log(`Direct equality: ${partId === currentUserIdStr}`);
      console.log(`Ignore case equality: ${partId.toLowerCase() === currentUserIdStr.toLowerCase()}`);
    });

    // Try to find user in MongoDB to verify ID format
    const userInDb = await User.findById(currentUserId);
    console.log('User found in DB:', userInDb ? { 
      id: userInDb._id.toString(), 
      name: userInDb.name, 
      role: userInDb.role 
    } : 'Not found');

    // Multiple ways to check if user is a participant
    let isParticipant = false;
    
    // 1. Check by direct string inclusion
    isParticipant = participantIds.includes(currentUserIdStr);
    
    // 2. If that fails, try case-insensitive check
    if (!isParticipant) {
      isParticipant = participantIds.some(
        id => id.toLowerCase() === currentUserIdStr.toLowerCase()
      );
    }
    
    // 3. If that fails, check by user ObjectId from DB
    if (!isParticipant && userInDb) {
      isParticipant = participantIds.includes(userInDb._id.toString());
    }
    
    // 4. If seller, try to match by role (find admin and seller pair)
    if (!isParticipant && userInDb && userInDb.role === 'seller') {
      // Verify participants are admin and seller
      const participantUsers = await User.find({
        _id: { $in: conversation.participants }
      }).select('role');
      
      const roles = participantUsers.map(u => u.role);
      console.log('Participant roles:', roles);
      
      // If we have exactly one admin and one seller, this is a valid conversation for this seller
      const hasAdmin = roles.includes('admin');
      const hasSeller = roles.includes('seller');
      
      if (hasAdmin && hasSeller && roles.length === 2) {
        console.log('Valid admin-seller conversation detected, authorizing seller');
        isParticipant = true;
      }
    }

    // Verify current user is a participant
    if (!isParticipant) {
      console.log('User not authorized - not a participant');
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    console.log('User authorized, finding messages for conversation');
    
    // IMPORTANT: Make sure we're only getting messages for THIS specific conversation
    // by using the exact participants in THIS conversation
    
    // Get the other participant
    const otherParticipantId = conversation.participants.find(
      id => id.toString() !== currentUserIdStr
    );
    
    if (!otherParticipantId) {
      console.log('Could not determine other participant');
      return res.status(500).json({ message: 'Error finding conversation participants' });
    }
    
    console.log(`Querying messages between ${currentUserIdStr} and ${otherParticipantId}`);
    
    // Get messages specifically between these two users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: otherParticipantId },
        { sender: otherParticipantId, recipient: currentUserId }
      ]
    })
    .populate({
      path: 'sender',
      select: 'name role profile'
    })
    .sort({ createdAt: 1 });

    console.log(`Found ${messages.length} messages between these specific users`);

    // Mark messages as read
    await Message.updateMany(
      { 
        recipient: currentUserId,
        sender: otherParticipantId,
        read: false
      },
      { read: true }
    );

    // Reset unread count
    conversation.unreadCount = 0;
    await conversation.save();

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, imageBase64 } = req.body;
    const senderId = req.user.id || (req.user._id ? req.user._id.toString() : null);

    console.log(`sendMessage: conversationId=${conversationId}, sender=${senderId}`);
    console.log('Sender ID type:', typeof senderId);
    console.log('User object from request:', { 
      id: req.user.id, 
      _id: req.user._id?.toString(),
      name: req.user.name,
      role: req.user.role
    });

    if ((!content || content.trim() === '') && !imageBase64) {
      return res.status(400).json({ message: 'Message content or image is required' });
    }
    
    // Handle temp IDs from frontend
    if (conversationId.startsWith('temp-')) {
      return res.status(400).json({ 
        message: 'Cannot send messages to temporary conversations',
        details: 'Please create a real conversation first'
      });
    }

    // Verify the conversation exists
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      console.log('Conversation not found:', conversationId);
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Improved debugging
    console.log('Found conversation:', {
      id: conversation._id.toString(),
      participants: conversation.participants.map(p => p.toString())
    });
    console.log('Current user ID (sender):', senderId);

    // Convert ObjectIds to strings for reliable comparison
    const participantIds = conversation.participants.map(id => id.toString());
    const currentUserIdStr = senderId.toString();
    
    // Debug each participant comparison
    participantIds.forEach((partId, index) => {
      console.log(`Comparing participant ${index}: "${partId}" with user ID: "${currentUserIdStr}"`);
      console.log(`Direct equality: ${partId === currentUserIdStr}`);
      console.log(`Ignore case equality: ${partId.toLowerCase() === currentUserIdStr.toLowerCase()}`);
    });

    // Find all possible user ID formats from DB
    const userInDb = await User.findById(senderId);
    console.log('User found in DB:', userInDb ? { 
      id: userInDb._id.toString(), 
      name: userInDb.name, 
      role: userInDb.role 
    } : 'Not found');
    
    // Multiple ways to check if user is a participant
    let isParticipant = false;
    
    // 1. Check by direct string inclusion
    isParticipant = participantIds.includes(currentUserIdStr);
    
    // 2. If that fails, try case-insensitive check
    if (!isParticipant) {
      isParticipant = participantIds.some(
        id => id.toLowerCase() === currentUserIdStr.toLowerCase()
      );
    }
    
    // 3. If that fails, check by user ObjectId from DB
    if (!isParticipant && userInDb) {
      isParticipant = participantIds.includes(userInDb._id.toString());
    }
    
    // 4. If seller, try to match by role (find admin and seller pair)
    if (!isParticipant && userInDb && userInDb.role === 'seller') {
      // Verify participants are admin and seller
      const participantUsers = await User.find({
        _id: { $in: conversation.participants }
      }).select('role');
      
      const roles = participantUsers.map(u => u.role);
      console.log('Participant roles:', roles);
      
      // If we have exactly one admin and one seller, this is a valid conversation for this seller
      const hasAdmin = roles.includes('admin');
      const hasSeller = roles.includes('seller');
      
      if (hasAdmin && hasSeller && roles.length === 2) {
        console.log('Valid admin-seller conversation detected, authorizing seller');
        isParticipant = true;
      }
    }
    
    if (!isParticipant) {
      console.log(`User ${senderId} not authorized - not a participant in conversation ${conversationId}`);
      console.log('Participants:', participantIds);
      return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
    }

    console.log('User is authorized as a participant');

    // Get recipient (the other participant)
    const recipientId = conversation.participants.find(
      participantId => participantId.toString() !== currentUserIdStr
    ) || conversation.participants[0]; // Fallback to first participant if not found

    if (!recipientId) {
      console.log('Could not determine recipient ID');
      return res.status(500).json({ message: 'Could not determine recipient' });
    }

    console.log(`Sending message from ${senderId} to ${recipientId}`);

    // If imageBase64 is present, upload to Cloudinary
    let imageUrl = null;
    if (imageBase64) {
      try {
        const uploadRes = await cloudinary.uploader.upload(imageBase64, {
          folder: 'chat_images',
          resource_type: 'image',
        });
        imageUrl = uploadRes.secure_url;
        console.log('Image uploaded to Cloudinary:', imageUrl);
      } catch (err) {
        console.error('Cloudinary upload failed:', err);
        return res.status(500).json({ message: 'Image upload failed', error: err.message });
      }
    }

    // Create and save message
    const newMessage = new Message({
      sender: senderId,
      recipient: recipientId,
      content: content ? content.trim() : '',
      imageUrl: imageUrl || null,
    });

    const savedMessage = await newMessage.save();
    console.log('New message saved:', savedMessage._id);

    // Update conversation with last message and increment unread count
    conversation.lastMessage = savedMessage._id;
    conversation.unreadCount = (conversation.unreadCount || 0) + 1;
    conversation.updatedAt = new Date();
    await conversation.save();
    console.log('Conversation updated with new message');

    // Return the message with sender info
    const populatedMessage = await Message.findById(savedMessage._id).populate({
      path: 'sender',
      select: 'name role profile'
    });

    console.log('Message saved and populated:', populatedMessage._id);

    // Emit socket event for real-time updates
    const io = req.app.get('io'); // Get socket.io instance from app
    if (io) {
      const messageData = {
        _id: populatedMessage._id.toString(),
        conversationId: conversationId,
        senderId: senderId.toString(),
        recipientId: recipientId.toString(),
        content: populatedMessage.content,
        imageUrl: populatedMessage.imageUrl,
        createdAt: populatedMessage.createdAt.toISOString(),
        sender: {
          _id: populatedMessage.sender._id.toString(),
          name: populatedMessage.sender.name,
          role: populatedMessage.sender.role,
          profile: populatedMessage.sender.profile
        }
      };

      console.log('Emitting socket event for new message:', {
        messageId: messageData._id,
        from: messageData.senderId,
        to: messageData.recipientId,
        conversationId: messageData.conversationId
      });
      
      // Emit to recipient
      io.to(recipientId.toString()).emit('new_message', messageData);
      
      // Also emit to sender for confirmation
      io.to(senderId.toString()).emit('message_sent', messageData);
      
      console.log(`Socket events emitted to ${recipientId} and ${senderId}`);
    } else {
      console.error('Socket.io instance not available in chat controller');
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const unreadCount = await Message.countDocuments({ 
      recipient: userId,
      read: false
    });
    
    res.status(200).json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
};

// Create a new conversation - wrapper around the implementation
export const createConversation = async (req, res) => {
  return createConversationImpl(req, res);
};