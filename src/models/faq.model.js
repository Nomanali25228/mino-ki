import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'FAQ title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'FAQ description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
faqSchema.index({ order: 1 });

export default mongoose.model('FAQ', faqSchema);
