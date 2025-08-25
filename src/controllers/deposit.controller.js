import Deposit from '../models/deposit.model.js';

// Get all deposits (for admin)
const getAllDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find()
      .populate('createdBy', 'name email')
      .populate('seller', 'name email shopName')
      .sort({ order: 1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: deposits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deposits',
      error: error.message
    });
  }
};

// Get deposits for sellers/public
const getActiveDeposits = async (req, res) => {
  try {
    let userId = null;
    if (req.user && req.user.role === 'seller') {
      userId = req.user._id ? req.user._id.toString() : (req.user.id || null);
    }
    let query = {};
    if (userId) {
      query = { $or: [ { seller: null }, { seller: userId } ] };
    } else {
      query = { seller: null };
    }
    // Debug logging
    console.log('getActiveDeposits: userId:', userId, 'type:', typeof userId);
    console.log('getActiveDeposits: query:', JSON.stringify(query));
    const deposits = await Deposit.find({})
      .populate('seller', 'name email shopName')
      .sort({ order: 1, createdAt: -1 })
      .select('-createdBy');
    deposits.forEach(d => {
      console.log('Deposit:', d._id.toString(), 'seller:', d.seller?._id?.toString?.() || d.seller, 'type:', typeof (d.seller?._id?.toString?.() || d.seller));
    });
    // Now filter as before
    let filtered = [];
    if (userId) {
      filtered = deposits.filter(d => {
        if (!d.seller) return true;
        if (d.seller._id && d.seller._id.toString() === userId) return true;
        if (typeof d.seller === 'string' && d.seller === userId) return true;
        return false;
      });
    } else {
      filtered = deposits.filter(d => !d.seller);
    }
    console.log('getActiveDeposits: filtered deposits:', filtered.map(d => ({ _id: d._id, seller: d.seller })));
    return res.status(200).json({
      success: true,
      data: filtered
    });
    res.status(200).json({
      success: true,
      data: deposits
    });
  } catch (error) {
    console.error('getActiveDeposits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deposits',
      error: error.message
    });
  }
};

// Get single deposit
const getDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('seller', 'name email shopName');
    
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: deposit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deposit',
      error: error.message
    });
  }
};

// Create new deposit
const createDeposit = async (req, res) => {
  try {

    const { title, content, order, seller } = req.body;
    const mongoose = (await import('mongoose')).default;
    let sellerObj = null;
    if (seller) {
      try {
        sellerObj = new mongoose.Types.ObjectId(seller);
      } catch (e) {
        sellerObj = null;
      }
    }
    const deposit = new Deposit({
      title,
      content,
      order: order || 0,
      createdBy: req.user.id,
      seller: sellerObj
    });

    await deposit.save();
    
    const populatedDeposit = await Deposit.findById(deposit._id)
      .populate('createdBy', 'name email')
      .populate('seller', 'name email shopName');
    
    res.status(201).json({
      success: true,
      message: 'Deposit created successfully',
      data: populatedDeposit
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create deposit',
      error: error.message
    });
  }
};

// Update deposit
const updateDeposit = async (req, res) => {
  try {

    const { title, content, order, seller } = req.body;
    const mongoose = (await import('mongoose')).default;
    let sellerObj = null;
    if (seller) {
      try {
        sellerObj = new mongoose.Types.ObjectId(seller);
      } catch (e) {
        sellerObj = null;
      }
    }
    const deposit = await Deposit.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        order,
        seller: sellerObj
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('createdBy', 'name email')
     .populate('seller', 'name email shopName');
    
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Deposit updated successfully',
      data: deposit
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update deposit',
      error: error.message
    });
  }
};

// Delete deposit
const deleteDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findByIdAndDelete(req.params.id);
    
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Deposit deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete deposit',
      error: error.message
    });
  }
};

// Update deposit order
const updateDepositOrder = async (req, res) => {
  try {
    const { order } = req.body;
    
    const deposit = await Deposit.findByIdAndUpdate(
      req.params.id,
      { order },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Deposit order updated successfully',
      data: deposit
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update deposit order',
      error: error.message
    });
  }
};

export {
  getAllDeposits,
  getActiveDeposits,
  getDeposit,
  createDeposit,
  updateDeposit,
  deleteDeposit,
  updateDepositOrder
};
