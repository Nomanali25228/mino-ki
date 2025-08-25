import express from 'express';
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct } from '../controllers/product.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protectRoute, createProduct);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.put('/:id', protectRoute, updateProduct);
router.delete('/:id', protectRoute, deleteProduct);

export default router;
