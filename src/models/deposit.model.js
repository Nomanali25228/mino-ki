import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Deposit title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Deposit content is required'],
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Only set for seller-specific deposits
  }
}, {
  timestamps: true
});

// Index for efficient querying
depositSchema.index({ order: 1 });

export default mongoose.model('Deposit', depositSchema);
