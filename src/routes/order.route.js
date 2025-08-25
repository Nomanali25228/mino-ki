import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  sellerOrderResponse,
  updateOrder,
  deleteOrder,
  getOrderStats
} from '../controllers/order.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Order CRUD operations
router.post('/', createOrder);                    // Create order (Admin only)
router.get('/', getOrders);                       // Get orders (Admin: all, Seller: own)
router.get('/stats', getOrderStats);              // Get order statistics
router.get('/stats/:sellerId', getOrderStats);    // Get order statistics for specific seller (Admin only)
router.get('/:id', getOrderById);                 // Get single order
router.put('/:id', updateOrder);                  // Update order (Admin only)
router.delete('/:id', deleteOrder);               // Delete order (Admin only)

// Order status management
router.post('/:id/status', updateOrderStatus);   // Update order status (Admin only)
router.post('/:id/response', sellerOrderResponse); // Seller response (Seller only)

export default router;
