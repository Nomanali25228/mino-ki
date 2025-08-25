import mongoose from 'mongoose';
import Conversation from '../models/conversation.model.js';

/**
 * Safely creates a conversation between two users, handling duplicate key errors
 * and other common issues.
 * 
 * @param {string[]} participantIds - Array of two user IDs
 * @returns {Promise<Object>} - The created or found conversation
 */
export const safeCreateConversation = async (participantIds) => {
  if (!participantIds || participantIds.length !== 2) {
    throw new Error('Exactly two participant IDs are required');
  }
  
  // Sort participant IDs to ensure consistent lookup
  const sortedParticipantIds = [...participantIds].sort((a, b) => 
    a.toString().localeCompare(b.toString())
  );
  
  let conversation = null;
  
  // Step 1: Try to find existing conversation
  try {
    conversation = await Conversation.findOne({
      participants: { $all: sortedParticipantIds }
    }).populate({
      path: 'participants',
      select: 'name email role profile shopName'
    });
    
    if (conversation) {
      console.log('Found existing conversation:', conversation._id);
      return conversation;
    }
  } catch (findError) {
    console.error('Error finding conversation:', findError);
    // Continue to creation
  }
  
  // Step 2: Try standard Mongoose creation
  try {
    const newConversation = new Conversation({
      participants: sortedParticipantIds
    });
    
    const savedConversation = await newConversation.save();
    console.log('Created conversation with Mongoose:', savedConversation._id);
    
    conversation = await Conversation.findById(savedConversation._id).populate({
      path: 'participants',
      select: 'name email role profile shopName'
    });
    
    if (conversation) {
      return conversation;
    }
  } catch (saveError) {
    console.error('Error saving conversation with Mongoose:', saveError);
    // If duplicate key error, try to find the conversation again
    if (saveError.code === 11000) {
      try {
        // Wait a moment for potential race conditions to resolve
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const existingConversation = await Conversation.findOne({
          participants: { $all: sortedParticipantIds }
        }).populate({
          path: 'participants',
          select: 'name email role profile shopName'
        });
        
        if (existingConversation) {
          console.log('Found conversation after duplicate key error:', existingConversation._id);
          return existingConversation;
        }
      } catch (retryError) {
        console.error('Error finding conversation after duplicate key error:', retryError);
        // Continue to next attempt
      }
    }
  }
  
  // Step 3: Try direct MongoDB insertion as last resort
  try {
    // Fix: Add special flag to bypass duplicates
    const result = await mongoose.connection.collection('conversations').insertOne({
      participants: sortedParticipantIds.map(id => new mongoose.Types.ObjectId(id)),
      unreadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      _forcedCreation: true // Add this flag
    });
    
    if (result && result.insertedId) {
      console.log('Created conversation with direct MongoDB insertion:', result.insertedId);
      
      const insertedConversation = await Conversation.findById(result.insertedId).populate({
        path: 'participants',
        select: 'name email role profile shopName'
      });
      
      if (insertedConversation) {
        return insertedConversation;
      }
    }
  } catch (directInsertError) {
    console.error('Error with direct MongoDB insertion:', directInsertError);
    
    // If duplicate key error, make one final attempt to find it
    if (directInsertError.code === 11000) {
      try {
        const finalAttempt = await Conversation.findOne({
          participants: { $all: sortedParticipantIds }
        }).populate({
          path: 'participants',
          select: 'name email role profile shopName'
        });
        
        if (finalAttempt) {
          console.log('Found conversation in final attempt:', finalAttempt._id);
          return finalAttempt;
        }
      } catch (finalError) {
        console.error('Final attempt to find conversation failed:', finalError);
      }
    }
    
    throw directInsertError; // Re-throw if we couldn't recover
  }
  
  throw new Error('Failed to create or find conversation after multiple attempts');
};
