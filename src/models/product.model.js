import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String },
  discountedPrice: { type: Number },
  quantity: { type: Number, required: true },
  category: { type: String, required: true },
  // seller removed
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
