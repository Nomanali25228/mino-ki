import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      trim: true
    },
    imageUrl: {
      type: String,
      default: null
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;