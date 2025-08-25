import express from 'express';
import {
  getAllDeposits,
  getActiveDeposits,
  getDeposit,
  createDeposit,
  updateDeposit,
  deleteDeposit,
  updateDepositOrder
} from '../controllers/deposit.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route for sellers to view deposits
import { protectRoute } from '../middleware/auth.middleware.js';

// Require authentication for /active so seller filtering works
router.get('/active', protectRoute, getActiveDeposits);

// Protected routes (admin only)
router.use(protect);

router.get('/', authorize('admin'), getAllDeposits);
router.get('/:id', authorize('admin'), getDeposit);
router.post('/', authorize('admin'), createDeposit);
router.put('/:id', authorize('admin'), updateDeposit);
router.delete('/:id', authorize('admin'), deleteDeposit);
router.put('/:id/order', authorize('admin'), updateDepositOrder);

export default router;
