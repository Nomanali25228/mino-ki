import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    unreadCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// First log when indexing completes
conversationSchema.on('index', function(err) {
  if (err) console.error('Conversation index error:', err);
  else console.log('Conversation indexing completed successfully');
});

// IMPORTANT: Instead of using a unique index on the participants array (which causes problems),
// we'll create a custom pre-save hook to check for duplicates

// We remove the problematic index
// conversationSchema.index(
//   { participants: 1 }, 
//   { 
//     unique: true, 
//     background: true,
//     name: "unique_participants_index"
//   }
// );

// Add a normal index for query performance (but not unique)
conversationSchema.index({ participants: 1 }, { background: true, name: "participants_query_index" });



// Add a pre-save hook to manually check for duplicate conversations
conversationSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Skip duplicate check for forced creation (last resort in race conditions)
      if (this._forcedCreation === true) {
        console.log('Skipping duplicate check for forced conversation creation');
        // Remove the flag before saving but after check
        delete this._forcedCreation;
        return next();
      }
      
      const ConversationModel = this.constructor;
      
      // Sort participants to ensure consistent checking regardless of order
      const sortedParticipants = [...this.participants].sort((a, b) => 
        a.toString().localeCompare(b.toString())
      );
      
      // Update participants with sorted version
      this.participants = sortedParticipants;
      
      // First try a precise query to check for existing conversations
      const existing = await ConversationModel.findOne({
        participants: { 
          $size: this.participants.length, 
          $all: this.participants 
        }
      });
      
      if (existing) {
        console.log('Pre-save hook detected existing conversation:', existing._id);
        const error = new Error('Conversation already exists');
        error.code = 11000; // Set duplicate key error code
        error.existingConversation = existing;
        return next(error);
      }
      
      // Try a more lenient query as well
      const lenientCheck = await ConversationModel.findOne({
        participants: { $all: this.participants }
      });
      
      if (lenientCheck) {
        console.log('Pre-save hook detected existing conversation (lenient check):', lenientCheck._id);
        const error = new Error('Conversation already exists (lenient check)');
        error.code = 11000;
        error.existingConversation = lenientCheck;
        return next(error);
      }
      
      // Paranoid check: try one more time with a delay to catch race conditions
      // This helps when two requests try to create the same conversation simultaneously
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const doubleCheck = await ConversationModel.findOne({
        participants: { $all: this.participants }
      });
      
      if (doubleCheck) {
        console.log('Pre-save hook detected race condition:', doubleCheck._id);
        const error = new Error('Conversation already exists (race condition detected)');
        error.code = 11000;
        error.existingConversation = doubleCheck;
        return next(error);
      }
    } catch (err) {
      console.error('Error in conversation pre-save hook:', err);
      return next(err);
    }
  }
  
  next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;