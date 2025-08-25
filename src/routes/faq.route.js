import express from 'express';
import {
  getAllFAQs,
  getActiveFAQs,
  getFAQ,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  updateFAQOrder
} from '../controllers/faq.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/active', getActiveFAQs);

// Protected routes
router.use(protect);

// Admin only routes
router.get('/', authorize('admin'), getAllFAQs);
router.get('/:id', authorize('admin'), getFAQ);
router.post('/', authorize('admin'), createFAQ);
router.put('/:id', authorize('admin'), updateFAQ);
router.delete('/:id', authorize('admin'), deleteFAQ);
router.put('/order/update', authorize('admin'), updateFAQOrder);

export default router;
