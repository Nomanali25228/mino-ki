import express from 'express';
import { createSeller, updateSeller, getUser, deleteUser, getUsers, getAdminUser } from '../controllers/user.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get current user profile
router.get('/me', protectRoute, (req, res) => {
  try {
    console.log('Getting current user profile:', req.user._id);
    res.json(req.user);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Error getting user profile' });
  }
});

// Get all users
router.get('/', protectRoute, getUsers);

// Add the admin route BEFORE the :userId route
router.get('/admin', protectRoute, getAdminUser);

router.post('/seller', createSeller);
router.put('/seller/:sellerId', protectRoute, updateSeller);

// Get user details by ID
router.get('/:userId', protectRoute, getUser);

// Delete user by ID
router.delete('/:userId', protectRoute, deleteUser);

export default router;
