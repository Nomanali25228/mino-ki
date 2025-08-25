import mongoose from 'mongoose';

const sellerProductSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sellerQuantity: {
    type: Number,
    default: 0
  },
  sellerPrice: {
    type: Number,
    required: true
  },
  sellerDiscountedPrice: {
    type: Number
  }
}, { timestamps: true });

// Ensure one seller can't add same product twice
sellerProductSchema.index({ seller: 1, product: 1 }, { unique: true });

const SellerProduct = mongoose.model('SellerProduct', sellerProductSchema);
export default SellerProduct;
