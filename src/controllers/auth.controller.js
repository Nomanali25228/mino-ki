
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cloudinary from '../lib/cloudinary.js';

// Seller signup
export const signup = async (req, res) => {
  try {
    const { name, email, password, phone, shopName, identity } = req.body;
    if (!name || !email || !password || !identity) {
      return res.status(400).json({ message: 'Name, email, password, and identity are required' });
    }
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Handle identity image (base64)
    let identityUrl = '';
    if (identity && identity.startsWith('data:')) {
      const uploadResponse = await cloudinary.uploader.upload(identity, { folder: 'identity' });
      identityUrl = uploadResponse.secure_url;
    } else {
      return res.status(400).json({ message: 'Identity image is required as base64' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      identity: identityUrl,
      email,
      phone: phone || '',
      shopName: shopName || '',
      approved: false,
      password: hashedPassword,
      role: 'seller',
      creditAmount: 0,
      totalOrders: 0,
      pendingAmount: 0
    });
    return res.status(201).json({ message: 'Signup successful, please wait for admin verification' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Unified login for both admin and seller
export const login = async (req, res) => {
  const { email, password, loginVerificationCode } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    // Try to find user as seller first
    let user = await User.findOne({ email, role: 'seller' });
    if (user) {
      if (!user.approved) {
        return res.status(403).json({ message: 'wait for the approval notification' });
      }
    } else {
      // Try to find as admin
      user = await User.findOne({ email, role: 'admin' });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    // Require loginVerificationCode if set for user
    if (user.loginVerificationCode && user.loginVerificationCode.length > 0) {
      if (!loginVerificationCode || loginVerificationCode !== user.loginVerificationCode) {
        return res.status(400).json({ message: 'Invalid or missing login verification code' });
      }
    }
    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      shopName: user.shopName,
      identity: user.identity,
      creditAmount: user.creditAmount,
      totalOrders: user.totalOrders,
      pendingAmount: user.pendingAmount,
      role: user.role,
      approved: user.approved,
      createdAt: user.createdAt,
      token
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

