import FAQ from '../models/faq.model.js';

// Get all FAQs (for admin)
const getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find()
      .populate('createdBy', 'name email')
      .sort({ order: 1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: faqs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs',
      error: error.message
    });
  }
};

// Get active FAQs (for sellers/public)
const getActiveFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find()
      .sort({ order: 1, createdAt: -1 })
      .select('-createdBy');
    
    res.status(200).json({
      success: true,
      data: faqs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs',
      error: error.message
    });
  }
};

// Get single FAQ
const getFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: faq
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQ',
      error: error.message
    });
  }
};

// Create new FAQ
const createFAQ = async (req, res) => {
  try {
    const { title, description, order } = req.body;
    
    const faq = new FAQ({
      title,
      description,
      order: order || 0,
      createdBy: req.user.id
    });
    
    await faq.save();
    await faq.populate('createdBy', 'name email');
    
    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: faq
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create FAQ',
      error: error.message
    });
  }
};

// Update FAQ
const updateFAQ = async (req, res) => {
  try {
    const { title, description, order } = req.body;
    
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        order
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('createdBy', 'name email');
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'FAQ updated successfully',
      data: faq
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update FAQ',
      error: error.message
    });
  }
};

// Delete FAQ
const deleteFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete FAQ',
      error: error.message
    });
  }
};

// Bulk update FAQ order
const updateFAQOrder = async (req, res) => {
  try {
    const { faqs } = req.body; // Array of { id, order }
    
    const updatePromises = faqs.map(item => 
      FAQ.findByIdAndUpdate(item.id, { order: item.order })
    );
    
    await Promise.all(updatePromises);
    
    res.status(200).json({
      success: true,
      message: 'FAQ order updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update FAQ order',
      error: error.message
    });
  }
};

export {
  getAllFAQs,
  getActiveFAQs,
  getFAQ,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  updateFAQOrder
};
