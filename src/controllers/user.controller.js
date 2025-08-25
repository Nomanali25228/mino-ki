// Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
};
// Delete user by ID
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Emit socket event to log out the deleted user if online
    const io = req.app.get('io');
    if (io) {
      io.to(userId).emit('user_deleted', { userId });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
};
// Get user details by ID
export const getUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user..', error });
  }
};
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';

export const createAdmin = async () => {
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    const admin = new User({
      name: 'Admin',
      email: 'adminalfa@alfa.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
      identity: 'admin',
      phone: '',
      shopName: '',
      creditAmount: 0,
      totalOrders: 0,
      pendingAmount: 0,
      profile: '',
      approved: true,
    });
    await admin.save();
  }
};

export const createSeller = async (req, res) => {
  try {
    const { name, identity, profile, email, phone, shopName, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const seller = new User({
      name,
      identity,
      profile,
      email,
      phone,
      shopName,
      password: hashedPassword,
      role: 'seller',
      creditAmount: 0,
      totalOrders: 0,
      pendingAmount: 0,
      approved: false,
    });
    await seller.save();
    res.status(201).json({ message: 'Seller created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating seller', error });
  }
};

export const updateSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { name, identity, profile, email, phone, shopName, creditAmount, totalOrders, pendingAmount, approved, loginVerificationCode } = req.body;
    const seller = await User.findOne({ _id: sellerId, role: 'seller' });
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    if (name !== undefined) seller.name = name;
    if (identity !== undefined) seller.identity = identity;
    if (profile !== undefined) seller.profile = profile;
    if (email !== undefined) seller.email = email;
    if (phone !== undefined) seller.phone = phone;
    if (shopName !== undefined) seller.shopName = shopName;
    if (creditAmount !== undefined) seller.creditAmount = creditAmount;
    if (totalOrders !== undefined) seller.totalOrders = totalOrders;
    if (pendingAmount !== undefined) seller.pendingAmount = pendingAmount;
    if (approved !== undefined) seller.approved = approved;
    if (loginVerificationCode !== undefined) seller.loginVerificationCode = loginVerificationCode;
    await seller.save();
    res.status(200).json({ message: 'Seller updated successfully', seller });
  } catch (error) {
    res.status(500).json({ message: 'Error updating seller', error });
  }
};

// In your user.controller.js
export const getAllUsers = async (req, res) => {
  try {
    console.log('Getting all users');
    const users = await User.find().select('-password');
    
    console.log('Found users:', users.length);
    console.log('Admin user found:', users.some(u => u.role === 'admin'));
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// In your user.controller.js
export const getAdminUser = async (req, res) => {
  try {
    console.log('Getting admin user');
    const admin = await User.findOne({ role: 'admin' }).select('-password');
    
    if (!admin) {
      console.log('No admin user found');
      return res.status(404).json({ message: 'Admin user not found' });
    }
    
    console.log('Found admin:', admin.name, admin._id);
    res.status(200).json(admin);
  } catch (error) {
    console.error('Error fetching admin user:', error);
    res.status(500).json({ message: 'Error fetching admin user', error: error.message });
  }
};
