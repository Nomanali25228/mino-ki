
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  identity: { type: String },
  profile: { type: String },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  shopName: { type: String },
  approved: { type: Boolean, default: false },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'seller'], default: 'seller' },
  creditAmount: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  loginVerificationCode: { type: String, default: '' }, // Only settable by admin
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
