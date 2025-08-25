import SellerProduct from '../models/sellerProduct.model.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';

// Get all available products for seller to select from
export const getAvailableProducts = async (req, res) => {
  try {
    const sellerId = req.user._id;
    
    // Get all products
    const allProducts = await Product.find();
    
    // Get products already selected by this seller
    const sellerProducts = await SellerProduct.find({ seller: sellerId });
    const selectedProductIds = sellerProducts.map(sp => sp.product.toString());
    
    // Filter out already selected products
    const availableProducts = allProducts.filter(product => 
      !selectedProductIds.includes(product._id.toString())
    );
    
    res.status(200).json(availableProducts);
  } catch (error) {
    console.error('Error fetching available products:', error);
    res.status(500).json({ message: 'Error fetching available products', error: error.message });
  }
};

// Add product to seller's inventory
export const addProductToSeller = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { productId, sellerQuantity, sellerPrice, sellerDiscountedPrice } = req.body;
    
    // Validate seller role
    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can add products' });
    }
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if seller already has this product
    const existingSellerProduct = await SellerProduct.findOne({
      seller: sellerId,
      product: productId
    });
    
    if (existingSellerProduct) {
      return res.status(400).json({ message: 'Product already in your inventory' });
    }
    
    // Create seller product
    const sellerProduct = new SellerProduct({
      seller: sellerId,
      product: productId,
      sellerQuantity: sellerQuantity || 0,
      sellerPrice: sellerPrice || product.price,
      sellerDiscountedPrice: sellerDiscountedPrice || product.discountedPrice
    });
    
    await sellerProduct.save();
    
    // Populate for response
    await sellerProduct.populate('product');
    
    res.status(201).json({
      message: 'Product added to your inventory successfully',
      sellerProduct
    });
  } catch (error) {
    console.error('Error adding product to seller:', error);
    res.status(500).json({ message: 'Error adding product', error: error.message });
  }
};

// Get seller's products
export const getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user._id;
    
    const sellerProducts = await SellerProduct.find({ seller: sellerId, isActive: true })
      .populate('product')
      .sort({ createdAt: -1 });
    
    res.status(200).json(sellerProducts);
  } catch (error) {
    console.error('Error fetching seller products:', error);
    res.status(500).json({ message: 'Error fetching seller products', error: error.message });
  }
};

// Update seller product
export const updateSellerProduct = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { id } = req.params;
    const { sellerQuantity, sellerPrice, sellerDiscountedPrice, isActive } = req.body;
    
    const sellerProduct = await SellerProduct.findOne({
      _id: id,
      seller: sellerId
    });
    
    if (!sellerProduct) {
      return res.status(404).json({ message: 'Product not found in your inventory' });
    }
    
    // Update fields
    if (sellerQuantity !== undefined) sellerProduct.sellerQuantity = sellerQuantity;
    if (sellerPrice !== undefined) sellerProduct.sellerPrice = sellerPrice;
    if (sellerDiscountedPrice !== undefined) sellerProduct.sellerDiscountedPrice = sellerDiscountedPrice;
    if (isActive !== undefined) sellerProduct.isActive = isActive;
    
    await sellerProduct.save();
    await sellerProduct.populate('product');
    
    res.status(200).json({
      message: 'Product updated successfully',
      sellerProduct
    });
  } catch (error) {
    console.error('Error updating seller product:', error);
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

// Remove product from seller's inventory
export const removeSellerProduct = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { id } = req.params;
    
    const sellerProduct = await SellerProduct.findOneAndDelete({
      _id: id,
      seller: sellerId
    });
    
    if (!sellerProduct) {
      return res.status(404).json({ message: 'Product not found in your inventory' });
    }
    
    res.status(200).json({ message: 'Product removed from inventory' });
  } catch (error) {
    console.error('Error removing seller product:', error);
    res.status(500).json({ message: 'Error removing product', error: error.message });
  }
};

// Get seller's products for admin (when creating orders)
export const getSellerProductsForAdmin = async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    // Validate admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can access this endpoint' });
    }
    
    const sellerProducts = await SellerProduct.find({ 
      seller: sellerId, 
      isActive: true,
      sellerQuantity: { $gt: 0 } // Only products with quantity > 0
    })
      .populate('product')
      .populate('seller', 'name shopName')
      .sort({ createdAt: -1 });
    
    res.status(200).json(sellerProducts);
  } catch (error) {
    console.error('Error fetching seller products for admin:', error);
    res.status(500).json({ message: 'Error fetching seller products', error: error.message });
  }
};
