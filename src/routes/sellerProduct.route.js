import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
  getAvailableProducts,
  addProductToSeller,
  getSellerProducts,
  updateSellerProduct,
  removeSellerProduct,
  getSellerProductsForAdmin
} from '../controllers/sellerProduct.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Seller routes
router.get('/available', getAvailableProducts); // Get products available to add
router.post('/add', addProductToSeller); // Add product to seller inventory
router.get('/my-products', getSellerProducts); // Get seller's products
router.put('/:id', updateSellerProduct); // Update seller product
router.delete('/:id', removeSellerProduct); // Remove product from seller inventory

// Admin routes
router.get('/seller/:sellerId', getSellerProductsForAdmin); // Get seller's products for admin

export default router;
