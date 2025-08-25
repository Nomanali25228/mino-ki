import Message from '../models/message.model.js';
import Conversation from '../models/conversation.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';
import { safeCreateConversation } from '../lib/conversationHelper.js';

// Create a new conversation
export const createConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { recipientId } = req.body;
    
    console.log(`createConversation: current user=${currentUserId}, recipient=${recipientId}`);
    
    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }
    
    // Validate both users exist
    const currentUser = await User.findById(currentUserId);
    const recipientUser = await User.findById(recipientId);
    
    if (!currentUser || !recipientUser) {
      console.log('User not found:', { currentUserFound: !!currentUser, recipientUserFound: !!recipientUser });
      return res.status(404).json({ 
        message: 'One or both users not found',
        currentUserFound: !!currentUser,
        recipientUserFound: !!recipientUser 
      });
    }
    
    console.log('Users found:', { 
      currentUser: { id: currentUser._id, role: currentUser.role }, 
      recipientUser: { id: recipientUser._id, role: recipientUser.role }
    });
    
    // Check if seller/admin combination is valid
    const isValidConversation = 
      (currentUser.role === 'admin' && recipientUser.role === 'seller') ||
      (currentUser.role === 'seller' && recipientUser.role === 'admin');
    
    if (!isValidConversation) {
      console.log('Invalid conversation - wrong user roles:', { currentUserRole: currentUser.role, recipientUserRole: recipientUser.role });
      return res.status(403).json({ 
        message: 'Conversations can only be created between sellers and admin' 
      });
    }
    
    try {
      // Sort participants to ensure consistent lookup
      const sortedParticipantIds = [currentUserId, recipientId].sort();
      
      // Try to find an existing conversation first
      console.log('Looking for existing conversation before creating a new one');
      const existingConversation = await Conversation.findOne({
        participants: { $all: sortedParticipantIds }
      }).populate({
        path: 'participants',
        select: 'name email role profile shopName'
      });
      
      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation._id);
        return res.status(200).json(existingConversation);
      }
      
      // Use our helper function to safely create a conversation
      console.log('No existing conversation found, creating new one with helper');
      const newConversation = await safeCreateConversation(sortedParticipantIds);
      
      console.log('Successfully created conversation:', newConversation._id);
      return res.status(201).json(newConversation);
      
    } catch (error) {
      console.error('Error creating or finding conversation:', error);
      
      // Last attempt - try one more time to find the conversation
      try {
        const sortedParticipantIds = [currentUserId, recipientId].sort();
        const finalAttempt = await Conversation.findOne({
          participants: { $in: sortedParticipantIds }
        }).populate({
          path: 'participants',
          select: 'name email role profile shopName'
        });
        
        if (finalAttempt) {
          console.log('Found conversation in final attempt:', finalAttempt._id);
          return res.status(200).json(finalAttempt);
        }
      } catch (finalError) {
        // Ignore this error and proceed to the main error handler
      }
      
      return res.status(500).json({
        message: 'Error creating conversation',
        error: error.message,
        details: 'All approaches to create or find conversation failed'
      });
    }
  } catch (outerError) {
    console.error('Unhandled error in createConversation:', outerError);
    return res.status(500).json({
      message: 'Unexpected server error',
      error: outerError.message
    });
  }
};
